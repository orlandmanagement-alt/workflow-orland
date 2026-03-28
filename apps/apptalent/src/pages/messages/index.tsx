import { MessageSquare } from 'lucide-react';
export default function Messages() {
  return (
    <div className="min-h-[60vh] bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center flex-col text-center p-6 animate-in fade-in">
        <div className="h-24 w-24 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
            <MessageSquare size={40} className="text-slate-300 dark:text-slate-600" />
        </div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">Kotak Masuk Kosong</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm leading-relaxed">
            Semua percakapan, negosiasi, dan arahan dari Sutradara atau Klien terkait proyek Anda akan diamankan dan muncul di halaman ini.
        </p>
    </div>
  )
}
