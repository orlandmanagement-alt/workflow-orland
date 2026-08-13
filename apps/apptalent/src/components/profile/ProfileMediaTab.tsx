// File: apps/apptalent/src/components/profile/ProfileMediaTab.tsx
import { useState } from 'react';
import { Upload, Trash2, Star, Camera, AlertCircle } from 'lucide-react';
import { formatCdnUrl } from '@/lib/profileHelpers';

interface MediaItem {
  id: string;
  url: string;
  type: 'photo' | 'video';
  alt_text?: string;
  is_main?: boolean;
}

interface ProfileMediaTabProps {
  data: {
    photos?: MediaItem[];
    videos?: MediaItem[];
  };
  onChange: (field: string, value: any) => void;
  onUploadClick?: () => void;
}

export default function ProfileMediaTab({
  data,
  onChange,
  onUploadClick,
}: ProfileMediaTabProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const photos = data.photos || [];
  const videos = data.videos || [];

  const handleSetAsMain = (photoId: string) => {
    const updated = photos.map((p) => ({
      ...p,
      is_main: p.id === photoId,
    }));
    onChange('photos', updated);
  };

  const handleRemovePhoto = (photoId: string) => {
    const updated = photos.filter((p) => p.id !== photoId);
    onChange('photos', updated);
  };

  const handleRemoveVideo = (videoId: string) => {
    const updated = videos.filter((v) => v.id !== videoId);
    onChange('videos', updated);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('File harus berupa gambar (JPG, PNG, WebP)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setUploadError('Ukuran file maksimal 10MB');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Step 1: Get presigned URL from backend
      const presignedResponse = await fetch('/api/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `profile-${Date.now()}-${file.name}`,
          contentType: file.type,
        }),
      });

      if (!presignedResponse.ok) {
        throw new Error('Gagal mendapat presigned URL');
      }

      const { uploadUrl, finalUrl } = await presignedResponse.json();

      // Step 2: Upload file to R2 using presigned URL
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': file.type,
        },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error('Gagal upload file');
      }

      // Step 3: Add to photos array
      const newPhoto: MediaItem = {
        id: `photo-${Date.now()}`,
        url: formatCdnUrl(finalUrl),
        type: 'photo',
        alt_text: file.name,
        is_main: photos.length === 0, // First photo is main by default
      };

      const updated = [...photos, newPhoto];
      onChange('photos', updated);
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Error uploading file');
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Photos Section */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Camera size={20} className="text-amber-400" /> Foto Profile
        </h3>

        {/* Photo Grid */}
        <div className="space-y-4 mb-6">
          {photos.length === 0 && (
            <div className="text-center py-8 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed">
              <Camera className="mx-auto text-slate-500 mb-2" size={32} />
              <p className="text-slate-400 text-sm">Belum ada foto. Upload foto profile Anda.</p>
            </div>
          )}

          {photos.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <img
                    src={photo.url}
                    alt={photo.alt_text}
                    className="w-full h-40 object-cover rounded-lg border-2 border-slate-700 group-hover:border-blue-500 transition-colors"
                  />
                  {photo.is_main && (
                    <div className="absolute top-2 left-2 bg-amber-400 text-slate-900 px-2 py-1 rounded-full flex items-center gap-1 text-xs font-bold">
                      <Star size={12} /> Main
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    {!photo.is_main && (
                      <button
                        onClick={() => handleSetAsMain(photo.id)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                      >
                        <Star size={12} /> Set Main
                      </button>
                    )}
                    <button
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                    >
                      <Trash2 size={12} /> Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{uploadError}</p>
          </div>
        )}

        {/* Upload Button */}
        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            disabled={isUploading}
            className="hidden"
          />
          <button
            onClick={(e) => {
              e.preventDefault();
              const inputEl = (e.currentTarget as HTMLElement).querySelector('input') as HTMLInputElement;
              inputEl?.click();
            }}
            disabled={isUploading}
            className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
          >
            <Upload size={18} />
            {isUploading ? 'Uploading...' : 'Upload Foto'}
          </button>
        </label>

        <p className="text-xs text-slate-400 mt-2">
          📁 Format: JPG, PNG, WebP | Maksimal: 10MB | Rekomendasi: Portrait photo berukuran headshot
        </p>
      </div>

      {/* Videos Section */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Camera size={20} className="text-purple-400" /> Video Reel
        </h3>

        {videos.length === 0 && (
          <div className="text-center py-8 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed">
            <Camera className="mx-auto text-slate-500 mb-2" size={32} />
            <p className="text-slate-400 text-sm">Belum ada video. Video bisa ditambah di Digital Assets.</p>
          </div>
        )}

        {videos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {videos.map((video) => (
              <div key={video.id} className="relative group">
                <div className="w-full h-40 bg-slate-700 rounded-lg flex items-center justify-center border-2 border-slate-700 group-hover:border-purple-500 transition-colors">
                  <Camera className="text-slate-500" size={32} />
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <button
                    onClick={() => handleRemoveVideo(video.id)}
                    className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Trash2 size={12} /> Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-xs text-slate-300">
          💡 Foto berkualitas tinggi meningkatkan kemungkinan Anda mendapat job opportunities. Pastikan pencahayaan
          bagus dan ekspresi natural.
        </p>
      </div>
    </div>
  );
}
