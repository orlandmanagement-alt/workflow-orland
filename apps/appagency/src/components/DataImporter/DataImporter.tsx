import React, { useState } from 'react';
import { Send, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import DropZone from './DropZone';
import PreviewTable from './PreviewTable';
import PasteArea from './PasteArea';
import { api } from '../../lib/api';

interface ImportData {
  rawData: Record<string, any>[];
  columns: string[];
  totalRows: number;
}

type ImportTarget = 'roster' | 'schedules' | 'master' | '';

export default function DataImporter() {
  const [isDragging, setIsDragging] = useState(false);
  const [importData, setImportData] = useState<ImportData | null>(null);
  const [isPasteMode, setIsPasteMode] = useState(false);
  const [pasteContent, setPasteContent] = useState('');
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');
  const [selectedTarget, setSelectedTarget] = useState<ImportTarget>('');
  const [error, setError] = useState<string>('');

  const parseCSV = (text: string): Record<string, any>[] => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) throw new Error('CSV harus memiliki header dan minimal 1 baris data');

    const headers = lines[0].split(',').map(h => h.trim());
    const data = lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const obj: Record<string, any> = {};
      headers.forEach((header, idx) => {
        obj[header] = values[idx] || '';
      });
      return obj;
    });

    return data;
  };

  const parseJSON = (text: string): Record<string, any>[] => {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed)) {
      throw new Error('JSON harus berupa array of objects');
    }
    return parsed as Record<string, any>[];
  };

  const parseData = (content: string): ImportData => {
    if (!content.trim()) throw new Error('Data tidak boleh kosong');

    let rawData: Record<string, any>[] = [];

    // Try JSON first
    try {
      rawData = parseJSON(content);
    } catch {
      // Fall back to CSV
      try {
        rawData = parseCSV(content);
      } catch (csvError) {
        throw new Error('Format tidak dikenali. Gunakan CSV atau JSON array.');
      }
    }

    if (!rawData.length) throw new Error('Data kosong setelah parsing');

    const columns = Object.keys(rawData[0]);
    return {
      rawData,
      columns,
      totalRows: rawData.length,
    };
  };

  const handleFileSelect = (file: File) => {
    setError('');
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = parseData(content);
        setImportData(parsed);
        setSyncStatus('idle');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'File parsing failed');
      }
    };

    reader.onerror = () => {
      setError('File reading failed');
    };

    reader.readAsText(file);
  };

  const handlePasteChange = (content: string) => {
    setPasteContent(content);
    setError('');

    if (!content.trim()) {
      setImportData(null);
      return;
    }

    try {
      const parsed = parseData(content);
      setImportData(parsed);
      setSyncStatus('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Parse error');
    }
  };

  const handleSync = async () => {
    if (!importData || !selectedTarget) {
      setError('Pilih target dan pastikan data valid');
      return;
    }

    setIsSyncing(true);
    setSyncStatus('idle');

    try {
      const response = await api.post(`/api/v1/system/import/${selectedTarget}`, {
        data: importData.rawData,
        metadata: {
          columns: importData.columns,
          totalRows: importData.totalRows,
          timestamp: new Date().toISOString(),
        },
      });

      setSyncStatus('success');
      setSyncMessage(`✓ ${response.data.message || `${importData.totalRows} baris berhasil di-sync`}`);
      
      // Reset form setelah 3 detik
      setTimeout(() => {
        setImportData(null);
        setPasteContent('');
        setSelectedTarget('');
        setSyncStatus('idle');
      }, 3000);
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(
        err instanceof Error 
          ? err.message 
          : 'Sync ke database gagal. Periksa koneksi atau format data.'
      );
    } finally {
      setIsSyncing(false);
    }
  };

  const resetForm = () => {
    setImportData(null);
    setPasteContent('');
    setSelectedTarget('');
    setError('');
    setSyncStatus('idle');
    setIsPasteMode(false);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Data Importer
        </h1>
        <p className="text-amber-500/70 text-sm mt-1">
          Unggah data massal (Roster, Jadwal, Master Data) dengan satu klik
        </p>
      </div>

      {/* Input Methods */}
      <div className="space-y-4">
        <DropZone 
          onFileSelect={handleFileSelect}
          isDragging={isDragging}
          onDragChange={setIsDragging}
          error={error}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center pointer-events-none">
            <div className="w-full border-t border-amber-500/10"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-4 bg-[#071122] text-amber-500/50 text-sm font-semibold">OR</span>
          </div>
        </div>

        <PasteArea
          isActive={isPasteMode}
          onActivate={() => setIsPasteMode(true)}
          onPaste={handlePasteChange}
          onClear={() => {
            setPasteContent('');
            setImportData(null);
          }}
          content={pasteContent}
        />
      </div>

      {/* Data Preview */}
      {importData && (
        <>
          <PreviewTable
            data={importData.rawData}
            columns={importData.columns}
            isExpanded={isPreviewExpanded}
            onToggleExpand={() => setIsPreviewExpanded(!isPreviewExpanded)}
            totalRows={importData.totalRows}
          />

          {/* Target & Sync */}
          <div className="bg-gradient-to-br from-slate-950/60 to-slate-900/40 border border-amber-500/10 rounded-lg p-6 space-y-4">
            <div>
              <label className="block text-amber-400 text-sm font-black uppercase tracking-wider mb-3">
                Pilih Target Import
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { value: 'roster', label: 'Roster Talent' },
                  { value: 'schedules', label: 'Jadwal' },
                  { value: 'master', label: 'Master Data' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedTarget(option.value as ImportTarget)}
                    className={`px-4 py-3 rounded-lg border-2 transition-all font-semibold text-sm ${
                      selectedTarget === option.value
                        ? 'border-amber-500 bg-amber-500/20 text-amber-300'
                        : 'border-amber-500/20 bg-slate-950/40 text-slate-300 hover:border-amber-500/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Messages */}
            {syncStatus === 'success' && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-300 font-semibold text-sm">Sync Berhasil</p>
                  <p className="text-green-400/70 text-xs mt-1">{syncMessage}</p>
                </div>
              </div>
            )}

            {syncStatus === 'error' && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-300 font-semibold text-sm">Sync Gagal</p>
                  <p className="text-red-400/70 text-xs mt-1">{syncMessage}</p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4">
              <button
                onClick={handleSync}
                disabled={!selectedTarget || isSyncing}
                className={`flex-1 px-6 py-3 rounded-lg font-black text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  !selectedTarget || isSyncing
                    ? 'bg-slate-950/40 text-slate-500 cursor-not-allowed'
                    : 'bg-amber-500 text-slate-950 hover:bg-amber-600 shadow-lg shadow-amber-500/20'
                }`}
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Sync to Database
                  </>
                )}
              </button>

              <button
                onClick={resetForm}
                className="px-6 py-3 bg-slate-950/40 border border-amber-500/20 text-amber-400 rounded-lg hover:bg-slate-950/60 transition-colors font-semibold text-sm"
              >
                Reset
              </button>
            </div>

            {!selectedTarget && importData && (
              <p className="text-amber-500/60 text-xs">⚠️ Pilih target sebelum sync</p>
            )}
          </div>
        </>
      )}

      {/* Empty State */}
      {!importData && (
        <div className="text-center py-8 text-slate-400">
          <p className="text-sm">Upload atau paste data untuk memulai</p>
        </div>
      )}
    </div>
  );
}
