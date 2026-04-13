// File: apps/apptalent/src/components/profile/ProfileExperienceTab.tsx
import { useState, useEffect } from 'react';
import { Plus, Trash2, Briefcase, Calendar } from 'lucide-react';

interface Experience {
  id: string;
  job_title: string;
  client_name: string;
  year_start: number;
  year_end?: number;
  still_active?: boolean;
  description?: string;
}

interface ProfileExperienceTabProps {
  data: {
    experiences?: Experience[];
  };
  onChange: (field: string, value: any) => void;
}

export default function ProfileExperienceTab({
  data,
  onChange,
}: ProfileExperienceTabProps) {
  const [experiences, setExperiences] = useState<Experience[]>(data.experiences || []);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Experience>>({
    still_active: true,
  });

  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 30 }, (_, i) => currentYear - i);

  const handleAddExperience = () => {
    if (!formData.job_title?.trim() || !formData.client_name?.trim()) {
      return;
    }

    const newExperience: Experience = {
      id: `exp-${Date.now()}`,
      job_title: formData.job_title,
      client_name: formData.client_name,
      year_start: formData.year_start || currentYear,
      year_end: formData.still_active ? undefined : formData.year_end,
      still_active: formData.still_active || false,
      description: formData.description,
    };

    const updated = [newExperience, ...experiences];
    setExperiences(updated);
    onChange('experiences', updated);

    // Reset form
    setFormData({ still_active: true });
    setShowForm(false);
  };

  const handleRemoveExperience = (id: string) => {
    const updated = experiences.filter((e) => e.id !== id);
    setExperiences(updated);
    onChange('experiences', updated);
  };

  const handleUpdateExperience = (id: string, field: string, value: any) => {
    const updated = experiences.map((e) =>
      e.id === id ? { ...e, [field]: value } : e
    );
    setExperiences(updated);
    onChange('experiences', updated);
  };

  return (
    <div className="space-y-6">
      {/* Add Experience Form */}
      {showForm && (
        <div className="bg-slate-800/50 rounded-xl p-6 border-2 border-blue-500/50 space-y-4">
          <h3 className="text-lg font-bold text-white mb-4">Tambah Pengalaman Kerja</h3>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Posisi / Job Title</label>
            <input
              type="text"
              value={formData.job_title || ''}
              onChange={(e) => setFormData({ ...formData, job_title: e.target.value })}
              placeholder="Misal: Lead Talent, VJ, Influencer..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Klien / Perusahaan / Brand
            </label>
            <input
              type="text"
              value={formData.client_name || ''}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              placeholder="Misal: RCTI, Metro TV, Indosiar, PT. ABC..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-2">Tahun Mulai</label>
              <select
                value={formData.year_start || currentYear}
                onChange={(e) =>
                  setFormData({ ...formData, year_start: parseInt(e.target.value) })
                }
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 1rem center',
                  paddingRight: '2.5rem',
                }}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {!formData.still_active && (
              <div>
                <label className="block text-sm font-bold text-slate-300 mb-2">Tahun Selesai</label>
                <select
                  value={formData.year_end || currentYear}
                  onChange={(e) =>
                    setFormData({ ...formData, year_end: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 appearance-none"
                  style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 1rem center',
                    paddingRight: '2.5rem',
                  }}
                >
                  {yearOptions.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.still_active || false}
                onChange={(e) =>
                  setFormData({ ...formData, still_active: e.target.checked })
                }
                className="w-4 h-4 rounded border-slate-600 text-blue-600 cursor-pointer"
              />
              <span className="text-sm font-bold text-slate-300">Masih aktif di posisi ini</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">
              Deskripsi / Catatan (Opsional)
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detail peran, project utama, achievement..."
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => {
                setShowForm(false);
                setFormData({ still_active: true });
              }}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold transition-colors"
            >
              Batal
            </button>
            <button
              onClick={handleAddExperience}
              disabled={!formData.job_title?.trim() || !formData.client_name?.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg font-bold transition-colors"
            >
              Simpan
            </button>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
        >
          <Plus size={18} /> Tambah Pengalaman Kerja
        </button>
      )}

      {/* Experiences List */}
      <div className="space-y-4">
        {experiences.length === 0 && !showForm && (
          <div className="text-center py-8 bg-slate-900/50 rounded-lg border border-slate-700 border-dashed">
            <Briefcase className="mx-auto text-slate-500 mb-2" size={32} />
            <p className="text-slate-400 text-sm">
              Belum ada pengalaman kerja. Tambahkan pengalaman Anda.
            </p>
          </div>
        )}

        {experiences.map((exp, index) => (
          <div
            key={exp.id}
            className="bg-slate-800/30 rounded-xl p-5 border border-slate-700 space-y-3"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h4 className="text-lg font-bold text-white">{exp.job_title}</h4>
                <p className="text-sm text-slate-300">{exp.client_name}</p>
              </div>
              <button
                onClick={() => handleRemoveExperience(exp.id)}
                className="text-red-400 hover:text-red-300 transition-colors p-2"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Years */}
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar size={14} />
              {exp.year_start} - {exp.still_active ? 'Sekarang' : exp.year_end}
              {exp.still_active && (
                <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold">
                  Aktif
                </span>
              )}
            </div>

            {/* Description */}
            {exp.description && (
              <p className="text-sm text-slate-300 leading-relaxed">{exp.description}</p>
            )}

            {/* Edit Fields - Inline */}
            <div className="pt-2 space-y-2 border-t border-slate-700">
              <div className="text-xs text-slate-400">
                Untuk mengubah, gunakan panel admin atau hubungi support
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-xs text-slate-300 space-y-2">
          <p>💡 Pengalaman kerja yang lengkap meningkatkan kredibilitas dan peluang job match:</p>
          <ul className="text-xs text-slate-400 list-disc list-inside">
            <li>Cantumkan job title dan klien/brand dengan jelas</li>
            <li>Tambahkan deskripsi singkat tentang peran dan achievement</li>
            <li>Urutkan dari paling baru ke paling lama</li>
          </ul>
        </p>
      </div>
    </div>
  );
}
