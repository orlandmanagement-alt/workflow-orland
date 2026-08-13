import { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Search, Upload, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import DropZone from '../components/DataImporter/DropZone';
import PreviewTable from '../components/DataImporter/PreviewTable';
import { apiRequest } from '../lib/api';

interface RosterTalent {
  id: string;
  name: string;
  email: string;
  category: string;
  status: 'active' | 'pending' | 'archived';
  bookings: number;
  rating: number;
  updatedAt: string;
}

interface ImportPayloadRow {
  name: string;
  email: string;
  category: string;
  status?: 'active' | 'pending' | 'archived';
}

const fallbackTalents: RosterTalent[] = [
  {
    id: 'tal_001',
    name: 'Budi Santoso',
    email: 'budi@example.com',
    category: 'content_creator',
    status: 'active',
    bookings: 8,
    rating: 4.8,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tal_002',
    name: 'Ella Singh',
    email: 'ella@example.com',
    category: 'influencer',
    status: 'active',
    bookings: 12,
    rating: 4.9,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'tal_003',
    name: 'Citra Dewi',
    email: 'citra@example.com',
    category: 'model',
    status: 'pending',
    bookings: 0,
    rating: 0,
    updatedAt: new Date().toISOString(),
  },
];

export default function Roster() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [talents, setTalents] = useState<RosterTalent[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'archived'>('all');

  const [showImporter, setShowImporter] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [importRows, setImportRows] = useState<ImportPayloadRow[]>([]);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [importError, setImportError] = useState<string>('');
  const [isImporting, setIsImporting] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);

  const fetchRoster = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiRequest('/agency/roster');
      const rosterList = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
      if (rosterList.length === 0) {
        setTalents(fallbackTalents);
      } else {
        setTalents(
          rosterList.map((item: Record<string, unknown>, index: number) => ({
            id: String(item.id || `tal_${index + 1}`),
            name: String(item.name || item.full_name || 'Unknown Talent'),
            email: String(item.email || '-'),
            category: String(item.category || 'other'),
            status: (item.status as 'active' | 'pending' | 'archived') || 'pending',
            bookings: Number(item.bookings || 0),
            rating: Number(item.rating || 0),
            updatedAt: String(item.updated_at || new Date().toISOString()),
          }))
        );
      }
    } catch {
      setTalents(fallbackTalents);
      setError('Gagal mengambil data roster dari API. Menampilkan data fallback.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoster();
  }, []);

  const filteredTalents = useMemo(() => {
    return talents.filter((talent) => {
      const matchSearch =
        talent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        talent.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' ? true : talent.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [talents, searchTerm, statusFilter]);

  const statusStyles: Record<RosterTalent['status'], string> = {
    active: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    pending: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    archived: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  };

  const parseCsvToRows = (text: string): ImportPayloadRow[] => {
    const lines = text
      .trim()
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      throw new Error('CSV minimal harus memiliki header dan 1 baris data.');
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    setImportColumns(headers);

    return lines.slice(1).map((line) => {
      const values = line.split(',').map((v) => v.trim());
      const row: Record<string, string> = {};
      headers.forEach((header, idx) => {
        row[header] = values[idx] || '';
      });

      return {
        name: row.name || row.full_name || '',
        email: row.email || '',
        category: row.category || 'other',
        status: (row.status as 'active' | 'pending' | 'archived') || 'pending',
      };
    });
  };

  const handleFileSelect = (file: File) => {
    setImportError('');
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const content = String(reader.result || '');
        const rows = parseCsvToRows(content).filter((row) => row.name && row.email);
        if (rows.length === 0) {
          throw new Error('Tidak ada baris valid (name + email) untuk diimport.');
        }
        setImportRows(rows);
      } catch (err) {
        setImportRows([]);
        setImportColumns([]);
        setImportError(err instanceof Error ? err.message : 'Gagal membaca file CSV.');
      }
    };
    reader.onerror = () => setImportError('Gagal membaca file.');
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (importRows.length === 0) {
      setImportError('Silakan pilih file CSV valid terlebih dulu.');
      return;
    }

    setIsImporting(true);
    setImportError('');
    try {
      await apiRequest('/agency/roster/import', {
        method: 'POST',
        body: { rows: importRows },
      });
      setImportRows([]);
      setImportColumns([]);
      setShowImporter(false);
      await fetchRoster();
    } catch {
      setImportError('API import gagal. Data belum masuk ke server.');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = () => {
    const headers = ['id', 'name', 'email', 'category', 'status', 'bookings', 'rating'];
    const rows = filteredTalents.map((talent) =>
      [talent.id, talent.name, talent.email, talent.category, talent.status, talent.bookings, talent.rating].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `agency-roster-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-white">Roster Talent</h1>
          <p className="mt-1 text-sm text-amber-500/80">
            Kelola roster agensi dengan import CSV, export, dan edit detail talent.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowImporter((prev) => !prev)}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/15 px-4 py-2 text-sm font-semibold text-amber-300 hover:bg-amber-500/25"
          >
            <Upload className="h-4 w-4" />
            Import CSV
          </button>
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-slate-900/60 px-4 py-2 text-sm font-semibold text-amber-200 hover:border-amber-400/50"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          <Link
            to="/roster/new"
            className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500 px-4 py-2 text-sm font-black text-[#071122] hover:bg-amber-400"
          >
            <Plus className="h-4 w-4" />
            Tambah Talent
          </Link>
        </div>
      </div>

      {showImporter && (
        <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-5 backdrop-blur-xl">
          <div className="mb-4">
            <h2 className="text-lg font-black uppercase tracking-wide text-amber-400">Import Roster CSV</h2>
            <p className="text-xs text-slate-300">Gunakan format kolom minimal: name,email,category,status</p>
          </div>
          <DropZone
            onFileSelect={handleFileSelect}
            isDragging={isDragging}
            onDragChange={setIsDragging}
            error={importError || undefined}
          />

          {importRows.length > 0 && (
            <div className="mt-4 space-y-4">
              <PreviewTable
                data={importRows as unknown as Record<string, unknown>[]}
                columns={importColumns}
                isExpanded={isPreviewExpanded}
                onToggleExpand={() => setIsPreviewExpanded((prev) => !prev)}
                totalRows={importRows.length}
              />
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="rounded-lg border border-amber-500/40 bg-amber-500 px-4 py-2 text-sm font-black text-[#071122] hover:bg-amber-400 disabled:opacity-60"
              >
                {isImporting ? 'Menyimpan ke server...' : `Import ${importRows.length} Talent`}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-4 backdrop-blur-xl">
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-amber-500/70" />
            <input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari nama atau email talent"
              className="w-full rounded-lg border border-amber-500/20 bg-[#071122] py-2.5 pl-10 pr-3 text-sm text-white placeholder-slate-400 focus:border-amber-400/60 focus:outline-none"
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'pending' | 'archived')}
            className="rounded-lg border border-amber-500/20 bg-[#071122] px-3 py-2.5 text-sm text-white focus:border-amber-400/60 focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">{error}</div>
      )}

      <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-white/5 backdrop-blur-xl">
        <table className="w-full text-sm">
          <thead className="bg-slate-900/60 text-amber-300">
            <tr>
              <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Talent</th>
              <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Kategori</th>
              <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Booking</th>
              <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Rating</th>
              <th className="px-4 py-3 text-left font-black uppercase tracking-wide">Status</th>
              <th className="px-4 py-3 text-right font-black uppercase tracking-wide">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-slate-300">
                  Memuat roster...
                </td>
              </tr>
            )}

            {!loading && filteredTalents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-300">
                  <div className="flex flex-col items-center gap-2">
                    <Users className="h-8 w-8 text-amber-500/60" />
                    <p>Tidak ada talent yang cocok dengan filter saat ini.</p>
                  </div>
                </td>
              </tr>
            )}

            {!loading &&
              filteredTalents.map((talent) => (
                <tr key={talent.id} className="border-t border-amber-500/10 text-slate-100 hover:bg-amber-500/5">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-white">{talent.name}</p>
                    <p className="text-xs text-slate-400">{talent.email}</p>
                  </td>
                  <td className="px-4 py-3 text-slate-200">{talent.category}</td>
                  <td className="px-4 py-3 text-slate-200">{talent.bookings}</td>
                  <td className="px-4 py-3 text-slate-200">{talent.rating > 0 ? talent.rating.toFixed(1) : '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-1 text-xs font-semibold ${statusStyles[talent.status]}`}>
                      {talent.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/roster/${talent.id}`}
                      className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20"
                    >
                      Detail / Edit
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
