import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, ShieldCheck, Ban, Key, UserCircle, Activity, Loader2, RefreshCw, Trash2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: 'talent' | 'client' | 'admin' | 'super_admin';
  status: 'pending' | 'active' | 'suspended' | 'deleted' | 'banned';
  created_at: string;
  projects_count: number;
}

export default function UsersCRM() {
  const [users, setUsers] = useState<PortalUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'talent' | 'client'>('all');
  const [actionDropdown, setActionDropdown] = useState<string | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch from Admin API
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/admin/users', { 
         withCredentials: true,
         params: debouncedSearch ? { q: debouncedSearch } : {}
      });
      if (response.data?.status === 'ok') {
        setUsers(response.data.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch master users:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [debouncedSearch]); // Re-fetch only when debounced search changes

  const filteredUsers = users.filter(u => {
    const matchRole = filterRole === 'all' ? true : u.role === filterRole;
    return matchRole;
  });

  const handleAction = async (userId: string, targetStatus: string) => {
    setActionDropdown(null);
    let title = '';
    if (targetStatus === 'active') title = 'Aktifkan Akun ini?';
    if (targetStatus === 'suspended') title = 'Suspend (Tangguhkan) Akun ini?';
    if (targetStatus === 'banned') title = 'Banned secara permanen?';
    if (targetStatus === 'deleted') title = 'Hapus Akun secara sistem?';

    if (!confirm(title)) return;

    try {
      const response = await api.patch(`/admin/users/${userId}/status`, 
         { status: targetStatus },
         { withCredentials: true }
      );
      if (response.data?.status === 'ok') {
         // Update local var instantly
         setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: targetStatus as any } : u));
      }
    } catch (err: any) {
      alert('Gagal mengeksekusi tindakan. Silakan coba lagi. ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
              <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                  <ShieldCheck size={20} />
              </div>
              Identity Management CRM
           </h1>
           <p className="text-sm text-slate-500 mt-2 dark:text-slate-400">Pusat kendali akses, verifikasi, dan administrasi profil Talents & Clients.</p>
        </div>
        <button onClick={fetchUsers} disabled={loading} className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-slate-700 dark:text-slate-200">
           {loading ? <Loader2 size={16} className="animate-spin text-brand-500"/> : <RefreshCw size={16} className="text-slate-400" />}
           Sikronisasi Data
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-[0_10px_30px_rgba(17,24,39,0.03)] overflow-hidden">
        
        {/* Table Filters & Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#0b1626] flex flex-wrap gap-4 items-center justify-between">
           <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
             {(['all', 'client', 'talent'] as const).map(role => (
               <button 
                 key={role}
                 onClick={() => setFilterRole(role)}
                 className={`px-5 py-2 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all 
                 ${filterRole === role ? 'bg-slate-900 text-white shadow-md dark:bg-brand-500' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
               >
                 {role}
               </button>
             ))}
           </div>

           <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari Nama / Email di DB..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2.5 w-[280px] rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-medium text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 dark:text-white shadow-inner transition-all"
              />
           </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto min-h-[400px]">
           <table className="w-full text-left whitespace-nowrap">
             <thead className="bg-[#f8fafc] dark:bg-[#071122]/50 border-b border-slate-100 dark:border-slate-800">
                <tr className="text-[10px] uppercase font-black text-slate-400 dark:text-slate-500 tracking-widest">
                  <th className="px-6 py-4">User Identity</th>
                  <th className="px-6 py-4 text-center">Account Role</th>
                  <th className="px-6 py-4 text-center">Current Status</th>
                  <th className="px-6 py-4 text-center">Projects</th>
                  <th className="px-6 py-4">Registration Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                
                {loading && users.length === 0 && (
                   <tr>
                     <td colSpan={6} className="px-6 py-20 text-center">
                        <Loader2 size={32} className="animate-spin text-brand-500 mx-auto mb-4" />
                        <span className="text-xs font-bold text-slate-400 tracking-widest uppercase">Fetching Master Records...</span>
                     </td>
                   </tr>
                )}

                {!loading && filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-indigo-50/30 dark:hover:bg-slate-800/30 transition-colors group">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 group-hover:text-brand-500 group-hover:bg-brand-50 transition-colors border border-slate-200 dark:border-slate-700">
                              <UserCircle size={20} />
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 text-sm dark:text-white flex items-center gap-1 group-hover:text-brand-600 transition-colors">
                                {u.name || 'No Name Provided'}
                                {u.status === 'active' && <CheckCircle2 size={14} className="text-emerald-500" />}
                              </p>
                              <p className="text-xs font-medium text-slate-500 mt-0.5">{u.email}</p>
                           </div>
                        </div>
                     </td>
                     
                     <td className="px-6 py-4 text-center">
                        <span className={`px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-md border ${u.role === 'client' ? 'border-amber-200 text-amber-700 bg-amber-50 dark:border-amber-900/50 dark:text-amber-400 dark:bg-amber-900/10' : u.role === 'admin' ? 'border-purple-200 text-purple-700 bg-purple-50' : 'border-indigo-200 text-indigo-700 bg-indigo-50 dark:border-indigo-800/50 dark:text-indigo-400 dark:bg-indigo-900/20'}`}>
                           {u.role}
                        </span>
                     </td>

                     <td className="px-6 py-4 text-center">
                        <StatusBadge status={u.status} />
                     </td>

                     <td className="px-6 py-4 text-center">
                         <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 rounded-lg py-1 px-2 border border-slate-100 dark:border-slate-800 w-max mx-auto">
                            <Activity size={12} className={u.projects_count > 0 ? "text-brand-500" : "text-slate-300"} /> 
                            {u.projects_count}
                         </div>
                     </td>

                     <td className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400">
                        {new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                     </td>

                     <td className="px-6 py-4 text-center">
                        <div className="relative inline-block text-left">
                           <button onClick={(e) => { e.stopPropagation(); setActionDropdown(actionDropdown === u.id ? null : u.id); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200">
                             <MoreVertical size={18} />
                           </button>

                           {actionDropdown === u.id && (
                             <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-2xl z-30 py-2 overflow-hidden animate-in fade-in zoom-in-95" onMouseLeave={() => setActionDropdown(null)}>
                                
                                <div className="px-4 pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tindakan Admin</p>
                                </div>

                                <button onClick={() => handleAction(u.id, 'active')} disabled={u.status === 'active'} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-500/10 flex items-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed">
                                   <ShieldCheck size={14} className="opacity-70 group-hover/btn:text-emerald-500" /> Verify & Active
                                </button>
                                
                                <button onClick={() => handleAction(u.id, 'suspended')} disabled={u.status === 'suspended'} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/10 flex items-center gap-2 group/btn disabled:opacity-50 disabled:cursor-not-allowed">
                                   <Ban size={14} className="opacity-70 group-hover/btn:text-amber-500" /> Suspend Account
                                </button>

                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1.5 mx-2"></div>
                                
                                <button onClick={() => handleAction(u.id, 'banned')} disabled={u.status === 'banned'} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 group/btn disabled:opacity-50">
                                   <Ban size={14} className="opacity-70 group-hover/btn:text-rose-500" /> Ban Permanently
                                </button>
                                
                                <button onClick={() => handleAction(u.id, 'deleted')} className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2 group/btn">
                                   <Trash2 size={14} className="opacity-70 group-hover/btn:text-rose-500" /> Delete Master Data
                                </button>
                             </div>
                           )}
                        </div>
                     </td>
                  </tr>
                ))}

                {!loading && filteredUsers.length === 0 && search && (
                   <tr>
                     <td colSpan={6} className="px-6 py-16 text-center">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                             <Search size={24} />
                        </div>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400">Tidak ada user yang cocok dengan nama "{search}"</p>
                     </td>
                   </tr>
                )}
             </tbody>
           </table>
        </div>
      </div>

    </div>
  );
}

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'active': return <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 uppercase tracking-widest gap-1 border border-emerald-200 dark:border-emerald-500/30"><CheckCircle2 size={10}/> Active</span>;
    case 'pending': return <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 uppercase tracking-widest border border-amber-200 dark:border-amber-500/30">Pending</span>;
    case 'suspended': return <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 uppercase tracking-widest gap-1 border border-orange-200 dark:border-orange-500/30">Suspended</span>;
    case 'banned': return <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 uppercase tracking-widest gap-1 border border-rose-200 dark:border-rose-500/30"><Ban size={10}/> Banned</span>;
    case 'deleted': return <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 uppercase tracking-widest border border-slate-300 dark:border-slate-700">Deleted</span>;
    default: return <span className="inline-flex items-center px-2 py-1 rounded-md text-[9px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 uppercase tracking-widest border border-slate-200">{status}</span>;
  }
};
