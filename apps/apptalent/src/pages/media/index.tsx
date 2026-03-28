import { useRef } from 'react';
import { ImagePlus, Star, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '@/lib/services/mediaService';

export default function MediaPortfolio() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: mediaList, isLoading, isError } = useQuery({
    queryKey: ['my-media'],
    queryFn: mediaService.getMedia,
  });

  const uploadMutation = useMutation({
    mutationFn: mediaService.uploadMedia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-media'] }),
    onError: (error: any) => alert(error.message || 'Gagal mengunggah file.'),
  });

  const setMainMutation = useMutation({
    mutationFn: mediaService.setMainMedia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-media'] }),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) return alert('Ukuran maksimal file adalah 10MB');
      uploadMutation.mutate(file);
    }
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={40} /></div>;
  if (isError) return <div className="p-10 text-center text-red-500">Gagal memuat galeri portofolio. (API belum siap)</div>;

  const items = Array.isArray(mediaList) ? mediaList : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Galeri Portofolio</h1>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/mp4" className="hidden" />
        <button 
          onClick={() => fileInputRef.current?.click()} 
          disabled={uploadMutation.isPending}
          className="flex items-center px-5 py-2.5 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 disabled:opacity-70 transition-all w-full sm:w-auto justify-center"
        >
          {uploadMutation.isPending ? <Loader2 size={18} className="animate-spin mr-2" /> : <ImagePlus size={18} className="mr-2" />}
          {uploadMutation.isPending ? 'Mengunggah...' : 'Upload Media Baru'}
        </button>
      </div>
      
      <p className="text-sm text-slate-500 dark:text-slate-400">Tekan tombol bintang untuk menjadikan foto sebagai Sampul Comp Card. Gunakan kualitas terbaik untuk menarik Klien.</p>

      {items.length === 0 ? (
        <div className="bg-white dark:bg-dark-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed text-center shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Galeri Masih Kosong</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Mulai unggah Headshot dan Foto Full Body Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {items.map((media: any) => (
              <div key={media.id} className={`group relative bg-slate-100 dark:bg-slate-800 rounded-3xl h-64 flex flex-col justify-end p-4 transition-all overflow-hidden border-2 ${media.is_main ? 'border-brand-500 shadow-lg shadow-brand-500/20' : 'border-transparent'}`}>
                  {media.url && (
                    <img src={media.url} alt="Portofolio" className="absolute inset-0 w-full h-full object-cover rounded-2xl opacity-90 group-hover:scale-105 transition-transform duration-500" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent z-0"></div>

                  <button 
                    onClick={() => setMainMutation.mutate(media.id)}
                    className="absolute top-4 left-4 h-9 w-9 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-brand-500 hover:scale-110 transition-all z-10 shadow-sm"
                    title="Jadikan Sampul"
                  >
                      <Star size={18} className={media.is_main ? "fill-brand-500 text-brand-500" : ""} />
                  </button>

                  {media.is_main && (
                      <div className="absolute top-4 right-4 bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg z-10">
                          <Star size={12} className="mr-1 fill-white" /> Sampul
                      </div>
                  )}
                  
                  <div className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl flex justify-between items-center mt-auto shadow-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-slate-800 dark:text-white truncate max-w-[120px]">{media.filename || 'Portofolio'}</span>
                        <span className="text-xs font-semibold text-slate-500 uppercase">{media.type || 'IMAGE'}</span>
                      </div>
                      <button className="text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                  </div>
              </div>
          ))}
        </div>
      )}
    </div>
  )
}
