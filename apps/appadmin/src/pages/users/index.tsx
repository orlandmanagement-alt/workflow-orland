import React, { useState } from 'react';
import { Search, Filter, MoreVertical, ShieldCheck, Ban, Key, ChevronRight, UserCircle, Activity } from 'lucide-react';

interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: 'talent' | 'client';
  status: 'pending' | 'active' | 'banned';
  created_at: string;
  projects_count: number;
}

const MOCK_USERS: PortalUser[] = [
  { id: 'usr-1', name: 'Nusantara Productions', email: 'hello@nusantara.ph', role: 'client', status: 'active', created_at: '2026-01-10T00:00:00Z', projects_count: 12 },
  { id: 'usr-2', name: 'Alina Kharisma', email: 'alina.k@gmail.com', role: 'talent', status: 'pending', created_at: '2026-03-20T00:00:00Z', projects_count: 0 },
  { id: 'usr-3', name: 'Budi Santoso', email: 'budis@yahoo.com', role: 'talent', status: 'banned', created_at: '2025-11-05T00:00:00Z', projects_count: 2 },
  { id: 'usr-4', name: 'Superb Events (EO)', email: 'info@superbevents.com', role: 'client', status: 'active', created_at: '2026-02-15T00:00:00Z', projects_count: 5 },
];

export default function UsersCRM() {
  const [users, setUsers] = useState<PortalUser[]>(MOCK_USERS);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState<'all' | 'talent' | 'client'>('all');
  const [actionDropdown, setActionDropdown] = useState<string | null>(null);

  const filteredUsers = users.filter(u => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'all' ? true : u.role === filterRole;
    return matchSearch && matchRole;
  });

  const handleAction = (userId: string, action: 'verify' | 'ban' | 'reset') => {
    if (action === 'verify') {
      if(confirm('Keluarkan tanda centang biru untuk user ini?')) {
         setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'active' } : u));
      }
    } else if (action === 'ban') {
      if(confirm('Ubah status ke Banned? User akan logout paksa.')) {
         setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: 'banned' } : u));
      }
    } else {
      alert(`Link reset password dikirim ke email user ${userId}`);
    }
    setActionDropdown(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2 tracking-tight">
              <Users className="text-brand-500" /> Identity Management
           </h1>
           <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Verifikasi, Banned, dan Kontrol Hak Akses Seluruh Klien & Talent</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        
        {/* Table Filters & Controls */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0b1626] flex flex-wrap gap-4 items-center justify-between">
           <div className="flex gap-2 bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
             {(['all', 'client', 'talent'] as const).map(role => (
               <button 
                 key={role}
                 onClick={() => setFilterRole(role)}
                 className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors 
                 ${filterRole === role ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md' : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}
               >
                 {role}
               </button>
             ))}
           </div>

           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari Nama / Email..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 w-64 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-sm outline-none focus:ring-2 focus:ring-brand-500 dark:text-white shadow-sm"
              />
           </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto">
           <table className="w-full text-left whitespace-nowrap">
             <thead className="bg-slate-50/50 dark:bg-[#071122]">
                <tr className="text-[10px] uppercase font-black text-slate-500 dark:text-slate-400 tracking-wider">
                  <th className="px-6 py-4">User Identity</th>
                  <th className="px-6 py-4 text-center">Role / Type</th>
                  <th className="px-6 py-4 text-center">Status Account</th>
                  <th className="px-6 py-4 text-center">Projects</th>
                  <th className="px-6 py-4">Joined Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredUsers.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors group">
                     <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-300">
                              <UserCircle size={24} />
                           </div>
                           <div>
                              <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1">
                                {u.name}
                                {u.status === 'active' && <ShieldCheck size={14} className="text-brand-500" />}
                              </p>
                              <p className="text-xs text-slate-500 font-mono">{u.email}</p>
                           </div>
                        </div>
                     </td>
                     
                     <td className="px-6 py-4 text-center">
                        <span className={`px-3 py-1 text-[10px] font-black uppercase rounded-lg border ${u.role === 'client' ? 'border-brand-200 text-brand-700 bg-brand-50 dark:border-brand-800/50 dark:text-brand-400 dark:bg-brand-900/20' : 'border-indigo-200 text-indigo-700 bg-indigo-50 dark:border-indigo-800/50 dark:text-indigo-400 dark:bg-indigo-900/20'}`}>
                           {u.role}
                        </span>
                     </td>

                     <td className="px-6 py-4 text-center">
                        <StatusBadge status={u.status} />
                     </td>

                     <td className="px-6 py-4 text-center">
                         <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                            <Activity size={14} className="text-slate-400" /> {u.projects_count}
                         </div>
                     </td>

                     <td className="px-6 py-4 text-xs font-mono text-slate-500 dark:text-slate-400">
                        {new Date(u.created_at).toLocaleDateString()}
                     </td>

                     <td className="px-6 py-4 text-center">
                        <div className="relative inline-block text-left">
                           <button onClick={(e) => { e.stopPropagation(); setActionDropdown(actionDropdown === u.id ? null : u.id); }} className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                             <MoreVertical size={18} />
                           </button>

                           {actionDropdown === u.id && (
                             <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl z-20 py-1 overflow-hidden animate-in fade-in zoom-in-95" onMouseLeave={() => setActionDropdown(null)}>
                                <button onClick={() => handleAction(u.id, 'verify')} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-brand-50 hover:text-brand-700 dark:hover:bg-brand-500/20 flex items-center gap-2">
                                   <ShieldCheck size={14} className="opacity-70" /> Verify Account
                                </button>
                                <button onClick={() => handleAction(u.id, 'reset')} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-500/20 flex items-center gap-2">
                                   <Key size={14} className="opacity-70" /> Reset Password
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-slate-700 my-1"></div>
                                <button onClick={() => handleAction(u.id, 'ban')} className="w-full text-left px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 flex items-center gap-2">
                                   <Ban size={14} className="opacity-70" /> Suspend / Ban
                                </button>
                             </div>
                           )}
                        </div>
                     </td>
                  </tr>
                ))}

                {filteredUsers.length === 0 && (
                   <tr>
                     <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 text-sm">
                        Tidak ada user yang ditemukan.
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
    case 'active': return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400 uppercase tracking-widest gap-1"><ShieldCheck size={10}/> Active</span>;
    case 'pending': return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 uppercase tracking-widest">Pending</span>;
    case 'banned': return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 uppercase tracking-widest gap-1"><Ban size={10}/> Banned</span>;
    default: return <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 uppercase tracking-widest">{status}</span>;
  }
};
