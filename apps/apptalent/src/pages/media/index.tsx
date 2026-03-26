import { ImagePlus, GripVertical, Star } from 'lucide-react';
export default function MediaPortfolio() {
  const dummyMedia = [
    { id: 1, type: 'Headshot', isMain: true },
    { id: 2, type: 'Full Body', isMain: false },
    { id: 3, type: 'Samping', isMain: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Galeri Portofolio</h1>
        <button className="flex items-center px-4 py-2 bg-brand-600 text-white font-bold rounded-xl shadow-lg hover:bg-brand-700 transition-colors">
          <ImagePlus size={18} className="mr-2" /> Upload
        </button>
      </div>
      
      <p className="text-sm text-slate-500 dark:text-slate-400">Tekan dan geser (Drag & Drop) ikon titik enam untuk mengubah urutan foto. Foto urutan pertama otomatis menjadi Sampul Comp Card.</p>

      {/* Grid Drag and Drop Visual */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {dummyMedia.map((media, i) => (
            <div key={media.id} className={`group relative bg-slate-100 dark:bg-slate-800 rounded-3xl h-64 border-2 flex flex-col justify-end p-4 transition-all ${media.isMain ? 'border-brand-500 shadow-[0_0_15px_rgba(14,165,233,0.2)]' : 'border-dashed border-slate-300 dark:border-slate-700 hover:border-slate-400'}`}>
                
                {/* Gagang Drag & Drop */}
                <div className="absolute top-4 left-4 h-8 w-8 bg-white/80 dark:bg-black/50 backdrop-blur rounded-lg flex items-center justify-center cursor-grab active:cursor-grabbing text-slate-600 dark:text-slate-300 hover:text-brand-600 transition-colors">
                    <GripVertical size={20} />
                </div>

                {/* Badge Sampul Utama */}
                {media.isMain && (
                    <div className="absolute top-4 right-4 bg-brand-500 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center shadow-lg">
                        <Star size={12} className="mr-1 fill-white" /> Sampul Utama
                    </div>
                )}
                
                {/* Informasi Gambar Bawah */}
                <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md p-3 rounded-xl flex justify-between items-center">
                    <span className="font-bold text-sm dark:text-white">{media.type}</span>
                    <span className="text-xs font-semibold text-slate-500">#{i + 1}</span>
                </div>
            </div>
        ))}
      </div>
    </div>
  )
}
