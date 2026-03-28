export default function Payouts() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dompet Pendapatan</h1>
      <div className="bg-gradient-to-br from-slate-900 to-brand-900 p-8 rounded-3xl shadow-xl shadow-brand-900/20 text-white">
        <p className="text-slate-300 text-sm font-medium">Saldo Tertahan (Menunggu Payout)</p>
        <h2 className="text-4xl font-extrabold mt-2 tracking-tighter">Rp 0</h2>
      </div>
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="p-4 font-semibold">Tanggal</th>
                  <th className="p-4 font-semibold">Proyek</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold">Nominal</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-500 dark:text-slate-400">Belum ada riwayat transaksi.</td>
                </tr>
            </tbody>
        </table>
      </div>
    </div>
  );
}
