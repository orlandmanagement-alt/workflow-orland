import { useRef, useState } from 'react';
import { ShieldAlert, CreditCard, ScanFace, CheckCircle, Loader2, AlertTriangle, UploadCloud } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { kycService } from '@/lib/services/kycService';

export default function KYCVerification() {
  const queryClient = useQueryClient();
  const documentInputRef = useRef<HTMLInputElement>(null);
  const livenessInputRef = useRef<HTMLInputElement>(null);
  const [uploadType, setUploadType] = useState<'document' | 'liveness' | null>(null);

  // 1. Fetch Status KYC
  const { data: kycData, isLoading, isError } = useQuery({
    queryKey: ['kyc-status'],
    queryFn: kycService.getStatus,
  });

  // 2. Mutation: Upload Dokumen KTP
  const docMutation = useMutation({
    mutationFn: kycService.uploadDocument,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
      alert('Dokumen berhasil diunggah! Menunggu verifikasi tim.');
    },
    onError: (err: any) => alert(err.message || 'Gagal mengunggah dokumen.'),
    onSettled: () => setUploadType(null),
  });

  // 3. Mutation: Upload Liveness
  const livenessMutation = useMutation({
    mutationFn: kycService.uploadLiveness,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kyc-status'] });
      alert('Video Liveness berhasil diunggah! Menunggu verifikasi tim.');
    },
    onError: (err: any) => alert(err.message || 'Gagal mengunggah liveness.'),
    onSettled: () => setUploadType(null),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'document' | 'liveness') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validasi ukuran (Maks 10MB)
    if (file.size > 10 * 1024 * 1024) return alert('Ukuran maksimal file adalah 10MB');

    setUploadType(type);
    if (type === 'document') docMutation.mutate(file);
    if (type === 'liveness') livenessMutation.mutate(file);
  };

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={40} /></div>;
  if (isError) throw new Error('Gagal memuat status KYC Anda.');

  // Simulasi data jika backend belum ada endpoint-nya
  const status = kycData?.status || 'unverified'; // verified, pending, rejected, unverified
  const docStatus = kycData?.document_status || 'unverified';
  const livenessStatus = kycData?.liveness_status || 'unverified';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verifikasi Identitas (KYC)</h1>
      
      {/* Banner Status Dinamis */}
      {status === 'verified' && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 p-6 rounded-3xl flex items-start">
            <CheckCircle className="text-green-600 dark:text-green-400 mt-1 mr-4 shrink-0" size={28} />
            <div>
                <h2 className="text-xl font-bold text-green-800 dark:text-green-300">Akun Terverifikasi Penuh</h2>
                <p className="text-green-600 dark:text-green-400 text-sm mt-1">Luar biasa! Identitas Anda telah dikonfirmasi. Anda kini bisa melamar proyek eksklusif dan menerima pembayaran.</p>
            </div>
        </div>
      )}

      {status === 'pending' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 p-6 rounded-3xl flex items-start">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-400 mt-1 mr-4 shrink-0" size={28} />
            <div>
                <h2 className="text-xl font-bold text-yellow-800 dark:text-yellow-300">Sedang Ditinjau Admin</h2>
                <p className="text-yellow-600 dark:text-yellow-400 text-sm mt-1">Dokumen Anda sedang kami proses. Proses ini biasanya memakan waktu 1x24 jam kerja.</p>
            </div>
        </div>
      )}

      {(status === 'unverified' || status === 'rejected') && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-3xl flex items-start">
            <ShieldAlert className="text-red-600 dark:text-red-400 mt-1 mr-4 shrink-0" size={28} />
            <div>
                <h2 className="text-xl font-bold text-red-800 dark:text-red-300">
                    {status === 'rejected' ? 'Verifikasi Ditolak' : 'Akun Belum Terverifikasi'}
                </h2>
                <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                    {status === 'rejected' 
                        ? 'Dokumen yang Anda unggah blur atau tidak cocok. Silakan unggah ulang dengan kualitas lebih baik.' 
                        : 'Anda tidak dapat melamar proyek eksklusif atau mencairkan dana sebelum memverifikasi identitas.'}
                </p>
            </div>
        </div>
      )}

      {/* Area Upload Dokumen & Liveness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {/* 1. KTP/Paspor */}
        <div 
          onClick={() => docStatus !== 'verified' && docStatus !== 'pending' && documentInputRef.current?.click()}
          className={`relative p-6 rounded-3xl border shadow-sm transition-all overflow-hidden ${
            docStatus === 'verified' ? 'bg-green-50/50 border-green-200 opacity-70 cursor-not-allowed' :
            docStatus === 'pending' ? 'bg-yellow-50/50 border-yellow-200 opacity-70 cursor-wait' :
            'bg-white dark:bg-dark-card border-slate-200 dark:border-slate-800 hover:border-brand-400 cursor-pointer group'
          }`}
        >
            <input type="file" ref={documentInputRef} onChange={(e) => handleFileChange(e, 'document')} accept="image/jpeg,image/png" className="hidden" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                    <CreditCard size={24} />
                </div>
                {docStatus === 'verified' && <CheckCircle className="text-green-500" size={24} />}
                {docStatus === 'pending' && <Loader2 className="text-yellow-500 animate-spin" size={24} />}
            </div>
            
            <h3 className="font-bold dark:text-white relative z-10">1. Upload KTP / Paspor</h3>
            <p className="text-sm text-slate-500 mt-2 relative z-10">Pastikan foto jelas, tidak terpotong, tidak kena silau, dan tulisan dapat dibaca.</p>

            {/* Overlay Loading saat sedang mengunggah */}
            {uploadType === 'document' && docMutation.isPending && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <UploadCloud className="text-brand-600 animate-bounce mb-2" size={32} />
                    <span className="text-sm font-bold text-brand-600">Mengunggah...</span>
                </div>
            )}
        </div>

        {/* 2. Selfie / Liveness */}
        <div 
          onClick={() => livenessStatus !== 'verified' && livenessStatus !== 'pending' && livenessInputRef.current?.click()}
          className={`relative p-6 rounded-3xl border shadow-sm transition-all overflow-hidden ${
            livenessStatus === 'verified' ? 'bg-green-50/50 border-green-200 opacity-70 cursor-not-allowed' :
            livenessStatus === 'pending' ? 'bg-yellow-50/50 border-yellow-200 opacity-70 cursor-wait' :
            'bg-white dark:bg-dark-card border-slate-200 dark:border-slate-800 hover:border-brand-400 cursor-pointer group'
          }`}
        >
            {/* Accept video & image untuk liveness capture dari HP */}
            <input type="file" ref={livenessInputRef} onChange={(e) => handleFileChange(e, 'liveness')} accept="video/mp4,image/*" capture="user" className="hidden" />
            
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="h-12 w-12 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center group-hover:bg-brand-100 group-hover:text-brand-600 transition-colors">
                    <ScanFace size={24} />
                </div>
                {livenessStatus === 'verified' && <CheckCircle className="text-green-500" size={24} />}
                {livenessStatus === 'pending' && <Loader2 className="text-yellow-500 animate-spin" size={24} />}
            </div>
            
            <h3 className="font-bold dark:text-white relative z-10">2. Foto Selfie Wajah</h3>
            <p className="text-sm text-slate-500 mt-2 relative z-10">Kami akan mengakses kamera Anda untuk mencocokkan wajah asli dengan foto di KTP.</p>

            {/* Overlay Loading saat sedang mengunggah */}
            {uploadType === 'liveness' && livenessMutation.isPending && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center">
                    <UploadCloud className="text-brand-600 animate-bounce mb-2" size={32} />
                    <span className="text-sm font-bold text-brand-600">Mengunggah...</span>
                </div>
            )}
        </div>
      </div>
    </div>
  )
}
