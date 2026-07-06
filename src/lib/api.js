const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const json = await res.json();
  if (!json.success) throw new Error(json.error?.message || 'API error');
  return json.data;
}

export const api = {
  // Dashboard
  getStats: () => apiFetch('/api/dashboard/stats'),

  // Jobs
  getJobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/api/jobs${qs ? '?' + qs : ''}`);
  },
  scrapeJobs: (urls, userSkills) =>
    apiFetch('/api/jobs/scrape', { method: 'POST', body: JSON.stringify({ urls, userSkills }) }),
  scrapeJobBoards: (queries, locations = ['India'], userSkills = []) =>
    apiFetch('/api/jobs/scrape-board', {
      method: 'POST',
      body: JSON.stringify({ queries, locations, userSkills }),
    }),
  scrapeCompanyPages: (companies, queries, userSkills = []) =>
    apiFetch('/api/jobs/scrape-company', {
      method: 'POST',
      body: JSON.stringify({ companies, queries, userSkills }),
    }),
  scrapeAll: (queries, locations = ['India'], userSkills = [], topCompanies = 10) =>
    apiFetch('/api/jobs/scrape-all', {
      method: 'POST',
      body: JSON.stringify({ queries, locations, userSkills, topCompanies }),
    }),
  getJobCompanies: () => apiFetch('/api/jobs/companies'),
  getJobSources: () => apiFetch('/api/jobs/sources'),
  updateJobStatus: (id, status) =>
    apiFetch(`/api/jobs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),

  // Resume
  getResumes: () => apiFetch('/api/resume'),
  uploadBaseResume: (content) =>
    apiFetch('/api/resume/base', { method: 'POST', body: JSON.stringify({ content }) }),
  uploadResumeFile: async (file) => {
    const fd = new FormData();
    fd.append('resume', file);
    const res = await fetch(`${API}/api/resume/upload`, { method: 'POST', body: fd });
    const json = await res.json();
    if (!json.success) throw new Error(json.error?.message || 'Upload failed');
    return json.data;
  },
  parseResumeText: (text) =>
    apiFetch('/api/resume/parse-text', { method: 'POST', body: JSON.stringify({ text }) }),
  tailorResume: (jobId, baseResumeId) =>
    apiFetch('/api/resume/tailor', { method: 'POST', body: JSON.stringify({ jobId, baseResumeId }) }),
  downloadResume: (id) => `${API}/api/resume/${id}/download`,

  // GitHub
  analyzeGitHub: (username) =>
    apiFetch('/api/github/analyze', { method: 'POST', body: JSON.stringify({ username }) }),
  generateReadme: (username, repo) =>
    apiFetch('/api/github/readme', { method: 'POST', body: JSON.stringify({ username, repo }) }),

  // GitHub OAuth
  githubConnectUrl: () => `${API}/api/github/oauth/connect`,
  githubStatus: () => apiFetch('/api/github/oauth/status'),
  githubDisconnect: () => apiFetch('/api/github/oauth/disconnect', { method: 'DELETE' }),

  // Learning
  getLearningPlans: () => apiFetch('/api/learning'),
  generateLearningPlan: (data) =>
    apiFetch('/api/learning/generate', { method: 'POST', body: JSON.stringify(data) }),
  completeLearningItem: (planId, itemId) =>
    apiFetch(`/api/learning/${planId}/item/${itemId}/complete`, { method: 'PATCH' }),

  // Orchestrator
  getLogs: () => apiFetch('/api/orchestrator/logs'),
  runWorkflow: (workflow, params) =>
    apiFetch('/api/orchestrator/workflow', { method: 'POST', body: JSON.stringify({ workflow, params }) }),

  // Health
  health: () => apiFetch('/api/health'),
};
