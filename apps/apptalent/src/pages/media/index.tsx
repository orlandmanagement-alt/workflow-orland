import { useState } from 'react';
import { ImagePlus, Star, Trash2, UploadCloud, AlertCircle } from 'lucide-react';

// Simulasi Data Galeri
const MOCK_GALLERY = [
  { id: 1, url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=800', type: 'Main Headshot', isMain: true },
  { id: 2, url: 'https://images.unsplash.com/photo-1515347619152-16b0808fea2b?auto=format&fit=crop&q=80&w=800', type: 'Full Body', isMain: false },
  { id: 3, url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=800', type: 'Side Profile', isMain: false },
];

export default function MediaGallery() {
  const [gallery, setGallery] = useState(MOCK_GALLERY);

  const handleDelete = (id: number) => {
      if(confirm('Yakin ingin menghapus foto ini dari galeri publik Anda?')) {
          setGallery(prev => prev.filter(img => img.id !== id));
      }
  };

  const setAsMain = (id: number) => {
      setGallery(prev => prev.map(img => ({ ...img, isMain: img.id === id })));
      alert("Berhasil! Foto ini sekarang menjadi foto utama (Headshot) Anda.");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center"><ImagePlus className="mr-2 text-brand-500" /> Comp Card Pro</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Kelola aset visual Anda. Klien menyukai profil dengan minimal 3 foto.</p>
          </div>
          <button onClick={() => document.getElementById('gallery-upload')?.click()} className="w-full sm:w-auto px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg transition-colors flex items-center justify-center">
              <UploadCloud size={18} className="mr-2" /> Upload Foto Baru
          </button>
          <input type="file" id="gallery-upload" accept="image/*" multiple className="hidden" onChange={(e) => { if(e.target.files) alert("Simulasi: " + e.target.files.length + " Foto siap diunggah!"); }} />
      </div>

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
                      <img src={img.url} alt="Gallery" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      
                      {/* OVERLAY KONTROL */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                          
                          {/* BADGE MAIN PHOTO */}
                          <div className="flex justify-between items-start">
                              {img.isMain ? (
                                  <span className="bg-amber-400 text-amber-950 text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg flex items-center"><Star size={10} className="mr-1 fill-amber-950"/> Utama</span>
                              ) : (
                                  <span></span> // Spacer
                              )}
                              
                              <button onClick={() => handleDelete(img.id)} className="p-2 bg-red-500/80 hover:bg-red-600 text-white rounded-lg backdrop-blur-sm transition-colors">
                                  <Trash2 size={14} />
                              </button>
                          </div>

                          {/* ACTION BUTTON */}
                          <div>
                              <p className="text-white text-xs font-bold mb-2 opacity-90">{img.type}</p>
                              {!img.isMain && (
                                  <button onClick={() => setAsMain(img.id)} className="w-full py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white text-xs font-bold rounded-lg border border-white/30 transition-colors">
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
  )
}
