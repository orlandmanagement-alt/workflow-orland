import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Briefcase, Users, FileText, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

interface SearchResult {
  id: string;
  type: 'project' | 'talent' | 'contract';
  title: string;
  subtitle: string;
  href: string;
}

export default function OmniSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Keyboard shortcut: Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Focus input saat terbuka
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 50);
  }, [isOpen]);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/search?q=${encodeURIComponent(query)}&limit=8`);
        const data = res.data?.data ?? [];
        setResults(data);
      } catch {
        // Fallback local mock jika API belum ready
        setResults([
          { id: '1', type: 'project', title: `Proyek: ${query}`, subtitle: 'Casting', href: '/dashboard/projects' },
          { id: '2', type: 'talent', title: `Talent: ${query}`, subtitle: 'Search talent', href: '/dashboard/talents' },
        ]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.href);
    setIsOpen(false);
    setQuery('');
  };

  const ICONS: Record<string, React.ElementType> = {
    project: Briefcase,
    talent: Users,
    contract: FileText,
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-20 px-4" onClick={() => setIsOpen(false)}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Cari proyek, talent, kontrak..."
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 outline-none text-sm font-medium"
          />
          {isLoading && <Loader2 size={16} className="text-slate-400 animate-spin" />}
          <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <ul className="max-h-80 overflow-y-auto py-2">
            {results.map(r => {
              const Icon = ICONS[r.type] ?? Search;
              return (
                <li key={r.id}>
                  <button
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-left"
                  >
                    <div className="h-8 w-8 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0">
                      <Icon size={16} className="text-brand-600 dark:text-brand-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{r.subtitle}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Empty state */}
        {query.length >= 2 && !isLoading && results.length === 0 && (
          <div className="p-8 text-center">
            <p className="text-sm text-slate-500">Tidak ada hasil untuk "<strong>{query}</strong>"</p>
          </div>
        )}

        {/* Hint */}
        {query.length < 2 && (
          <div className="p-4 text-center">
            <p className="text-xs text-slate-400">Ketik minimal 2 karakter untuk mulai mencari</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
          <span className="text-[10px] text-slate-400 font-mono">ESC untuk tutup</span>
        </div>
      </div>
    </div>
  );
}
