import { useRef, useState } from 'react';
import { ShieldAlert, CreditCard, ScanFace, CheckCircle, Loader2, AlertTriangle, UploadCloud } from 'lucide-react';

export default function KYCVerification() {
  const documentInputRef = useRef<HTMLInputElement>(null);
  const livenessInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'document' | 'liveness' | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Karena ini tahap UI Placeholder, kita buat status simulasi
  const [docStatus, setDocStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const [livenessStatus, setLivenessStatus] = useState<'unverified' | 'pending' | 'verified'>('unverified');
  const status = (docStatus === 'verified' && livenessStatus === 'verified') ? 'verified' : 
                 (docStatus === 'pending' || livenessStatus === 'pending') ? 'pending' : 'unverified';

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'document' | 'liveness') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) return alert('Ukuran maksimal file adalah 10MB');

    setUploadType(type);
    setIsUploading(true);
    
    // Simulasi loading upload 2 detik
    setTimeout(() => {
        setIsUploading(false);
        setUploadType(null);
        if (type === 'document') setDocStatus('pending');
        if (type === 'liveness') setLivenessStatus('pending');
        alert(`${type === 'document' ? 'Dokumen KTP' : 'Foto Selfie'} berhasil diunggah! Menunggu verifikasi tim.`);
    }, 2000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verifikasi Identitas (KYC)</h1>
      
      {/* Banner Status */}
      {status === 'verified' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-3xl flex items-start shadow-sm">
            <CheckCircle className="text-green-600 dark:text-green-400 mt-1 mr-4 shrink-0" size={28} />
            <div>
                <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Akun Terverifikasi Penuh</h2>
                <p className="text-green-600 dark:text-green-400 text-sm mt-1">Luar biasa! Identitas Anda telah dikonfirmasi. Anda kini bisa melamar proyek eksklusif dan menerima pembayaran.</p>
            </div>
        </div>
      )}

      {status === 'pending' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-3xl flex items-start shadow-sm">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-1 mr-4 shrink-0" size={28} />
            <div>
                <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">Sedang Ditinjau Admin</h2>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">Dokumen Anda sedang kami proses secara manual. Proses ini biasanya memakan waktu 1x24 jam kerja.</p>
            </div>
        </div>
      )}

      {status === 'unverified' && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-3xl flex items-start shadow-sm">
            <ShieldAlert className="text-red-600 dark:text-red-400 mt-1 mr-4 shrink-0" size={28} />
            <div>
                <h2 className="text-xl font-bold text-red-800 dark:text-red-300">Akun Belum Terverifikasi</h2>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">Anda tidak dapat melamar proyek eksklusif atau mencairkan dana sebelum mengunggah identitas asli.</p>
            </div>
        </div>
      )}

      {/* Area Upload Dokumen & Liveness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        
        {/* 1. KTP */}
        <div 
          onClick={() => docStatus === 'unverified' && documentInputRef.current?.click()}
          className={`relative p-6 rounded-3xl border shadow-md transition-all duration-300 overflow-hidden ${
            docStatus === 'verified' ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800 opacity-80 cursor-not-allowed' :
            docStatus === 'pending' ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 opacity-80 cursor-wait' :
            'bg-white dark:bg-dark-card border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 cursor-pointer group hover:shadow-xl hover:-translate-y-1'
          }`}
        >
            <input type="file" ref={documentInputRef} onChange={(e) => handleFileChange(e, 'document')} accept="image/jpeg,image/png" className="hidden" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="h-14 w-14 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    <CreditCard size={28} className={docStatus === 'unverified' ? "text-slate-400 dark:text-slate-500" : "text-brand-600"} />
                </div>
                {docStatus === 'verified' && <CheckCircle className="text-green-500" size={28} />}
                {docStatus === 'pending' && <Loader2 className="text-yellow-500 animate-spin" size={28} />}
            </div>
            
            <h3 className="font-bold text-lg dark:text-white relative z-10">1. Upload KTP / Paspor</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 relative z-10">Pastikan foto jelas, tidak terpotong, bebas dari pantulan cahaya kilat (flash).</p>

            {/* Overlay Loading */}
            {uploadType === 'document' && isUploading && (
                <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in">
                    <UploadCloud className="text-brand-600 animate-bounce mb-3" size={36} />
                    <span className="text-sm font-bold text-brand-600 tracking-wide">MENGUNGGAH...</span>
                </div>
            )}
        </div>

        {/* 2. Selfie */}
        <div 
          onClick={() => livenessStatus === 'unverified' && livenessInputRef.current?.click()}
          className={`relative p-6 rounded-3xl border shadow-md transition-all duration-300 overflow-hidden ${
            livenessStatus === 'verified' ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800 opacity-80 cursor-not-allowed' :
            livenessStatus === 'pending' ? 'bg-yellow-50/50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800 opacity-80 cursor-wait' :
            'bg-white dark:bg-dark-card border-slate-200 dark:border-slate-800 hover:border-brand-400 dark:hover:border-brand-500 cursor-pointer group hover:shadow-xl hover:-translate-y-1'
          }`}
        >
            <input type="file" ref={livenessInputRef} onChange={(e) => handleFileChange(e, 'liveness')} accept="image/*" capture="user" className="hidden" />
            
            <div className="flex justify-between items-start mb-6 relative z-10">
                <div className="h-14 w-14 bg-slate-100 dark:bg-slate-800/50 rounded-2xl flex items-center justify-center group-hover:bg-brand-100 dark:group-hover:bg-brand-900/50 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                    <ScanFace size={28} className={livenessStatus === 'unverified' ? "text-slate-400 dark:text-slate-500" : "text-brand-600"} />
                </div>
                {livenessStatus === 'verified' && <CheckCircle className="text-green-500" size={28} />}
                {livenessStatus === 'pending' && <Loader2 className="text-yellow-500 animate-spin" size={28} />}
            </div>
            
            <h3 className="font-bold text-lg dark:text-white relative z-10">2. Foto Selfie Wajah</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 relative z-10">Kamera akan terbuka otomatis. Pastikan Anda berada di ruangan dengan pencahayaan yang cukup.</p>

            {/* Overlay Loading */}
            {uploadType === 'liveness' && isUploading && (
                <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center animate-in fade-in">
                    <UploadCloud className="text-brand-600 animate-bounce mb-3" size={36} />
                    <span className="text-sm font-bold text-brand-600 tracking-wide">MENGUNGGAH...</span>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
