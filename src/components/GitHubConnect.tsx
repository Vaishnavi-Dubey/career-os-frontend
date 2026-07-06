'use client';
import { useEffect, useState } from 'react';
import { Github, LogOut, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';

type GhStatus = {
  connected: boolean;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  profileUrl?: string;
  scopes?: string[];
  reason?: string;
};

export default function GitHubConnect({
  onChange,
}: {
  onChange?: (status: GhStatus) => void;
}) {
  const [status, setStatus] = useState<GhStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function refresh() {
    try {
      const data = await api.githubStatus();
      setStatus(data);
      onChange?.(data);
    } catch (e: any) {
      setStatus({ connected: false });
      setMsg(`Status check failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();

    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('github_connected')) {
      const username = params.get('username');
      setMsg(`✅ Connected as @${username}`);
      window.history.replaceState({}, '', window.location.pathname);
      refresh();
    } else if (params.get('github_error')) {
      setMsg(`❌ ${decodeURIComponent(params.get('github_error') || '')}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleConnect() {
    window.location.href = api.githubConnectUrl();
  }

  async function handleDisconnect() {
    if (!confirm('Disconnect your GitHub account? You can reconnect any time.')) return;
    try {
      await api.githubDisconnect();
      setMsg('GitHub account disconnected');
      refresh();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    }
  }

  if (loading) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-slate-400">
        Checking GitHub connection…
      </div>
    );
  }

  if (status?.connected) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center gap-3">
        {status.avatarUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={status.avatarUrl}
            alt={status.username}
            className="w-10 h-10 rounded-full border border-slate-600"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-white flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-green-400" />
            {status.displayName || status.username}
          </div>
          <a
            href={status.profileUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-400 hover:text-indigo-300 font-mono truncate block"
          >
            @{status.username}
          </a>
        </div>
        <button
          onClick={handleDisconnect}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-400 px-2 py-1 rounded border border-slate-700 hover:border-red-500/40"
          title="Disconnect"
        >
          <LogOut size={13} /> Disconnect
        </button>
        {msg && <div className="ml-2 text-xs text-slate-500">{msg}</div>}
      </div>
    );
  }

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 flex items-center justify-between gap-3">
      <div>
        <div className="text-sm font-medium text-white flex items-center gap-2">
          <Github size={16} /> GitHub not connected
        </div>
        <div className="text-xs text-slate-400 mt-0.5">
          Connect your account to use the GitHub Assistant with your real repos.
        </div>
        {msg && <div className="text-xs text-amber-400 mt-1">{msg}</div>}
      </div>
      <button
        onClick={handleConnect}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap"
      >
        <Github size={15} /> Connect GitHub
      </button>
    </div>
  );
}
