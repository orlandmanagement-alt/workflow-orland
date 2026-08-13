import { useState, useEffect } from 'react';
import {
  Users,
  Mail,
  UserPlus,
  Shield,
  ShieldAlert,
  Trash2,
  Clock,
  CheckCircle2,
  Loader2,
  ChevronDown,
  AlertCircle,
  RotateCcw,
} from 'lucide-react';
import { teamService, TeamMember } from '@/lib/services/teamService';

export default function TeamManagement() {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoadingTeam, setIsLoadingTeam] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviteAccessLevel, setInviteAccessLevel] = useState('view_only');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // Fetch team members on mount
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        setIsLoadingTeam(true);
        setError(null);
        const members = await teamService.getTeamMembers();
        setTeam(members);
      } catch (err: any) {
        console.error('Failed to fetch team:', err);
        setError(err.message || 'Gagal memuat daftar tim');
      } finally {
        setIsLoadingTeam(false);
      }
    };

    fetchTeam();
  }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setIsInviting(true);
      setError(null);

      const response = await teamService.inviteTeamMember({
        email: inviteEmail,
        role: inviteRole as 'admin' | 'editor' | 'viewer',
        access_level: inviteAccessLevel as
          | 'edit_projects'
          | 'billing_escrow'
          | 'view_only',
      });

      if (response.status === 'success') {
        setSuccessMessage(`Undangan berhasil dikirim ke ${inviteEmail}`);
        setInviteEmail('');
        setInviteRole('viewer');
        setInviteAccessLevel('view_only');

        // Refetch team
        const members = await teamService.getTeamMembers();
        setTeam(members);

        // Auto-hide success message
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setError(response.error || 'Gagal mengirim undangan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim undangan');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRevoke = async (memberId: string, memberName: string) => {
    if (
      !confirm(
        `Peringatan: Cabut akses untuk ${memberName}? Mereka tidak akan bisa login ke dashboard ini lagi.`
      )
    ) {
      return;
    }

    try {
      setActionInProgress(memberId);
      setError(null);

      const response = await teamService.revokeTeamMember(memberId);

      if (response.status === 'success') {
        setSuccessMessage(`Akses dicabut untuk ${memberName}`);
        setTeam(team.filter((m) => m.id !== memberId));
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setError(response.error || 'Gagal mencabut akses');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mencabut akses');
    } finally {
      setActionInProgress(null);
    }
  };

  const handleResendInvite = async (memberId: string, memberEmail: string) => {
    try {
      setActionInProgress(memberId);
      setError(null);

      const response = await teamService.resendInvitation(memberId);

      if (response.status === 'success') {
        setSuccessMessage(`Undangan berhasil dikirim ulang ke ${memberEmail}`);
        setTimeout(() => setSuccessMessage(null), 4000);
      } else {
        setError(response.error || 'Gagal mengirim ulang undangan');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirim ulang undangan');
    } finally {
      setActionInProgress(null);
    }
  };

  const getAccessBadge = (accessLevel: string) => {
    const badgeMap: Record<string, { bg: string; text: string; label: string }> = {
      full_access: {
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
        text: 'text-indigo-700 dark:text-indigo-400',
        label: 'Full Access',
      },
      edit_projects: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        label: 'Edit Projects',
      },
      billing_escrow: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        label: 'Billing & Escrow',
      },
      view_only: {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-400',
        label: 'View Only',
      },
    };

    const badge = badgeMap[accessLevel] || badgeMap.view_only;

    return (
      <span
        className={`flex items-center w-fit text-[10px] font-bold px-2 py-0.5 rounded border ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<
      string,
      { color: string; icon: any; label: string }
    > = {
      active: {
        color: 'text-emerald-600 dark:text-emerald-400',
        icon: CheckCircle2,
        label: 'Aktif',
      },
      pending: {
        color: 'text-yellow-600 dark:text-yellow-400',
        icon: Clock,
        label: 'Pending',
      },
      suspended: {
        color: 'text-red-600 dark:text-red-400',
        icon: AlertCircle,
        label: 'Suspended',
      },
      declined: {
        color: 'text-slate-500',
        icon: Clock,
        label: 'Declined',
      },
    };

    const statusInfo = statusMap[status] || statusMap.pending;
    const IconComponent = statusInfo.icon;

    return (
      <span className={`flex items-center text-xs font-bold ${statusInfo.color}`}>
        <IconComponent size={14} className="mr-1" /> {statusInfo.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center tracking-tight gap-3">
            <Users className="text-amber-500" size={36} /> Tim & Manajemen Akses
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-lg">
            Kelola sub-user internal Anda dengan kontrol akses berbasis role.
            Setiap anggota tim akan menerima undangan email SSO untuk login aman.
          </p>
        </div>
      </div>

      {/* SUCCESS & ERROR ALERTS */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-2xl flex items-center gap-3">
          <CheckCircle2 className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
          <p className="text-emerald-700 dark:text-emerald-300 text-sm font-semibold">
            {successMessage}
          </p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/30 rounded-2xl flex items-center gap-3">
          <AlertCircle className="text-rose-600 dark:text-rose-400 flex-shrink-0" />
          <p className="text-rose-700 dark:text-rose-300 text-sm font-semibold">
            {error}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT COLUMN: INVITE FORM */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-dark-card rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center mb-6 gap-2">
              <UserPlus className="text-amber-500" size={20} /> Undang Anggota Tim
            </h2>

            <form onSubmit={handleInvite} className="space-y-4">
              {/* Email Input */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Email
                </label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="staff@company.com"
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Role Select */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Role
                </label>
                <div className="relative mt-1">
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="viewer">Viewer</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Admin: Akses penuh. Editor: Bisa edit project. Viewer: Hanya lihat.
                </p>
              </div>

              {/* Access Level Select */}
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Level Akses
                </label>
                <div className="relative mt-1">
                  <select
                    value={inviteAccessLevel}
                    onChange={(e) => setInviteAccessLevel(e.target.value)}
                    className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="view_only">View Only</option>
                    <option value="edit_projects">Edit Projects</option>
                    <option value="billing_escrow">Billing & Escrow</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  PERINGATAN: Jangan berikan "Billing & Escrow" kecuali staff yang
                  bertanggung jawab.
                </p>
              </div>

              <button
                type="submit"
                disabled={isInviting || !inviteEmail}
                className="w-full mt-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:to-amber-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg hover:scale-105 transition-transform flex items-center justify-center disabled:hover:scale-100 gap-2"
              >
                {isInviting ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Mengirim...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} /> Kirim Undangan
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Security Card */}
          <div className="bg-gradient-to-br from-slate-900 to-black rounded-3xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <ShieldAlert size={100} className="text-white" />
            </div>
            <h3 className="text-white font-bold mb-2 flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-400" /> Keamanan
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Setiap staff harus login via SSO/Magic Link. Semua aktivitas
              tercatat di Audit Log untuk compliance.
            </p>
          </div>
        </div>

        {/* RIGHT COLUMN: TEAM LIST */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-500/5 dark:to-transparent flex justify-between items-center">
              <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users size={18} className="text-amber-500" /> Anggota Tim ({team.length})
              </h3>
            </div>

            {/* Content */}
            {isLoadingTeam ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="animate-spin mb-3 text-amber-500" size={32} />
                <p className="font-semibold">Memuat anggota tim...</p>
              </div>
            ) : team.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Users className="mb-3 opacity-30" size={48} />
                <p className="font-semibold">Belum ada anggota tim</p>
                <p className="text-sm">Mulai dengan menginvit anggota pertama</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                      <th className="p-4 pl-6">Profil</th>
                      <th className="p-4">Role & Akses</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {team.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                      >
                        <td className="p-4 pl-6 flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                            {member.name
                              ? member.name.charAt(0).toUpperCase()
                              : member.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white text-sm">
                              {member.name || 'Pending'}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                              {member.email}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-300 capitalize mb-1">
                            {member.role}
                          </p>
                          {getAccessBadge(member.access_level)}
                        </td>
                        <td className="p-4">{getStatusBadge(member.status)}</td>
                        <td className="p-4 pr-6 text-right flex items-center justify-end gap-2">
                          {member.status === 'pending' && (
                            <button
                              onClick={() => handleResendInvite(member.id, member.email)}
                              disabled={actionInProgress === member.id}
                              className="p-2 text-slate-400 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-lg transition-colors disabled:opacity-50"
                              title="Kirim ulang undangan"
                            >
                              {actionInProgress === member.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <RotateCcw size={18} />
                              )}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              handleRevoke(
                                member.id,
                                member.name || member.email
                              )
                            }
                            disabled={actionInProgress === member.id}
                            className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 rounded-lg transition-colors disabled:opacity-50"
                            title="Cabut akses"
                          >
                            {actionInProgress === member.id ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Trash2 size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
