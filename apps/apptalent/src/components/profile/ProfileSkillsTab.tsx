// File: apps/apptalent/src/components/profile/ProfileSkillsTab.tsx
import { useState, useEffect } from 'react';
import { Plus, Trash2, Globe, Zap } from 'lucide-react';

interface Skill {
  id: string;
  skill_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

interface Language {
  id: string;
  language_name: string;
  proficiency_level: 'beginner' | 'intermediate' | 'advanced' | 'native';
}

interface ProfileSkillsTabProps {
  data: {
    skills?: Skill[];
    languages?: Language[];
  };
  onChange: (field: string, value: any) => void;
}

const PROFICIENCY_LEVELS_SKILL = ['beginner', 'intermediate', 'advanced', 'expert'];
const PROFICIENCY_LEVELS_LANGUAGE = ['beginner', 'intermediate', 'advanced', 'native'];

const SKILL_OPTIONS = [
  'Acting',
  'Modeling',
  'Hosting',
  'Singing',
  'Dancing',
  'Photography',
  'Videography',
  'Makeup',
  'Styling',
  'Social Media',
  'Video Editing',
  'Animation',
  'Graphic Design',
  'Writing',
  'Public Speaking',
  'Sports',
  'Martial Arts',
  'English',
  'Bahasa Indonesia',
  'Lainnya',
];

const LANGUAGE_OPTIONS = [
  'Bahasa Indonesia',
  'English',
  'Mandarin',
  'Bahasa Jepang',
  'Bahasa Korea',
  'Français',
  'Español',
  'Deutsch',
  'Bahasa Arab',
  'Bahasa Melayu',
  'Lainnya',
];

export default function ProfileSkillsTab({ data, onChange }: ProfileSkillsTabProps) {
  const [skills, setSkills] = useState<Skill[]>(data.skills || []);
  const [languages, setLanguages] = useState<Language[]>(data.languages || []);
  const [newSkillName, setNewSkillName] = useState('');
  const [newLanguageName, setNewLanguageName] = useState('');

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const newSkill: Skill = {
      id: `skill-${Date.now()}`,
      skill_name: newSkillName,
      proficiency_level: 'intermediate',
    };
    const updated = [...skills, newSkill];
    setSkills(updated);
    onChange('skills', updated);
    setNewSkillName('');
  };

  const handleRemoveSkill = (id: string) => {
    const updated = skills.filter((s) => s.id !== id);
    setSkills(updated);
    onChange('skills', updated);
  };

  const handleUpdateSkillLevel = (id: string, level: any) => {
    const updated = skills.map((s) =>
      s.id === id ? { ...s, proficiency_level: level } : s
    );
    setSkills(updated);
    onChange('skills', updated);
  };

  const handleAddLanguage = () => {
    if (!newLanguageName.trim()) return;
    const newLanguage: Language = {
      id: `lang-${Date.now()}`,
      language_name: newLanguageName,
      proficiency_level: 'intermediate',
    };
    const updated = [...languages, newLanguage];
    setLanguages(updated);
    onChange('languages', updated);
    setNewLanguageName('');
  };

  const handleRemoveLanguage = (id: string) => {
    const updated = languages.filter((l) => l.id !== id);
    setLanguages(updated);
    onChange('languages', updated);
  };

  const handleUpdateLanguageLevel = (id: string, level: any) => {
    const updated = languages.map((l) =>
      l.id === id ? { ...l, proficiency_level: level } : l
    );
    setLanguages(updated);
    onChange('languages', updated);
  };

  return (
    <div className="space-y-8">
      {/* Skills Section */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Zap size={20} className="text-amber-400" /> Keahlian
        </h3>

        <div className="space-y-3 mb-4">
          {skills.length === 0 && (
            <p className="text-slate-400 text-sm italic">Belum ada keahlian. Tambahkan keahlian Anda di bawah.</p>
          )}
          {skills.map((skill) => (
            <div
              key={skill.id}
              className="flex items-center justify-between gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{skill.skill_name}</p>
              </div>
              <select
                value={skill.proficiency_level}
                onChange={(e) => handleUpdateSkillLevel(skill.id, e.target.value)}
                className="px-3 py-1 text-sm bg-slate-700 rounded border border-slate-600 text-white focus:outline-none focus:border-blue-500 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.25rem center',
                  paddingRight: '1.75rem',
                }}
              >
                <option value="beginner">Pemula</option>
                <option value="intermediate">Menengah</option>
                <option value="advanced">Lanjutan</option>
                <option value="expert">Ahli</option>
              </select>
              <button
                onClick={() => handleRemoveSkill(skill.id)}
                className="text-red-400 hover:text-red-300 transition-colors p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Skill Row */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-300 mb-1 block">Keahlian Baru</label>
            <input
              type="text"
              list="skill-options"
              value={newSkillName}
              onChange={(e) => setNewSkillName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
              placeholder="Ketik atau pilih dari daftar..."
              className="w-full px-3 py-2 text-sm bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <datalist id="skill-options">
              {SKILL_OPTIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <button
            onClick={handleAddSkill}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* Languages Section */}
      <div className="bg-slate-800/30 rounded-xl p-6 border border-slate-700">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Globe size={20} className="text-blue-400" /> Bahasa
        </h3>

        <div className="space-y-3 mb-4">
          {languages.length === 0 && (
            <p className="text-slate-400 text-sm italic">Belum ada bahasa. Tambahkan bahasa yang Anda kuasai.</p>
          )}
          {languages.map((lang) => (
            <div
              key={lang.id}
              className="flex items-center justify-between gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
            >
              <div className="flex-1">
                <p className="text-sm font-bold text-white">{lang.language_name}</p>
              </div>
              <select
                value={lang.proficiency_level}
                onChange={(e) => handleUpdateLanguageLevel(lang.id, e.target.value)}
                className="px-3 py-1 text-sm bg-slate-700 rounded border border-slate-600 text-white focus:outline-none focus:border-blue-500 appearance-none"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 0.25rem center',
                  paddingRight: '1.75rem',
                }}
              >
                <option value="beginner">Pemula</option>
                <option value="intermediate">Menengah</option>
                <option value="advanced">Lanjutan</option>
                <option value="native">Native</option>
              </select>
              <button
                onClick={() => handleRemoveLanguage(lang.id)}
                className="text-red-400 hover:text-red-300 transition-colors p-1"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Add Language Row */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <label className="text-xs font-bold text-slate-300 mb-1 block">Bahasa Baru</label>
            <input
              type="text"
              list="language-options"
              value={newLanguageName}
              onChange={(e) => setNewLanguageName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddLanguage()}
              placeholder="Ketik atau pilih dari daftar..."
              className="w-full px-3 py-2 text-sm bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
            <datalist id="language-options">
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>
          <button
            onClick={handleAddLanguage}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Tambah
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/30 rounded-lg p-4">
        <p className="text-xs text-slate-300">
          💡 Keahlian dan bahasa membantu matching dengan project yang cocok untuk Anda.
        </p>
      </div>
    </div>
  );
}
