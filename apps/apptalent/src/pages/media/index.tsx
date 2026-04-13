import { useState, useEffect } from 'react';
import { ImagePlus, Star, Trash2, UploadCloud, AlertCircle, Loader2 } from 'lucide-react';
import { mediaService } from '@/lib/services/mediaService';

interface MediaItem {
  id: string;
  file_key: string;
  public_url: string;
  file_name: string;
  is_main: boolean;
  created_at: string;
}

export default function MediaGallery() {
  const [gallery, setGallery] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      const data = await mediaService.getMedia();
      setGallery(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load media');
      setGallery([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const uploadPromises = Array.from(files).map(file =>
      mediaService.uploadMedia(file, 'talents')
        .catch(err => {
          console.error(`Failed to upload ${file.name}:`, err);
          throw err;
        })
    );

    try {
      await Promise.all(uploadPromises);
      await fetchMedia();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload media');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (mediaId: string) => {
    if (!confirm('Yakin ingin menghapus gambar ini dari galeri publik Anda?')) {
      return;
    }

    try {
      setLoading(true);
      await mediaService.deleteMedia(mediaId);
      await fetchMedia();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete media');
    } finally {
      setLoading(false);
    }
  };

  const setAsMain = async (mediaId: string) => {
    try {
      setLoading(true);
      await mediaService.setMainMedia(mediaId);
      await fetchMedia();
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to set main media');
    } finally {
      setLoading(false);
    }
  };

  if (loading && gallery.length === 0) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="animate-spin text-brand-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center"><ImagePlus className="mr-2 text-brand-500" /> Comp Card Pro</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Kelola aset visual Anda. Klien menyukai profil dengan minimal 3 foto.</p>
        </div>
        <button 
          onClick={() => document.getElementById('gallery-upload')?.click()} 
          disabled={uploading}
          className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2"
        >
          {uploading ? <Loader2 size={18} className="animate-spin" /> : <UploadCloud size={18} />}
          {uploading ? 'Mengunggah...' : 'Upload Foto Baru'}
        </button>
        <input 
          type="file" 
          id="gallery-upload" 
          accept="image/*" 
          multiple 
          className="hidden" 
          onChange={handleUpload}
          disabled={uploading}
        />
      </div>

      {/* ERROR ALERT */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-start gap-3">
          <AlertCircle size={20} className="text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-800 dark:text-red-400">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* ALERT TIPS */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800/50 p-4 rounded-2xl flex items-start gap-3">
        <AlertCircle size={20} className="text-blue-600 dark:text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">Pastikan foto memiliki pencahayaan baik, latar belakang polos, dan tidak banyak diedit. Foto natural memiliki peluang 80% lebih tinggi dipilih oleh Klien.</p>
      </div>

      {/* GALLERY GRID */}
      {gallery.length === 0 ? (
        <div className="bg-white dark:bg-dark-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-sm">
          <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4"><ImagePlus size={32}/></div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Galeri Masih Kosong</h3>
          <p className="text-slate-500 text-sm mt-1">Unggah beberapa foto terbaik Anda sekarang.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
          {gallery.map((img) => (
            <div key={img.id} className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800">
              <img src={img.public_url} alt={img.file_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              
              {/* OVERLAY KONTROL */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-between items-start">
                  {img.is_main && (
                    <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center gap-1">
                      <Star size={10} className="fill-amber-950"/> Utama
                    </span>
                  )}
                  <button 
                    onClick={() => handleDelete(img.id)}
                    disabled={loading}
                    className="p-2 bg-red-500/80 hover:bg-red-600 disabled:opacity-50 text-white rounded-lg backdrop-blur-sm transition-colors"
                  >
                    {loading ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>

                {/* ACTION BUTTON */}
                <div>
                  <p className="text-white text-xs font-bold mb-2 opacity-90">{img.file_name}</p>
                  {!img.is_main && (
                    <button 
                      onClick={() => setAsMain(img.id)}
                      disabled={loading}
                      className="w-full py-2 bg-white/20 hover:bg-white/30 disabled:opacity-50 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/30 transition-colors"
                    >
                      Jadikan Foto Utama
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
