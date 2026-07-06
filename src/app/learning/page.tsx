'use client';
import { useEffect, useState } from 'react';
import { GraduationCap, Plus, CheckCircle2, Circle, ChevronDown, ChevronRight } from 'lucide-react';
import { api } from '@/lib/api';

const PRIORITY_COLOR: Record<string,string> = { high: 'text-red-400 bg-red-900/30', medium: 'text-yellow-400 bg-yellow-900/30', low: 'text-slate-400 bg-slate-700' };

export default function LearningPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [expanded, setExpanded] = useState(null);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ targetRole: '', userSkills: '' });

  const load = () => {
    setLoading(true);
    api.getLearningPlans().then(setPlans).catch((e) => setMsg(e.message)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  async function handleGenerate() {
    if (!form.targetRole.trim()) return setMsg('Enter a target role.');
    setGenerating(true); setMsg('');
    try {
      await api.generateLearningPlan({
        targetRole: form.targetRole,
        userSkills: form.userSkills.split(',').map((s) => s.trim()).filter(Boolean),
      });
      setMsg('Learning plan generated!');
      load();
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setGenerating(false);
    }
  }

  async function handleComplete(planId: string, itemId: string) {
    try {
      await api.completeLearningItem(planId, itemId);
      load();
    } catch (e: any) {
      setMsg(e.message);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Learning Roadmap</h1>
        <p className="text-slate-400 text-sm mt-1">AI-generated skill gap analysis and personalised learning plans</p>
      </div>

      {/* Generate form */}
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-white flex items-center gap-2"><Plus size={16} /> Generate New Plan</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Role</label>
            <input
              value={form.targetRole}
              onChange={(e) => setForm((f) => ({ ...f, targetRole: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="e.g. Senior Full Stack Engineer"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Your Current Skills (comma-separated)</label>
            <input
              value={form.userSkills}
              onChange={(e) => setForm((f) => ({ ...f, userSkills: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
              placeholder="JavaScript, React, Git"
            />
          </div>
        </div>
        {msg && <p className="text-sm text-yellow-400">{msg}</p>}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          <GraduationCap size={15} /> {generating ? 'Generating plan with llama3…' : 'Generate Roadmap'}
        </button>
      </div>

      {/* Plans list */}
      {loading ? (
        <p className="text-slate-400 text-center py-8">Loading…</p>
      ) : plans.length === 0 ? (
        <p className="text-slate-500 text-center py-8">No learning plans yet. Generate one above!</p>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => (
            <div key={plan._id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
              {/* Plan header */}
              <button
                onClick={() => setExpanded(expanded === plan._id ? null : plan._id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-750"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-white">{plan.targetRole}</h3>
                    <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded">{plan.roadmap?.length || 0} items</span>
                  </div>
                  <p className="text-sm text-slate-400 mt-0.5">
                    {plan.skillGaps?.length || 0} skill gaps · {plan.progressPercent || 0}% complete
                  </p>
                  {/* Progress bar */}
                  <div className="w-48 bg-slate-700 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-violet-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${plan.progressPercent || 0}%` }}
                    />
                  </div>
                </div>
                {expanded === plan._id ? <ChevronDown size={18} className="text-slate-400" /> : <ChevronRight size={18} className="text-slate-400" />}
              </button>

              {/* Expanded roadmap */}
              {expanded === plan._id && (
                <div className="border-t border-slate-700 p-5">
                  {plan.rawPlan && (
                    <p className="text-sm text-slate-400 mb-4 bg-slate-900 rounded-lg p-3">{plan.rawPlan}</p>
                  )}

                  {plan.skillGaps?.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      <span className="text-xs text-slate-500 mr-1">Gaps:</span>
                      {plan.skillGaps.map((g: string) => (
                        <span key={g} className="text-xs bg-red-900/30 text-red-400 px-2 py-0.5 rounded">{g}</span>
                      ))}
                    </div>
                  )}

                  <div className="space-y-3">
                    {(plan.roadmap || []).map((item: any) => (
                      <div
                        key={item._id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${item.completed ? 'border-slate-700/40 opacity-60' : 'border-slate-700'}`}
                      >
                        <button
                          onClick={() => !item.completed && handleComplete(plan._id, item._id)}
                          className="mt-0.5 shrink-0"
                          disabled={item.completed}
                        >
                          {item.completed
                            ? <CheckCircle2 size={18} className="text-green-400" />
                            : <Circle size={18} className="text-slate-500 hover:text-white" />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-medium text-sm ${item.completed ? 'line-through text-slate-500' : 'text-white'}`}>{item.skill}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${PRIORITY_COLOR[item.priority] || PRIORITY_COLOR.low}`}>{item.priority}</span>
                            {item.estimatedDays && <span className="text-xs text-slate-500">{item.estimatedDays}d</span>}
                          </div>
                          {item.resources?.length > 0 && (
                            <ul className="mt-1 space-y-0.5">
                              {item.resources.slice(0, 3).map((r: string, i: number) => (
                                <li key={i} className="text-xs text-indigo-400/80">→ {r}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
