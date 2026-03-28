import React from 'react';
import { Sparkles } from 'lucide-react';

export default function PitchDeckButton({ projectId }: { projectId: string }) {
  return (
    <button 
      onClick={() => alert('Generating Pitch Deck for ' + projectId)}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-xl text-xs font-bold border border-indigo-100 dark:border-indigo-800"
    >
      <Sparkles size={14} /> 1-Click Pitch Deck
    </button>
  );
}
