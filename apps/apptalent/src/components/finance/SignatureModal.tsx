import React, { useRef, useState, useEffect } from 'react';
import { PenTool, Keyboard, X, Check, ScanFace } from 'lucide-react';
import { useAuthStore } from '@/store/useAppStore';

interface SignatureModalProps {
  contractId: string;
  onClose: () => void;
  onSignSuccess: (payload: { type: 'draw' | 'type', data: string }) => void;
}

export const SignatureModal = ({ contractId, onClose, onSignSuccess }: SignatureModalProps) => {
  const [activeTab, setActiveTab] = useState<'draw' | 'type'>('draw');
  const [typedName, setTypedName] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const user = useAuthStore((state: any) => state.user);
  
  // HTML5 Canvas ref untuk menampung coretan (Finger/Mouse)
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize Canvas
  useEffect(() => {
    if (activeTab === 'draw' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [activeTab]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const endDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      ctx?.beginPath(); // Reset lintasan agar titik coretan tidak nyambung
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    
    // Matikan scroll saat menarik jari di mobile
    if (e.type.includes('touch')) e.preventDefault();

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Hitung posisi kursor relatif terhadap Canvas Border (BoundingRect)
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }

    const x = clientX - rect.left;
    const y = clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
    // Memulai poin path baru untuk rendering smooth 
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.beginPath();
    }
  };

  const handleAgreeAndSign = () => {
    setIsSigning(true);
    
    setTimeout(() => {
      if (activeTab === 'draw') {
        const dataUrl = canvasRef.current?.toDataURL('image/png') || '';
        onSignSuccess({ type: 'draw', data: dataUrl });
      } else {
        // Gabungkan Timestamp untuk legal e-sign typed logic
        const timestampedStr = `${typedName} :: ${new Date().toISOString()}`;
        onSignSuccess({ type: 'type', data: timestampedStr });
      }
      setIsSigning(false);
    }, 1500); // Simulasi Request Backend PUT /contracts/:id/sign
  };

  const isFormValid = activeTab === 'type' ? typedName.trim().length > 2 : true;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-dark-card w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative">
        
        {/* Header Modal */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between">
          <div>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <ScanFace className="text-brand-600" /> Tanda Tangan Digital
            </h3>
            <p className="text-xs text-slate-500 mt-1 font-mono">Doc ID: {contractId}</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button 
            onClick={() => setActiveTab('draw')} 
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'draw' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <PenTool size={16} /> Gambar TTD
          </button>
          <button 
            onClick={() => setActiveTab('type')} 
            className={`flex-1 py-4 text-sm font-bold flex items-center justify-center gap-2 ${activeTab === 'type' ? 'text-brand-600 border-b-2 border-brand-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Keyboard size={16} /> Ketik Nama
          </button>
        </div>

        {/* Input Area */}
        <div className="p-6">
          {activeTab === 'draw' ? (
            <div className="space-y-3 animate-in fade-in slide-in-from-left-4">
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl bg-white overflow-hidden relative touch-none shadow-inner">
                <canvas 
                  ref={canvasRef}
                  width={400}
                  height={200}
                  className="w-full h-[200px] cursor-crosshair bg-slate-50"
                  onMouseDown={startDrawing}
                  onMouseUp={endDrawing}
                  onMouseOut={endDrawing}
                  onMouseMove={draw}
                  onTouchStart={startDrawing}
                  onTouchEnd={endDrawing}
                  onTouchMove={draw}
                />
                
                {/* Petunjuk Garis Tanda Tangan */}
                <div className="absolute bottom-6 left-10 right-10 h-px bg-slate-300 pointer-events-none flex justify-center">
                   <span className="text-[10px] text-slate-400 -mt-2 bg-slate-50 px-2 font-mono">TANDA TANGAN DI ATAS GARIS</span>
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={clearCanvas} className="text-xs font-bold text-red-500 hover:text-red-700">Kosongkan Canvas</button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">Ketik nama lengkap Anda sesuai KTP:</label>
              <input 
                type="text" 
                value={typedName}
                onChange={e => setTypedName(e.target.value.toUpperCase())}
                placeholder="Misal: BUDI SANTOSO"
                className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-lg font-black font-serif text-slate-900 dark:text-white uppercase tracking-widest focus:ring-2 focus:ring-brand-500 outline-none"
              />
              <p className="text-xs text-slate-500 leading-relaxed text-justify">
                Dengan mengetikkan nama Anda pada dokumen elektronik ini, Anda secara sah mengakui bahwa tindakan tersebut <strong>sama kuatnya dengan tanda tangan basah</strong> dan Anda menyetujui Legal term Orland Management. Sistem mencatat IP & Timestamp.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 rounded-b-3xl">
          <button 
            onClick={onClose} 
            disabled={isSigning}
            className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button 
            onClick={handleAgreeAndSign}
            disabled={isSigning || !isFormValid}
            className="px-8 py-3 font-extrabold text-white bg-green-600 hover:bg-green-700 rounded-xl shadow-lg shadow-green-500/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isSigning ? 'Menyimpan Kontrak...' : <><Check size={18} /> I Agree & Sign</>}
          </button>
        </div>

      </div>
    </div>
  );
};
