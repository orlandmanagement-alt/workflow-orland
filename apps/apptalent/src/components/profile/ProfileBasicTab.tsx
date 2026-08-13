// File: apps/apptalent/src/components/profile/ProfileBasicTab.tsx
import { useState } from 'react';
import { User, Mail, MapPin, FileText } from 'lucide-react';
import { INDONESIAN_CITIES, formatDateForInput, calculateAge, formatDateID } from '@/lib/profileHelpers';

interface ProfileBasicTabProps {
  data: {
    full_name?: string;
    email?: string;
    domicile?: string;
    birth_date?: string;
    bio?: string;
  };
  onChange: (field: string, value: any) => void;
}

export default function ProfileBasicTab({ data, onChange }: ProfileBasicTabProps) {
  const [showAge, setShowAge] = useState(!!data.birth_date);
  const age = data.birth_date ? calculateAge(data.birth_date) : null;

  return (
    <div className="space-y-6">
      {/* Full Name */}
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
          <User size={16} /> Nama Lengkap
        </label>
        <input
          type="text"
          value={data.full_name || ''}
          onChange={(e) => onChange('full_name', e.target.value)}
          placeholder="Nama Lengkap Anda"
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
          <Mail size={16} /> Email
        </label>
        <input
          type="email"
          value={data.email || ''}
          onChange={(e) => onChange('email', e.target.value)}
          disabled
          className="w-full px-4 py-3 bg-slate-700/50 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed opacity-60"
        />
        <p className="text-xs text-slate-500 mt-1">Email tidak bisa diubah (dari akun SSO)</p>
      </div>

      {/* Domisili - Select Dropdown */}
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
          <MapPin size={16} /> Domisili
        </label>
        <select
          value={data.domicile || ''}
          onChange={(e) => onChange('domicile', e.target.value)}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: '2.5rem',
          }}
        >
          <option value="">-- Pilih Kota --</option>
          {INDONESIAN_CITIES.map((city) => (
            <option key={city.value} value={city.value}>
              {city.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tanggal Lahir & Usia Otomatis */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Tanggal Lahir</label>
          <input
            type="date"
            value={data.birth_date ? formatDateForInput(data.birth_date) : ''}
            onChange={(e) => onChange('birth_date', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Usia</label>
          <div className="px-4 py-3 bg-slate-800/30 border border-slate-700 rounded-xl text-slate-300 font-bold">
            {age !== null ? `${age} tahun` : '—'}
          </div>
        </div>
      </div>

      {/* Bio */}
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
          <FileText size={16} /> Bio / Deskripsi Singkat
        </label>
        <textarea
          value={data.bio || ''}
          onChange={(e) => onChange('bio', e.target.value)}
          placeholder="Ceritakan diri Anda dalam beberapa kalimat..."
          rows={4}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors resize-none"
        />
        <p className="text-xs text-slate-500 mt-1">
          {(data.bio || '').length}/200 karakter
        </p>
      </div>
    </div>
  );
}
