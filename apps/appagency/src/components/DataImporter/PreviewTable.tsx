import React from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface PreviewTableProps {
  data: Record<string, any>[];
  columns: string[];
  isExpanded: boolean;
  onToggleExpand: () => void;
  totalRows: number;
}

export default function PreviewTable({ 
  data, 
  columns, 
  isExpanded, 
  onToggleExpand,
  totalRows 
}: PreviewTableProps) {
  if (!data.length) return null;

  return (
    <div className="bg-gradient-to-br from-slate-950/60 to-slate-900/40 border border-amber-500/10 rounded-lg p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-black text-amber-400 uppercase tracking-wider">
            Preview Data
          </h3>
          <p className="text-slate-400 text-sm mt-1">
            Menampilkan {Math.min(5, data.length)} dari {totalRows} baris
          </p>
        </div>
        <button
          onClick={onToggleExpand}
          className="p-2 hover:bg-amber-500/10 rounded-lg transition-colors"
          title={isExpanded ? 'Collapse' : 'Expand'}
        >
          {isExpanded ? (
            <EyeOff className="w-5 h-5 text-amber-400" />
          ) : (
            <Eye className="w-5 h-5 text-amber-500/70" />
          )}
        </button>
      </div>

      {isExpanded ? (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-amber-500/10">
                <th className="px-4 py-3 text-left text-amber-400 font-black text-xs uppercase tracking-wider">No</th>
                {columns.map((col) => (
                  <th
                    key={col}
                    className="px-4 py-3 text-left text-amber-400 font-black text-xs uppercase tracking-wider whitespace-nowrap"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 5).map((row, idx) => (
                <tr key={idx} className="border-b border-amber-500/5 hover:bg-amber-500/5 transition-colors">
                  <td className="px-4 py-3 text-slate-400">{idx + 1}</td>
                  {columns.map((col) => (
                    <td key={`${idx}-${col}`} className="px-4 py-3 text-slate-300 font-mono text-xs max-w-xs truncate">
                      {String(row[col] ?? '-')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="p-3 bg-slate-950/40 rounded-lg border border-amber-500/5">
            <p className="text-slate-300 font-semibold text-sm">Kolom: {columns.join(', ')}</p>
          </div>
          <p className="text-slate-400 text-xs">Klik icon mata untuk melihat preview tabel lengkap</p>
        </div>
      )}
    </div>
  );
}
