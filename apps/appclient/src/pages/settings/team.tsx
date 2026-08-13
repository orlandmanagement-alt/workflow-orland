import { useState } from 'react';
import { Users, Mail, UserPlus, Shield, ShieldAlert, Trash2, Clock, CheckCircle2, Loader2, ChevronDown } from 'lucide-react';

// Simulasi Database Anggota Tim Klien
const MOCK_TEAM = [
  { id: 'M-1', name: 'Manoj Punjabi', email: 'manoj@md-ent.com', role: 'Executive Producer', access: 'Owner', status: 'Active', avatar: 'bg-indigo-600' },
  { id: 'M-2', name: 'Joko Anwar', email: 'joko.a@md-ent.com', role: 'Director', access: 'Edit Projects', status: 'Active', avatar: 'bg-emerald-600' },
  { id: 'M-3', name: 'Sarah Finance', email: 'finance@md-ent.com', role: 'Finance Admin', access: 'Billing & Escrow', status: 'Active', avatar: 'bg-amber-600' },
  { id: 'M-4', name: '-', email: 'asisten.casting@md-ent.com', role: 'Casting Director', access: 'View Only', status: 'Pending', avatar: 'bg-slate-300' },
];

export default function TeamSettings() {
  const [team, setTeam] = useState(MOCK_TEAM);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('View Only');
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail) return;
      
      setIsInviting(true);
      // Simulasi API Call
      setTimeout(() => {
          const newMember = {
              id: `M-${Date.now()}`,
              name: '-',
              email: inviteEmail,
              role: 'Staff',
              access: inviteRole,
              status: 'Pending',
              avatar: 'bg-slate-300'
          };
          setTeam([...team, newMember]);
          setInviteEmail('');
          setIsInviting(false);
          alert(`Undangan berhasil dikirim ke ${inviteEmail}`);
      }, 1500);
  };

  const handleRevoke = (id: string, name: string) => {
      if (confirm(`Peringatan: Cabut akses untuk ${name || 'user ini'}? Mereka tidak akan bisa login ke dashboard perusahaan ini lagi.`)) {
          setTeam(team.filter(m => m.id !== id));
      }
  };

  const getAccessBadge = (access: string) => {
      switch(access) {
          case 'Owner': return <span className="flex items-center w-fit text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700 border border-indigo-200"><Shield size={10} className="mr-1"/> FULL ACCESS</span>;
          case 'Edit Projects': return <span className="flex items-center w-fit text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200">PROJECTS (R/W)</span>;
          case 'Billing & Escrow': return <span className="flex items-center w-fit text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">FINANCE ONLY</span>;
          default: return <span className="flex items-center w-fit text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">READ ONLY</span>;
      }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white flex items-center tracking-tight">
                <Users className="mr-3 text-brand-500" size={32}/> Team & Member Access
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg">Kelola siapa saja yang memiliki akses ke dashboard proyek, database talent, dan informasi tagihan (Escrow) perusahaan Anda.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* KOLOM KIRI (1/3): FORM UNDANG MEMBER */}
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center mb-6"><UserPlus className="mr-2 text-brand-500" size={20}/> Undang Anggota Tim</h2>
                  
                  <form onSubmit={handleInvite} className="space-y-4">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Alamat Email Karyawan</label>
                          <div className="relative mt-1">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Mail className="text-slate-400" size={16} /></div>
                              <input 
                                  type="email" 
                                  required
                                  value={inviteEmail}
                                  onChange={(e) => setInviteEmail(e.target.value)}
                                  placeholder="contoh@md-ent.com" 
                                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-brand-500" 
                              />
                          </div>
                      </div>

                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Level Hak Akses (RBAC)</label>
                          <div className="relative mt-1">
                              <select 
                                  value={inviteRole}
                                  onChange={(e) => setInviteRole(e.target.value)}
                                  className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white appearance-none cursor-pointer"
                              >
                                  <option value="View Only">View Only (Cuma bisa lihat Project & Talent)</option>
                                  <option value="Edit Projects">Edit Projects (Bisa Approve/Shortlist Talent)</option>
                                  <option value="Billing & Escrow">Billing & Escrow (Akses Menu Finance)</option>
                                  <option value="Admin">Admin (Bisa tambah project & member lain)</option>
                              </select>
                              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><ChevronDown className="text-slate-400" size={16} /></div>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">Peringatan: Jangan berikan akses "Admin" atau "Billing & Escrow" kepada anggota tim yang tidak berwenang mencairkan dana.</p>
                      </div>

                      <button 
                          type="submit" 
                          disabled={isInviting || !inviteEmail}
                          className="w-full mt-4 py-3.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center disabled:opacity-70 disabled:hover:scale-100"
                      >
                          {isInviting ? <><Loader2 size={18} className="animate-spin mr-2"/> Mengirim Undangan...</> : <><Mail size={18} className="mr-2"/> Kirim Undangan via Email</>}
                      </button>
                  </form>
              </div>

              {/* Security Info Card */}
              <div className="bg-slate-900 dark:bg-black rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10"><ShieldAlert size={80} className="text-white"/></div>
                  <h3 className="text-white font-bold mb-2 flex items-center"><ShieldAlert size={16} className="mr-2 text-brand-400"/> Keamanan Enterprise</h3>
                  <p className="text-slate-400 text-xs leading-relaxed">Setiap staf yang diundang wajib login menggunakan email kantor yang terdaftar (SSO/Magic Link). Sistem memantau dan mencatat (Audit Log) setiap aktivitas Edit, Approve, dan Tarik Dana.</p>
              </div>
          </div>

          {/* KOLOM KANAN (2/3): DAFTAR ANGGOTA TIM */}
          <div className="lg:col-span-2">
              <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden h-full">
                  <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800/60 flex justify-between items-center">
                      <h3 className="font-bold text-lg text-slate-900 dark:text-white">Daftar Anggota Aktif ({team.length})</h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                          <thead>
                              <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800/60">
                                  <th className="p-4 pl-6">Profil Karyawan</th>
                                  <th className="p-4">Hak Akses</th>
                                  <th className="p-4">Status</th>
                                  <th className="p-4 pr-6 text-right">Aksi</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                              {team.map((member) => (
                                  <tr key={member.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                                      <td className="p-4 pl-6 flex items-center gap-3">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0 ${member.avatar}`}>
                                              {member.name !== '-' ? member.name.charAt(0) : <Mail size={16}/>}
                                          </div>
                                          <div>
                                              <p className="font-bold text-slate-900 dark:text-white text-sm">{member.name !== '-' ? member.name : 'Menunggu Pendaftaran'}</p>
                                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">{member.email}</p>
                                          </div>
                                      </td>
                                      <td className="p-4">
                                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">{member.role}</p>
                                          {getAccessBadge(member.access)}
                                      </td>
                                      <td className="p-4">
                                          {member.status === 'Active' ? (
                                              <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400"><CheckCircle2 size={14} className="mr-1"/> Aktif</span>
                                          ) : (
                                              <span className="flex items-center text-xs font-bold text-slate-500"><Clock size={14} className="mr-1"/> Pending (Dikirim)</span>
                                          )}
                                      </td>
                                      <td className="p-4 pr-6 text-right">
                                          {member.access !== 'Owner' ? (
                                              <button 
                                                  onClick={() => handleRevoke(member.id, member.name !== '-' ? member.name : member.email)}
                                                  className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-lg transition-colors" 
                                                  title="Cabut Akses (Revoke)"
                                              >
                                                  <Trash2 size={18} />
                                              </button>
                                          ) : (
                                              <span className="text-[10px] font-bold text-slate-400 uppercase">Tidak Bisa Dihapus</span>
                                          )}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>

      </div>
    </div>
  )
}
