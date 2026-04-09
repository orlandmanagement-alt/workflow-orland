/**
 * Frontend Integration Examples
 * Shows how to use the new components and utilities in your React app
 */

import React from 'react';
import MultiDropzone from '@/components/shared/MultiDropzone';
import CSVImport from '@/components/shared/CSVImport';
import AgencyRoster from '@/components/agency/AgencyRoster';
import { compressImageForCredit } from '@/lib/imageCompressor';

/**
 * Example 1: Multi-Image Upload Page for Talent Profile
 */
export function TalentMediaUploadPage() {
  const handleImagesReady = (images: any[]) => {
    console.log('Images ready:', images);
    // Save state to manage images before upload
  };

  const handleUploadComplete = (uploadUrls: string[]) => {
    console.log('Upload complete:', uploadUrls);
    // Save URLs to database
    // showSuccessMessage(`Uploaded ${uploadUrls.length} images`);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Upload Your Portfolio</h1>
      <MultiDropzone
        onImagesReady={handleImagesReady}
        onUploadComplete={handleUploadComplete}
        maxFiles={10}
        presignedUrlEndpoint="/api/v1/media/upload-url"
      />
    </div>
  );
}

/**
 * Example 2: Bulk Import Talents (Admin/Agency)
 */
export function BulkTalentImportPage() {
  const handleImportComplete = (count: number) => {
    console.log(`Imported ${count} talents`);
    // Refresh talent list or redirect
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Bulk Import Talents</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <CSVImport
          mode="talents"
          endpoint="/api/v1/agency/talents/bulk"
          onImportComplete={handleImportComplete}
        />
      </div>
    </div>
  );
}

/**
 * Example 3: Bulk Import Credits (Talent)
 */
export function BulkCreditImportPage() {
  const handleImportComplete = (count: number) => {
    console.log(`Imported ${count} credits`);
    // Refresh credits list
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Bulk Import Credits</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <CSVImport
          mode="credits"
          endpoint="/api/v1/talents/me/credits/bulk"
          onImportComplete={handleImportComplete}
        />
      </div>
    </div>
  );
}

/**
 * Example 4: Agency Roster Display
 */
export function AgencyRosterPage({ agencyId }: { agencyId: string }) {
  return (
    <div className="max-w-6xl mx-auto p-6">
      <AgencyRoster agencyId={agencyId} showContactInfo={true} />
    </div>
  );
}

/**
 * Example 5: Single Image Compression with Upload
 */
export async function compressAndUploadImage(file: File) {
  try {
    // Step 1: Compress image
    const compressed = await compressImageForCredit(file, {
      quality: 0.6,
      maxWidth: 400,
      maxHeight: 400,
      format: 'jpeg',
    });

    console.log(`Compressed from ${(file.size / 1024).toFixed(2)}KB to ${compressed.sizeKB}KB`);

    // Step 2: Get presigned URL
    const urlResponse = await fetch('/api/v1/media/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: `credit-${Date.now()}.jpg`,
        contentType: 'image/jpeg',
      }),
    });

    const { uploadUrl } = await urlResponse.json();

    // Step 3: Upload to R2
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: compressed.blob,
      headers: { 'Content-Type': 'image/jpeg' },
    });

    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }

    // Step 4: Return the public URL
    const publicUrl = uploadUrl.split('?')[0];
    return publicUrl;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Example 6: Multiple Images Compression (Concurrent)
 */
export async function compressMultipleAndUpload(files: File[]) {
  try {
    // Compress all images concurrently
    const compressedPromises = files.map((file) =>
      compressImageForCredit(file, { quality: 0.6, maxWidth: 400 })
    );
    const compressed = await Promise.all(compressedPromises);

    // Get all presigned URLs
    const urlPromises = compressed.map((img) =>
      fetch('/api/v1/media/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `image-${Date.now()}-${Math.random()}.jpg`,
          contentType: 'image/jpeg',
        }),
      }).then((r) => r.json())
    );
    const urls = await Promise.all(urlPromises);

    // Upload all files concurrently
    const uploadPromises = compressed.map((img, idx) =>
      fetch(urls[idx].uploadUrl, {
        method: 'PUT',
        body: img.blob,
        headers: { 'Content-Type': 'image/jpeg' },
      })
    );
    await Promise.all(uploadPromises);

    // Return all public URLs
    return urls.map((url) => url.uploadUrl.split('?')[0]);
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

/**
 * Example 7: Setting Authentication Headers
 */
export function setupAuthHeaders() {
  const userId = localStorage.getItem('userId');
  const userTier = localStorage.getItem('userTier') || 'free';
  const userRole = localStorage.getItem('userRole') || 'talent';

  return {
    'x-user-id': userId,
    'x-user-tier': userTier as 'free' | 'premium',
    'x-user-role': userRole,
  };
}

/**
 * Example 8: Batch Apply to Casting (Agency)
 */
export async function batchApplyTalents(projectId: string, talentIds: string[]) {
  try {
    const response = await fetch(`/api/v1/agency/projects/${projectId}/apply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...setupAuthHeaders(),
      },
      body: JSON.stringify({ talentIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error);
    }

    const result = await response.json();
    console.log(`Applied ${result.appliedCount} talents`);
    return result;
  } catch (error) {
    console.error('Error applying talents:', error);
    throw error;
  }
}

/**
 * Example 9: Fetch Public Talent Profile with Masking
 */
export async function fetchTalentProfile(talentId: string) {
  try {
    const response = await fetch(`/api/v1/public/talents/${talentId}`, {
      headers: setupAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error('Talent not found');
    }

    const talent = await response.json();
    console.log('Talent profile:', talent);
    // Email/phone will be masked or unmasked based on user tier
    return talent;
  } catch (error) {
    console.error('Error fetching talent:', error);
    throw error;
  }
}

/**
 * Example 10: Reorder Media (Drag-and-Drop Result)
 */
export async function reorderMedia(items: Array<{ id: string; sort_order: number }>) {
  try {
    const response = await fetch('/api/v1/media/reorder', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...setupAuthHeaders(),
      },
      body: JSON.stringify({ items }),
    });

    if (!response.ok) {
      throw new Error('Failed to reorder media');
    }

    const result = await response.json();
    console.log('Media reordered:', result);
    return result;
  } catch (error) {
    console.error('Error reordering media:', error);
    throw error;
  }
}

export default {
  TalentMediaUploadPage,
  BulkTalentImportPage,
  BulkCreditImportPage,
  AgencyRosterPage,
  compressAndUploadImage,
  compressMultipleAndUpload,
  setupAuthHeaders,
  batchApplyTalents,
  fetchTalentProfile,
  reorderMedia,
};
