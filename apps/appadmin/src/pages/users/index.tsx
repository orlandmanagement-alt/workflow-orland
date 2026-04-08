import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

export default function MasterUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/users?search=${search}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('admin_token')}` } // Sesuaikan dengan sistem Auth SSO Anda
      });
      const json = await res.json();
      if (json.status === 'success') {
        setUsers(json.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Delay sedikit untuk mencegah spam fetch saat mengetik pencarian (Debouncing sederhana)
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const updateUserStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Yakin ingin mengubah status user ini menjadi ${newStatus}?`)) return;
    
    try {
      const res = await fetch(`/api/v1/admin/users/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const json = await res.json();
      if (json.status === 'success') {
        alert(json.message);
        fetchUsers(); // Refresh tabel setelah update
      } else {
        alert(json.message || 'Gagal mengubah status');
      }
    } catch (error) {
      alert('Terjadi kesalahan jaringan');
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Master Users</h1>
          <p className="text-gray-500 mt-1">Kelola seluruh pengguna (Talent, Klien, Admin) dalam platform.</p>
        </div>
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Cari email atau role..."
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Memuat data...</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email Akun</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tgl Terdaftar</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 
                      user.status === 'suspended' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    {user.status !== 'suspended' && (
                      <button onClick={() => updateUserStatus(user.id, 'suspended')} className="text-yellow-600 hover:text-yellow-900">Suspend</button>
                    )}
                    {user.status !== 'active' && (
                      <button onClick={() => updateUserStatus(user.id, 'active')} className="text-green-600 hover:text-green-900">Aktifkan</button>
                    )}
                    {user.status !== 'banned' && (
                      <button onClick={() => updateUserStatus(user.id, 'banned')} className="text-red-600 hover:text-red-900">Banned</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}