import { useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiRequest } from '../lib/api';

interface TalentFormData {
  name: string;
  email: string;
  category: string;
  location: string;
  bio: string;
  minimumRate: number;
  maximumRate: number;
  status: 'active' | 'pending' | 'archived';
}

const initialForm: TalentFormData = {
  name: '',
  email: '',
  category: 'content_creator',
  location: '',
  bio: '',
  minimumRate: 0,
  maximumRate: 0,
  status: 'pending',
};

const categories = [
  'content_creator',
  'influencer',
  'model',
  'actor',
  'musician',
  'photographer',
  'videographer',
  'other',
];

export default function TalentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const isCreateMode = !id || id === 'new';
  const [formData, setFormData] = useState<TalentFormData>(initialForm);
  const [loading, setLoading] = useState(!isCreateMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchTalent = async () => {
      if (isCreateMode || !id) return;

      setLoading(true);
      setError(null);
      try {
        const response = await apiRequest(`/agency/roster/${id}`);
        const payload = response?.data || response;

        setFormData({
          name: String(payload?.name || payload?.full_name || ''),
          email: String(payload?.email || ''),
          category: String(payload?.category || 'other'),
          location: String(payload?.location || ''),
          bio: String(payload?.bio || ''),
          minimumRate: Number(payload?.minimumRate || payload?.minimum_rate || 0),
          maximumRate: Number(payload?.maximumRate || payload?.maximum_rate || 0),
          status: (payload?.status as 'active' | 'pending' | 'archived') || 'pending',
        });
      } catch {
        setError('Gagal memuat detail talent dari API.');
      } finally {
        setLoading(false);
      }
    };

    fetchTalent();
  }, [id, isCreateMode]);

  const setField = <K extends keyof TalentFormData>(field: K, value: TalentFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      if (isCreateMode) {
        await apiRequest('/agency/roster', {
          method: 'POST',
          body: formData,
        });
        setSuccess('Talent baru berhasil dibuat.');
      } else if (id) {
        await apiRequest(`/agency/roster/${id}`, {
          method: 'PATCH',
          body: formData,
        });
        setSuccess('Perubahan talent berhasil disimpan.');
      }
      setTimeout(() => navigate('/roster'), 700);
    } catch {
      setError('Gagal menyimpan data talent.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">
            {isCreateMode ? 'Tambah Talent Baru' : 'Detail Talent'}
          </h1>
          <p className="mt-1 text-sm text-amber-500/80">
            {isCreateMode
              ? 'Buat data talent baru untuk roster agensi.'
              : 'Edit informasi inti talent tanpa mengubah alur SSO.'}
          </p>
        </div>
        <button
          onClick={() => navigate('/roster')}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-slate-900/70 px-3 py-2 text-sm font-semibold text-amber-200 hover:border-amber-400/60"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-8 text-center text-slate-200 backdrop-blur-xl">
          Memuat detail talent...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div>
          )}
          {success && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {success}
            </div>
          )}

          <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-black uppercase tracking-wide text-amber-400">Informasi Dasar</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-200">Nama Talent</label>
                <input
                  value={formData.name}
                  onChange={(e) => setField('name', e.target.value)}
                  required
                  className="w-full rounded-lg border border-amber-500/20 bg-[#071122] px-3 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-200">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setField('email', e.target.value)}
                  required
                  className="w-full rounded-lg border border-amber-500/20 bg-[#071122] px-3 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-200">Kategori</label>
                <select
                  value={formData.category}
                  onChange={(e) => setField('category', e.target.value)}
                  className="w-full rounded-lg border border-amber-500/20 bg-[#071122] px-3 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-200">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setField('status', e.target.value as 'active' | 'pending' | 'archived')}
                  className="w-full rounded-lg border border-amber-500/20 bg-[#071122] px-3 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
                >
                  <option value="active">active</option>
                  <option value="pending">pending</option>
                  <option value="archived">archived</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-200">Lokasi</label>
                <input
                  value={formData.location}
                  onChange={(e) => setField('location', e.target.value)}
                  placeholder="Jakarta, Indonesia"
                  className="w-full rounded-lg border border-amber-500/20 bg-[#071122] px-3 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-6 backdrop-blur-xl">
            <h2 className="mb-4 text-lg font-black uppercase tracking-wide text-amber-400">Rate Card Ringkas</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-200">Minimum Rate (IDR)</label>
                <input
                  type="number"
                  value={formData.minimumRate}
                  onChange={(e) => setField('minimumRate', Number(e.target.value))}
                  className="w-full rounded-lg border border-amber-500/20 bg-[#071122] px-3 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-200">Maximum Rate (IDR)</label>
                <input
                  type="number"
                  value={formData.maximumRate}
                  onChange={(e) => setField('maximumRate', Number(e.target.value))}
                  className="w-full rounded-lg border border-amber-500/20 bg-[#071122] px-3 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-6 backdrop-blur-xl">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-amber-200">Bio</label>
            <textarea
              rows={5}
              value={formData.bio}
              onChange={(e) => setField('bio', e.target.value)}
              placeholder="Tulis ringkasan profil talent"
              className="w-full rounded-lg border border-amber-500/20 bg-[#071122] px-3 py-2.5 text-sm text-white focus:border-amber-400/70 focus:outline-none"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/roster')}
              className="rounded-lg border border-amber-500/30 bg-slate-900/70 px-4 py-2 text-sm font-semibold text-amber-200"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500 px-4 py-2 text-sm font-black text-[#071122] hover:bg-amber-400 disabled:opacity-60"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Menyimpan...' : isCreateMode ? 'Simpan Talent' : 'Update Talent'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
