import React, { useRef } from 'react';
import { Upload, File, AlertCircle } from 'lucide-react';

interface DropZoneProps {
  onFileSelect: (file: File) => void;
  isDragging: boolean;
  onDragChange: (isDragging: boolean) => void;
  error?: string;
}

export default function DropZone({ onFileSelect, isDragging, onDragChange, error }: DropZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragChange(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragChange(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    onDragChange(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type === 'text/csv' || file.type === 'application/json' || file.name.endsWith('.csv') || file.name.endsWith('.json')) {
        onFileSelect(file);
      }
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300 cursor-pointer ${
          isDragging
            ? 'border-amber-500 bg-amber-500/10 shadow-lg shadow-amber-500/20'
            : error
            ? 'border-red-500/50 bg-red-500/5'
            : 'border-amber-500/30 bg-slate-950/40 hover:border-amber-500/50 hover:bg-slate-950/60'
        }`}
        onClick={handleFileClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.json"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center gap-4">
          <div className={`p-4 rounded-xl ${isDragging ? 'bg-amber-500/20' : 'bg-amber-500/10'}`}>
            <Upload className={`w-12 h-12 ${isDragging ? 'text-amber-400 animate-bounce' : 'text-amber-500/70'}`} />
          </div>

          <div className="text-center">
            <h3 className="text-white font-black text-lg uppercase tracking-wider mb-2">
              {isDragging ? 'DROP FILE HERE' : 'Drag & Drop Your File'}
            </h3>
            <p className="text-amber-500/70 text-sm mb-3">
              CSV atau JSON • Max 10MB
            </p>
            <button
              type="button"
              onClick={handleFileClick}
              className="px-6 py-2 bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg hover:bg-amber-500/30 transition-colors font-semibold text-sm"
            >
              Browse Files
            </button>
          </div>

          <div className="mt-4 pt-4 border-t border-amber-500/10 w-full text-center">
            <p className="text-slate-400 text-xs">Atau copy & paste data di bawah</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-300 font-semibold text-sm">Error</p>
            <p className="text-red-400/70 text-xs mt-1">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
