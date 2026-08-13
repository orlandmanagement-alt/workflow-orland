/**
 * Image Compression Utility for Credits/Experience Thumbnails
 * Ensures images are under 100KB while maintaining acceptable quality
 */

export interface CompressionOptions {
  quality?: number; // 0-1 (default: 0.6)
  maxWidth?: number; // default: 400
  maxHeight?: number; // default: 400
  format?: 'jpeg' | 'webp'; // default: 'jpeg'
}

export interface CompressionResult {
  blob: Blob;
  sizeKB: number;
  width: number;
  height: number;
  mimeType: string;
}

/**
 * Compress image aggressively for credit thumbnails (<100KB constraint)
 * Uses canvas for efficient compression
 */
export async function compressImageForCredit(
  file: File,
  options: CompressionOptions = {}
): Promise<CompressionResult> {
  const {
    quality = 0.6,
    maxWidth = 400,
    maxHeight = 400,
    format = 'jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    // Create file reader
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        try {
          // Calculate new dimensions maintaining aspect ratio
          let { width, height } = img;
          const aspectRatio = width / height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              width = maxWidth;
              height = Math.round(maxWidth / aspectRatio);
            } else {
              height = maxHeight;
              width = Math.round(maxHeight * aspectRatio);
            }
          }

          // Create canvas and compress
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            throw new Error('Failed to get canvas context');
          }

          // Draw image on canvas
          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with compression
          const mimeType = format === 'webp' ? 'image/webp' : 'image/jpeg';
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }

              const sizeKB = Math.round(blob.size / 1024);

              // If still over 100KB, further reduce quality
              if (sizeKB > 100) {
                const newQuality = Math.max(0.3, quality * 0.7);
                compressImageForCredit(file, { ...options, quality: newQuality })
                  .then(resolve)
                  .catch(reject);
                return;
              }

              resolve({
                blob,
                sizeKB,
                width,
                height,
                mimeType,
              });
            },
            mimeType,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Compress multiple images concurrently
 */
export async function compressMultipleImages(
  files: File[],
  options: CompressionOptions = {}
): Promise<CompressionResult[]> {
  const promises = files.map((file) => compressImageForCredit(file, options));
  return Promise.all(promises);
}

/**
 * Validate if image meets credit requirements
 */
export function validateCreditImage(file: File): { valid: boolean; error?: string } {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (!validTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid image format. Only JPEG, PNG, and WebP are allowed.' };
  }

  if (file.size > 5 * 1024 * 1024) {
    // 5MB max before compression
    return { valid: false, error: 'Image is too large. Maximum 5MB before compression.' };
  }

  return { valid: true };
}

/**
 * Utility to upload compressed image to R2
 */
export async function uploadCompressedImageToR2(
  compressedImage: CompressionResult,
  presignedUrl: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('file', compressedImage.blob);

    const response = await fetch(presignedUrl, {
      method: 'PUT',
      body: compressedImage.blob,
      headers: {
        'Content-Type': compressedImage.mimeType,
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Upload failed with status ${response.status}`,
      };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during upload',
    };
  }
}

/**
 * ENTERPRISE: Strict compress mode for Credit/Experience Thumbnails
 * Optimized for <100KB constraint with aggressive compression
 * 
 * Usage: For work credits, experience images, company logos
 * Ensures consistent sizing: max 400x300px
 * Quality: 0.6 baseline (auto-reduces if still over 100KB)
 */
export async function strictCompressForThumbnail(
  file: File
): Promise<CompressionResult> {
  const validation = validateCreditImage(file);
  if (!validation.valid) {
    throw new Error(validation.error || 'Image validation failed');
  }

  return compressImageForCredit(file, {
    quality: 0.6,
    maxWidth: 400,
    maxHeight: 300, // More aggressive height constraint for thumbnails
    format: 'jpeg',
  });
}

/**
 * Batch compress multiple thumbnail images
 * Useful for bulk credit photo uploads
 */
export async function strictCompressMultipleThumbnails(
  files: File[]
): Promise<CompressionResult[]> {
  const results = await Promise.all(
    files.map((file) => strictCompressForThumbnail(file))
  );

  // Validate all are under 100KB
  const oversized = results.filter((r) => r.sizeKB > 100);
  if (oversized.length > 0) {
    console.warn(
      `${oversized.length} images exceeded 100KB despite compression. ` +
      `Consider splitting into multiple uploads.`
    );
  }

  return results;
}
