import React, { useState, useEffect, useCallback } from 'react';
import { 
  Moon, 
  Heart, 
  Activity, 
  Plus, 
  Trash2, 
  Edit3, 
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
import { Card3D } from '../components/common/Card3D';

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
    <div className="space-y-6 text-sage-forest">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-sage-forest flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30 shadow-sm">
              <Moon className="h-5 w-5" />
            </div>
            <span>Recovery & Readiness</span>
          </h1>
          <p className="text-xs text-sage-muted mt-0.5">
            Track restorative sleep, muscle fatigue ratings, and resting cardiovascular baseline.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sage-action hover:bg-sage-forest text-white font-bold text-xs transition-all shadow-card active:scale-95 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Log Recovery
        </button>
      </div>

      {/* Mandatory Clinical Disclaimer */}
      <div className="flex items-start gap-3 rounded-2xl border border-sage-border bg-sage-surface/80 p-4 text-xs text-sage-forest">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-sage-action" />
        <div>
          <span className="font-bold">Training Guidance Only: </span>
          Recovery metrics and soreness ratings are self-reported indicators of training fatigue and restorative capacity. They do not constitute medical, cardiovascular, or diagnostic assessments. Consult a licensed healthcare professional for medical concerns.
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card3D className="rounded-2xl border border-sage-border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sage-muted">Avg Sleep</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/20">
              <Moon className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-sage-forest">{avgSleep}</span>
            <span className="text-xs text-sage-muted font-medium">hrs/night</span>
          </div>
        </Card3D>

        <Card3D className="rounded-2xl border border-sage-border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sage-muted">Avg Soreness</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-surface text-sage-forest border border-sage-border">
              <Activity className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-sage-forest">{avgSoreness}</span>
            <span className="text-xs text-sage-muted font-medium">/ 10 rating</span>
          </div>
        </Card3D>

        <Card3D className="rounded-2xl border border-sage-border bg-white p-5 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-sage-muted">Avg Resting HR</span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sage-mint text-sage-forest border border-sage-sage/20">
              <Heart className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-sage-forest">{avgRhr}</span>
            <span className="text-xs text-sage-muted font-medium">bpm</span>
          </div>
        </Card3D>
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
            <Card3D className="rounded-2xl border border-sage-border bg-white p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-sage-action" />
                  <h3 className="text-sm font-bold text-sage-forest">Sleep Duration History</h3>
                </div>
                <span className="text-xs text-sage-muted">Target: 7–9 hrs</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chronologicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5EDE7" vertical={false} />
                    <XAxis dataKey="logged_date" stroke="#77847C" fontSize={11} tickLine={false} />
                    <YAxis stroke="#77847C" fontSize={11} domain={[0, 12]} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5EDE7', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 4px 20px -2px rgba(38,61,50,0.1)' }}
                      formatter={(val) => [`${val} hours`, 'Sleep']}
                    />
                    <Bar dataKey="sleep_hours" fill="#6BA985" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card3D>

            {/* Soreness & Resting Heart Rate Trend */}
            <Card3D className="rounded-2xl border border-sage-border bg-white p-5 shadow-card">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-sage-forest" />
                  <h3 className="text-sm font-bold text-sage-forest">Fatigue & Resting HR</h3>
                </div>
                <span className="text-xs text-sage-muted">Trend over time</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chronologicalData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5EDE7" vertical={false} />
                    <XAxis dataKey="logged_date" stroke="#77847C" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#6BA985" fontSize={11} domain={[1, 10]} tickLine={false} />
                    <YAxis yAxisId="right" orientation="right" stroke="#263D32" fontSize={11} domain={[40, 110]} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#E5EDE7', borderRadius: '0.75rem', fontSize: '12px', boxShadow: '0 4px 20px -2px rgba(38,61,50,0.1)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line yAxisId="left" type="monotone" dataKey="soreness_score" name="Soreness (1-10)" stroke="#6BA985" strokeWidth={2.5} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="resting_hr" name="Resting HR (bpm)" stroke="#263D32" strokeWidth={2.5} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card3D>
          </div>

          {/* Recovery Log Table */}
          <div className="rounded-2xl border border-sage-border bg-white p-5 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-sage-forest">Recorded Daily Readiness</h3>
              <button
                onClick={() => setViewTableAccessible(!viewTableAccessible)}
                className="text-xs text-sage-muted hover:text-sage-action underline font-medium"
              >
                {viewTableAccessible ? 'Standard Compact View' : 'Accessible High-Contrast View'}
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-sage-muted">
                <thead className="border-b border-sage-border text-[10px] uppercase font-bold tracking-wider text-sage-forest bg-sage-surface">
                  <tr>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Sleep (hrs)</th>
                    <th className="py-3 px-4">Soreness</th>
                    <th className="py-3 px-4">Resting HR</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sage-border">
                  {entries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-sage-surface/60 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-medium text-sage-forest flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-sage-muted" />
                        {entry.logged_date}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-sage-forest">
                        {entry.sleep_hours != null ? `${entry.sleep_hours} hrs` : '—'}
                      </td>
                      <td className="py-3.5 px-4">
                        {entry.soreness_score != null ? (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                            entry.soreness_score <= 3 ? 'bg-sage-mint text-sage-action border border-sage-sage/40' :
                            entry.soreness_score <= 6 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {entry.soreness_score} / 10
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-sage-forest">
                        {entry.resting_hr != null ? `${entry.resting_hr} bpm` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEdit(entry)}
                            className="p-1.5 rounded-lg text-sage-muted hover:text-sage-forest hover:bg-sage-mint transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="p-1.5 rounded-lg text-sage-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
