import { MapPin, QrCode, FileText, Clapperboard, Loader2 } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { projectService } from '@/lib/services/projectService';

export default function ProjectDetail() {
  const { id } = useParams();

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectService.getProjectById(id as string),
    enabled: !!id, // Hanya jalankan query jika ID tersedia di URL
  });

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-brand-600" size={40} /></div>;
  if (isError) throw new Error('Gagal memuat detail The Green Room');

  // Data Fallback jika API belum mengembalikan format utuh
  const p: any = project || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm font-medium text-slate-500 mb-4">
        <Link to="/dashboard/projects" className="hover:text-brand-600 transition-colors">Proyek Aktif</Link> 
        <span className="mx-2">/</span> 
        <span className="text-slate-900 dark:text-white truncate max-w-[200px]">{p.title || `Detail Proyek ${id}`}</span>
      </div>

      <div className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm animate-fade-in">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-6">
            <div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">Status: {p.status || 'Confirmed Booking'}</span>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">{p.title || 'Judul Proyek Memuat...'}</h1>
                <p className="text-slate-500 mt-1">Sutradara: {p.director || 'TBA'} | Klien: {p.client_name || 'TBA'}</p>
            </div>
            <button className="w-full md:w-auto flex justify-center items-center px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform shrink-0">
                <QrCode size={18} className="mr-2" /> Check-in Lokasi (Absen)
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold flex items-center mb-4 dark:text-white"><MapPin size={18} className="mr-2 text-brand-500" /> Call Sheet & Lokasi</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2"><strong>Waktu Standby:</strong> {p.standby_time || 'Menunggu Jadwal'}</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4"><strong>Lokasi:</strong> {p.location || 'Lokasi belum ditentukan.'}</p>
                <button className="text-brand-600 font-bold text-sm hover:underline">Buka di Google Maps &rarr;</button>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold flex items-center mb-4 dark:text-white"><Clapperboard size={18} className="mr-2 text-brand-500" /> Dokumen & Naskah</h3>
                {p.script_url ? (
                    <div className="flex items-center justify-between p-3 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-slate-700">
                        <div className="flex items-center overflow-hidden"><FileText size={16} className="text-slate-400 mr-2 shrink-0"/><span className="text-sm font-semibold dark:text-white truncate">Script_Final.pdf</span></div>
                        <a href={p.script_url} target="_blank" rel="noreferrer" className="text-brand-600 text-xs font-bold pl-2 hover:underline">Baca</a>
                    </div>
                ) : (
                    <p className="text-sm text-slate-500">Naskah belum diunggah oleh pihak agensi/klien.</p>
                )}
            </div>
        </div>
      </div>
    </div>
  )
}
