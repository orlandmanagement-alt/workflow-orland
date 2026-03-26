import { MailOpen } from 'lucide-react';
export default function JobInvites() {
  return (
    <div className="space-y-6 text-center pt-20">
      <MailOpen size={64} className="mx-auto text-slate-300 dark:text-slate-600 mb-6" />
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Tidak Ada Undangan Langsung</h1>
      <p className="text-slate-500 max-w-md mx-auto">Sutradara atau Klien belum mengirimkan undangan casting eksklusif ke profil Anda. Pastikan Comp Card Anda menarik!</p>
    </div>
  )
}
