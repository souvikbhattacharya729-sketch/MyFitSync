import React, { useState, useEffect, useCallback } from 'react';
import { 
  Moon, 
  Heart, 
  Activity, 
  Plus, 
  Trash2, 
  Edit3, 
  Info, 
  Calendar,
  AlertCircle 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  Legend 
} from 'recharts';
import { api } from '../services/api';
import { ReadinessModal } from '../components/recovery/ReadinessModal';
import { Skeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export const Recovery = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [viewTableAccessible, setViewTableAccessible] = useState(false);

  const fetchReadiness = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getReadiness({ page_size: 50 });
      setEntries(data.items || []);
    } catch (err) {
      setError(err.message || 'Failed to load recovery data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  const handleOpenAdd = () => {
    setEditingEntry(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (entry) => {
    setEditingEntry(entry);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this recovery entry?')) return;
    try {
      await api.deleteReadiness(id);
      fetchReadiness();
    } catch (err) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingEntry) {
        await api.updateReadiness(editingEntry.id, data);
      } else {
        await api.createOrUpdateReadiness(data);
      }
      setIsModalOpen(false);
      fetchReadiness();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    }
  };

  // Calculations for summary
  const totalEntries = entries.length;
  const avgSleep = totalEntries > 0
    ? (entries.reduce((acc, curr) => acc + (curr.sleep_hours || 0), 0) / entries.filter(e => e.sleep_hours != null).length || 0).toFixed(1)
    : '—';
  const avgSoreness = totalEntries > 0
    ? (entries.reduce((acc, curr) => acc + (curr.soreness_score || 0), 0) / entries.filter(e => e.soreness_score != null).length || 0).toFixed(1)
    : '—';
  const avgRhr = totalEntries > 0
    ? Math.round(entries.reduce((acc, curr) => acc + (curr.resting_hr || 0), 0) / entries.filter(e => e.resting_hr != null).length || 0)
    : '—';

  // Prepare chronological data for charts
  const chronologicalData = [...entries].sort((a, b) => new Date(a.logged_date) - new Date(b.logged_date));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white">Recovery & Readiness</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Track restorative sleep, muscle fatigue ratings, and resting cardiovascular baseline.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Log Recovery
        </button>
      </div>

      {/* Mandatory Clinical Disclaimer */}
      <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-amber-300">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">Training Guidance Only: </span>
          Recovery metrics and soreness ratings are self-reported indicators of training fatigue and restorative capacity. They do not constitute medical, cardiovascular, or diagnostic assessments. Consult a licensed healthcare professional for medical concerns.
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Sleep</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Moon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{avgSleep}</span>
            <span className="text-xs text-slate-400">hrs/night</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Soreness</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{avgSoreness}</span>
            <span className="text-xs text-slate-400">/ 10 rating</span>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Resting HR</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/10 text-rose-400">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-white">{avgRhr}</span>
            <span className="text-xs text-slate-400">bpm</span>
          </div>
        </div>
      </div>

      {/* Error / Loading State */}
      {loading ? (
        <Skeleton height="h-72" />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchReadiness} />
      ) : entries.length === 0 ? (
        <EmptyState
          title="No recovery records logged"
          description="Log your daily sleep hours, muscle soreness, or resting heart rate to reveal your readiness baseline."
          actionText="Log First Recovery"
          onAction={handleOpenAdd}
        />
      ) : (
        <>
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sleep Duration Trend */}
            <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-sm font-bold text-white">Sleep Duration History</h3>
                </div>
                <span className="text-xs text-slate-400">Target: 7–9 hrs</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chronologicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="logged_date" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={11} domain={[0, 12]} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                      formatter={(val) => [`${val} hours`, 'Sleep']}
                    />
                    <Bar dataKey="sleep_hours" fill="#6366F1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Soreness & Resting Heart Rate Trend */}
            <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-rose-400" />
                  <h3 className="text-sm font-bold text-white">Fatigue & Resting HR</h3>
                </div>
                <span className="text-xs text-slate-400">Trend over time</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chronologicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                    <XAxis dataKey="logged_date" stroke="#64748B" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#F59E0B" fontSize={11} domain={[1, 10]} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#F43F5E" fontSize={11} domain={[40, 110]} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0B0F17', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="soreness_score" name="Soreness (1-10)" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                    <Line yAxisId="right" type="monotone" dataKey="resting_hr" name="Resting HR (bpm)" stroke="#F43F5E" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Recovery Log Table */}
          <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">Recorded Daily Readiness</h3>
              <button
                onClick={() => setViewTableAccessible(!viewTableAccessible)}
                className="text-xs text-slate-400 hover:text-emerald-400 underline"
              >
                {viewTableAccessible ? 'Standard Compact View' : 'Accessible High-Contrast View'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-400 bg-slate-900/50">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Sleep (hrs)</th>
                    <th className="py-3 px-4">Soreness</th>
                    <th className="py-3 px-4">Resting HR</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-slate-500" />
                        {entry.logged_date}
                      </td>
                      <td className="py-3.5 px-4">
                        {entry.sleep_hours != null ? `${entry.sleep_hours} hrs` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {entry.soreness_score != null ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            entry.soreness_score <= 3 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            entry.soreness_score <= 6 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}>
                            {entry.soreness_score} / 10
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {entry.resting_hr != null ? `${entry.resting_hr} bpm` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Edit / Add Modal */}
      <ReadinessModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        entry={editingEntry}
      />
    </div>
  );
};
