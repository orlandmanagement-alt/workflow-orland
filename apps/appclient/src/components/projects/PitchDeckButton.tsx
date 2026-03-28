import { Sparkles } from 'lucide-react';

interface PitchDeckProps {
  projectId: string;
}

export default function PitchDeckButton({ projectId }: PitchDeckProps) {
  return (
    <button 
      onClick={() => alert('Exporting ' + projectId)}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold"
    >
      <Sparkles size={14} /> 1-Click Pitch Deck
    </button>
  );
}
