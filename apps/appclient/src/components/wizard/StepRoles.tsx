import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useProjectDraftStore, RoleDraft } from '@/store/useProjectDraftStore';
import { ArrowLeft, ArrowRight, Plus, Trash2, Users } from 'lucide-react';

export const StepRoles = () => {
  const { roles, addRole, removeRole, setStep } = useProjectDraftStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newRole, setNewRole] = useState<Partial<RoleDraft>>({
    role_name: '',
    quantity: 1,
    gender: 'Any',
    age_min: 18,
    age_max: 30
  });

  const handleAdd = () => {
    if (!newRole.role_name?.trim()) return;
    
    addRole({
      id: crypto.randomUUID(),
      role_name: newRole.role_name,
      quantity: newRole.quantity || 1,
      gender: newRole.gender as 'Male'|'Female'|'Any' || 'Any',
      age_min: newRole.age_min || 18,
      age_max: newRole.age_max || 99,
      budget: 0 // Will be filled in Step 4
    });
    
    setNewRole({ role_name: '', quantity: 1, gender: 'Any', age_min: 18, age_max: 30 });
    setIsAdding(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-3xl mx-auto space-y-8 pb-10"
    >
      <div className="text-center mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-2">Role Builder (Bundle)</h2>
        <p className="text-slate-500 dark:text-slate-400">Tambahkan jumlah target dan karakter yang Anda butuhkan ke dalam Keranjang Casting.</p>
      </div>

      <div className="space-y-4">
        {/* Render Saved Roles */}
        <AnimatePresence>
          {roles.map((role) => (
            <motion.div
              key={role.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-dark-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group overflow-hidden"
            >
              <div>
                <h4 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <span className="bg-brand-100 text-brand-700 text-xs px-2 py-0.5 rounded-md">x{role.quantity}</span>
                  {role.role_name}
                </h4>
                <p className="text-sm text-slate-500 mt-1">{role.gender} • Usia {role.age_min}-{role.age_max}th</p>
              </div>
              <button 
                onClick={() => removeRole(role.id)}
                className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all opacity-0 flex-shrink-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Inline Add Form */}
        {isAdding ? (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-brand-50/50 dark:bg-slate-800/80 p-6 rounded-3xl border border-brand-200 dark:border-slate-700 space-y-4 shadow-inner"
          >
            <div>
              <label className="block text-xs font-bold text-brand-800 dark:text-brand-300 mb-2 uppercase tracking-wider">Tipe Karakter / Pekerjaan *</label>
              <input 
                type="text" 
                value={newRole.role_name}
                onChange={e => setNewRole({...newRole, role_name: e.target.value})}
                placeholder="Misal: Pemeran Utama / Usher VVIP / SPG" 
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-brand-100 dark:border-slate-600 focus:ring-2 focus:ring-brand-500 outline-none text-sm font-bold dark:text-white"
              />
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Jumlah Orang</label>
                <input 
                  type="number" min="1" value={newRole.quantity}
                  onChange={e => setNewRole({...newRole, quantity: parseInt(e.target.value) || 1})}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm font-bold text-center dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Gender Focus</label>
                <select 
                  value={newRole.gender} 
                  onChange={e => setNewRole({...newRole, gender: e.target.value as any})}
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-sm dark:text-white"
                >
                  <option value="Any">Bebas (Any)</option>
                  <option value="Male">Pria</option>
                  <option value="Female">Wanita</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">Rentang Umur</label>
                <div className="flex items-center gap-1">
                  <input type="number" value={newRole.age_min} onChange={e => setNewRole({...newRole, age_min: parseInt(e.target.value)})} className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-center dark:text-white" />
                  <span className="text-slate-400">-</span>
                  <input type="number" value={newRole.age_max} onChange={e => setNewRole({...newRole, age_max: parseInt(e.target.value)})} className="w-full p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs text-center dark:text-white" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={() => setIsAdding(false)} className="px-5 py-2 text-slate-500 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-sm">Batal</button>
              <button 
                onClick={handleAdd} 
                disabled={!newRole.role_name?.trim()}
                className="px-6 py-2 bg-brand-600 text-white font-bold rounded-xl shadow-md disabled:opacity-50 hover:bg-brand-700 transition-colors text-sm"
              >
                + Tambah Role Ini
              </button>
            </div>
          </motion.div>
        ) : (
          <button 
            onClick={() => setIsAdding(true)}
            className="w-full py-6 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-3xl text-slate-500 dark:text-slate-400 hover:border-brand-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all flex flex-col items-center justify-center font-bold"
          >
            <Plus size={24} className="mb-2" />
            Tambah Kebutuhan Karakter / Pekerja
          </button>
        )}
      </div>

      <div className="flex justify-between pt-10">
        <button 
          onClick={() => setStep(2)}
          className="px-6 py-4 bg-transparent border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Kembali
        </button>
        <button 
          onClick={() => setStep(4)}
          disabled={roles.length === 0}
          className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2 group disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
        >
          Next: Budget & Checkout <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </motion.div>
  );
};
