import { useRef, useState, useCallback } from 'react';
import { ImagePlus, Star, Loader2, Trash2, Crop as CropIcon } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaService } from '@/lib/services/mediaService';
import Cropper from 'react-easy-crop';
import imageCompression from 'browser-image-compression';
import getCroppedImg from '@/utils/cropImage';

export default function MediaPortfolio() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // STATE UNTUK CROPPER
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { data: mediaList, isLoading, isError } = useQuery({ queryKey: ['my-media'], queryFn: mediaService.getMedia });

  const uploadMutation = useMutation({
    mutationFn: mediaService.uploadMedia,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['my-media'] });
        if(fileInputRef.current) fileInputRef.current.value = '';
    },
    onError: (error: any) => alert(error.message || 'Gagal mengunggah file.'),
  });

  const setMainMutation = useMutation({
    mutationFn: mediaService.setMainMedia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-media'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: mediaService.deleteMedia,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-media'] }),
  });

  // TAHAP 1: PILIH FILE
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
         // Jika Gambar, buka Cropper
         const reader = new FileReader();
         reader.readAsDataURL(file);
         reader.onload = () => {
            setImageSrc(reader.result as string);
            setOriginalFile(file);
         }
      } else {
         // Jika Video (Max 50MB), langsung upload
         if (file.size > 50 * 1024 * 1024) return alert('Ukuran video maksimal 50MB');
         uploadMutation.mutate(file);
      }
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // TAHAP 2: POTONG & KOMPRES
  const processAndUpload = async () => {
       try {
          setIsProcessing(true);
          let fileToUpload = originalFile;

          // 1. Potong (Crop)
          if (imageSrc && croppedAreaPixels) {
             const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels);
             if (croppedFile) fileToUpload = croppedFile;
          }

          if (fileToUpload) {
             // 2. Kompres (Compress)
             const options = {
               maxSizeMB: 1, // Maksimal 1MB!
               maxWidthOrHeight: 1920,
               useWebWorker: true,
             };
             const compressedFile = await imageCompression(fileToUpload, options);
             
             // 3. Upload ke API & R2
             uploadMutation.mutate(compressedFile);
          }
       } catch (e) {
          alert('Terjadi kesalahan saat memproses gambar.');
       } finally {
          setIsProcessing(false);
          setImageSrc(null);
          setOriginalFile(null);
       }
  }

  const handleDelete = (id: string) => {
      if(confirm('Yakin menghapus media ini permanen?')) deleteMutation.mutate(id);
  }

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={40} /></div>;
  if (isError) return <div className="p-10 text-center text-red-500">Gagal memuat galeri.</div>;

  const items = Array.isArray(mediaList) ? mediaList : [];

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* CROPPER MODAL (Hanya muncul jika ada foto yang dipilih) */}
      {imageSrc && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col animate-in fade-in">
            <div className="relative flex-1">
            <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={4 / 5} // Standar rasio Comp Card Orland
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
            />
            </div>
            <div className="bg-slate-900 p-6 flex flex-col sm:flex-row gap-6 justify-between items-center border-t border-slate-800">
                <div className="w-full sm:w-1/2 flex items-center text-white">
                    <span className="text-xs font-bold mr-4">ZOOM</span>
                    <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full accent-brand-500" />
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                    <button onClick={() => {setImageSrc(null); setOriginalFile(null);}} className="flex-1 px-6 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition">Batal</button>
                    <button onClick={processAndUpload} disabled={isProcessing} className="flex-1 px-6 py-3 bg-brand-600 text-white font-bold rounded-xl flex items-center justify-center hover:bg-brand-700 transition shadow-lg shadow-brand-500/50 min-w-[180px]">
                        {isProcessing ? <><Loader2 className="animate-spin mr-2" size={18} /> Memproses...</> : <><CropIcon className="mr-2" size={18} /> Potong & Simpan</>}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* HEADER GALERI */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Comp Card Pro</h1>
        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*,video/mp4" className="hidden" />
        <button onClick={() => fileInputRef.current?.click()} disabled={uploadMutation.isPending} className="flex items-center px-6 py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-500/30 hover:bg-brand-700 disabled:opacity-70 transition-all w-full sm:w-auto justify-center">
          {uploadMutation.isPending ? <Loader2 size={20} className="animate-spin mr-2" /> : <ImagePlus size={20} className="mr-2" />}
          {uploadMutation.isPending ? 'Mengunggah ke R2...' : 'Upload Media Baru'}
        </button>
      </div>
      
      <p className="text-sm text-slate-500 dark:text-slate-400">Tekan tombol bintang untuk menjadikan foto sebagai Sampul. Sistem AI Orland akan otomatis memotong dan mengompres foto Anda.</p>

      {/* GRID GALERI */}
      {items.length === 0 ? (
        <div className="bg-white dark:bg-dark-card p-10 rounded-3xl border border-slate-200 dark:border-slate-800 border-dashed text-center shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Galeri Masih Kosong</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">Mulai unggah Headshot dan Foto Full Body Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((media: any) => (
              <div key={media.media_id} className={`group relative bg-slate-100 dark:bg-slate-800 rounded-3xl aspect-[4/5] flex flex-col justify-end p-3 transition-all overflow-hidden border-2 ${media.is_main ? 'border-brand-500 shadow-lg shadow-brand-500/30 scale-[1.02]' : 'border-transparent'}`}>
                  {media.url && <img src={media.url} alt="Portofolio" className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-0"></div>

                  <button onClick={() => setMainMutation.mutate(media.media_id)} className="absolute top-3 left-3 h-8 w-8 sm:h-10 sm:w-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-full flex items-center justify-center text-slate-400 hover:text-brand-500 hover:scale-110 transition-all z-10 shadow-sm" title="Jadikan Sampul">
                      <Star size={18} className={media.is_main ? "fill-brand-500 text-brand-500" : ""} />
                  </button>

                  {media.is_main && <div className="absolute top-3 right-3 bg-brand-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center shadow-lg z-10"><Star size={12} className="mr-1 fill-white" /> Sampul</div>}
                  
                  <div className="relative z-10 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-2 sm:p-3 rounded-xl flex justify-between items-center mt-auto shadow-sm">
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-xs sm:text-sm text-slate-800 dark:text-white truncate">{media.filename}</span>
                        <span className="text-[10px] sm:text-xs font-semibold text-slate-500 uppercase">{media.type}</span>
                      </div>
                      <button onClick={() => handleDelete(media.media_id)} disabled={deleteMutation.isPending} className="text-red-500 p-1.5 sm:p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors shrink-0">
                        {deleteMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                  </div>
              </div>
          ))}
        </div>
      )}
    </div>
  )
}
