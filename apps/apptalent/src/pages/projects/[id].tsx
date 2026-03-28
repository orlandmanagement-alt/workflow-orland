import { MapPin, QrCode, FileText, Clapperboard, Loader2, ArrowLeft } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/lib/services/projectService';

export default function ProjectDetail() {
  const { id } = useParams();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProjectById(id as string),
    enabled: !!id,
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={40} /></div>;
  if (isError) return <div className="p-10 text-center text-red-500 font-bold">Gagal memuat detail The Green Room.</div>;

  const p: any = project || {};

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
        <Link to="/projects" className="flex items-center hover:text-brand-600 transition-colors"><ArrowLeft size={16} className="mr-1" /> Kembali ke Daftar Proyek</Link> 
      </div>

      <div className="bg-white dark:bg-dark-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
            <div>
                <span className="bg-green-100 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">Status: {p.status || 'Confirmed Booking'}</span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">{p.title || 'Judul Proyek Memuat...'}</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm sm:text-base">Sutradara: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.director || 'TBA'}</span> <span className="mx-2 text-slate-300 dark:text-slate-700">|</span> Klien: <span className="font-semibold text-slate-700 dark:text-slate-300">{p.client_name || 'TBA'}</span></p>
            </div>
            <button className="w-full md:w-auto flex justify-center items-center px-6 py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-xl hover:scale-105 transition-transform shrink-0">
                <QrCode size={18} className="mr-2" /> Check-in Lokasi (Absen)
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="font-bold flex items-center mb-5 text-slate-900 dark:text-white"><MapPin size={18} className="mr-2 text-brand-500" /> Call Sheet & Lokasi</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-3"><strong>Waktu Standby:</strong><br/>{p.standby_time || 'Menunggu Jadwal dari Tim Produksi'}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-5"><strong>Lokasi Set:</strong><br/>{p.location || 'Lokasi belum ditentukan.'}</p>
                <button className="text-brand-600 dark:text-brand-400 font-bold text-sm hover:underline flex items-center">Buka di Google Maps &rarr;</button>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                <h3 className="font-bold flex items-center mb-5 text-slate-900 dark:text-white"><Clapperboard size={18} className="mr-2 text-brand-500" /> Dokumen & Naskah</h3>
                {p.script_url ? (
                    <div className="flex items-center justify-between p-4 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex items-center overflow-hidden"><FileText size={18} className="text-slate-400 dark:text-slate-500 mr-3 shrink-0"/><span className="text-sm font-semibold text-slate-800 dark:text-white truncate">Script_Final.pdf</span></div>
                        <a href={p.script_url} target="_blank" rel="noreferrer" className="text-brand-600 dark:text-brand-400 text-xs font-bold pl-3 hover:underline whitespace-nowrap">Baca/Unduh</a>
                    </div>
                ) : (
                    <div className="text-center p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl">
                        <p className="text-sm text-slate-500 dark:text-slate-400">Naskah (Script) belum diunggah oleh pihak agensi atau klien.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
