import { MapPin, QrCode, FileText, Clapperboard } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
export default function ProjectDetail() {
  const { id } = useParams();
  return (
    <div className="space-y-6">
      <div className="flex items-center text-sm font-medium text-slate-500 mb-4">
        <Link to="/dashboard/projects" className="hover:text-brand-600">Proyek Aktif</Link> <span className="mx-2">/</span> <span className="text-slate-900 dark:text-white">Detail Proyek {id}</span>
      </div>
      <div className="bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-start mb-6">
            <div>
                <span className="bg-green-100 text-green-700 text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">Status: Confirmed Booking</span>
                <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Iklan TVC Minuman Energi</h1>
                <p className="text-slate-500 mt-1">Sutradara: Joko Anwar | Klien: PT Maju Bersama</p>
            </div>
            <button className="flex items-center px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl shadow-lg hover:scale-105 transition-transform">
                <QrCode size={18} className="mr-2" /> Check-in Lokasi (Absen)
            </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold flex items-center mb-4 dark:text-white"><MapPin size={18} className="mr-2 text-brand-500" /> Call Sheet & Lokasi</h3>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2"><strong>Waktu Standby:</strong> 06:00 WIB (Pagi)</p>
                <p className="text-sm text-slate-600 dark:text-slate-300 mb-4"><strong>Lokasi:</strong> Studio Alam TVRI, Depok, Jawa Barat.</p>
                <button className="text-brand-600 font-bold text-sm">Buka di Google Maps &rarr;</button>
            </div>
            <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold flex items-center mb-4 dark:text-white"><Clapperboard size={18} className="mr-2 text-brand-500" /> Dokumen & Naskah</h3>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-dark-card rounded-xl border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center"><FileText size={16} className="text-slate-400 mr-2"/><span className="text-sm font-semibold dark:text-white">Script_TVC_Final_v2.pdf</span></div>
                    <button className="text-brand-600 text-xs font-bold">Baca</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
