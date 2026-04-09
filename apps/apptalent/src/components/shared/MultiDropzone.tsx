/**
 * Multi-Dropzone Component with Drag-and-Drop Sorting
 * Allows uploading multiple images with reordering capability
 */

import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Upload, X, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { compressImageForCredit, validateCreditImage } from '../../lib/imageCompressor';

interface UploadedImage {
  id: string;
  file: Blob;
  preview: string;
  sizeKB: number;
  width: number;
  height: number;
  uploadProgress?: number;
  uploaded?: boolean;
}

interface MultiDropzoneProps {
  onImagesReady?: (images: UploadedImage[]) => void;
  onUploadComplete?: (uploadUrls: string[]) => void;
  maxFiles?: number;
  presignedUrlEndpoint?: string;
}

const MultiDropzone: React.FC<MultiDropzoneProps> = ({
  onImagesReady,
  onUploadComplete,
  maxFiles = 50,
  presignedUrlEndpoint = '/api/v1/media/upload-url',
}) => {
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      distance: 8,
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Handle file selection and compression
   */
  const handleFiles = useCallback(
    async (files: FileList) => {
      try {
        setError(null);

        const fileArray = Array.from(files);
        const remainingSlots = maxFiles - images.length;

        if (fileArray.length > remainingSlots) {
          setError(
            `You can only upload ${remainingSlots} more image${
              remainingSlots !== 1 ? 's' : ''
            }`
          );
          return;
        }

        // Validate and compress all files
        const validFiles = fileArray.filter((file) => {
          const validation = validateCreditImage(file);
          if (!validation.valid) {
            setError(validation.error || 'Invalid file');
            return false;
          }
          return true;
        });

        // Compress all images concurrently
        const compressedPromises = validFiles.map(async (file) => {
          try {
            const compressed = await compressImageForCredit(file);
            const preview = URL.createObjectURL(compressed.blob);

            return {
              id: `${Date.now()}-${Math.random()}`,
              file: compressed.blob,
              preview,
              sizeKB: compressed.sizeKB,
              width: compressed.width,
              height: compressed.height,
            };
          } catch (err) {
            console.error('Error compressing image:', err);
            throw err;
          }
        });

        const newImages = await Promise.all(compressedPromises);
        const updated = [...images, ...newImages];
        setImages(updated);

        // Notify parent component
        if (onImagesReady) {
          onImagesReady(updated);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to process images'
        );
      }
    },
    [images.length, maxFiles, onImagesReady]
  );

  /**
   * Handle drag and drop
   */
  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  /**
   * Handle file input change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFiles(e.target.files);
    }
  };

  /**
   * Handle drag end for reordering
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const activeIndex = images.findIndex((img) => img.id === active.id);
      const overIndex = images.findIndex((img) => img.id === over.id);

      if (activeIndex !== -1 && overIndex !== -1) {
        const newImages = arrayMove(images, activeIndex, overIndex);
        setImages(newImages);

        if (onImagesReady) {
          onImagesReady(newImages);
        }
      }
    }
  };

  /**
   * Remove image
   */
  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  /**
   * Upload images to R2
   */
  const uploadImages = async () => {
    try {
      setUploading(true);
      setError(null);

      const uploadUrls: string[] = [];

      for (let i = 0; i < images.length; i++) {
        const image = images[i];

        // Get presigned URL
        const urlResponse = await fetch(presignedUrlEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: `credit-thumbnail-${Date.now()}-${i}.jpg`,
            contentType: image.file.type || 'image/jpeg',
          }),
        });

        if (!urlResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl } = await urlResponse.json();

        // Upload to R2
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: image.file,
          headers: {
            'Content-Type': image.file.type || 'image/jpeg',
          },
        });

        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for image ${i + 1}`);
        }

        // Extract URL from presigned URL (remove query params)
        const baseUrl = uploadUrl.split('?')[0];
        uploadUrls.push(baseUrl);

        // Update upload progress
        setImages((prev) =>
          prev.map((img, idx) =>
            idx === i ? { ...img, uploadProgress: 100, uploaded: true } : img
          )
        );
      }

      if (onUploadComplete) {
        onUploadComplete(uploadUrls);
      }

      // Clear images after successful upload
      setTimeout(() => {
        setImages([]);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative p-8 border-2 border-dashed rounded-lg transition-colors ${
          dragActive
            ? 'border-indigo-500 bg-indigo-50'
            : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        <div className="text-center">
          <Upload className="mx-auto text-gray-400 mb-3" size={32} />
          <p className="text-gray-900 font-medium">Drag and drop images here</p>
          <p className="text-gray-500 text-sm mt-1">
            or click to browse (max {maxFiles} images, &lt;100KB each)
          </p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* Image Preview Grid with Sorting */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-gray-900">
              {images.length} image{images.length !== 1 ? 's' : ''} ready
            </h3>
            <span className="text-sm text-gray-500">
              {images.reduce((sum, img) => sum + img.sizeKB, 0)} KB total
            </span>
          </div>

          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={images.map((img) => img.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className="relative group rounded-lg overflow-hidden bg-gray-100 aspect-square"
                  >
                    {/* Image */}
                    <img
                      src={image.preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-full object-cover"
                    />

                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        onClick={() => removeImage(image.id)}
                        type="button"
                        disabled={uploading}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 disabled:opacity-50"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Info Badge */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2">
                      <div className="flex justify-between">
                        <span>{image.sizeKB} KB</span>
                        <span>{index + 1}</span>
                      </div>
                    </div>

                    {/* Upload Status */}
                    {image.uploaded && (
                      <div className="absolute top-2 right-2 bg-green-600 rounded-full p-1">
                        <CheckCircle size={20} className="text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>
          </DndContext>

          {/* Upload Button */}
          <button
            onClick={uploadImages}
            disabled={uploading || images.length === 0}
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <Loader size={20} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={20} />
                Upload {images.length} Image{images.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiDropzone;
