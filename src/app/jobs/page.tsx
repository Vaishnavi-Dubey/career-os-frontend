'use client';
import { useEffect, useState } from 'react';
import { Plus, RefreshCw, ExternalLink, ChevronDown, Globe, Building2 } from 'lucide-react';
import { api } from '@/lib/api';

const STATUS_BADGE: Record<string,string> = {
  new:       'bg-indigo-900 text-indigo-300',
  reviewing: 'bg-yellow-900 text-yellow-300',
  applied:   'bg-blue-900 text-blue-300',
  interview: 'bg-violet-900 text-violet-300',
  offer:     'bg-green-900 text-green-300',
  rejected:  'bg-red-900 text-red-300',
  ignored:   'bg-slate-700 text-slate-400',
};

const STATUSES = ['new','reviewing','applied','interview','offer','rejected','ignored'];

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [queryInput, setQueryInput] = useState('');

  // Pipeline form
  const [pipelineQueries, setPipelineQueries] = useState('');
  const [pipelineLocations, setPipelineLocations] = useState('India');
  const [pipelineCompanies, setPipelineCompanies] = useState<string[]>([]);
  const [topN, setTopN] = useState(10);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filterMinScore, setFilterMinScore] = useState('');

  const [supportedCompanies, setSupportedCompanies] = useState<string[]>([]);
  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  const [msg, setMsg] = useState('');

  const load = () => {
    setLoading(true);
    const params: Record<string,string> = {};
    if (filterStatus) params.status = filterStatus;
    if (filterSource) params.source = filterSource;
    if (filterCompany) params.company = filterCompany;
    if (filterSearch) params.search = filterSearch;
    if (filterMinScore) params.minScore = filterMinScore;
    api.getJobs(params)
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch((e) => setMsg(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterSource, filterCompany, filterMinScore]);

  useEffect(() => {
    const id = setTimeout(load, 350);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterSearch]);

  useEffect(() => {
    api.getJobCompanies().then((d: any) => {
      setSupportedCompanies(d?.supported || []);
      setAllCompanies(d?.companies || []);
    }).catch(() => {});
    api.getJobSources().then((d: any) => setSources(d?.sources || [])).catch(() => {});
  }, []);

  const parseList = (s: string) =>
    s.split(/[\n,]/).map((x) => x.trim()).filter(Boolean);

  async function handleScrape() {
    const urls = urlInput.split('\n').map((u) => u.trim()).filter(Boolean);
    const userSkills = parseList(skillInput);
    if (!urls.length && !queryInput) return setMsg('Enter at least one URL or a RemoteOK search query.');
    setScraping(true); setMsg('');
    try {
      if (urls.length) await api.scrapeJobs(urls, userSkills);
      setMsg('Scraping started! Jobs will appear as they are processed.');
      setTimeout(load, 5000);
    } catch (e: any) { setMsg(`Error: ${e.message}`); }
    finally { setScraping(false); }
  }

  async function handleScrapeBoards() {
    const queries = parseList(pipelineQueries);
    if (!queries.length) return setMsg('Enter at least one query.');
    const locations = parseList(pipelineLocations);
    const userSkills = parseList(skillInput);
    setScraping(true); setMsg('');
    try {
      const r: any = await api.scrapeJobBoards(queries, locations.length ? locations : ['India'], userSkills);
      setMsg(`✅ ${r?.message || 'Job-board scrape started'} — ${queries.join(', ')}`);
      setTimeout(load, 8000);
    } catch (e: any) { setMsg(`Error: ${e.message}`); }
    finally { setScraping(false); }
  }

  async function handleScrapeCompanies() {
    const queries = parseList(pipelineQueries);
    if (!queries.length) return setMsg('Enter at least one query.');
    if (!pipelineCompanies.length) return setMsg('Pick at least one company below.');
    const userSkills = parseList(skillInput);
    setScraping(true); setMsg('');
    try {
      const r: any = await api.scrapeCompanyPages(pipelineCompanies, queries, userSkills);
      setMsg(`✅ ${r?.message || 'Company scrape started'} — ${pipelineCompanies.join(', ')}`);
      setTimeout(load, 8000);
    } catch (e: any) { setMsg(`Error: ${e.message}`); }
    finally { setScraping(false); }
  }

  async function handleScrapeAll() {
    const queries = parseList(pipelineQueries);
    if (!queries.length) return setMsg('Enter at least one query.');
    const locations = parseList(pipelineLocations);
    const userSkills = parseList(skillInput);
    setScraping(true); setMsg('');
    try {
      const r: any = await api.scrapeAll(queries, locations.length ? locations : ['India'], userSkills, topN);
      setMsg(`✅ ${r?.message || 'Full pipeline started'} — top ${topN} companies + boards`);
      setTimeout(load, 12000);
    } catch (e: any) { setMsg(`Error: ${e.message}`); }
    finally { setScraping(false); }
  }

  async function handleStatusChange(jobId: string, status: string) {
    try {
      await api.updateJobStatus(jobId, status);
      setJobs((prev) => prev.map((j) => j._id === jobId ? { ...j, status } : j));
    } catch (e: any) { setMsg(e.message); }
  }

  function toggleCompany(name: string) {
    setPipelineCompanies((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Jobs</h1>
          <p className="text-slate-400 text-sm mt-1">Scrape job boards & company career pages — all local</p>
        </div>
        <button onClick={load} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Pipeline form */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2"><Globe size={16} /> Auto-discover Jobs</h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Job titles / queries (comma or newline)</label>
            <textarea
              value={pipelineQueries}
              onChange={(e) => setPipelineQueries(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-20 resize-none focus:outline-none focus:border-indigo-500"
              placeholder="React developer, Backend engineer"
            />
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Locations (comma)</label>
              <input
                value={pipelineLocations}
                onChange={(e) => setPipelineLocations(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="India, Bangalore"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Your Skills (comma)</label>
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                placeholder="React, Node.js, Python"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs text-slate-400 mb-2 flex items-center gap-2">
            <Building2 size={12} /> Pick companies (for company-page scrape)
          </label>
          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1">
            {supportedCompanies.map((c) => {
              const active = pipelineCompanies.includes(c);
              return (
                <button
                  type="button"
                  key={c}
                  onClick={() => toggleCompany(c)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    active
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-900 border-slate-600 text-slate-300 hover:border-indigo-500'
                  }`}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleScrapeBoards}
            disabled={scraping}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={16} /> Scrape Job Boards
          </button>
          <button
            onClick={handleScrapeCompanies}
            disabled={scraping}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Building2 size={16} /> Scrape Selected Companies
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={handleScrapeAll}
              disabled={scraping}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Globe size={16} /> Scrape Everything
            </button>
            <span className="text-xs text-slate-400">top</span>
            <input
              type="number"
              min={1}
              max={supportedCompanies.length || 35}
              value={topN}
              onChange={(e) => setTopN(Number(e.target.value) || 10)}
              className="w-16 bg-slate-900 border border-slate-600 rounded-lg px-2 py-1 text-xs text-slate-200"
            />
            <span className="text-xs text-slate-400">companies</span>
          </div>
        </div>
        {msg && <p className="text-sm text-yellow-400">{msg}</p>}
      </div>

      <details className="bg-slate-800 border border-slate-700 rounded-xl">
        <summary className="px-6 py-3 cursor-pointer text-sm font-medium text-slate-300">Or scrape specific URLs</summary>
        <div className="px-6 pb-5 space-y-3">
          <textarea
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-20 resize-none focus:outline-none focus:border-indigo-500"
            placeholder="https://example.com/jobs/123 (one per line)"
          />
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            placeholder="RemoteOK search query (optional)"
          />
          <button
            onClick={handleScrape}
            disabled={scraping}
            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus size={16} /> Scrape URLs
          </button>
        </div>
      </details>

      <div className="flex items-center gap-2 flex-wrap bg-slate-800 border border-slate-700 rounded-xl p-3">
        <select
          value={filterSource}
          onChange={(e) => setFilterSource(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200"
        >
          <option value="">All sources</option>
          {sources.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={filterCompany}
          onChange={(e) => setFilterCompany(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200"
        >
          <option value="">All companies</option>
          {allCompanies.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="text"
          value={filterSearch}
          onChange={(e) => setFilterSearch(e.target.value)}
          placeholder="Search title / company / desc…"
          className="flex-1 min-w-[160px] bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200"
        />
        <select
          value={filterMinScore}
          onChange={(e) => setFilterMinScore(e.target.value)}
          className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-1.5 text-xs text-slate-200"
        >
          <option value="">Any score</option>
          <option value="8">8+ / 10</option>
          <option value="6">6+ / 10</option>
          <option value="4">4+ / 10</option>
        </select>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-slate-400">Status:</span>
        {['', ...STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
          >
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400 text-center py-12">Loading…</p>
      ) : jobs.length === 0 ? (
        <p className="text-slate-500 text-center py-12">No jobs found. Scrape some above!</p>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job._id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="font-semibold text-white truncate">{job.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_BADGE[job.status]}`}>{job.status}</span>
                    {job.relevanceScore > 0 && (
                      <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
                        Score: {job.relevanceScore}/10
                      </span>
                    )}
                    {job.source && (
                      <span className="text-xs text-indigo-300 bg-indigo-900/40 px-2 py-0.5 rounded-full">
                        {job.source}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">{job.company} · {job.location || 'Unknown'}</p>
                  {job.description && <p className="text-sm text-slate-500 mt-2 line-clamp-2">{job.description}</p>}
                  {job.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {job.skills.slice(0, 8).map((s: string) => (
                        <span key={s} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a href={job.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-white">
                    <ExternalLink size={16} />
                  </a>
                  <div className="relative group">
                    <button className="flex items-center gap-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg">
                      Update <ChevronDown size={12} />
                    </button>
                    <div className="absolute right-0 top-full mt-1 bg-slate-700 border border-slate-600 rounded-lg shadow-xl z-10 min-w-32 hidden group-hover:block">
                      {STATUSES.map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(job._id, s)}
                          className="block w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-slate-600 first:rounded-t-lg last:rounded-b-lg"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
