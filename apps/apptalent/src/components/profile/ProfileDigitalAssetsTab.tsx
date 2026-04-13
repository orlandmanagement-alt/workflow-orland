// File: apps/apptalent/src/components/profile/ProfileDigitalAssetsTab.tsx
import { useState } from 'react';
import { Plus, Trash2, Music, Video, AlertCircle } from 'lucide-react';
import { extractYouTubeId, getAudioEmbedUrl, isValidUrl, formatCdnUrl } from '@/lib/profileHelpers';

interface DigitalAsset {
  id: string;
  url: string;
  type: 'youtube' | 'spotify' | 'soundcloud';
  title?: string;
}

interface ProfileDigitalAssetsTabProps {
  data: {
    digital_assets?: DigitalAsset[];
  };
  onChange: (field: string, value: any) => void;
}

export default function ProfileDigitalAssetsTab({
  data,
  onChange,
}: ProfileDigitalAssetsTabProps) {
  const [assets, setAssets] = useState<DigitalAsset[]>(data.digital_assets || []);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);
  const [preview, setPreview] = useState<{
    type: 'youtube' | 'spotify' | 'soundcloud' | null | undefined;
    id?: string;
  }>({ type: null });

  const detectAssetType = (url: string): 'youtube' | 'spotify' | 'soundcloud' | null => {
    if (!isValidUrl(url)) return null;

    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    }
    if (url.includes('spotify.com')) {
      return 'spotify';
    }
    if (url.includes('soundcloud.com')) {
      return 'soundcloud';
    }
    return null;
  };

  const handleUrlChange = (url: string) => {
    setNewUrl(url);
    setUrlError(null);

    if (url.trim()) {
      const type = detectAssetType(url);
      if (type) {
        if (type === 'youtube') {
          const id = extractYouTubeId(url) || undefined;
          setPreview({ type: 'youtube', id });
        } else {
          setPreview({ type });
        }
      } else {
        setPreview({ type: null });
      }
    } else {
      setPreview({ type: null });
    }
  };

  const handleAddAsset = () => {
    if (!newUrl.trim()) {
      setUrlError('Masukkan URL terlebih dahulu');
      return;
    }

    const type = detectAssetType(newUrl);
    if (!type) {
      setUrlError('URL harus berupa YouTube, Spotify, atau SoundCloud');
      return;
    }

    const newAsset: DigitalAsset = {
      id: `asset-${Date.now()}`,
      url: newUrl,
      type,
      title: newTitle || type.charAt(0).toUpperCase() + type.slice(1),
    };

    const updated = [...assets, newAsset];
    setAssets(updated);
    onChange('digital_assets', updated);

    // Reset form
    setNewUrl('');
    setNewTitle('');
    setUrlError(null);
    setPreview({ type: null });
  };

  const handleRemoveAsset = (id: string) => {
    const updated = assets.filter((a) => a.id !== id);
    setAssets(updated);
    onChange('digital_assets', updated);
  };

  const getEmbedUrl = (asset: DigitalAsset): string | null => {
    if (asset.type === 'youtube') {
      const id = extractYouTubeId(asset.url);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return getAudioEmbedUrl(asset.url);
  };

  const getPreviewUrl = () => {
    if (!preview.type) return null;

    if (preview.type === 'youtube' && preview.id) {
      return `https://www.youtube.com/embed/${preview.id}`;
    }
    if (preview.type === 'spotify' || preview.type === 'soundcloud') {
      return getAudioEmbedUrl(newUrl);
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Add Asset Form */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Plus size={20} /> Tambah Digital Assets
        </h3>

        {/* URL Input */}
        <div className="mb-4 space-y-2">
          <label className="block text-sm font-bold text-slate-300">URL Media</label>
          <input
            type="text"
            value={newUrl}
            onChange={(e) => handleUrlChange(e.target.value)}
            placeholder="Paste YouTube, Spotify, atau SoundCloud link..."
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          <p className="text-xs text-slate-400">
            ✅ Dukungan: YouTube, Spotify, SoundCloud
          </p>
        </div>

        {/* Title Input */}
        <div className="mb-4 space-y-2">
          <label className="block text-sm font-bold text-slate-300">Judul (Opsional)</label>
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Misal: 'Cover Song - Melodi Indah'"
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Error Message */}
        {urlError && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex gap-2">
            <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-300">{urlError}</p>
          </div>
        )}

        {/* Preview */}
        {getPreviewUrl() && (
          <div className="mb-4 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
            <p className="px-4 py-2 text-xs font-bold text-slate-400 bg-slate-900">Preview:</p>
            {preview.type === 'youtube' && preview.id && (
              <iframe
                width="100%"
                height="250"
                src={`https://www.youtube.com/embed/${preview.id}`}
                title="YouTube preview"
                allowFullScreen
                className="border-0"
              />
            )}
            {(preview.type === 'spotify' || preview.type === 'soundcloud') && (
              <div className="px-4 py-4 text-center text-slate-400 text-sm">
                Audio embed preview akan muncul setelah ditambahkan
              </div>
            )}
          </div>
        )}

        {/* Add Button */}
        <button
          onClick={handleAddAsset}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={18} /> Tambah Asset
        </button>
      </div>

      {/* Assets List */}
      <div>
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          {assets.length > 0 ? (
            <>
              <Video size={20} /> Digital Assets ({assets.length})
            </>
          ) : (
            <>
              <Video size={20} /> Digital Assets
            </>
          )}
        </h3>

        {assets.length === 0 && (
          <div className="text-center py-8 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed">
            <Music className="mx-auto text-slate-500 mb-2" size={32} />
            <p className="text-slate-400 text-sm">Belum ada digital assets. Tambahkan di atas.</p>
          </div>
        )}

        <div className="space-y-4">
          {assets.map((asset) => {
            const embedUrl = getEmbedUrl(asset);
            return (
              <div
                key={asset.id}
                className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {asset.type === 'youtube' && (
                        <Video size={16} className="text-red-400" />
                      )}
                      {asset.type === 'spotify' && (
                        <Music size={16} className="text-green-400" />
                      )}
                      {asset.type === 'soundcloud' && (
                        <Music size={16} className="text-orange-400" />
                      )}
                      <h4 className="font-bold text-white">{asset.title}</h4>
                      <span className="ml-auto px-2 py-1 bg-slate-700 rounded text-xs font-bold text-slate-300">
                        {asset.type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate">{asset.url}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveAsset(asset.id)}
                    className="text-red-400 hover:text-red-300 transition-colors p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                {/* Embed Preview */}
                {embedUrl && (
                  <div className="bg-slate-900/50 rounded-lg overflow-hidden border border-slate-700">
                    {asset.type === 'youtube' && (
                      <iframe
                        width="100%"
                        height="220"
                        src={embedUrl}
                        title={asset.title}
                        allowFullScreen
                        className="border-0"
                      />
                    )}
                    {(asset.type === 'spotify' || asset.type === 'soundcloud') && (
                      <div className="px-4 py-4 text-center text-slate-400 text-sm">
                        🎵 {asset.type.toUpperCase()} audio - akan otomatis embed ketika dipublikasi
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
        <p className="text-xs text-slate-300 space-y-2">
          <p>💡 Digital Assets membantu showcase talent Anda:</p>
          <ul className="text-xs text-slate-400 list-disc list-inside">
            <li>YouTube: Demo, cover, performance
            </li>
            <li>Spotify: Musik original, kolaborasi
            </li>
            <li>SoundCloud: Podcast, audio production
            </li>
          </ul>
        </p>
      </div>
    </div>
  );
}
