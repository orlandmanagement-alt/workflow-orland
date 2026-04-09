import { useState, useEffect } from 'react';
import { FileSignature, FileText, Download, Eye, Plus, AlertTriangle, CheckCircle2, ShieldAlert, Clock, X, Loader2 } from 'lucide-react';
import { phase4API } from '@/lib/phase4API';

export default function ContractsHub() {
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState<any>(null); // State untuk PDF Viewer Modal
  const [stats, setStats] = useState({
    expiring: 0,
    pending: 0,
    active: 0
  });

  // Fetch contracts from API
  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setLoading(true);
        const response = await phase4API.getContracts();
        if (response.status === 'success' && response.data) {
          setContracts(response.data);
          
          // Calculate stats
          const expiring = response.data.filter((c: any) => c.status === 'expiring_soon').length;
          const pending = response.data.filter((c: any) => c.status === 'pending').length;
          const active = response.data.filter((c: any) => c.status === 'signed').length;
          
          setStats({ expiring, pending, active });
        }
      } catch (err) {
        console.error('Failed to fetch contracts:', err);
        // Keep fallback empty array
      } finally {
        setLoading(false);
      }
    };

    fetchContracts();
  }, []);

  const getStatusBadge = (status: string, daysLeft: number | null) => {
      if (status === 'EXPIRING SOON') {
          return (
              <span className="flex items-center w-fit text-[10px] font-bold px-2.5 py-1 rounded bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400 border border-pink-200 dark:border-pink-800 animate-pulse">
                  <ShieldAlert size={12} className="mr-1.5"/> SISA {daysLeft} HARI
              </span>
          );
      }
      if (status === 'PENDING') {
          return (
              <span className="flex items-center w-fit text-[10px] font-bold px-2.5 py-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                  <Clock size={12} className="mr-1.5"/> MENUNGGU TTD
              </span>
          );
      }
      return (
          <span className="flex items-center w-fit text-[10px] font-bold px-2.5 py-1 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <CheckCircle2 size={12} className="mr-1.5"/> SIGNED (SAH)
          </span>
      );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      
      {/* HEADER & ACTIONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
                <FileSignature className="mr-3 text-brand-500" size={32}/> Legal & Contracts
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">Pusat dokumen hukum (SPK, NDA) dan pemantauan masa berlaku Izin Tayang (Usage Rights) talent.</p>
        </div>
        
        <button className="w-full sm:w-auto flex items-center justify-center px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-sm font-bold shadow-lg hover:scale-105 transition-transform">
            <Plus size={18} className="mr-2"/> Generate Template NDA
        </button>
      </div>

      {/* QUICK STATS ALERTS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <div className="bg-pink-50 dark:bg-pink-900/10 p-6 rounded-3xl border border-pink-200 dark:border-pink-800/50 shadow-sm flex flex-col">
              <span className="text-xs font-bold text-pink-600 dark:text-pink-400 uppercase tracking-wider mb-2 flex items-center"><ShieldAlert size={14} className="mr-1"/> Usage Right Expiring</span>
              <h2 className="text-3xl font-black text-pink-700 dark:text-pink-300 mb-1">{stats.expiring} Dokumen</h2>
              <p className="text-xs text-pink-600/70 dark:text-pink-400/70">Masa tayang iklan akan habis bulan ini.</p>
          </div>
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider mb-2 flex items-center"><Clock size={14} className="mr-1"/> Menunggu Tanda Tangan</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stats.pending} SPK</h2>
              <p className="text-xs text-slate-500">Talent belum menandatangani kontrak.</p>
          </div>
          <div className="bg-white dark:bg-dark-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
              <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2 flex items-center"><CheckCircle2 size={14} className="mr-1"/> Kontrak Aktif</span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-1">{stats.active} Dokumen</h2>
              <p className="text-xs text-slate-500">Aman dan mengikat secara hukum.</p>
          </div>
      </div>

      {/* CONTRACTS DATA TABLE */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 flex items-center">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Arsip Dokumen Aktif</h3>
          </div>
          
          {loading ? (
            <div className="p-8 text-center flex items-center justify-center gap-2">
              <Loader2 className="animate-spin text-brand-500" size={24} />
              <span className="text-slate-600 dark:text-slate-400 font-bold">Memuat kontrak...</span>
            </div>
          ) : contracts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 dark:text-slate-400">
              <FileText className="mx-auto mb-3 opacity-50" size={40} />
              <p className="font-bold">Belum ada kontrak</p>
            </div>
          ) : contracts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead>
                      <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                          <th className="p-4 pl-6">Judul Dokumen</th>
                          <th className="p-4">Jenis</th>
                          <th className="p-4">Pihak Terkait</th>
                          <th className="p-4">Batas Waktu / Validitas</th>
                          <th className="p-4">Status Legal</th>
                          <th className="p-4 pr-6 text-right">Aksi</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                      {contracts.map((doc) => (
                          <tr key={doc.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                              <td className="p-4 pl-6">
                                  <p className="font-bold text-slate-900 dark:text-white text-sm">{doc.title}</p>
                                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{doc.id}</p>
                              </td>
                              <td className="p-4"><span className="text-xs font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">{doc.type}</span></td>
                              <td className="p-4"><p className="text-sm font-medium text-slate-700 dark:text-slate-300">{doc.talent}</p></td>
                              <td className="p-4">
                                  <p className={`text-sm font-bold ${doc.status === 'EXPIRING SOON' ? 'text-pink-600 dark:text-pink-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                      {doc.validUntil}
                                  </p>
                              </td>
                              <td className="p-4">{getStatusBadge(doc.status, doc.daysLeft)}</td>
                              <td className="p-4 pr-6 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                      <button onClick={() => setViewDoc(doc)} className="p-2 text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg transition-colors" title="Lihat PDF">
                                          <Eye size={18} />
                                      </button>
                                      <button className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors" title="Download">
                                          <Download size={18} />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
          ) : null}
      </div>

      {/* PDF VIEWER MODAL SIMULATION */}
      {viewDoc && (
          <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
              <div className="bg-slate-100 dark:bg-[#1e1e1e] w-full max-w-4xl h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-slate-300 dark:border-slate-700 flex flex-col animate-in zoom-in-95">
                  
                  {/* PDF Toolbar */}
                  <div className="bg-white dark:bg-[#2d2d2d] p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shadow-sm z-10">
                      <div className="flex items-center gap-3">
                          <FileText className="text-red-500" size={24}/>
                          <div>
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{viewDoc.title}.pdf</h3>
                              <p className="text-[10px] text-slate-500">Secured Document • Orland Legal Dept.</p>
                          </div>
                      </div>
                      <div className="flex gap-2">
                          <button className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-sm font-bold text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center">
                              <Download size={16} className="mr-2"/> Unduh
                          </button>
                          <button onClick={() => setViewDoc(null)} className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-lg transition-colors">
                              <X size={20} />
                          </button>
                      </div>
                  </div>

                  {/* Simulated PDF Canvas */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-slate-200 dark:bg-[#121212]">
                      <div className="bg-white w-full max-w-2xl min-h-[800px] shadow-lg p-10 sm:p-16 relative">
                          {/* Watermark */}
                          <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none">
                              <span className="text-8xl font-black transform -rotate-45 text-black">CONFIDENTIAL</span>
                          </div>
                          
                          {/* PDF Content Skeleton */}
                          <div className="space-y-6">
                              <div className="text-center mb-10 border-b-2 border-black pb-4">
                                  <h1 className="text-2xl font-black uppercase text-black">{viewDoc.type}</h1>
                                  <p className="text-xs font-mono text-gray-500 mt-2">REF: {viewDoc.id} / ORLAND / 2026</p>
                              </div>

                              <p className="text-sm text-black leading-relaxed text-justify">
                                  Perjanjian ini dibuat dan ditandatangani pada hari ini, antara pihak <strong>Orland Management</strong> dan pihak <strong>{viewDoc.talent}</strong> (selanjutnya disebut sebagai "Talent").
                              </p>
                              <div className="h-4 bg-gray-200 rounded w-full animate-pulse mt-4"></div>
                              <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse mt-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse mt-2"></div>
                              
                              <h3 className="font-bold text-black mt-8 text-sm">PASAL 1: RUANG LINGKUP PEKERJAAN</h3>
                              <div className="h-4 bg-gray-200 rounded w-full animate-pulse mt-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-full animate-pulse mt-2"></div>
                              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mt-2"></div>

                              {viewDoc.status === 'EXPIRING SOON' && (
                                  <div className="mt-8 p-4 border-2 border-pink-500 bg-pink-50">
                                      <h3 className="font-bold text-pink-700 text-sm">PERHATIAN: BATAS WAKTU IZIN TAYANG</h3>
                                      <p className="text-xs text-pink-900 mt-1 font-bold">Izin penayangan materi iklan yang menampilkan wajah Talent akan kedaluwarsa pada: {viewDoc.validUntil}. (Sisa waktu: {viewDoc.daysLeft} Hari).</p>
                                  </div>
                              )}

                              <div className="mt-16 flex justify-between">
                                  <div className="text-center">
                                      <p className="text-xs font-bold text-black mb-10">Pihak Pertama</p>
                                      <div className="w-32 border-b border-black mx-auto"></div>
                                      <p className="text-[10px] mt-1 text-black">Orland Management</p>
                                  </div>
                                  <div className="text-center">
                                      <p className="text-xs font-bold text-black mb-10">Pihak Kedua</p>
                                      {viewDoc.status === 'SIGNED' ? (
                                          <div className="w-32 mx-auto relative">
                                              <span className="font-writing text-blue-600 text-2xl absolute -top-8 -left-2 transform -rotate-12">Signed</span>
                                              <div className="border-b border-black"></div>
                                          </div>
                                      ) : (
                                          <div className="w-32 border-b border-black mx-auto"></div>
                                      )}
                                      <p className="text-[10px] mt-1 text-black">{viewDoc.talent}</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

    </div>
  )
}
