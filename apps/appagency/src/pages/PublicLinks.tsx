import { useMemo, useState } from 'react';
import { Check, Copy, Link2, RefreshCw } from 'lucide-react';
import { apiRequest } from '../lib/api';
import { useAuthStore } from '../store/useAppStore';

export default function PublicLinks() {
  const user = useAuthStore((state) => state.user);
  const agencySlug = useMemo(() => {
    const sourceName = (user?.full_name || 'agency').toLowerCase();
    return sourceName.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'agency';
  }, [user]);

  const [inviteLink, setInviteLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<'invite' | 'portfolio' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateLinks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiRequest('/agency/public-links', {
        method: 'POST',
        body: { agencySlug },
      });

      const payload = response?.data || response;
      setInviteLink(String(payload?.inviteLink || payload?.invite_url || ''));
      setPortfolioLink(String(payload?.portfolioLink || payload?.portfolio_url || ''));
    } catch {
      const origin = window.location.origin;
      setInviteLink(`${origin}/join/agency/${agencySlug}`);
      setPortfolioLink(`${origin}/agency/${agencySlug}/portfolio`);
      setError('API generate link gagal, menggunakan format fallback lokal.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (value: string, key: 'invite' | 'portfolio') => {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1200);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-6 backdrop-blur-xl">
        <h1 className="text-3xl font-black uppercase tracking-tight text-white">Public Links</h1>
        <p className="mt-1 text-sm text-amber-500/80">
          Generate tautan undangan talent baru dan halaman portfolio publik agensi.
        </p>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-6 backdrop-blur-xl">
        <button
          onClick={generateLinks}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg border border-amber-500/40 bg-amber-500 px-4 py-2 text-sm font-black text-[#071122] hover:bg-amber-400 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Generating...' : 'Generate Links'}
        </button>
        {error && <p className="mt-3 text-sm text-amber-200">{error}</p>}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-5 backdrop-blur-xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-300">Invite To Agency</p>
          <h2 className="mb-3 text-lg font-black text-white">Talent Invite Link</h2>
          <div className="rounded-lg border border-amber-500/20 bg-[#071122] p-3 text-xs text-slate-200">
            {inviteLink || 'Belum digenerate'}
          </div>
          <button
            onClick={() => copyToClipboard(inviteLink, 'invite')}
            disabled={!inviteLink}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {copiedKey === 'invite' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedKey === 'invite' ? 'Copied' : 'Copy Link'}
          </button>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-5 backdrop-blur-xl">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-amber-300">Agency Portfolio Page</p>
          <h2 className="mb-3 text-lg font-black text-white">Public Roster Link</h2>
          <div className="rounded-lg border border-amber-500/20 bg-[#071122] p-3 text-xs text-slate-200">
            {portfolioLink || 'Belum digenerate'}
          </div>
          <button
            onClick={() => copyToClipboard(portfolioLink, 'portfolio')}
            disabled={!portfolioLink}
            className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 disabled:opacity-50"
          >
            {copiedKey === 'portfolio' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copiedKey === 'portfolio' ? 'Copied' : 'Copy Link'}
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-500/20 bg-white/5 p-5 backdrop-blur-xl">
        <div className="flex items-start gap-3">
          <Link2 className="mt-0.5 h-5 w-5 text-amber-400" />
          <p className="text-sm text-slate-300">
            Gunakan Invite Link untuk onboarding talent baru ke agensi. Gunakan Public Portfolio Link untuk showcase roster
            ke calon klien tanpa membuka panel internal.
          </p>
        </div>
      </div>
    </div>
  );
}
