'use client';
import { useEffect, useState } from 'react';
import { Upload, Sparkles, Download, Star } from 'lucide-react';
import { api } from '@/lib/api';

export default function ResumePage() {
  const [resumes, setResumes] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);
  const [baseContent, setBaseContent] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [loading, setLoading] = useState(true);
  const [tailoring, setTailoring] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [parsedSummary, setParsedSummary] = useState<any>(null);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    Promise.all([
      api.getResumes().then(setResumes),
      api.getJobs({ limit: 50 }).catch(() => []),
    ])
      .catch((e) => setMsg(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    api.getJobs({ limit: 50 })
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  async function handleFileUpload(file: File | undefined | null) {
    if (!file) return;
    setUploading(true); setMsg(''); setParsedSummary(null);
    try {
      const data: any = await api.uploadResumeFile(file);
      setParsedSummary({
        wordCount: data.wordCount,
        parseMethod: data.parseMethod,
        skills: data.structured?.skills || [],
        name: data.structured?.name,
        email: data.structured?.email,
      });
      setBaseContent(data.preview ? `${data.preview}…` : '');
      setMsg(`✅ Parsed ${data.parseMethod?.toUpperCase()} (${data.wordCount} words). Saved as base resume.`);
      const updated = await api.getResumes();
      setResumes(updated);
    } catch (e: any) {
      setMsg(`Upload failed: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    handleFileUpload(file);
  }

  async function handleUpload() {
    if (!baseContent.trim()) return setMsg('Paste your resume content first.');
    setUploading(true); setMsg('');
    try {
      await api.uploadBaseResume(baseContent);
      setMsg('Base resume saved!');
      api.getResumes().then(setResumes);
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setUploading(false);
    }
  }

  async function handleTailor() {
    if (!selectedJob) return setMsg('Select a job first.');
    setTailoring(true); setMsg('');
    try {
      await api.tailorResume(selectedJob);
      setMsg('Resume tailored successfully!');
      api.getResumes().then(setResumes);
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setTailoring(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Resume</h1>
        <p className="text-slate-400 text-sm mt-1">Upload your base resume and let the AI tailor it for each job</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload base */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><Upload size={16} /> Base Resume</h2>

          {/* Drag & drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={handleDrop}
            onClick={() => document.getElementById('resume-file-input')?.click()}
            className="border-2 border-dashed border-slate-600 hover:border-indigo-500 rounded-lg p-6 text-center cursor-pointer transition-colors"
          >
            <div className="text-3xl mb-2">📄</div>
            <p className="text-sm text-slate-300 font-medium">
              {uploading ? 'Parsing…' : 'Drop your resume here or click to upload'}
            </p>
            <p className="text-xs text-slate-500 mt-1">PDF, DOCX or TXT — max 10MB</p>
            {parsedSummary && (
              <p className="text-xs text-emerald-400 mt-2">
                {parsedSummary.parseMethod?.toUpperCase()} · {parsedSummary.wordCount} words
                {parsedSummary.name ? ` · ${parsedSummary.name}` : ''}
                {parsedSummary.skills?.length ? ` · ${parsedSummary.skills.slice(0, 5).join(', ')}` : ''}
              </p>
            )}
          </div>
          <input
            id="resume-file-input"
            type="file"
            accept=".pdf,.docx,.doc,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            className="hidden"
            onChange={(e) => handleFileUpload(e.target.files?.[0])}
          />

          <div className="text-xs text-slate-500 -mb-2">— or paste plain text —</div>
          <textarea
            value={baseContent}
            onChange={(e) => setBaseContent(e.target.value)}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 h-48 resize-none font-mono focus:outline-none focus:border-indigo-500"
            placeholder="Paste your full resume text here (plain text or markdown)…"
          />
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Upload size={15} /> {uploading ? 'Saving…' : 'Save Pasted Text as Base Resume'}
          </button>
        </div>

        {/* Tailor for job */}
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-white flex items-center gap-2"><Sparkles size={16} /> Tailor for a Job</h2>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Select Target Job</label>
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="">— Pick a scraped job —</option>
              {jobs.map((j) => (
                <option key={j._id} value={j._id}>{j.title} @ {j.company}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-slate-500">
            The AI will analyse the job description, identify skill gaps, and rewrite your resume to match.
            Uses llama3 locally — no data leaves your machine.
          </p>
          <button
            onClick={handleTailor}
            disabled={tailoring || !selectedJob}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Sparkles size={15} /> {tailoring ? 'Tailoring with AI…' : 'Tailor Resume'}
          </button>
        </div>
      </div>

      {msg && <p className="text-sm text-yellow-400 bg-yellow-900/20 border border-yellow-800 rounded-lg px-4 py-3">{msg}</p>}

      {/* Resume versions */}
      <div>
        <h2 className="font-semibold text-white mb-3">Resume Versions</h2>
        {loading ? (
          <p className="text-slate-400">Loading…</p>
        ) : resumes.length === 0 ? (
          <p className="text-slate-500 text-center py-8">No resume versions yet. Upload your base resume above.</p>
        ) : (
          <div className="space-y-3">
            {resumes.map((r: any) => (
              <div key={r._id} className="bg-slate-800 border border-slate-700 rounded-xl p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white">v{r.version} — {r.label}</span>
                      {r.isBase && <span className="text-xs bg-blue-900 text-blue-300 px-2 py-0.5 rounded-full">Base</span>}
                      {r.score && (
                        <span className="flex items-center gap-1 text-xs text-yellow-400">
                          <Star size={11} fill="currentColor" /> {r.score}/10
                        </span>
                      )}
                    </div>
                    {r.targetJobTitle && (
                      <p className="text-sm text-slate-400 mt-0.5">Tailored for: {r.targetJobTitle} @ {r.targetCompany}</p>
                    )}
                    {r.improvements?.length > 0 && (
                      <ul className="mt-2 space-y-0.5">
                        {r.improvements.slice(0, 4).map((imp: string, i: number) => (
                          <li key={i} className="text-xs text-slate-500">• {imp}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <a
                    href={api.downloadResume(r._id)}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 bg-indigo-900/30 px-3 py-1.5 rounded-lg"
                  >
                    <Download size={13} /> Download
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
