import { useState } from 'react';
import { HardHat, Box, Plus, ShoppingCart, CheckCircle } from 'lucide-react';

const INFRA_ITEMS = [
  { id: 'INF-1', name: 'Panggung Utama 8x6m', price: 'Rp 15jt', desc: 'Rangka besi, alas kayu jati', img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=400' },
  { id: 'INF-2', name: 'Palet Kayu Pinus', price: 'Rp 85rb', desc: 'Custom size untuk dekorasi', img: 'https://images.unsplash.com/photo-1590644365607-1c5a519a7a37?q=80&w=400' },
  { id: 'INF-3', name: 'Sound System 10k Watt', price: 'Rp 5jt', desc: 'Lengkap dengan operator', img: 'https://images.unsplash.com/photo-1545127398-14699f92334b?q=80&w=400' },
];

export default function InfraCatalog() {
  const [cart, setCart] = useState(0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      <div className="flex justify-between items-center bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
            <HardHat className="text-brand-500" size={24}/> Logistics & Infra
          </h1>
          <p className="text-sm text-slate-500 italic">Pengadaan kebutuhan fisik event langsung dari vendor mitra Orland.</p>
        </div>
        <div className="relative p-3 bg-slate-900 text-white rounded-2xl">
          <ShoppingCart size={20} />
          <span className="absolute -top-1 -right-1 bg-brand-500 text-[10px] w-5 h-5 rounded-full flex items-center justify-center font-bold">{cart}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {INFRA_ITEMS.map(item => (
          <div key={item.id} className="bg-white dark:bg-dark-card rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group">
            <div className="h-40 overflow-hidden relative">
              <img src={item.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
              <div className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-md">{item.price}</div>
            </div>
            <div className="p-5">
              <h3 className="font-bold text-slate-900 dark:text-white">{item.name}</h3>
              <p className="text-xs text-slate-500 mt-1 mb-4">{item.desc}</p>
              <button onClick={() => setCart(c => c + 1)} className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold rounded-xl hover:bg-brand-500 hover:text-white transition-all flex items-center justify-center gap-2">
                <Plus size={14}/> Tambah ke Request
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
