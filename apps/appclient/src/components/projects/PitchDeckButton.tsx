import { FileDown, Sparkles } from 'lucide-react';

interface PDBProps { projectId: string }
export default function PitchDeckButton({ projectId }: PDBProps) {
  const handleExport = () => {
    alert(`Sedang menyusun Pitch Deck untuk ${projectId}... AI sedang melayout foto talent ke format PDF presentasi.`);
    // Logika: Ambil data talent dari project_talents -> Generate PDF
  };

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-black hover:bg-indigo-100 transition-all shadow-sm"
    >
      <Sparkles size={14} className="animate-pulse" /> 1-Click Pitch Deck (PDF)
    </button>
  );
}
