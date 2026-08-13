import { useState } from 'react';
import {
  Users,
  Plus,
  Trash2,
  FileUp,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  Download,
  Filter,
  Mail,
} from 'lucide-react';

interface Guest {
  id: string;
  name: string;
  email: string;
  phone?: string;
  rsvpStatus: 'invited' | 'confirmed' | 'declined' | 'pending';
  dietaryNeeds?: string;
  specialRequests?: string;
  invitedDate: string;
  responseDate?: string;
}

const FALLBACK_GUESTS: Guest[] = [
  {
    id: 'g1',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    phone: '+62821234567',
    rsvpStatus: 'confirmed',
    dietaryNeeds: 'Vegetarian',
    invitedDate: '2026-04-01',
    responseDate: '2026-04-02',
  },
  {
    id: 'g2',
    name: 'Siti Nurhaliza',
    email: 'siti@example.com',
    phone: '+62812345678',
    rsvpStatus: 'pending',
    invitedDate: '2026-04-01',
  },
  {
    id: 'g3',
    name: 'Andi Wijaya',
    email: 'andi@example.com',
    rsvpStatus: 'declined',
    invitedDate: '2026-04-01',
    responseDate: '2026-04-03',
  },
];

export default function GuestManagement() {
  const [guests, setGuests] = useState<Guest[]>(FALLBACK_GUESTS);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestEmail, setNewGuestEmail] = useState('');
  const [newGuestPhone, setNewGuestPhone] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const filteredGuests = filterStatus
    ? guests.filter((g) => g.rsvpStatus === filterStatus)
    : guests;

  const stats = {
    total: guests.length,
    confirmed: guests.filter((g) => g.rsvpStatus === 'confirmed').length,
    pending: guests.filter((g) => g.rsvpStatus === 'pending').length,
    declined: guests.filter((g) => g.rsvpStatus === 'declined').length,
  };

  const handleAddGuest = () => {
    if (!newGuestName || !newGuestEmail) return;

    const newGuest: Guest = {
      id: `g${Date.now()}`,
      name: newGuestName,
      email: newGuestEmail,
      phone: newGuestPhone || undefined,
      rsvpStatus: 'invited',
      invitedDate: new Date().toISOString().split('T')[0],
    };

    setGuests([...guests, newGuest]);
    setNewGuestName('');
    setNewGuestEmail('');
    setNewGuestPhone('');
    setIsAddingGuest(false);
  };

  const handleUpdateRSVP = (
    guestId: string,
    status: 'confirmed' | 'declined' | 'pending'
  ) => {
    const updatedGuests = guests.map((guest) => {
      if (guest.id === guestId) {
        return {
          ...guest,
          rsvpStatus: status,
          responseDate: new Date().toISOString().split('T')[0],
        };
      }
      return guest;
    });
    setGuests(updatedGuests);
  };

  const handleDeleteGuest = (guestId: string) => {
    setGuests(guests.filter((g) => g.id !== guestId));
  };

  const handleExportCSV = () => {
    setIsExporting(true);

    const headers = ['Name', 'Email', 'Phone', 'RSVP Status', 'Dietary Needs'];
    const rows = filteredGuests.map((g) => [
      g.name,
      g.email,
      g.phone || '-',
      g.rsvpStatus.toUpperCase(),
      g.dietaryNeeds || '-',
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    link.download = `guest-list-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    setTimeout(() => setIsExporting(false), 1000);
  };

  const getRSVPBadge = (status: string) => {
    const badgeMap: Record<string, { bg: string; text: string; label: string }> = {
      confirmed: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        label: 'Confirmed',
      },
      pending: {
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
        text: 'text-yellow-700 dark:text-yellow-400',
        label: 'Pending',
      },
      declined: {
        bg: 'bg-rose-100 dark:bg-rose-900/30',
        text: 'text-rose-700 dark:text-rose-400',
        label: 'Declined',
      },
      invited: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        label: 'Invited',
      },
    };

    const badge = badgeMap[status] || badgeMap.pending;

    return (
      <span
        className={`inline-flex items-center text-[10px] font-bold px-2 py-1 rounded border ${badge.bg} ${badge.text}`}
      >
        {badge.label}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-6xl mx-auto px-4 sm:px-6 mt-6 pb-20">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
          <Users className="text-amber-500" size={36} /> Guest Management
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
          Kelola daftar undangan untuk event Anda. Track RSVP status, kebutuhan diet,
          dan permintaan khusus dari setiap guest.
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-dark-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
          <p className="text-xs font-bold text-slate-500 uppercase">Total Guest</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
            {stats.total}
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800">
          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
            Confirmed
          </p>
          <p className="text-3xl font-black text-emerald-700 dark:text-emerald-300 mt-1">
            {stats.confirmed}
          </p>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-2xl border border-yellow-200 dark:border-yellow-800">
          <p className="text-xs font-bold text-yellow-600 dark:text-yellow-400 uppercase">
            Pending
          </p>
          <p className="text-3xl font-black text-yellow-700 dark:text-yellow-300 mt-1">
            {stats.pending}
          </p>
        </div>
        <div className="bg-rose-50 dark:bg-rose-900/20 p-4 rounded-2xl border border-rose-200 dark:border-rose-800">
          <p className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase">
            Declined
          </p>
          <p className="text-3xl font-black text-rose-700 dark:text-rose-300 mt-1">
            {stats.declined}
          </p>
        </div>
      </div>

      {/* CONTROLS */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setFilterStatus(null)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              filterStatus === null
                ? 'bg-amber-500 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All
          </button>
          {['invited', 'confirmed', 'pending', 'declined'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
                filterStatus === status
                  ? 'bg-amber-500 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportCSV}
            disabled={isExporting || guests.length === 0}
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
              </>
            ) : (
              <>
                <Download size={16} /> Export CSV
              </>
            )}
          </button>
          <button
            onClick={() => setIsAddingGuest(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:to-amber-700 text-white rounded-lg text-sm font-semibold flex items-center gap-2"
          >
            <Plus size={16} /> Add Guest
          </button>
        </div>
      </div>

      {/* GUEST LIST TABLE */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-500/5 dark:to-transparent">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Filter size={18} className="text-amber-500" /> Daftar Undangan ({filteredGuests.length})
          </h2>
        </div>

        {/* Content */}
        {filteredGuests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Users className="mb-3 opacity-30" size={48} />
            <p className="font-semibold">Belum ada guest</p>
            <p className="text-sm">Mulai dengan menambahkan guest pertama</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                  <th className="p-4 pl-6">Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone</th>
                  <th className="p-4">RSVP Status</th>
                  <th className="p-4">Dietary / Requests</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredGuests.map((guest) => (
                  <tr
                    key={guest.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 pl-6">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {guest.name}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <Mail size={14} /> {guest.email}
                      </p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {guest.phone || '-'}
                      </p>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-1">
                        {guest.rsvpStatus === 'pending' && (
                          <>
                            <button
                              onClick={() =>
                                handleUpdateRSVP(guest.id, 'confirmed')
                              }
                              className="px-2 py-1 text-[10px] font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded"
                            >
                              ✓ Yes
                            </button>
                            <button
                              onClick={() =>
                                handleUpdateRSVP(guest.id, 'declined')
                              }
                              className="px-2 py-1 text-[10px] font-bold bg-rose-500 hover:bg-rose-600 text-white rounded"
                            >
                              ✕ No
                            </button>
                          </>
                        )}
                        {guest.rsvpStatus !== 'pending' && (
                          getRSVPBadge(guest.rsvpStatus)
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {guest.dietaryNeeds && (
                          <span className="inline-block bg-yellow-100 dark:bg-yellow-900/20 px-2 py-1 rounded text-xs mr-1">
                            {guest.dietaryNeeds}
                          </span>
                        )}
                        {guest.specialRequests && (
                          <span className="text-xs italic">
                            {guest.specialRequests}
                          </span>
                        )}
                      </p>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => handleDeleteGuest(guest.id)}
                        className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD GUEST FORM */}
      {isAddingGuest && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-300 dark:border-amber-700 p-6 rounded-2xl">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <Plus size={18} className="text-amber-500" /> Add New Guest
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              required
              value={newGuestName}
              onChange={(e) => setNewGuestName(e.target.value)}
              placeholder="Full Name"
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="email"
              required
              value={newGuestEmail}
              onChange={(e) => setNewGuestEmail(e.target.value)}
              placeholder="Email"
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white focus:ring-2 focus:ring-amber-500"
            />
            <input
              type="tel"
              value={newGuestPhone}
              onChange={(e) => setNewGuestPhone(e.target.value)}
              placeholder="Phone (optional)"
              className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none dark:text-white focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="mt-4 flex gap-2 justify-end">
            <button
              onClick={handleAddGuest}
              disabled={!newGuestName || !newGuestEmail}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold rounded-lg"
            >
              ✓ Save
            </button>
            <button
              onClick={() => setIsAddingGuest(false)}
              className="px-6 py-2 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-bold rounded-lg"
            >
              ✕ Cancel
            </button>
          </div>
        </div>
      )}

      {/* INFO BOX */}
      <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl flex gap-3">
        <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0" size={20} />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-semibold">💡 Tips Manajemen Guest</p>
          <p className="mt-1">
            Kirim reminder ke pending guest sebelum event. Track dietary needs dan
            special requests untuk catering dan setup. Export CSV untuk koordinasi dengan
            vendor.
          </p>
        </div>
      </div>
    </div>
  );
}
