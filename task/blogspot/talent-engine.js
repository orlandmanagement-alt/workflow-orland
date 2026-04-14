/**
 * =================================================================================
 * Orland Management - Talent Profile Integration Script for Blogspot
 * =================================================================================
 * 
 * Purpose: This script provides the full client-side logic to power the
 * talent profile page. It handles API communication, state management,
 * data mapping, and UI interactions like image cropping and uploading.
 * 
 * Instructions:
 * 1. Embed this script directly before the closing </body> tag of your Blogspot template.
 * 2. Ensure the HTML structure from 'profile-upload-page-blogspot.html' is present.
 * 3. The user must be logged in via the SSO flow, which should set a token in
 *    localStorage under the key 'orland_sso_user'.
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- Configuration ---
  const API_BASE_URL = 'https://api.orlandmanagement.com/api/v1'; // Replace with your actual API worker URL

  // --- DOM Element References ---
  const modalCrop = document.getElementById('modalCrop');
  const cropImage = document.getElementById('cropImage');
  const cropApplyBtn = document.getElementById('cropApplyBtn');
  // ... (add other frequently used DOM elements here)

  // --- State Management ---
  let state = {
    // This object will be populated with data from the API
  };
  let cropper;
  let currentUploadContext = {
    type: null, // e.g., 'headshot', 'side', 'full'
    callback: null,
  };

  /**
   * =================================================================
   * SECTION 1: API Communication Layer
   * =================================================================
   */
  const AppAPI = {
    _getToken: () => {
      try {
        const ssoData = JSON.parse(localStorage.getItem('orland_sso_user'));
        return ssoData?.token || null;
      } catch (e) {
        return null;
      }
    },

    _fetch: async (endpoint, options = {}) => {
      const token = AppAPI._getToken();
      if (!token) {
        alert('Your session has expired. Please log in again.');
        // Optional: Redirect to login page
        // window.location.href = 'https://sso.orlandmanagement.com';
        throw new Error('Authentication token not found.');
      }

      const headers = {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      };
      
      // Do not set Content-Type for FormData, browser does it.
      if (!(options.body instanceof FormData)) {
          headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      if (response.status === 401) {
        alert('Your session is invalid. Please log in again.');
        localStorage.removeItem('orland_sso_user');
        throw new Error('Unauthorized');
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'An API error occurred.');
      }

      return response.json();
    },

    getProfile: () => AppAPI._fetch('/talents/me'),
    updateProfile: (profileData) => AppAPI._fetch('/talents/me', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    }),
    uploadImage: (formData) => AppAPI._fetch('/talents/upload', {
      method: 'POST',
      body: formData,
    }),
  };

  /**
   * =================================================================
   * SECTION 2: Data Mapping Utilities
   * =================================================================
   */

  // No mapping needed if backend GET /me already returns the correct state structure.
  // The provided backend code is designed to do this.

  /**
   * Maps the frontend state object to the format expected by the PUT /me endpoint.
   * @param {object} frontendState - The current state from the UI.
   * @returns {object} - The payload ready for the database.
   */
  function mapStateToDB(frontendState) {
    // The backend schema is already very close to the frontend state.
    // We just need to ensure the structure is correct.
    return {
      name: frontendState.name,
      personal: frontendState.personal,
      interestedIn: frontendState.interestedIn,
      skills: frontendState.skills,
      appearance: frontendState.appearance,
      photos: frontendState.photos,
      credits: frontendState.credits,
    };
  }

  /**
   * =================================================================
   * SECTION 3: Core Application Logic
   * =================================================================
   */

  /**
   * Saves the entire profile to the backend.
   */
  async function saveProfile() {
    console.log('Saving profile...', state);
    try {
      const dbPayload = mapStateToDB(state);
      await AppAPI.updateProfile(dbPayload);
      alert('Profile saved successfully!');
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert(`Error: ${error.message}`);
    }
  }

  /**
   * Initializes the application by fetching the user's profile.
   */
  async function initializeProfile() {
    try {
      const response = await AppAPI.getProfile();
      state = response.data;
      // Now, you would call a function to render this state to the UI
      renderProfile(state);
      console.log('Profile loaded:', state);
    } catch (error) {
      console.error('Failed to initialize profile:', error);
    }
  }
  
  /**
    * Renders the fetched profile data into the HTML.
    * @param {object} profile - The profile state object.
    */
  function renderProfile(profile) {
    // This is a simplified example. You would need to populate all fields.
    document.getElementById('talentName').textContent = `${profile.name.first} ${profile.name.last}`;
    
    // Example for personal info
    document.querySelector('#personal-gender .value').textContent = profile.personal.gender || '-';
    document.querySelector('#personal-dob .value').textContent = profile.personal.dob ? new Date(profile.personal.dob).toLocaleDateString() : '-';

    // Example for skills (chips)
    const skillsContainer = document.getElementById('skillsContainer');
    skillsContainer.innerHTML = '';
    (profile.skills || []).forEach(skill => {
        const chip = document.createElement('div');
        chip.className = 'bg-violet-50 text-violet-800 text-xs font-semibold px-2.5 py-1 rounded-full';
        chip.textContent = skill;
        skillsContainer.appendChild(chip);
    });

    // Example for photos
    const headshotImg = document.getElementById('headshotImage');
    if (profile.photos.headshot) {
        headshotImg.src = profile.photos.headshot;
        headshotImg.classList.remove('hide');
    }
  }


  /**
   * =================================================================
   * SECTION 4: CropperJS and Upload Logic
   * =================================================================
   */

  /**
   * Initializes the Cropper modal for a given image.
   * @param {string} imageUrl - The Data URL of the image to crop.
   * @param {object} context - Contains upload type and callback.
   */
  function openCropper(imageUrl, context) {
    currentUploadContext = context;
    modalCrop.classList.remove('hide');
    cropImage.src = imageUrl;

    if (cropper) {
      cropper.destroy();
    }

    cropper = new Cropper(cropImage, {
      aspectRatio: context.aspectRatio || 1,
      viewMode: 1,
      dragMode: 'move',
      background: false,
      autoCropArea: 0.8,
    });
  }

  // Event listener for the "Apply & Save" button in the crop modal
  cropApplyBtn.addEventListener('click', async () => {
    if (!cropper || !currentUploadContext.callback) return;

    // 1. Get the cropped canvas as a Blob
    cropper.getCroppedCanvas({
      width: 1024, // Define output resolution
      height: 1024,
      imageSmoothingQuality: 'high',
    }).toBlob(async (blob) => {
      if (!blob) {
        alert('Could not create cropped image.');
        return;
      }

      // 2. Create a FormData object
      const formData = new FormData();
      formData.append('file', blob, `${currentUploadContext.type}.webp`);

      try {
        // 3. POST to the /upload endpoint
        const uploadResponse = await AppAPI.uploadImage(formData);
        
        if (uploadResponse.status === 'ok' && uploadResponse.url) {
          // 4. Update state and UI
          currentUploadContext.callback(uploadResponse.url);
          
          // 5. Save the entire profile with the new image URL
          await saveProfile();
          
          modalCrop.classList.add('hide');
          cropper.destroy();
        } else {
          throw new Error(uploadResponse.message || 'Upload failed to return a URL.');
        }
      } catch (error) {
        console.error('Upload process failed:', error);
        alert(`Upload Error: ${error.message}`);
      }

    }, 'image/webp', 0.9); // Use WebP format with 90% quality
  });
  
  // Example of how to trigger the cropper
  document.getElementById('uploadHeadshotBtn').addEventListener('click', () => {
      const fileInput = document.getElementById('fileInputSingle');
      fileInput.onchange = (e) => {
          const file = e.target.files[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (event) => {
              openCropper(event.target.result, {
                  type: 'headshot',
                  aspectRatio: 1,
                  callback: (url) => {
                      state.photos.headshot = url;
                      document.getElementById('headshotImage').src = url; // Update UI immediately
                  }
              });
          };
          reader.readAsDataURL(file);
      };
      fileInput.click();
  });


  // --- Initial Load ---
  initializeProfile();

});
