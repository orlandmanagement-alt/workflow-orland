/**
 * =================================================================================
 * Orland Management - Talent Profile Integration Script for Blogspot (v2)
 * =================================================================================
 * 
 * Purpose: This script provides the full client-side logic to power the
 * talent profile page, now fully compatible with the existing backend architecture
 * (talentHandler.ts, mediaHandler.ts).
 * 
 * Key Changes in v2:
 * - Authentication: Switched from Bearer Token to Cookie-based (sid) by using
 *   `credentials: "include"` in all fetch requests to resolve 401 errors.
 * - Image Upload: Implemented the 2-step presigned URL upload process. The script
 *   first requests a secure upload URL from the backend, then uploads the file
 *   directly to R2.
 * - Data Mapping: The `mapStateToDB` function is now aligned with the schema
 *   expected by `talentHandler.ts`, providing default values for required fields
 *   to ensure successful initial profile creation.
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- Configuration ---
  const API_BASE_URL = 'https://api.orlandmanagement.com/api/v1'; // Use your actual API worker URL

  // --- DOM Element References ---
  const modalCrop = document.getElementById('modalCrop');
  const cropImage = document.getElementById('cropImage');
  const cropApplyBtn = document.getElementById('cropApplyBtn');
  const saveBtn = document.getElementById('saveBtn');
  const apiLoader = document.getElementById('apiLoader');
  const mainAppContainer = document.getElementById('mainAppContainer');

  // --- State Management ---
  let state = {}; // Populated from API on load
  let cropper;
  let currentUploadContext = {
    type: null, // e.g., 'headshot', 'side_view', 'full_height'
    callback: null,
  };

  /**
   * =================================================================
   * SECTION 1: API Communication Layer
   * =================================================================
   */
  const AppAPI = {
    _fetch: async (endpoint, options = {}) => {
      const defaultOptions = {
        credentials: 'include', // CRITICAL: Sends cookies (like 'sid') with the request
        headers: {
          'Content-Type': 'application/json',
        },
      };

      // Do not set Content-Type for FormData, browser does it automatically
      if (options.body instanceof FormData) {
        delete defaultOptions.headers['Content-Type'];
      }
      
      // The PUT request for R2 presigned URL needs a specific content type
      if (options.isR2Upload) {
          defaultOptions.headers['Content-Type'] = options.contentType;
          delete options.isR2Upload;
          delete options.contentType;
      }

      const response = await fetch(endpoint, { ...defaultOptions, ...options });

      if (response.status === 401) {
        alert('Your session is invalid or has expired. Please log in again.');
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'An unknown API error occurred.' }));
        throw new Error(errorData.message || `Request failed with status ${response.status}`);
      }
      
      // For R2 PUT requests, we don't expect a JSON body, just a 200 OK status
      if (response.status === 200 && options.method === 'PUT' && endpoint.includes('r2.cloudflarestorage.com')) {
          return { status: 'ok' };
      }

      return response.json();
    },

    getProfile: () => AppAPI._fetch(`${API_BASE_URL}/talents/me`),
    updateProfile: (profileData) => AppAPI._fetch(`${API_BASE_URL}/talents/me`, {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
    getUploadUrl: (fileName, contentType, folder = 'profiles') => AppAPI._fetch(`${API_BASE_URL}/media/upload-url`, {
        method: 'POST',
        body: JSON.stringify({ fileName, contentType, folder }),
    }),
    uploadToR2: (url, file) => AppAPI._fetch(url, {
        method: 'PUT',
        body: file,
        isR2Upload: true,
        contentType: file.type,
    }),
  };

  /**
   * =================================================================
   * SECTION 2: Data Mapping & UI
   * =================================================================
   */
  function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-5 right-5 bg-neutral-800 text-white text-sm font-bold py-2 px-4 rounded-lg shadow-xl animate-[fadeIn_0.3s_ease-out]';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('animate-[fadeOut_0.3s_ease-in]');
        setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  function mapStateToDB(s) {
    // Maps frontend state to the schema expected by `talentHandler.ts`
    // Provides default values for required fields to ensure initial creation succeeds
    return {
      full_name: `${s.name?.first || ''} ${s.name?.last || ''}`.trim(),
      category: s.category || 'Unspecified',
      interests: s.interestedIn || [],
      skills: s.skills || [],
      height: s.appearance?.height || '1',
      weight: s.appearance?.weight || '1',
      birth_date: s.personal?.dob || null,
      gender: s.personal?.gender || 'Unspecified',
      headshot: s.photos?.headshot || null,
      sideView: s.photos?.side || null,
      fullHeight: s.photos?.full || null,
      showreels: s.assets?.youtube || [],
      audios: s.assets?.audio || [],
      additional_photos: s.photos?.additional || [],
      instagram: s.social?.instagram || null,
      tiktok: s.social?.tiktok || null,
      twitter: s.social?.x || null,
      phone: s.contacts?.phone || null,
      email: s.contacts?.email || null,
      union_affiliation: s.union || null,
      eye_color: s.appearance?.eye || 'Unspecified',
      hair_color: s.appearance?.hair || 'Unspecified',
      ethnicity: s.personal?.ethnicity || 'Unspecified',
      location: s.personal?.loc || 'Unspecified',
      // other fields from your talentHandler schema
      hip_size: s.appearance?.hip || null,
      chest_bust: s.appearance?.chest || null,
      body_type: s.appearance?.body || null,
      specific_characteristics: s.specific_characteristics ? JSON.stringify(s.specific_characteristics) : null,
      tattoos: s.tattoos ? JSON.stringify(s.tattoos) : null,
      piercings: s.piercings ? JSON.stringify(s.piercings) : null,
    };
  }

  /**
   * =================================================================
   * SECTION 3: Core Application Logic
   * =================================================================
   */
  async function saveProfile() {
    showToast('Syncing with server...');
    try {
      const dbPayload = mapStateToDB(state);
      const response = await AppAPI.updateProfile(dbPayload);
      // Re-sync state with the definitive data from the server
      state = { ...state, ...response.data };
      showToast('Profile saved successfully!');
      console.log('Profile updated:', response.data);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert(`Save Error: ${error.message}`);
    }
  }

  async function initializeProfile() {
    mainAppContainer.style.opacity = '0';
    apiLoader.classList.remove('hide');
    try {
      const response = await AppAPI.getProfile();
      state = response.data;
      // TODO: Implement a `renderProfile(state)` function to populate the UI
      console.log('Profile loaded:', state);
      showToast('Profile loaded successfully.');
    } catch (error) {
      console.error('Failed to initialize profile:', error);
      alert(`Load Error: ${error.message}`);
    } finally {
      apiLoader.classList.add('hide');
      mainAppContainer.style.opacity = '1';
    }
  }

  /**
   * =================================================================
   * SECTION 4: CropperJS and 2-Step Upload Logic
   * =================================================================
   */
  function openCropper(imageUrl, context) {
    currentUploadContext = context;
    modalCrop.classList.remove('hide');
    if (cropper) cropper.destroy();
    cropImage.src = imageUrl;
    cropper = new Cropper(cropImage, {
      aspectRatio: context.aspectRatio || 1,
      viewMode: 1,
    });
  }

  cropApplyBtn.addEventListener('click', () => {
    if (!cropper) return;
    cropper.getCroppedCanvas({ width: 1024, height: 1024 }).toBlob(async (blob) => {
      if (!blob) return alert('Crop failed.');
      
      showToast('Uploading image...');
      const fileName = `${currentUploadContext.type}-${Date.now()}.webp`;

      try {
        // Step 1: Get the presigned URL from our backend
        const { uploadUrl, publicUrl } = await AppAPI.getUploadUrl(fileName, blob.type);

        // Step 2: Upload the file directly to R2 using the presigned URL
        await AppAPI.uploadToR2(uploadUrl, blob);

        // Step 3: Update local state and save the profile with the new public URL
        if (currentUploadContext.callback) {
            currentUploadContext.callback(publicUrl);
        }
        await saveProfile();
        
        showToast('Upload complete!');
        modalCrop.classList.add('hide');
        cropper.destroy();

      } catch (error) {
        console.error('Upload process failed:', error);
        alert(`Upload Error: ${error.message}`);
      }
    }, 'image/webp', 0.9);
  });
  
  // --- Event Listeners ---
  saveBtn.addEventListener('click', saveProfile);
  // Add other listeners for upload buttons to call `openCropper`

  // --- Initial Load ---
  initializeProfile();
});
``