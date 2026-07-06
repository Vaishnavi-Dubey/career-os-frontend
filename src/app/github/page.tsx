'use client';
import { useState } from 'react';
import { GitBranch, Wand2, Star, GitFork, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import GitHubConnect from '@/components/GitHubConnect';

export default function GitHubPage() {
  const [username, setUsername] = useState('');
  const [repoName, setRepoName] = useState('');
  const [results, setResults] = useState<any>(null);
  const [readme, setReadme] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [readmeLoading, setReadmeLoading] = useState(false);
  const [msg, setMsg] = useState('');

  async function handleAnalyze() {
    if (!username.trim()) return setMsg('Enter a GitHub username.');
    setLoading(true); setMsg(''); setResults(null);
    try {
      const data = await api.analyzeGitHub(username.trim());
      setResults(data);
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function handleReadme() {
    if (!username.trim() || !repoName.trim()) return setMsg('Enter both username and repo name.');
    setReadmeLoading(true); setMsg(''); setReadme(null);
    try {
      const data = await api.generateReadme(username.trim(), repoName.trim());
      setReadme(data);
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setReadmeLoading(false);
    }
  }

  const scoreColor = (s: number) => s >= 8 ? 'text-green-400' : s >= 6 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">GitHub Insights</h1>
        <p className="text-slate-400 text-sm mt-1">Analyse your repos and generate improved READMEs with local AI</p>
      </div>

      <GitHubConnect
        onChange={(s) => {
          if (s.connected && s.username && !username) setUsername(s.username);
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Analyse repos */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><GitBranch size={16} /> Analyse Repos</h2>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">GitHub Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. torvalds"
              onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <GitBranch size={15} /> {loading ? 'Analysing…' : 'Analyse Repos'}
          </button>
        </div>

        {/* Generate README */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><Wand2 size={16} /> Generate README</h2>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="github username"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Repository Name</label>
            <input
              value={repoName}
              onChange={(e) => setRepoName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="repo-name"
            />
          </div>
          <button
            onClick={handleReadme}
            disabled={readmeLoading}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Wand2 size={15} /> {readmeLoading ? 'Generating…' : 'Generate README'}
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded-lg px-4 py-3">{msg}</p>}

      {/* Repo analysis results */}
      {results && (
        <div>
          <h2 className="font-semibold text-white mb-3">Analysis: {results.username} ({results.total} repos)</h2>
          <div className="space-y-4">
            {results.analyses?.map(({ repo, url, analysis }: any) => (
              <div key={repo} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <a href={url} target="_blank" rel="noreferrer" className="font-semibold text-white hover:text-indigo-400">{repo}</a>
                      <span className={`text-sm font-bold ${scoreColor(analysis.overallScore)}`}>{analysis.overallScore}/10</span>
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{analysis.summary}</p>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {analysis.strengths?.length > 0 && (
                        <div>
                          <p className="text-xs text-green-400 font-medium mb-1 flex items-center gap-1"><CheckCircle2 size={11} /> Strengths</p>
                          <ul className="space-y-0.5">{analysis.strengths.slice(0,3).map((s: string,i: number)=><li key={i} className="text-xs text-slate-400">• {s}</li>)}</ul>
                        </div>
                      )}
                      {analysis.improvements?.length > 0 && (
                        <div>
                          <p className="text-xs text-yellow-400 font-medium mb-1 flex items-center gap-1"><AlertCircle size={11} /> Improvements</p>
                          <ul className="space-y-0.5">{analysis.improvements.slice(0,3).map((imp: any,i: number)=><li key={i} className="text-xs text-slate-400">• {imp.area}: {imp.suggestion?.slice(0,80)}</li>)}</ul>
                        </div>
                      )}
                    </div>
                    {analysis.missingFiles?.length > 0 && (
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {analysis.missingFiles.map((f: string)=><span key={f} className="text-xs bg-red-900/40 text-red-400 px-2 py-0.5 rounded">Missing: {f}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generated README */}
      {readme && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2"><Wand2 size={16} /> Generated README</h2>
          <pre className="bg-slate-900 rounded-lg p-4 text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
            {readme.newReadme}
          </pre>
          <button
            onClick={() => navigator.clipboard.writeText(readme.newReadme)}
            className="mt-3 text-xs text-indigo-400 hover:text-indigo-300"
          >
            Copy to clipboard
          </button>
        </div>
      )}
    </div>
  );
}
