import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Sparkles, Check, X, Ticket, Loader2, MapPin, Calendar, DollarSign, Building2 } from 'lucide-react';
import { toast } from 'sonner';

// Tipe data berdasarkan Skema Database Baru
interface JobInvite {
  id: string;
  project_id: string;
  role_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  message: string;
  created_at: string;
  project: {
    title: string;
    client_name: string;
    shoot_location: string;
    shoot_date_start: string;
    budget_max: number;
  };
  role: {
    name: string;
  };
}

export default function JobInvites() {
  // Mengambil daftar undangan dari API
  const { data: invitesResponse, isLoading, refetch } = useQuery({
    queryKey: ['job-invites'],
    queryFn: async () => {
      const response = await fetch('/api/jobs/invites', {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` },
      });
      if (!response.ok) throw new Error('Gagal mengambil data undangan');
      return response.json();
    },
  });

  const invites: JobInvite[] = invitesResponse?.data || [];
  const pendingInvites = invites.filter(inv => inv.status === 'pending');

  // Mutasi untuk Merespons Undangan (Terima / Tolak)
  const respondMutation = useMutation({
    mutationFn: async ({ inviteId, status }: { inviteId: string; status: 'accepted' | 'rejected' }) => {
      const response = await fetch(`/api/jobs/invites/${inviteId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Gagal merespons undangan');
      }
      return response.json();
    },
    onSuccess: (_, variables) => {
      if (variables.status === 'accepted') {
        toast.success('✓ Undangan berhasil DITERIMA! Klien akan segera menghubungi Anda.');
      } else {
        toast.info('Undangan telah ditolak.');
      }
      refetch(); // Refresh data setelah merespons
    },
    onError: (error: any) => {
      toast.error(`✗ ${error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="animate-spin text-amber-500 mb-4" size={48} />
        <p className="text-slate-500 font-bold animate-pulse">Mengecek kotak masuk undangan Anda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Undangan Eksklusif</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Undangan casting tertutup yang dikirim langsung oleh Klien & Sutradara khusus untuk Anda.
        </p>
      </div>

      {pendingInvites.length === 0 ? (
        <div className="text-center py-20 bg-white dark:bg-dark-card p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm mt-8">
          <Ticket size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-300 mb-2">Belum Ada Undangan Baru</h3>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Pastikan portofolio Anda selalu <span className="text-brand-500">Up to Date</span> agar menarik perhatian Klien!
          </p>
        </div>
      ) : (
        <div className="space-y-8 mt-8">
          {pendingInvites.map((invite) => (
            <div 
              key={invite.id} 
              className="bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 p-1 rounded-3xl shadow-2xl shadow-amber-500/20 max-w-3xl mx-auto transform transition-transform hover:scale-[1.01]"
            >
              <div className="bg-slate-900 rounded-[22px] p-6 sm:p-10 relative overflow-hidden">
                
                {/* Efek Kilauan (UI Tetap Dipertahankan) */}
                <div className="absolute top-0 right-0 p-6 opacity-20 pointer-events-none">
                  <Ticket size={120} className="text-amber-400" />
                </div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-1 bg-amber-500/20 blur-xl rotate-45 pointer-events-none"></div>

                <div className="relative z-10 text-center sm:text-left">
                  <div className="inline-flex items-center justify-center bg-amber-400/10 border border-amber-400/50 text-amber-400 text-xs font-black uppercase px-4 py-1.5 rounded-full tracking-widest mb-6">
                    <Sparkles size={14} className="mr-2" /> Private Casting Invitation
                  </div>
                  
                  <h2 className="text-2xl sm:text-4xl font-black text-white mb-2 leading-tight">
                    {invite.project.title}
                  </h2>
                  
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-amber-200 text-sm font-medium mb-8">
                    <span className="flex items-center"><Building2 size={16} className="mr-1.5"/> {invite.project.client_name}</span>
                    <span className="flex items-center"><DollarSign size={16} className="mr-1.5 text-green-400"/> Rp {(invite.project.budget_max || 0).toLocaleString('id-ID')}</span>
                  </div>
                  
                  <div className="bg-white/5 border border-white/10 p-5 rounded-2xl mb-8 text-left backdrop-blur-sm">
                    <p className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">Pesan dari Klien:</p>
                    <p className="text-slate-300 text-sm leading-relaxed italic">"{invite.message}"</p>
                    
                    <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Karakter</p>
                        <p className="text-white text-sm font-semibold">{invite.role.name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 uppercase font-bold">Tanggal & Lokasi</p>
                        <p className="text-white text-sm font-semibold truncate">
                          {new Date(invite.project.shoot_date_start).toLocaleDateString('id-ID')} • {invite.project.shoot_location}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-4 justify-center sm:justify-start">
                    <button 
                      onClick={() => respondMutation.mutate({ inviteId: invite.id, status: 'accepted' })}
                      disabled={respondMutation.isPending}
                      className="px-8 py-3.5 bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900 font-black rounded-xl shadow-lg hover:shadow-amber-500/50 transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      {respondMutation.isPending ? <Loader2 size={20} className="animate-spin mr-2" /> : <Check size={20} className="mr-2" />} 
                      Terima Undangan
                    </button>
                    <button 
                      onClick={() => {
                        if(confirm('Yakin ingin menolak undangan emas ini?')) {
                          respondMutation.mutate({ inviteId: invite.id, status: 'rejected' });
                        }
                      }}
                      disabled={respondMutation.isPending}
                      className="px-8 py-3.5 bg-transparent border-2 border-slate-700 text-slate-400 font-bold rounded-xl hover:bg-slate-800 hover:text-white transition-all flex items-center justify-center disabled:opacity-50"
                    >
                      <X size={20} className="mr-2" /> Tolak
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}