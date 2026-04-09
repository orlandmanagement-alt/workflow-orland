import React, { useState, useEffect } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Trash2, Lock, Unlock, RotateCcw, AlertCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  phone?: string;
  name?: string;
  role: 'talent' | 'client' | 'admin' | 'agency' | 'super_admin';
  status: 'active' | 'suspended' | 'deleted' | 'pending';
  created_at: string;
  updated_at?: string;
  last_login?: string;
}

interface ApiResponse {
  status: 'success' | 'error';
  data?: User[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasMore: boolean;
  };
  message?: string;
}

const STATUS_COLORS: Record<User['status'], { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Aktif' },
  suspended: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Ditangguhkan' },
  deleted: { bg: 'bg-red-100', text: 'text-red-800', label: 'Dihapus' },
  pending: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pending' }
};

const ROLE_COLORS: Record<User['role'], string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-indigo-100 text-indigo-800',
  agency: 'bg-cyan-100 text-cyan-800',
  talent: 'bg-emerald-100 text-emerald-800',
  client: 'bg-sky-100 text-sky-800'
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState<any>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [actionInProgress, setActionInProgress] = useState<{userId: string; action: string} | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch users with filters
  const fetchUsers = async (page = 1) => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageLimit.toString(),
        ...(search && { search }),
        ...(statusFilter && { status: statusFilter }),
        ...(roleFilter && { role: roleFilter })
      });

      const res = await fetch(`/api/v1/admin/users?${params}`, {
        credentials: 'include'
      });
      
      const json: ApiResponse = await res.json();
      
      if (res.ok && json.status === 'success') {
        setUsers(json.data || []);
        setPagination(json.pagination);
        setCurrentPage(page);
        setSelectedUsers(new Set());
      } else {
        setError(json.message || 'Gagal memuat data pengguna');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Terjadi kesalahan jaringan saat memuat data');
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers(1);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search, statusFilter, roleFilter, pageLimit]);

  // Change user status
  const changeUserStatus = async (userId: string, newStatus: 'active' | 'suspended' | 'deleted') => {
    if (userId === localStorage.getItem('admin_id')) {
      setError('Tidak dapat mengubah status akun Anda sendiri');
      return;
    }

    if (!confirm(`Yakin ingin mengubah status user menjadi ${STATUS_COLORS[newStatus].label}?`)) return;

    setActionInProgress({ userId, action: newStatus });
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus, reason: 'Admin action' })
      });

      const json = await res.json();
      
      if (res.ok && json.status === 'success') {
        setSuccessMessage(json.message || `Status berhasil diubah ke ${newStatus}`);
        setTimeout(() => setSuccessMessage(''), 3000);
        fetchUsers(currentPage);
      } else {
        setError(json.message || 'Gagal mengubah status');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat mengubah status user');
    } finally {
      setActionInProgress(null);
    }
  };

  // Reset password
  const resetPassword = async (userId: string) => {
    if (!confirm('Yakin ingin mengirim permintaan reset password ke user ini?')) return;

    setActionInProgress({ userId, action: 'reset_password' });
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}/password/reset`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });

      const json = await res.json();
      
      if (res.ok && json.status === 'success') {
        setSuccessMessage('Reset password link telah dikirim');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(json.message || 'Gagal mengirim reset password');
      }
    } catch (error) {
      setError('Terjadi kesalahan saat reset password');
    } finally {
      setActionInProgress(null);
    }
  };

  const toggleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const selectAllOnPage = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map(u => u.id)));
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Manajemen Pengguna</h1>
        <p className="text-gray-600 mt-2">Kelola semua pengguna platform (Talent, Klien, Agency, Admin)</p>
      </div>

      {/* Alerts */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-900">Kesalahan</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          ✓ {successMessage}
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Cari Email, Nama, atau Phone</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari pengguna..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="suspended">Ditangguhkan</option>
              <option value="deleted">Dihapus</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              <option value="">Semua Role</option>
              <option value="super_admin">Super Admin</option>
              <option value="admin">Admin</option>
              <option value="agency">Agency</option>
              <option value="talent">Talent</option>
              <option value="client">Client</option>
            </select>
          </div>
        </div>

        {/* Items per page */}
        <div className="mt-4 flex items-center gap-4">
          <span className="text-sm text-gray-600">Tampilkan per halaman:</span>
          <select
            value={pageLimit}
            onChange={(e) => setPageLimit(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  checked={selectedUsers.size === users.length && users.length > 0}
                  onChange={selectAllOnPage}
                  className="rounded border-gray-300"
                />
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terdaftar</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                  </div>
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  Tidak ada pengguna yang ditemukan
                </td>
              </tr>
            ) : (
              users.map((user) => {
                const isLoading = actionInProgress?.userId === user.id;
                const statusColor = STATUS_COLORS[user.status];
                const roleColor = ROLE_COLORS[user.role];

                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedUsers.has(user.id)}
                        onChange={() => toggleSelectUser(user.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.email}</div>
                      {user.phone && <div className="text-xs text-gray-500">{user.phone}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {user.name || '—'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${roleColor}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColor.bg} ${statusColor.text}`}>
                        {statusColor.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(user.created_at).toLocaleDateString('id-ID', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        {user.status === 'active' ? (
                          <button
                            onClick={() => changeUserStatus(user.id, 'suspended')}
                            disabled={isLoading}
                            className="text-gray-600 hover:text-yellow-600 disabled:opacity-50"
                            title="Suspend user"
                          >
                            <Lock className="w-4 h-4" />
                          </button>
                        ) : user.status === 'suspended' ? (
                          <button
                            onClick={() => changeUserStatus(user.id, 'active')}
                            disabled={isLoading}
                            className="text-gray-600 hover:text-green-600 disabled:opacity-50"
                            title="Activate user"
                          >
                            <Unlock className="w-4 h-4" />
                          </button>
                        ) : null}

                        <button
                          onClick={() => resetPassword(user.id)}
                          disabled={isLoading}
                          className="text-gray-600 hover:text-blue-600 disabled:opacity-50"
                          title="Reset password"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        {user.status !== 'deleted' && (
                          <button
                            onClick={() => changeUserStatus(user.id, 'deleted')}
                            disabled={isLoading}
                            className="text-gray-600 hover:text-red-600 disabled:opacity-50"
                            title="Delete user"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Menampilkan <span className="font-medium">{(currentPage - 1) * pageLimit + 1}</span> hingga{' '}
            <span className="font-medium">
              {Math.min(currentPage * pageLimit, pagination.total)}
            </span>{' '}
            dari <span className="font-medium">{pagination.total}</span> pengguna
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => fetchUsers(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === pagination.totalPages || Math.abs(p - currentPage) <= 1)
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {idx > 0 && arr[idx - 1] !== page - 1 && <span className="px-1">...</span>}
                    <button
                      onClick={() => fetchUsers(page)}
                      className={`px-3 py-2 rounded-lg ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            <button
              onClick={() => fetchUsers(currentPage + 1)}
              disabled={currentPage === pagination.totalPages}
              className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}