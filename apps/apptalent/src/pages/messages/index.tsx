import { MessageSquare } from 'lucide-react';
export default function Messages() {
  return (
    <div className="h-[calc(100vh-12rem)] bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-center flex-col text-center">
        <MessageSquare size={48} className="text-slate-300 dark:text-slate-600 mb-4" />
        <h3 className="text-lg font-bold dark:text-white">Kotak Masuk Kosong</h3>
        <p className="text-slate-500 text-sm mt-2 max-w-sm">Pesan dari Sutradara atau Klien terkait proyek Anda akan muncul di sini.</p>
    </div>
  )
}
