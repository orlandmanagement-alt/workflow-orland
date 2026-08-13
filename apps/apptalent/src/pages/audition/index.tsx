import { useState, useRef, useEffect } from 'react';
import { Video, Square, Play, RefreshCw, Upload, Type, AlertCircle, Loader2 } from 'lucide-react';
import { mediaService } from '@/lib/services/mediaService';

export default function Audition() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showPrompter, setShowPrompter] = useState(true);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const scriptText = "Halo, nama saya [Sebutkan Nama]. Saya berusia [Umur] tahun. Tinggi badan saya [Tinggi] cm. Saya memiliki ketertarikan besar di dunia akting dan modeling. Karakter wajah saya sangat adaptif untuk berbagai peran. Saya sangat siap untuk bekerja sama dalam project ini. Terima kasih Orland Management!";

  // Inisialisasi Kamera
  useEffect(() => {
    if (!videoUrl) startCamera();
    return () => stopCamera();
  }, [videoUrl]);

  // Efek Timer Rekaman
  useEffect(() => {
    if (isRecording) {
        timerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } else {
        if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const startCamera = async () => {
    try {
      // Mengambil akses kamera depan (user) dan mikrofon
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: true });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      alert("Akses kamera/mikrofon ditolak atau tidak ditemukan di perangkat ini.");
    }
  };

  const stopCamera = () => {
    if (stream) stream.getTracks().forEach(track => track.stop());
  };

  const handleStartRecording = () => {
    if (!stream) return;
    chunksRef.current = [];
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
    
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data);
    };
    
    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
      stopCamera();
    };
    
    recorder.start();
    setMediaRecorder(recorder);
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleRetake = () => {
    setVideoUrl(null);
    setRecordingTime(0);
  };

  const handleUpload = async () => {
    if (!videoBlob) {
      setUploadError('Tidak ada video untuk diunggah');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      // Create a File from Blob
      const filename = `audition_${Date.now()}.webm`;
      const videoFile = new File([videoBlob], filename, { type: 'video/webm' });

      // Upload menggunakan mediaService
      await mediaService.uploadMedia(videoFile, 'talents');

      // Success
      alert('✅ Video Self-Tape berhasil diunggah ke Orland!\n\nStatus casting Anda sedang ditinjau tim kreatif kami.');
      handleRetake();
    } catch (err: any) {
      const errorMsg = err.message || 'Gagal mengunggah video. Silakan coba lagi.';
      setUploadError(errorMsg);
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-center mb-6">
          <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Studio Self-Tape</h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">Rekam video audisi Anda langsung dari aplikasi.</p>
          </div>
          <button onClick={() => setShowPrompter(!showPrompter)} className={`p-2.5 rounded-xl border transition-colors ${showPrompter ? 'bg-brand-50 border-brand-200 text-brand-600 dark:bg-brand-900/30 dark:border-brand-800 dark:text-brand-400' : 'bg-white border-slate-200 text-slate-500 dark:bg-slate-800 dark:border-slate-700'}`}>
              <Type size={20} />
          </button>
      </div>

      {uploadError && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-2xl flex items-start gap-3 max-w-2xl mx-auto">
              <AlertCircle size={20} className="text-red-600 dark:text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                  <p className="text-sm text-red-800 dark:text-red-400">{uploadError}</p>
                  <button onClick={() => setUploadError(null)} className="text-xs text-red-600 dark:text-red-400 hover:underline mt-1">Tutup</button>
              </div>
          </div>
      )}

      <div className="relative w-full max-w-2xl mx-auto aspect-[3/4] sm:aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl border border-slate-800">
          
          {/* TAMPILAN KAMERA LANGSUNG ATAU HASIL REKAMAN */}
          {!videoUrl ? (
             <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isRecording ? 'scale-105 transition-transform duration-[10s]' : ''}`} />
          ) : (
             <video src={videoUrl} controls autoPlay playsInline className="w-full h-full object-contain bg-black" />
          )}

          {/* OVERLAY: BINGKAI KAMERA (VIEWFINDER) */}
          {!videoUrl && (
              <div className="absolute inset-0 pointer-events-none">
                  {/* Sudut Putih */}
                  <div className="absolute top-6 left-6 w-8 h-8 border-t-4 border-l-4 border-white/50 rounded-tl-lg"></div>
                  <div className="absolute top-6 right-6 w-8 h-8 border-t-4 border-r-4 border-white/50 rounded-tr-lg"></div>
                  <div className="absolute bottom-6 left-6 w-8 h-8 border-b-4 border-l-4 border-white/50 rounded-bl-lg"></div>
                  <div className="absolute bottom-6 right-6 w-8 h-8 border-b-4 border-r-4 border-white/50 rounded-br-lg"></div>
                  
                  {/* Indikator Perekaman (Merah) */}
                  {isRecording && (
                      <div className="absolute top-8 right-10 flex items-center gap-2 bg-black/50 backdrop-blur px-3 py-1.5 rounded-full">
                          <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></span>
                          <span className="text-white font-mono text-xs font-bold">{formatTime(recordingTime)}</span>
                      </div>
                  )}
              </div>
          )}

          {/* OVERLAY: TELEPROMPTER KACA (GLASSMORPHISM) */}
          {!videoUrl && showPrompter && (
              <div className="absolute inset-x-4 sm:inset-x-12 top-20 h-40 sm:h-48 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 p-5 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20">
                  <p className="text-white/90 text-lg sm:text-xl font-medium leading-relaxed text-center" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
                      {scriptText}
                  </p>
              </div>
          )}

          {/* OVERLAY: TOMBOL KONTROL */}
          <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex justify-center items-center gap-6">
              {!videoUrl ? (
                  <>
                      {isRecording ? (
                          <button onClick={handleStopRecording} className="h-16 w-16 bg-white rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]">
                              <Square size={24} className="text-red-500 fill-red-500" />
                          </button>
                      ) : (
                          <button onClick={handleStartRecording} className="h-16 w-16 bg-red-500 rounded-full flex items-center justify-center border-4 border-white/30 hover:bg-red-600 hover:scale-110 transition-all shadow-[0_0_30px_rgba(239,68,68,0.5)]">
                              <Video size={24} className="text-white fill-white ml-1" />
                          </button>
                      )}
                  </>
              ) : (
                  <div className="flex gap-4 w-full px-4">
                      <button onClick={handleRetake} className="flex-1 py-3.5 bg-slate-800 text-white font-bold rounded-xl flex items-center justify-center hover:bg-slate-700 transition-colors border border-slate-700">
                          <RefreshCw size={18} className="mr-2" /> Rekam Ulang
                      </button>
                      <button onClick={handleUpload} disabled={isUploading} className="flex-1 py-3.5 bg-brand-600 text-white font-bold rounded-xl flex items-center justify-center hover:bg-brand-700 transition-colors shadow-lg shadow-brand-600/30 disabled:opacity-70">
                          {isUploading ? <><Loader2 size={18} className="animate-spin mr-2"/> Mengirim...</> : <><Upload size={18} className="mr-2" /> Kirim Video</>}
                      </button>
                  </div>
              )}
          </div>
      </div>

      {!videoUrl && (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-4 rounded-2xl flex items-start gap-3 max-w-2xl mx-auto">
              <AlertCircle size={20} className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">Pastikan Anda merekam di ruangan dengan pencahayaan yang cukup. Baca naskah pada layar Teleprompter secara natural seolah-olah Anda sedang berbicara dengan sutradara.</p>
          </div>
      )}
    </div>
  )
}
