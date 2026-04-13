import React, { useState } from 'react';
import { Clipboard, X } from 'lucide-react';

interface PasteAreaProps {
  isActive: boolean;
  onActivate: () => void;
  onPaste: (data: string) => void;
  onClear: () => void;
  content: string;
}

export default function PasteArea({ 
  isActive, 
  onActivate, 
  onPaste, 
  onClear,
  content 
}: PasteAreaProps) {
  if (!isActive) {
    return (
      <button
        onClick={onActivate}
        className="w-full px-4 py-3 bg-slate-950/40 border border-amber-500/20 rounded-lg text-amber-400 hover:bg-slate-950/60 hover:border-amber-500/30 transition-colors flex items-center justify-center gap-2 font-semibold text-sm"
      >
        <Clipboard className="w-4 h-4" />
        Switch to Copy & Paste Mode
      </button>
    );
  }

  return (
    <div className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => onPaste(e.target.value)}
        placeholder={`Paste CSV data (comma-separated):
name,email,phone
John Doe,john@example.com,+62812345
Jane Smith,jane@example.com,+62812346

Or paste JSON array:
[
  {"name": "John Doe", "email": "john@example.com"},
  {"name": "Jane Smith", "email": "jane@example.com"}
]`}
        className="w-full h-48 px-4 py-3 bg-slate-950/40 border border-amber-500/20 rounded-lg text-white font-mono text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500/50 resize-none"
      />
      <div className="flex items-center justify-between">
        <p className="text-slate-400 text-xs">
          {content.length} characters
        </p>
        <button
          onClick={onClear}
          className="px-3 py-1.5 bg-slate-950/40 border border-red-500/20 text-red-400 rounded text-xs hover:bg-slate-950/60 transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      </div>
    </div>
  );
}
