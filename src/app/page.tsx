'use client';
import { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Briefcase, FileText, GraduationCap, Activity, Zap } from 'lucide-react';
import { api } from '@/lib/api';

const STATUS_COLORS: Record<string,string> = {
  new: '#6366f1', reviewing: '#f59e0b', applied: '#3b82f6',
  interview: '#8b5cf6', offer: '#22c55e', rejected: '#ef4444', ignored: '#64748b',
};

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: any; color: string }) {
  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${color}`}><Icon size={20} className="text-white" /></div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-slate-400">{label}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getStats().then(setStats).catch((e) => setError(e.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400 pt-16 text-center">Loading dashboard…</div>;
  if (error) return (
    <div className="text-red-400 pt-16 text-center">
      <p>Error: {error}</p>
      <p className="text-xs text-slate-500 mt-2">Is the backend running? Run: cd backend &amp;&amp; npm run dev</p>
    </div>
  );

  const jobChartData = Object.entries(stats?.jobs?.byStatus || {}).map(([status, count]) => ({ status, count }));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Your autonomous career system at a glance</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Briefcase}     label="Total Jobs"      value={stats?.jobs?.total}                 color="bg-indigo-600" />
        <StatCard icon={FileText}      label="Resume Versions" value={stats?.resumes}                      color="bg-blue-600" />
        <StatCard icon={GraduationCap} label="Learning Plans"  value={stats?.learningPlans}                color="bg-violet-600" />
        <StatCard icon={Activity}      label="Applied"         value={stats?.jobs?.byStatus?.applied || 0} color="bg-green-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Jobs by Status</h2>
          {jobChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={jobChartData} barCategoryGap="30%">
                <XAxis dataKey="status" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }} />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {jobChartData.map((entry) => <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#6366f1'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-500 text-sm text-center py-12">No jobs yet — go to Jobs and scrape some!</p>
          )}
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-base font-semibold text-white mb-4">Top Required Skills</h2>
          <div className="space-y-2">
            {(stats?.topSkills || []).slice(0, 8).map((s: any) => (
              <div key={s.skill} className="flex items-center gap-3">
                <span className="text-sm text-slate-300 w-32 truncate">{s.skill}</span>
                <div className="flex-1 bg-slate-700 rounded-full h-2">
                  <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${Math.min(100, (s.count / (stats.topSkills[0]?.count || 1)) * 100)}%` }} />
                </div>
                <span className="text-xs text-slate-500 w-6 text-right">{s.count}</span>
              </div>
            ))}
            {!stats?.topSkills?.length && <p className="text-slate-500 text-sm text-center py-8">No skill data yet</p>}
          </div>
        </div>
      </div>

      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
        <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
          <Zap size={16} className="text-yellow-400" /> Recent Agent Activity
        </h2>
        <div className="space-y-1">
          {(stats?.recentActivity || []).map((log: any) => (
            <div key={log._id} className="flex items-center justify-between py-2 border-b border-slate-700/60 last:border-0">
              <div className="flex items-center gap-3">
                <span className={`w-2 h-2 rounded-full ${log.status === 'success' ? 'bg-green-400' : 'bg-red-400'}`} />
                <span className="text-sm text-slate-300 font-medium">{log.agentName}</span>
                <span className="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">{log.taskType}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                {log.durationMs && <span>{(log.durationMs / 1000).toFixed(1)}s</span>}
                <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
          {!stats?.recentActivity?.length && <p className="text-slate-500 text-sm text-center py-4">No activity yet</p>}
        </div>
      </div>
    </div>
  );
}
