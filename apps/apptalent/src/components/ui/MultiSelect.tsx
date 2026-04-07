import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronDown, Check } from 'lucide-react';

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  label?: string;
}

export function MultiSelect({ options, selected, onChange, placeholder = "Select...", label }: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (opt: string) => {
    if (selected.includes(opt)) {
      onChange(selected.filter(i => i !== opt));
    } else {
      onChange([...selected, opt]);
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="text-[11px] font-extrabold text-slate-400 mb-1 block">{label}</label>}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full min-h-[46px] border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl px-4 py-2 outline-none hover:border-brand-400 cursor-pointer flex flex-wrap items-center gap-2 transition-colors relative"
      >
        {selected.length === 0 ? (
          <span className="text-[13px] font-bold text-slate-400 user-select-none">{placeholder}</span>
        ) : (
          selected.map((item, idx) => (
            <span key={idx} className="bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 px-2 py-1 rounded-lg text-xs font-black text-slate-800 dark:text-indigo-300 flex items-center gap-1.5 animate-in zoom-in-95">
              {item} 
              <button 
                onClick={(e) => { e.stopPropagation(); toggleOption(item); }} 
                className="hover:bg-red-100 hover:text-red-500 rounded-full p-0.5 text-slate-400 transition-colors"
                aria-label="Remove"
              >
                <X size={12} />
              </button>
            </span>
          ))
        )}
        <div className="ml-auto pointer-events-none">
           <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto w-full animate-in fade-in slide-in-from-top-2">
          <div className="p-2 grid gap-1">
            {options.map((opt, i) => {
              const isSelected = selected.includes(opt);
              return (
                <div 
                  key={i} 
                  onClick={() => toggleOption(opt)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-colors flex items-center justify-between ${isSelected ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                >
                  {opt}
                  {isSelected && <Check size={16} className="text-brand-600 dark:text-brand-400" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
