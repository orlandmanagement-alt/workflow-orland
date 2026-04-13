// File: apps/apptalent/src/components/profile/ProfilePhysicalTab.tsx
import { useState } from 'react';
import { Ruler, Weight, Sparkles, Zap } from 'lucide-react';
import { FACE_TYPES, SKIN_TONES, HAIR_COLORS } from '@/lib/profileHelpers';

interface ProfilePhysicalTabProps {
  data: {
    height_cm?: number;
    weight_kg?: number;
    face_type?: string;
    skin_tone?: string;
    hair_color?: string;
    eye_color?: string;
    shirt_size?: string;
    shoe_size?: string;
  };
  onChange: (field: string, value: any) => void;
}

const EYE_COLORS = ['Hitam', 'Cokelat', 'Cokelat Muda', 'Abu-Abu', 'Biru', 'Hijau'];
const SHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
const SHOE_SIZES = Array.from({ length: 11 }, (_, i) => (35 + i).toString());

export default function ProfilePhysicalTab({ data, onChange }: ProfilePhysicalTabProps) {
  return (
    <div className="space-y-6">
      {/* Height & Weight Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
            <Ruler size={16} /> Tinggi Badan (cm)
          </label>
          <input
            type="number"
            min="140"
            max="210"
            value={data.height_cm || ''}
            onChange={(e) => onChange('height_cm', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="170"
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
            <Weight size={16} /> Berat Badan (kg)
          </label>
          <input
            type="number"
            min="40"
            max="150"
            value={data.weight_kg || ''}
            onChange={(e) => onChange('weight_kg', e.target.value ? parseInt(e.target.value) : null)}
            placeholder="60"
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Face Type */}
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-2 flex items-center gap-2">
          <Sparkles size={16} /> Bentuk Wajah
        </label>
        <select
          value={data.face_type || ''}
          onChange={(e) => onChange('face_type', e.target.value)}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: '2.5rem',
          }}
        >
          <option value="">-- Pilih Bentuk Wajah --</option>
          {FACE_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Skin Tone */}
      <div>
        <label className="block text-sm font-bold text-slate-300 mb-2">Warna Kulit</label>
        <select
          value={data.skin_tone || ''}
          onChange={(e) => onChange('skin_tone', e.target.value)}
          className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 1rem center',
            paddingRight: '2.5rem',
          }}
        >
          <option value="">-- Pilih Warna Kulit --</option>
          {SKIN_TONES.map((tone) => (
            <option key={tone.value} value={tone.value}>
              {tone.label}
            </option>
          ))}
        </select>
      </div>

      {/* Hair Color & Eye Color Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Warna Rambut</label>
          <select
            value={data.hair_color || ''}
            onChange={(e) => onChange('hair_color', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              paddingRight: '2.5rem',
            }}
          >
            <option value="">-- Pilih Warna Rambut --</option>
            {HAIR_COLORS.map((color) => (
              <option key={color.value} value={color.value}>
                {color.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Warna Mata</label>
          <select
            value={data.eye_color || ''}
            onChange={(e) => onChange('eye_color', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              paddingRight: '2.5rem',
            }}
          >
            <option value="">-- Pilih Warna Mata --</option>
            {EYE_COLORS.map((color) => (
              <option key={color} value={color}>
                {color}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Shirt Size & Shoe Size Row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Ukuran Baju</label>
          <select
            value={data.shirt_size || ''}
            onChange={(e) => onChange('shirt_size', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              paddingRight: '2.5rem',
            }}
          >
            <option value="">-- Pilih Ukuran Baju --</option>
            {SHIRT_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-bold text-slate-300 mb-2">Ukuran Sepatu</label>
          <select
            value={data.shoe_size || ''}
            onChange={(e) => onChange('shoe_size', e.target.value)}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors appearance-none"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 1rem center',
              paddingRight: '2.5rem',
            }}
          >
            <option value="">-- Pilih Ukuran Sepatu --</option>
            {SHOE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-lg p-4">
        <p className="text-xs text-slate-300">
          💡 Data fisik ini penting untuk matching dengan job opportunities yang sesuai dengan profile Anda.
        </p>
      </div>
    </div>
  );
}
