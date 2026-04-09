import { useState, useEffect } from 'react';
import { Sun, CloudRain, MapPin, Clock, Send, AlertTriangle, Loader2 } from 'lucide-react';
import { phService } from '@/lib/services/toolsService';

export default function CallSheetGenerator() {
  const [callSheets, setCallSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [publishing, setPublishing] = useState<string | null>(null);

  // Fetch call sheets on mount
  useEffect(() => {
    const fetchCallSheets = async () => {
      try {
        setLoading(true);
        const data = await phService.getCallSheets();
        setCallSheets(data);
      } catch (err: any) {
        console.error('Failed to fetch call sheets:', err);
        setError(err.message || 'Gagal memuat call sheets');
        // Fallback: empty state
        setCallSheets([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCallSheets();
  }, []);

  // Handle publish call sheet to WhatsApp
  const handlePublish = async (callSheetId: string) => {
    try {
      setPublishing(callSheetId);
      await phService.publishCallSheet(callSheetId);
      alert('Call sheet berhasil dikirim via WhatsApp ke semua talent!');
      // Refetch data
      const data = await phService.getCallSheets();
      setCallSheets(data);
    } catch (err: any) {
      alert('Gagal mengirim call sheet: ' + (err.message || 'Unknown error'));
    } finally {
      setPublishing(null);
    }
  };

  if (error) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto px-4 sm:px-6 mt-6 pb-20">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-6 rounded-3xl flex items-start gap-4">
          <AlertTriangle className="text-red-600 dark:text-red-400 shrink-0 mt-1" size={24} />
          <div className="flex-1">
            <h2 className="font-bold text-red-900 dark:text-red-400 mb-1">Gagal Memuat Call Sheets</h2>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
          <button onClick={() => window.location.reload()} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg">
            Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto px-4 sm:px-6 mt-6 pb-20 flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-3 text-brand-500" size={32} />
          <p className="font-bold text-slate-600 dark:text-slate-400">Memuat call sheets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto px-4 sm:px-6 mt-6 pb-20">
      {callSheets.length === 0 ? (
        <div className="bg-slate-100 dark:bg-slate-800 p-12 rounded-3xl text-center">
          <Clock className="mx-auto mb-4 text-slate-400" size={40} />
          <p className="text-slate-600 dark:text-slate-400 font-bold">Belum ada call sheet</p>
          <p className="text-sm text-slate-500 dark:text-slate-500 mt-1">Buat call sheet untuk proyek Anda</p>
        </div>
      ) : (
        callSheets.map((sheet) => (
          <div key={sheet.id} className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl border border-slate-800">
            <h1 className="text-3xl font-black mb-2">{sheet.title || 'Digital Call Sheet'}</h1>
            <p className="text-slate-400 text-sm">{sheet.description || 'Otomatis mengirim jadwal ke WhatsApp Talent dalam satu klik.'}</p>
            
            <div className="grid grid-cols-2 gap-4 mt-8 border-t border-white/10 pt-8">
              <div className="flex items-center gap-3">
                <Sun className="text-amber-400" />
                <div><p className="text-[10px] text-slate-400 uppercase font-bold">Weather Report</p><p className="font-bold">{sheet.weather || 'Data tidak tersedia'}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="text-red-400" />
                <div><p className="text-[10px] text-slate-400 uppercase font-bold">Shooting Location</p><p className="font-bold">{sheet.location || 'Data tidak tersedia'}</p></div>
              </div>
            </div>

            <div className="mt-8 space-y-4">
              {sheet.talents && sheet.talents.map((talent: any, idx: number) => (
                <div key={idx} className="bg-white/5 p-4 rounded-2xl flex justify-between items-center border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-500 rounded-xl font-black">{talent.call_time || '--:--'}</div>
                    <div><p className="font-bold text-sm">Call Time: {talent.name}</p><p className="text-xs text-slate-400">{talent.note || 'Makeup & Wardrobe'}</p></div>
                  </div>
                  <button className="text-[10px] font-black bg-white/10 px-3 py-1 rounded-lg uppercase tracking-widest hover:bg-brand-500 transition-colors">
                    Notify WA
                  </button>
                </div>
              ))}
            </div>

            <button 
              onClick={() => handlePublish(sheet.id)}
              disabled={publishing === sheet.id}
              className="w-full mt-10 py-4 bg-white text-slate-900 font-black rounded-2xl shadow-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform disabled:opacity-70"
            >
              {publishing === sheet.id ? (
                <><Loader2 size={18} className="animate-spin"/> Mengirim...</>
              ) : (
                <><Send size={18}/> Publish & Kirim Blast Call Sheet</>
              )}
            </button>
          </div>
        ))
      )}
    </div>
  );
}
