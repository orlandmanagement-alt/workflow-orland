// File: apps/apptalent/src/components/profile/ProfileRatesTab.tsx
import { DollarSign, TrendingUp, CheckCircle2 } from 'lucide-react';

interface ProfileRatesTabProps {
  data: {
    rate_daily_min?: number;
    rate_daily_max?: number;
    rate_hourly?: number;
    rate_project_based?: number;
    preferred_job_types?: string[];
  };
  onChange: (field: string, value: any) => void;
}

const JOB_TYPES = [
  { value: 'FILM', label: '🎬 Film / Drama' },
  { value: 'TVC', label: '📺 TVC / Commercial' },
  { value: 'MUSIC_VIDEO', label: '🎵 Music Video' },
  { value: 'HOSTING', label: '🎤 Hosting / MC' },
  { value: 'ENDORSEMENT', label: '⭐ Endorsement / Brand Ambassador' },
  { value: 'PHOTO_SHOOT', label: '📸 Photo Shoot' },
  { value: 'MODELING', label: '👗 Modeling' },
  { value: 'CONTENT_CREATION', label: '📱 Content Creation' },
  { value: 'PODCAST', label: '🎧 Podcast / Voice Over' },
  { value: 'LIVE_EVENT', label: '🎪 Live Event / Performance' },
];

export default function ProfileRatesTab({
  data,
  onChange,
}: ProfileRatesTabProps) {
  const handleToggleJobType = (jobType: string) => {
    const current = data.preferred_job_types || [];
    const updated = current.includes(jobType)
      ? current.filter((j) => j !== jobType)
      : [...current, jobType];
    onChange('preferred_job_types', updated);
  };

  const formatCurrency = (value: number | undefined): string => {
    if (!value) return '—';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="space-y-8">
      {/* Rate Card */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 space-y-6">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <DollarSign size={20} className="text-amber-400" /> Skala Tarif
        </h3>

        {/* Daily Rate */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Tarif Harian (Min)</label>
            <input
              type="number"
              value={data.rate_daily_min || ''}
              onChange={(e) =>
                onChange('rate_daily_min', e.target.value ? parseInt(e.target.value) : null)
              }
              placeholder="5000000"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1">IDR</p>
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-300 mb-2">Tarif Harian (Max)</label>
            <input
              type="number"
              value={data.rate_daily_max || ''}
              onChange={(e) =>
                onChange('rate_daily_max', e.target.value ? parseInt(e.target.value) : null)
              }
              placeholder="10000000"
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <p className="text-xs text-slate-500 mt-1">IDR</p>
          </div>
        </div>

        {/* Display Current Range */}
        {data.rate_daily_min || data.rate_daily_max ? (
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-700">
            <p className="text-xs text-slate-400 mb-1">Kisaran Tarif Harian Anda:</p>
            <p className="text-lg font-bold text-amber-400">
              {formatCurrency(data.rate_daily_min)} - {formatCurrency(data.rate_daily_max)}
            </p>
          </div>
        ) : null}

        {/* Info */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <p className="text-xs text-slate-300">
            💡 Tarif harian adalah estimasi untuk project 1 hari kerja. Klien dapat melakukan negotiasi.
          </p>
        </div>
      </div>

      {/* Preferred Job Types */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700 space-y-4">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={20} className="text-purple-400" /> Jenis Project yang Diminati
        </h3>

        <p className="text-sm text-slate-400">
          Pilih jenis project yang ingin Anda kerjakan. Ini membantu klien menemukan Anda.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {JOB_TYPES.map((jobType) => {
            const isSelected = (data.preferred_job_types || []).includes(jobType.value);
            return (
              <button
                key={jobType.value}
                onClick={() => handleToggleJobType(jobType.value)}
                className={`p-3 rounded-lg border-2 text-left font-bold transition-all ${
                  isSelected
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-2">
                  {isSelected && <CheckCircle2 size={16} />}
                  <span className="text-sm">{jobType.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
          <p className="text-xs text-slate-300">
            ✅ Terpilih: {data.preferred_job_types?.length || 0} jenis project
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-4">
        <p className="text-xs text-slate-300 space-y-2">
          <p>💡 Tips untuk Pricing:</p>
          <ul className="text-xs text-slate-400 list-disc list-inside">
            <li>Riset tarif talent sejenis di industri</li>
            <li>Pertimbangkan pengalaman, portfolio, dan demand Anda</li>
            <li>Lebih tinggi rating profile → Anda bisa set lebih tinggi</li>
            <li>Tarif biso berubah sesuai pengalaman dan portfolio</li>
          </ul>
        </p>
      </div>

      {/* Payment Terms */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <h3 className="text-sm font-bold text-slate-300 mb-3">📋 Catatan Umum</h3>
        <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside">
          <li>Tarif di atas adalah estimasi. Klien akan melakukan negosiasi.</li>
          <li>Pembayaran biasanya dibagi: 50% di awal, 50% setelah selesai.</li>
          <li>Ada biaya admin 10% untuk setiap transaksi melalui platform.</li>
          <li>Untuk project besar, Anda bisa negotiate term pembayaran khusus.</li>
        </ul>
      </div>
    </div>
  );
}
