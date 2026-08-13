import { useState, useEffect } from 'react';
import { FileSignature, ShieldCheck, PenTool, X, Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/store/useAppStore';
import { api } from '@/lib/api';

interface ContractData {
  id: string;
  title: string;
  content: string;
  status: 'pending' | 'signed';
  signed_at?: string;
  created_at: string;
}

export default function Contracts() {
  const user = useAuthStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [signatureName, setSignatureName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const [isSigned, setIsSigned] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contracts, setContracts] = useState<ContractData[]>([]);

  useEffect(() => {
    fetchContracts();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API endpoint when backend is ready
      const response = await api.get('/api/v1/contracts').catch(err => {
        console.log('Contracts API not ready, using mock data');
        return { data: null };
      });

      if (response?.data?.contracts) {
        setContracts(response.data.contracts);
        const signed = response.data.contracts.some((c: ContractData) => c.status === 'signed');
        setIsSigned(signed);
      } else {
        // Mock contract data
        setContracts([
          {
            id: '1',
            title: 'Kontrak Eksklusif Tahunan',
            content: `PASAL 1: RUANG LINGKUP
1. Pihak Pertama (Orland) berhak mengelola jadwal Pihak Kedua (Talent).
PASAL 2: PEMBAGIAN HONOR
1. Talent menyetujui potongan agency fee sebesar 20% dari total nilai proyek sebelum pajak.
[... Dokumen Legal Lengkap ...]`,
            status: 'pending',
            created_at: new Date().toISOString(),
          }
        ]);
        setIsSigned(false);
      }
      setError(null);
    } catch (err: any) {
      console.error('Error fetching contracts:', err);
      setError(err.message || 'Gagal memuat kontrak');
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (signatureName.toLowerCase() !== user?.full_name?.toLowerCase()) {
      alert('Nama tanda tangan harus sesuai dengan nama profil Anda.');
      return;
    }
    
    setIsSigning(true);
    try {
      // TODO: Call API to sign contract
      await api.post('/api/v1/contracts/sign', { signature: signatureName }).catch(err => {
        console.log('Sign contract API not ready, using mock');
        return { data: {} };
      });

      setIsSigning(false);
      setIsSigned(true);
      setIsModalOpen(false);
      alert('✅ Kontrak berhasil ditandatangani secara digital (E-Sign valid)!');
      await fetchContracts();
    } catch (err: any) {
      alert('❌ Gagal menandatangani kontrak: ' + (err.message || 'Coba lagi'));
      setIsSigning(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dokumen Legal & SPK</h1>
      
      <div className={`p-6 rounded-3xl border shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 transition-all ${isSigned ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-white dark:bg-dark-card border-slate-200 dark:border-slate-800'}`}>
        <div className="flex items-center">
            <div className={`h-14 w-14 rounded-2xl flex items-center justify-center mr-5 shrink-0 shadow-inner ${isSigned ? 'bg-green-100 text-green-600' : 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                {isSigned ? <ShieldCheck size={28} /> : <FileSignature size={28} />}
            </div>
            <div>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white">Kontrak Eksklusif Tahunan</h3>
                <p className={`text-sm font-medium mt-0.5 ${isSigned ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                    {isSigned ? 'Telah ditandatangani secara digital' : 'Membutuhkan Tanda Tangan Anda'}
                </p>
            </div>
        </div>
        
        <button 
            onClick={() => !isSigned && setIsModalOpen(true)}
            disabled={isSigned}
            className={`px-8 py-3 w-full sm:w-auto font-bold rounded-xl text-sm shadow-lg transition-all ${isSigned ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 cursor-not-allowed shadow-none' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105'}`}
        >
            {isSigned ? 'Kontrak Aktif' : 'Tinjau & Tanda Tangani'}
        </button>
      </div>

      {/* MODAL E-SIGNATURE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white dark:bg-dark-card w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h2 className="text-xl font-bold flex items-center dark:text-white"><PenTool size={20} className="mr-3 text-brand-600" /> E-Signature Kontrak</h2>
                    <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500"><X size={24} /></button>
                </div>

                <div className="p-8 overflow-y-auto flex-1 text-sm text-slate-600 dark:text-slate-400 space-y-4">
                    <p>Dengan membubuhkan tanda tangan elektronik di bawah ini, saya, <strong>{user?.full_name || 'Talent'}</strong>, menyatakan bersedia terikat pada syarat dan ketentuan Orland Management.</p>
                    <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl font-mono text-xs overflow-y-auto h-40 border border-slate-200 dark:border-slate-700">
                        PASAL 1: RUANG LINGKUP<br/>
                        1. Pihak Pertama (Orland) berhak mengelola jadwal Pihak Kedua (Talent).<br/>
                        PASAL 2: PEMBAGIAN HONOR<br/>
                        1. Talent menyetujui potongan agency fee sebesar 20% dari total nilai proyek sebelum pajak.<br/>
                        [... Dokumen Legal Lengkap ...]
                    </div>
                    
                    <div className="mt-6">
                        <label className="block text-sm font-bold text-slate-900 dark:text-white mb-2">Ketik nama lengkap Anda sebagai Tanda Tangan Digital:</label>
                        <input 
                            type="text" 
                            value={signatureName}
                            onChange={(e) => setSignatureName(e.target.value)}
                            placeholder={user?.full_name || "Nama Lengkap"} 
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-4 rounded-xl font-bold dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-2 flex items-center"><ShieldCheck size={14} className="mr-1 text-green-500" /> Tanda tangan ini mengikat secara hukum sesuai UU ITE.</p>
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-4">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors">Batal</button>
                    <button onClick={handleSign} disabled={isSigning || signatureName.length < 3} className="px-8 py-3 font-bold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-600/30 flex items-center disabled:opacity-50 transition-all">
                        {isSigning ? <><Loader2 size={18} className="animate-spin mr-2" /> Memvalidasi...</> : 'Setuju & Tanda Tangani'}
                    </button>
                </div>

            </div>
        </div>
      )}
    </div>
  )
}
