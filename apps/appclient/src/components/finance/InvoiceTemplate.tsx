import React from 'react';
import { Invoice } from '@/types/finance.types';
import { DownloadCloud, Building2, Landmark, CheckCircle2 } from 'lucide-react';

const MOCK_INVOICE: Invoice = {
  id: 'INV-2026-OM-001',
  project_id: 'PRJ-XYZ999',
  project_name: 'TVC Iklan Susu Anak',
  client_name: 'Nusantara Productions (PH)',
  client_address: 'Jl. Sudirman Kav 21, Jakarta Selatan, 12920',
  contract_ids: ['CTR-OM-101', 'CTR-OM-102'],
  subtotal_fee: 15000000,
  agency_fee: 1500000, 
  tax_amount: 1815000, 
  grand_total: 18315000,
  status: 'unpaid',
  due_date: '2026-06-15T00:00:00Z'
};

export const InvoiceTemplate = ({ invoice = MOCK_INVOICE }: { invoice?: Invoice }) => {
  const handleDownload = () => {
    // Di produksi, di sini akan memanggil html2canvas & jspdf
    alert('Invoice Print Layout Triggered');
    window.print(); 
  };

  return (
    <div className="w-full space-y-4">
      
      {/* Action Bar */}
      <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
         <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${invoice.status === 'paid' ? 'bg-green-100 text-green-700' : invoice.status === 'processing' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'}`}>
              {invoice.status}
            </span>
            <p className="text-sm font-bold text-slate-600 dark:text-slate-400">Jatuh Tempo: {new Date(invoice.due_date).toLocaleDateString('id-ID')}</p>
         </div>
         <button 
           onClick={handleDownload}
           className="px-4 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center gap-2 rounded-lg text-sm font-bold shadow-md hover:scale-105 transition-transform"
         >
           <DownloadCloud size={16} /> Print / Download PDF
         </button>
      </div>

      {/* A4 PAPER TEMPLATE (Screen & Print Wrapper) */}
      <div id="invoice-layout" className="bg-white mx-auto overflow-hidden shadow-2xl p-10 md:p-16 border border-slate-200" style={{ maxWidth: '800px', minHeight: '1000px', width: '100%' }}>
        
        {/* Header KOP Surat */}
        <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8">
            <div>
               <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase whitespace-nowrap">INVOICE <span className="text-slate-400">TAGIHAN</span></h1>
               <p className="text-sm font-bold font-mono text-slate-500 mt-2">{invoice.id}</p>
            </div>
            <div className="text-right">
               <h2 className="text-2xl font-black text-brand-600 uppercase tracking-widest whitespace-nowrap">ORLAND MANAGEMENT</h2>
               <p className="text-xs text-slate-600 font-medium leading-relaxed mt-2">
                 Gedung Orland Tower Lt 42<br />
                 Jl. Gatot Subroto No. 99, Jakarta 12930<br />
                 NPWP: 01.234.567.8-090.000<br />
                 finance@orlandmanagement.com
               </p>
            </div>
        </div>

        {/* Info Penagihan */}
        <div className="mt-12 flex justify-between">
           <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl w-[55%]">
             <h3 className="text-[10px] font-black uppercase text-slate-400 mb-2">Ditagihkan Kepada (Bill To):</h3>
             <p className="text-lg font-bold text-slate-900">{invoice.client_name}</p>
             <p className="text-sm text-slate-600 mt-1">{invoice.client_address}</p>
           </div>
           <div className="w-[35%]">
             <div className="flex justify-between border-b border-slate-200 pb-2 mb-2">
                <span className="text-xs text-slate-500 font-bold">Tanggal Terbit</span>
                <span className="text-sm text-slate-900 font-bold">{new Date().toLocaleDateString('id-ID')}</span>
             </div>
             <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-xs text-rose-500 font-bold">Jatuh Tempo</span>
                <span className="text-sm text-rose-600 font-bold">{new Date(invoice.due_date).toLocaleDateString('id-ID')}</span>
             </div>
           </div>
        </div>

        {/* Tabel Items */}
        <div className="mt-12">
            <table className="w-full text-left">
               <thead>
                 <tr className="bg-slate-900 text-white text-[10px] uppercase font-black uppercase tracking-wider">
                   <th className="px-4 py-3 rounded-tl-lg">Project Reference</th>
                   <th className="px-4 py-3">Description</th>
                   <th className="px-4 py-3 text-center">Contracts Count</th>
                   <th className="px-4 py-3 text-right rounded-tr-lg">Amount / Nilai</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-200 text-sm">
                  <tr>
                    <td className="px-4 py-6 font-mono font-bold text-slate-500">{invoice.project_id}</td>
                    <td className="px-4 py-6 font-bold text-slate-900 max-w-xs">{invoice.project_name} - Paket Talent Fee (Termasuk Buyout)</td>
                    <td className="px-4 py-6 text-center font-bold">{invoice.contract_ids.length} Talent(s)</td>
                    <td className="px-4 py-6 text-right font-black text-slate-900">Rp {invoice.subtotal_fee.toLocaleString()}</td>
                  </tr>
               </tbody>
            </table>
        </div>

        {/* Kalkulasi Total */}
        <div className="mt-10 flex justify-end">
           <div className="w-full md:w-[60%] lg:w-[45%]">
               
               <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500 font-bold uppercase">Subtotal Fee (Talent Dasar)</span>
                  <span className="text-sm font-bold text-slate-900">Rp {invoice.subtotal_fee.toLocaleString()}</span>
               </div>
               
               <div className="flex justify-between py-2 border-b border-slate-200">
                  <span className="text-xs text-slate-500 font-bold uppercase">Orland Agency Fee (10%)</span>
                  <span className="text-sm font-bold text-slate-900">Rp {invoice.agency_fee.toLocaleString()}</span>
               </div>
               
               <div className="flex justify-between py-2 border-b border-slate-400">
                  <span className="text-xs text-slate-500 font-bold uppercase">PPN (11%)</span>
                  <span className="text-sm font-bold text-slate-900">Rp {invoice.tax_amount.toLocaleString()}</span>
               </div>
               
               <div className="flex justify-between py-4 bg-slate-50 mt-2 px-4 rounded-xl border border-brand-200">
                  <span className="text-sm text-brand-700 font-black uppercase mt-1">TOTAL GRAND (IDR)</span>
                  <span className="text-2xl font-black text-brand-700">Rp {invoice.grand_total.toLocaleString()}</span>
               </div>

           </div>
        </div>

        {/* Tanda Tangan & Bank */}
        <div className="mt-16 pt-8 border-t-2 border-dashed border-slate-200 flex justify-between">
            <div className="w-[50%]">
                <h4 className="text-[10px] uppercase font-black text-slate-400 mb-3 tracking-wider flex items-center gap-2"><Landmark size={14}/> INFO PEMBAYARAN</h4>
                <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-1">
                    <p className="text-sm font-bold text-slate-600">Bank Central Asia (BCA)</p>
                    <p className="text-xl font-black text-slate-900 font-mono tracking-widest">A/C 123-456-7890</p>
                    <p className="text-xs font-bold text-slate-500 uppercase mt-1">A.N. PT ORLAND MANAGEMENT NUSANTARA</p>
                </div>
            </div>

            <div className="text-center w-[30%]">
                 <p className="text-xs font-bold text-slate-500 mb-2">Finance Department</p>
                 <div className="h-24 w-full flex items-center justify-center">
                    {/* Digital Signature Cap */}
                    <div className="border-4 border-red-500 text-red-500 opacity-60 rounded-full w-20 h-20 flex items-center justify-center -rotate-12 absolute z-0 pointer-events-none">
                       <span className="text-[10px] font-black uppercase text-center leading-tight">Orland<br/>Digital<br/>Verified</span>
                    </div>
                    {invoice.status !== 'unpaid' && (
                       <CheckCircle2 size={64} className="text-green-500 opacity-20 absolute" />
                    )}
                 </div>
                 <h5 className="font-bold text-slate-900 mt-2">Dian Finance</h5>
            </div>
        </div>

        {/* Footer */}
         <div className="mt-12 text-center text-xs text-slate-400 border-t border-slate-100 pt-6">
            <p>Terima kasih atas kerja samanya. Harap selesaikan pembayaran sebelum tanggal jatuh tempo.<br/>Dokumen PDF ini di-generate otomatis oleh sistem dan sah secara digital.</p>
         </div>
      </div>

    </div>
  );
};
