import { useState, useEffect } from 'react';
import { FileText, Download, UploadCloud, ShieldCheck, AlertCircle, Clock, Filter, Search, CheckCircle2, Loader2, X, AlertTriangle } from 'lucide-react';
import { phase4API } from '@/lib/phase4API';

export default function FinanceHub() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [stats, setStats] = useState({
    unpaid: 'Rp 0',
    escrowHeld: 'Rp 0',
    totalReleased: 'Rp 0'
  });

  // Fetch invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await phase4API.getInvoices();
        if (response.status === 'success' && response.data) {
          setInvoices(response.data);
          
          // Calculate stats from API data
          const unpaidTotal = response.data
            .filter((inv: any) => inv.status === 'UNPAID')
            .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
          const escrowTotal = response.data
            .filter((inv: any) => inv.status === 'ESCROW HELD')
            .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
          const releasedTotal = response.data
            .filter((inv: any) => inv.status === 'RELEASED')
            .reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
          
          setStats({
            unpaid: `Rp ${(unpaidTotal / 1000000).toFixed(0)} Jt`,
            escrowHeld: `Rp ${(escrowTotal / 1000000).toFixed(0)} Jt`,
            totalReleased: `Rp ${(releasedTotal / 1000000).toFixed(0)} Jt`
          });
        }
      } catch (err: any) {
        console.error('Failed to fetch invoices:', err);
        setError(err.message || 'Gagal memuat data invoices');
        // Set default fallback values
        setInvoices([]);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const handleUploadProof = () => {
      setIsUploading(true);
      // Simulasi proses kompresi & upload ke R2
      setTimeout(() => {
          setIsUploading(false);
          setInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? { ...inv, status: 'ESCROW HELD' } : inv));
          setSelectedInvoice(null);
          // Recalculate stats
          const updatedInvoices = invoices.map(inv => inv.id === selectedInvoice.id ? { ...inv, status: 'ESCROW HELD' } : inv);
          const unpaidTotal = updatedInvoices.filter((inv: any) => inv.status === 'UNPAID').reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
          const escrowTotal = updatedInvoices.filter((inv: any) => inv.status === 'ESCROW HELD').reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
          const releasedTotal = updatedInvoices.filter((inv: any) => inv.status === 'RELEASED').reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
          setStats({
            unpaid: `Rp ${(unpaidTotal / 1000000).toFixed(0)} Jt`,
            escrowHeld: `Rp ${(escrowTotal / 1000000).toFixed(0)} Jt`,
            totalReleased: `Rp ${(releasedTotal / 1000000).toFixed(0)} Jt`
          });
          alert('Bukti transfer berhasil diunggah! Dana Anda kini aman di Escrow Orland sampai project selesai.');
      }, 2500);
  };

  const getStatusBadge = (status: string) => {
      if (status === 'UNPAID') return <span className="flex items-center w-fit text-[10px] font-bold px-2.5 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 border border-red-200 dark:border-red-800"><AlertCircle size={12} className="mr-1.5"/> BELUM DIBAYAR</span>;
      if (status === 'ESCROW HELD') return <span className="flex items-center w-fit text-[10px] font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800"><ShieldCheck size={12} className="mr-1.5"/> ESCROW (DITAHAN)</span>;
      return <span className="flex items-center w-fit text-[10px] font-bold px-2.5 py-1 rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"><CheckCircle2 size={12} className="mr-1.5"/> LUNAS & SELESAI</span>;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      
      {/* HEADER & QUICK STATS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
                <FileText className="mr-3 text-brand-500" size={32}/> Finance & Escrow
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">Kelola tagihan proyek Anda. Dana Anda dijamin aman di rekening Escrow Orland hingga pekerjaan talent selesai.</p>
        </div>
      </div>

      {/* ERROR ALERT */}
      {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3 flex-1">
                  <div className="p-2 bg-red-100 dark:bg-red-800 rounded-full text-red-600 dark:text-red-300 shrink-0"><AlertTriangle size={20} /></div>
                  <div>
                      <h3 className="font-bold text-red-900 dark:text-red-400">Gagal Memuat Invoices</h3>
                      <p className="text-sm text-red-700 dark:text-red-300 mt-0.5">{error}</p>
                  </div>
              </div>
              <button onClick={() => window.location.reload()} className="w-full sm:w-auto whitespace-nowrap px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md transition-colors">
                  Coba Lagi
              </button>
          </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-red-200 dark:border-red-900/30 shadow-sm shadow-red-500/5 flex flex-col">
              <span className="text-xs font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center"><AlertCircle size={14} className="mr-1"/> Harus Dibayar (Unpaid)</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stats.unpaid}</h2>
              <p className="text-xs text-slate-500">{invoices.filter(inv => inv.status === 'UNPAID').length} Tagihan jatuh tempo segera</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-900/10 p-6 rounded-3xl border border-amber-200 dark:border-amber-800/50 shadow-sm flex flex-col">
              <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider mb-2 flex items-center"><ShieldCheck size={14} className="mr-1"/> Dana Aman (Escrow Held)</span>
              <h2 className="text-3xl font-black text-amber-900 dark:text-amber-400 mb-1">{stats.escrowHeld}</h2>
              <p className="text-xs text-amber-700/70 dark:text-amber-500/70">Menunggu {invoices.filter(inv => inv.status === 'ESCROW HELD').length} proyek selesai</p>
          </div>
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center"><CheckCircle2 size={14} className="mr-1"/> Total Tersalurkan</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stats.totalReleased}</h2>
              <p className="text-xs text-slate-500">Sepanjang tahun 2026</p>
          </div>
      </div>

      {/* INVOICE TABLE TOOLBAR */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mt-8">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="relative flex-1 w-full sm:max-w-xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Search className="text-slate-400" size={18} /></div>
                  <input type="text" placeholder="Cari No Invoice / Project..." className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none dark:text-white transition-shadow" />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                  <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <Filter size={16} className="mr-2"/> Filter Waktu
                  </button>
                  <button className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                      <Download size={16} className="mr-2"/> Export CSV
                  </button>
              </div>
          </div>
          
          {/* LOADING STATE */}
          {loading && !error ? (
            <div className="p-8 text-center flex items-center justify-center gap-2">
              <Loader2 className="animate-spin text-brand-500" size={24} />
              <span className="text-slate-600 dark:text-slate-400 font-bold">Memuat invoices...</span>
            </div>
          ) : !error && invoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <FileText className="mx-auto mb-3 opacity-50" size={40} />
              <p className="font-bold">Belum ada invoices</p>
            </div>
          ) : !error ? (
            <>
              {/* DATA TABLE */}
              <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                          <th className="p-4 pl-6">No. Invoice & Project</th>
                          <th className="p-4">Tipe Tagihan</th>
                          <th className="p-4">Nominal (Rp)</th>
                          <th className="p-4">Batas Waktu</th>
                          <th className="p-4">Status</th>
                          <th className="p-4 pr-6 text-right">Aksi</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="p-4 pl-6">
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{inv.project}</p>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{inv.id}</p>
                              </td>
                              <td className="p-4"><span className="text-xs text-slate-600 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{inv.type}</span></td>
                              <td className="p-4"><span className="font-black text-slate-900 dark:text-white text-base">{typeof inv.amount === 'number' ? `Rp ${(inv.amount / 1000000).toFixed(1)} Jt` : inv.amount}</span></td>
                              <td className="p-4">
                                  <div className={`flex items-center text-xs font-bold ${inv.status === 'UNPAID' ? 'text-red-500' : 'text-slate-500'}`}>
                                      <Clock size={12} className="mr-1.5"/> {inv.dueDate}
                                  </div>
                              </td>
                              <td className="p-4">{getStatusBadge(inv.status)}</td>
                              <td className="p-4 pr-6 text-right">
                                  {inv.status === 'UNPAID' ? (
                                      <button 
                                          onClick={() => setSelectedInvoice(inv)}
                                          className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold rounded-lg shadow-md transition-colors flex items-center justify-end w-full sm:w-auto ml-auto"
                                      >
                                          <UploadCloud size={14} className="mr-1.5"/> Upload Bukti
                                      </button>
                                  ) : (
                                      <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center justify-end w-full sm:w-auto ml-auto">
                                          Lihat Detail
                                      </button>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
            </>
          ) : (
            <div className="p-8 text-center text-red-500">
              <AlertCircle className="mx-auto mb-3 opacity-50" size={40} />
              <p className="font-bold">{error}</p>
            </div>
          )}
      </div>

      {/* MODAL UPLOAD BUKTI TRANSFER (SECURE PAYMENT UPLOADER) */}
      {selectedInvoice && (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95">
                  
                  {/* Modal Header */}
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                      <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white">Upload Bukti Transfer</h3>
                          <p className="text-xs text-slate-500 font-mono mt-1">{selectedInvoice.id} • {selectedInvoice.project}</p>
                      </div>
                      <button onClick={() => !isUploading && setSelectedInvoice(null)} className="p-2 bg-white dark:bg-slate-700 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors border border-slate-200 dark:border-slate-600">
                          <X size={20} />
                      </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 sm:p-8">
                      <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 mb-6 flex items-start gap-3">
                          <ShieldCheck size={20} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                          <p className="text-xs text-amber-800 dark:text-amber-400/90 leading-relaxed">
                              Silakan transfer sebesar <b className="font-black text-amber-900 dark:text-amber-300">{typeof selectedInvoice.amount === 'number' ? `Rp ${(selectedInvoice.amount / 1000000).toFixed(1)} Jt` : selectedInvoice.amount}</b> ke rekening <b>BCA 1234567890 a.n Orland Management Escrow</b>. Dana akan ditahan dengan aman dan tidak disalurkan ke Talent sebelum proyek selesai 100%.
                          </p>
                      </div>

                      {/* Smart Dropzone Simulation */}
                      <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-8 flex flex-col items-center justify-center text-center group hover:border-brand-500 hover:bg-brand-50 dark:hover:bg-brand-900/10 transition-colors cursor-pointer mb-6">
                          <div className="h-16 w-16 bg-white dark:bg-slate-800 rounded-full shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <UploadCloud size={28} className="text-brand-500" />
                          </div>
                          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm mb-1">Pilih File Bukti Transfer (JPG/PNG/PDF)</p>
                          <p className="text-xs text-slate-500">Sistem akan mengompresi gambar secara otomatis agar ukuran kecil namun teks nominal tetap tajam.</p>
                      </div>

                      <button 
                          onClick={handleUploadProof} 
                          disabled={isUploading} 
                          className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
                      >
                          {isUploading ? <><Loader2 size={18} className="animate-spin mr-2"/> Mengompresi & Mengunggah...</> : <><ShieldCheck size={18} className="mr-2"/> Amankan Dana ke Escrow</>}
                      </button>
                  </div>
              </div>
          </div>
      )}

    </div>
  )
}
