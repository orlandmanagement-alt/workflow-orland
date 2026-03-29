import React, { useState } from 'react';
import { Invoice } from '@/types/finance.types';
import { InvoiceTemplate } from '@/components/finance/InvoiceTemplate';
import { Search, CreditCard, ChevronRight, CheckCircle2, AlertCircle, Clock, FileText, Upload, Plus } from 'lucide-react';

const mockInvoices: Invoice[] = [
  { id: 'INV-2026-OM-001', project_id: 'PRJ-XYZ999', project_name: 'TVC Iklan Susu Anak', client_name: 'Nusantara Productions (PH)', client_address: 'Jakarta', contract_ids: ['C1'], subtotal_fee: 15000000, agency_fee: 1500000, tax_amount: 1815000, grand_total: 18315000, status: 'unpaid', due_date: '2026-06-15T00:00:00Z' },
  { id: 'INV-2026-OM-002', project_id: 'PRJ-XYZ102', project_name: 'Event Music Fest', client_name: 'Nusantara Productions (PH)', client_address: 'Jakarta', contract_ids: ['C2', 'C3'], subtotal_fee: 5000000, agency_fee: 500000, tax_amount: 605000, grand_total: 6105000, status: 'paid', due_date: '2026-05-01T00:00:00Z' },
  { id: 'INV-2026-OM-003', project_id: 'PRJ-XYZ255', project_name: 'Campaign TikTok Kemerdekaan', client_name: 'Nusantara Productions (PH)', client_address: 'Jakarta', contract_ids: ['C4'], subtotal_fee: 10000000, agency_fee: 1000000, tax_amount: 1210000, grand_total: 12210000, status: 'processing', due_date: '2026-06-10T00:00:00Z' }
];

export default function FinanceHub() {
  const [invoices, setInvoices] = useState<Invoice[]>(mockInvoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleUploadProof = () => {
    if (!selectedInvoice) return;
    setIsUploading(true);
    setTimeout(() => {
      setInvoices(prev => prev.map(inv => inv.id === selectedInvoice.id ? { ...inv, status: 'processing' } as Invoice : inv));
      setSelectedInvoice({ ...selectedInvoice, status: 'processing' });
      setIsUploading(false);
      alert('Bukti transfer berhasil diunggah. Menunggu verifikasi tim Orland.');
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-8 space-y-8">
      
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3">
            <CreditCard className="text-brand-600" /> Pusat Keuangan
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2">Kelola tagihan, invoice, dan riwayat pembayaran perusahaan Anda.</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Cari No. Invoice..." 
            className="pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 focus:ring-2 focus:ring-brand-500 outline-none min-w-[250px] shadow-sm text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Kolom Kiri: Tabel Invoices (2/3 width on desktop) */}
        <div className="md:col-span-1 border border-slate-200 dark:border-slate-800 rounded-3xl bg-white dark:bg-dark-card overflow-hidden shadow-sm flex flex-col h-[calc(100vh-220px)]">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
             <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
               <FileText size={18} className="text-brand-500" /> Daftar Tagihan
             </h3>
             <span className="text-xs font-bold bg-white dark:bg-black px-2 py-1 rounded-md shadow-sm border border-slate-200 dark:border-slate-800">
                {invoices.length} Bills
             </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {invoices.map(inv => (
              <button 
                key={inv.id}
                onClick={() => setSelectedInvoice(inv)}
                className={`w-full text-left p-4 rounded-2xl border transition-all flex flex-col gap-2
                  ${selectedInvoice?.id === inv.id 
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/10 shadow-md ring-1 ring-brand-500/50' 
                    : 'border-slate-200 dark:border-slate-800 hover:border-brand-300 bg-white dark:bg-[#121b2b]'}`}
              >
                <div className="flex justify-between items-start w-full">
                  <span className="text-xs font-black font-mono text-slate-500 dark:text-slate-400">{inv.id}</span>
                  <StatusBadge status={inv.status} />
                </div>
                <div>
                  <h4 className={`font-bold truncate ${selectedInvoice?.id === inv.id ? 'text-brand-900 dark:text-brand-400' : 'text-slate-900 dark:text-white'}`}>
                    {inv.project_name}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider font-bold">Jatuh Tempo: {new Date(inv.due_date).toLocaleDateString('id-ID')}</p>
                </div>
                <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-between items-center w-full">
                   <p className="text-sm font-black text-slate-900 dark:text-white">Rp {inv.grand_total.toLocaleString()}</p>
                   <ChevronRight size={16} className={selectedInvoice?.id === inv.id ? 'text-brand-500' : 'text-slate-300'} />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Kolom Kanan: Detail Viewer / Invoice Template */}
        <div className="md:col-span-2 rounded-3xl overflow-hidden shadow-sm flex flex-col h-[calc(100vh-220px)] border border-slate-200 dark:border-slate-800 relative bg-slate-50 dark:bg-black">
           
           {selectedInvoice ? (
             <div className="flex-1 overflow-y-auto">
               <div className="p-6">
                 {/* Auto Invoicing Generate Template Mappings */}
                 <InvoiceTemplate invoice={selectedInvoice} />
                 
                 {/* Action Bar (Upload Bukti) di bawah form PDF */}
                 <div className="mt-8 p-6 bg-white dark:bg-dark-card border border-slate-200 dark:border-slate-800 rounded-2xl">
                    {selectedInvoice.status === 'unpaid' && (
                      <div className="text-center space-y-4">
                        <AlertCircle className="mx-auto text-amber-500" size={32} />
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">Menunggu Pembayaran</h4>
                          <p className="text-sm text-slate-500 mt-1">Harap transfer sesuai Grand Total ke rekening BCA Orland dan unggah buktinya.</p>
                        </div>
                        <button 
                          onClick={handleUploadProof}
                          disabled={isUploading}
                          className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-extrabold rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                        >
                           {isUploading ? <Clock size={18} className="animate-spin" /> : <Upload size={18} />} 
                           {isUploading ? 'Mengunggah...' : 'Upload Bukti Transfer (JPG/PDF)'}
                        </button>
                      </div>
                    )}
                    
                    {selectedInvoice.status === 'processing' && (
                      <div className="text-center space-y-4 text-amber-600 dark:text-amber-500">
                        <Clock className="mx-auto" size={32} />
                        <div>
                          <h4 className="font-bold">Verifikasi Pembayaran</h4>
                          <p className="text-sm opacity-80 mt-1">Tim Orland sedang mengecek mutasi masuk. Payout akan diteruskan ke Talent setelah diverifikasi.</p>
                        </div>
                      </div>
                    )}

                    {selectedInvoice.status === 'paid' && (
                      <div className="text-center space-y-4 text-green-600 dark:text-green-500">
                        <CheckCircle2 className="mx-auto" size={32} />
                        <div>
                          <h4 className="font-bold">LUNAS</h4>
                          <p className="text-sm opacity-80 mt-1">Terima kasih. Dana pembayaran Talent Fee telah kami terima dan proes Payout talent sedang berjalan.</p>
                        </div>
                      </div>
                    )}
                 </div>
               </div>
             </div>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white dark:bg-dark-card">
               <FileText size={64} className="mb-4 opacity-20" />
               <h3 className="text-xl font-bold text-slate-600 dark:text-slate-300">Pilih Invoice</h3>
               <p className="text-sm mt-2 max-w-sm">Klik salah satu tagihan di sebelah kiri untuk melihat detail Surat Jalan / Invoice dan melakukan konfirmasi pembayaran.</p>
             </div>
           )}

        </div>

      </div>
    </div>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  switch(status) {
    case 'paid': return <span className="bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1"><CheckCircle2 size={10}/> Paid</span>;
    case 'processing': return <span className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1"><Clock size={10}/> In-Review</span>;
    default: return <span className="bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md flex items-center gap-1"><AlertCircle size={10}/> Unpaid</span>;
  }
}
