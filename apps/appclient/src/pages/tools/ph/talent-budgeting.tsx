import { useState } from 'react';
import {
  BarChart3,
  Plus,
  Trash2,
  DollarSign,
  Users,
  Calculator,
  Download,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface BudgetRole {
  id: string;
  roleName: string;
  quantity: number;
  budgetPerTalent: number;
  subtotal: number;
}

const FALLBACK_ROLES: BudgetRole[] = [
  {
    id: 'r1',
    roleName: 'Lead Talent',
    quantity: 1,
    budgetPerTalent: 50000000,
    subtotal: 50000000,
  },
  {
    id: 'r2',
    roleName: 'Supporting Talent',
    quantity: 2,
    budgetPerTalent: 25000000,
    subtotal: 50000000,
  },
  {
    id: 'r3',
    roleName: 'Extras',
    quantity: 5,
    budgetPerTalent: 2000000,
    subtotal: 10000000,
  },
];

export default function TalentBudgeting() {
  const [roles, setRoles] = useState<BudgetRole[]>(FALLBACK_ROLES);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleQty, setNewRoleQty] = useState(1);
  const [newRoleBudget, setNewRoleBudget] = useState(10000000);
  const [isExporting, setIsExporting] = useState(false);

  const handleAddRole = () => {
    if (!newRoleName || newRoleQty <= 0 || newRoleBudget <= 0) return;

    const subtotal = newRoleQty * newRoleBudget;
    const newRole: BudgetRole = {
      id: `r${Date.now()}`,
      roleName: newRoleName,
      quantity: newRoleQty,
      budgetPerTalent: newRoleBudget,
      subtotal,
    };

    setRoles([...roles, newRole]);
    setNewRoleName('');
    setNewRoleQty(1);
    setNewRoleBudget(10000000);
    setIsAddingRole(false);
  };

  const handleDeleteRole = (id: string) => {
    setRoles(roles.filter((r) => r.id !== id));
  };

  const handleUpdateRole = (
    id: string,
    field: keyof BudgetRole,
    value: any
  ) => {
    const updatedRoles = roles.map((role) => {
      if (role.id === id) {
        const updated = { ...role, [field]: value };
        // Recalculate subtotal
        if (field === 'quantity' || field === 'budgetPerTalent') {
          updated.subtotal = updated.quantity * updated.budgetPerTalent;
        }
        return updated;
      }
      return role;
    });
    setRoles(updatedRoles);
  };

  const totalBudget = roles.reduce((sum, role) => sum + role.subtotal, 0);
  const totalTalents = roles.reduce((sum, role) => sum + role.quantity, 0);

  const handleExportCSV = () => {
    setIsExporting(true);
    
    // Create CSV content
    const headers = ['Role', 'Quantity', 'Budget per Talent', 'Subtotal'];
    const rows = roles.map((role) => [
      role.roleName,
      role.quantity,
      `Rp ${role.budgetPerTalent.toLocaleString('id-ID')}`,
      `Rp ${role.subtotal.toLocaleString('id-ID')}`,
    ]);
    const footerRow = [
      'TOTAL',
      totalTalents,
      '',
      `Rp ${totalBudget.toLocaleString('id-ID')}`,
    ];

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
      footerRow.join(','),
    ]
      .join('\n');

    // Download
    const link = document.createElement('a');
    link.href = `data:text/csv;charset=utf-8,${encodeURIComponent(csvContent)}`;
    link.download = `talent-budget-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    setTimeout(() => setIsExporting(false), 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-5xl mx-auto px-4 sm:px-6 mt-6 pb-20">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
          <BarChart3 className="text-amber-500" size={36} /> Talent Budgeting
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-2xl">
          Rancang breakdown budget talent per role. Sistem otomatis menghitung
          total biaya dan membantu Anda merencanakan anggaran proyek.
        </p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/10 dark:from-amber-500/20 dark:to-amber-600/20 p-6 rounded-2xl border border-amber-200 dark:border-amber-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Users className="text-amber-600 dark:text-amber-400" size={24} />
            <p className="text-xs font-bold text-slate-500 uppercase">
              Total Talent
            </p>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {totalTalents}
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 dark:from-blue-500/20 dark:to-blue-600/20 p-6 rounded-2xl border border-blue-200 dark:border-blue-500/30">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="text-blue-600 dark:text-blue-400" size={24} />
            <p className="text-xs font-bold text-slate-500 uppercase">
              Jumlah Role
            </p>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">
            {roles.length}
          </p>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 dark:from-emerald-500/20 dark:to-emerald-600/20 p-6 rounded-2xl border border-emerald-200 dark:border-emerald-500/30">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="text-emerald-600 dark:text-emerald-400" size={24} />
            <p className="text-xs font-bold text-slate-500 uppercase">
              Total Budget
            </p>
          </div>
          <p className="text-2xl font-black text-slate-900 dark:text-white">
            Rp {totalBudget.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-500/5 dark:to-transparent flex justify-between items-center">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator size={18} className="text-amber-500" /> Breakdown Budget
            Talent
          </h2>
          <button
            onClick={handleExportCSV}
            disabled={isExporting || roles.length === 0}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download size={16} /> Export CSV
              </>
            )}
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <th className="p-4 pl-6">Role / Karakter</th>
                <th className="p-4">Quantity</th>
                <th className="p-4">Budget per Talent</th>
                <th className="p-4">Subtotal</th>
                <th className="p-4 pr-6 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {roles.map((role) => (
                <tr
                  key={role.id}
                  className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  <td className="p-4 pl-6">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {role.roleName}
                    </p>
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      min="1"
                      value={role.quantity}
                      onChange={(e) =>
                        handleUpdateRole(
                          role.id,
                          'quantity',
                          parseInt(e.target.value)
                        )
                      }
                      className="w-20 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold outline-none dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="relative flex items-center">
                      <span className="text-xs font-bold text-slate-500 pr-2">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={role.budgetPerTalent}
                        onChange={(e) =>
                          handleUpdateRole(
                            role.id,
                            'budgetPerTalent',
                            parseInt(e.target.value)
                          )
                        }
                        className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold outline-none dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      Rp {role.subtotal.toLocaleString('id-ID')}
                    </p>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <button
                      onClick={() => handleDeleteRole(role.id)}
                      className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-900/20 dark:hover:text-rose-400 rounded-lg transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}

              {/* Add Role Row */}
              {isAddingRole ? (
                <tr className="bg-amber-50/50 dark:bg-amber-900/10">
                  <td className="p-4 pl-6">
                    <input
                      type="text"
                      required
                      value={newRoleName}
                      onChange={(e) => setNewRoleName(e.target.value)}
                      placeholder="e.g., Lead Talent"
                      className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </td>
                  <td className="p-4">
                    <input
                      type="number"
                      min="1"
                      value={newRoleQty}
                      onChange={(e) => setNewRoleQty(parseInt(e.target.value))}
                      className="w-20 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white focus:ring-2 focus:ring-amber-500"
                    />
                  </td>
                  <td className="p-4">
                    <div className="relative flex items-center">
                      <span className="text-xs font-bold text-slate-500 pr-2">
                        Rp
                      </span>
                      <input
                        type="number"
                        min="0"
                        value={newRoleBudget}
                        onChange={(e) =>
                          setNewRoleBudget(parseInt(e.target.value))
                        }
                        className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none dark:text-white focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </td>
                  <td className="p-4">
                    <p className="font-bold text-slate-900 dark:text-white text-sm">
                      Rp {(newRoleQty * newRoleBudget).toLocaleString('id-ID')}
                    </p>
                  </td>
                  <td className="p-4 pr-6 text-right flex gap-2 justify-end">
                    <button
                      onClick={handleAddRole}
                      disabled={!newRoleName}
                      className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-bold disabled:opacity-50"
                    >
                      ✓ Save
                    </button>
                    <button
                      onClick={() => setIsAddingRole(false)}
                      className="px-3 py-1 bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg text-sm font-bold"
                    >
                      ✕ Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={5} className="p-4">
                    <button
                      onClick={() => setIsAddingRole(true)}
                      className="w-full py-3 border-2 border-dashed border-amber-300 dark:border-amber-700 rounded-xl font-semibold text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus size={18} /> Tambah Role Baru
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div>
            <p className="text-xs text-slate-500 uppercase font-bold">
              GRAND TOTAL
            </p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">
              Rp {totalBudget.toLocaleString('id-ID')}
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-500 uppercase font-bold">
              Average per Talent
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              Rp{' '}
              {totalTalents > 0
                ? Math.round(totalBudget / totalTalents).toLocaleString(
                    'id-ID'
                  )
                : '0'}
            </p>
          </div>
        </div>
      </div>

      {/* INFO BOX */}
      <div className="p-4 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 rounded-2xl flex gap-3">
        <AlertCircle className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-blue-700 dark:text-blue-300">
          <p className="font-semibold">💡 Tips</p>
          <p className="mt-1">
            Gunakan breakdown ini untuk negosiasi talent fee dan perencanaan
            distribusi budget. Export CSV untuk share dengan tim finance.
          </p>
        </div>
      </div>
    </div>
  );
}
