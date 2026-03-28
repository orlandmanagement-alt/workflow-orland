import { useState } from 'react';
import { Users, Send, CheckSquare, Square, MoreHorizontal, AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

// Simulasi Data Talent di dalam Project
const INITIAL_ROSTER = [
  { id: 'T1', name: 'Sarah Lee', role: 'Main Character (Ibu)', fee: 'Rp 15.000.000', status: 'Shortlisted', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' },
  { id: 'T2', name: 'Budi Santoso', role: 'Supporting (Ayah)', fee: 'Rp 8.000.000', status: 'Offered', image: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=150' },
  { id: 'T3', name: 'Jessica Wong', role: 'Extras (Anak)', fee: 'Rp 2.500.000', status: 'Booked', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=150' },
  { id: 'T4', name: 'Kevin Julio', role: 'Extras (Teman)', fee: 'Rp 2.500.000', status: 'Rejected', image: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=150' },
];

export default function RosterManager() {
  const [roster, setRoster] = useState(INITIAL_ROSTER);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showOfferModal, setShowOfferModal] = useState(false);

  // Toggle Checkbox
  const toggleSelect = (id: string) => {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
      if (selectedIds.length === roster.length) setSelectedIds([]);
      else setSelectedIds(roster.map(t => t.id));
  };

  // Bulk Action: Send Offer
  const handleBulkOffer = () => {
      setShowOfferModal(false);
      setRoster(prev => prev.map(t => selectedIds.includes(t.id) && t.status === 'Shortlisted' ? { ...t, status: 'Offered' } : t));
      setSelectedIds([]);
      alert('Penawaran resmi berhasil dikirim ke aplikasi Talent yang dipilih!');
  };

  const getStatusBadge = (status: string) => {
      switch(status) {
          case 'Booked': return <span className="flex items-center text-[10px] font-bold px-2 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"><CheckCircle2 size={12} className="mr-1"/> BOOKED</span>;
          case 'Rejected': return <span className="flex items-center text-[10px] font-bold px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"><XCircle size={12} className="mr-1"/> REJECTED</span>;
          case 'Offered': return <span className="flex items-center text-[10px] font-bold px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800"><Clock size={12} className="mr-1"/> OFFERED</span>;
          default: return <span className="flex items-center text-[10px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"><AlertCircle size={12} className="mr-1"/> SHORTLISTED</span>;
      }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      
      {/* TOOLBAR & BULK ACTIONS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2">
              <button onClick={toggleSelectAll} className="text-slate-400 hover:text-brand-500 transition-colors">
                  {selectedIds.length === roster.length && roster.length > 0 ? <CheckSquare className="text-brand-500" /> : <Square />}
              </button>
              <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {selectedIds.length} terpilih
              </span>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
              <button 
                  disabled={selectedIds.length === 0}
                  onClick={() => setShowOfferModal(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-xl shadow-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:hover:scale-100"
              >
                  <Send size={16} className="mr-2"/> Kirim Penawaran Serentak
              </button>
          </div>
      </div>

      {/* DATA TABLE ROSTER */}
      <div className="bg-white dark:bg-dark-card rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                  <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                      <th className="p-4 w-12 text-center"></th>
                      <th className="p-4">Talent & Peran</th>
                      <th className="p-4">Pengajuan Honor</th>
                      <th className="p-4">Status Kontrak</th>
                      <th className="p-4 text-right">Aksi</th>
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {roster.map((talent) => (
                      <tr key={talent.id} className={`transition-colors ${selectedIds.includes(talent.id) ? 'bg-brand-50/50 dark:bg-brand-900/10' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'}`}>
                          <td className="p-4 text-center">
                              <button onClick={() => toggleSelect(talent.id)} className="text-slate-300 hover:text-brand-500 transition-colors mt-1">
                                  {selectedIds.includes(talent.id) ? <CheckSquare className="text-brand-500" /> : <Square />}
                              </button>
                          </td>
                          <td className="p-4">
                              <div className="flex items-center gap-3">
                                  <img src={talent.image} alt="Talent" className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700" />
                                  <div>
                                      <p className="font-bold text-slate-900 dark:text-white text-sm">{talent.name}</p>
                                      <p className="text-[10px] text-slate-500 uppercase tracking-wider">{talent.role}</p>
                                  </div>
                              </div>
                          </td>
                          <td className="p-4">
                              <span className="font-bold text-slate-700 dark:text-slate-300 text-sm">{talent.fee}</span>
                          </td>
                          <td className="p-4">
                              {getStatusBadge(talent.status)}
                          </td>
                          <td className="p-4 text-right">
                              <button className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                  <MoreHorizontal size={18} />
                              </button>
                          </td>
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* MODAL KONFIRMASI BULK OFFER */}
      {showOfferModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-dark-card w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                  <div className="h-16 w-16 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mb-6 mx-auto"><Send size={32}/></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white text-center mb-2">Kirim Penawaran Resmi?</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-8">Anda akan mengirimkan SPK (Surat Perintah Kerja) dan pengajuan honor ke <b>{selectedIds.length} talent</b> terpilih. Mereka harus menyetujuinya via aplikasi mereka.</p>
                  
                  <div className="flex gap-3">
                      <button onClick={() => setShowOfferModal(false)} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Batal</button>
                      <button onClick={handleBulkOffer} className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:scale-105 transition-transform shadow-lg">Ya, Kirim Sekarang</button>
                  </div>
              </div>
          </div>
      )}

    </div>
  )
}
