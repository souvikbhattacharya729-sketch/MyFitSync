import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Trash2, Edit2, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { api } from '../services/api';
import { WorkoutModal } from '../components/workouts/WorkoutModal';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

export const Workouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [exerciseFilter, setExerciseFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkout, setEditingWorkout] = useState(null);

  const fetchWorkouts = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page, page_size: pageSize };
      if (exerciseFilter) params.exercise = exerciseFilter;
      if (fromDate) params.from = fromDate;
      if (toDate) params.to = toDate;

      const res = await api.getWorkouts(params);
      setWorkouts(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (err) {
      setError(err.message || 'Failed to load workouts.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkouts();
  }, [page, exerciseFilter, fromDate, toDate]);

  const handleSave = async (workoutData) => {
    try {
      if (editingWorkout) {
        await api.updateWorkout(editingWorkout.id, workoutData);
      } else {
        await api.createWorkout(workoutData);
      }
      setIsModalOpen(false);
      setEditingWorkout(null);
      fetchWorkouts();
    } catch (err) {
      alert(`Error saving workout: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this workout entry?')) return;
    try {
      await api.deleteWorkout(id);
      fetchWorkouts();
    } catch (err) {
      alert(`Error deleting workout: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Dumbbell className="h-6 w-6 text-cyan-400" />
            <span>Workout Logs</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Full history of your training sets, tonnage, and calculated 1-rep maximums
          </p>
        </div>

        <button
          onClick={() => {
            setEditingWorkout(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-800 bg-[#131B2A] p-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={exerciseFilter}
          onChange={(e) => {
            setExerciseFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
        >
          <option value="">All Exercises</option>
          <option value="bench_press">Bench Press</option>
          <option value="squat">Squat</option>
          <option value="deadlift">Deadlift</option>
          <option value="overhead_press">Overhead Press</option>
          <option value="barbell_row">Barbell Row</option>
          <option value="pull_up">Pull Up</option>
        </select>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => {
              setFromDate(e.target.value);
              setPage(1);
            }}
            placeholder="From"
            className="rounded-xl border border-slate-800 bg-[#0B0F17] px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
          <span className="text-slate-500 text-xs">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            placeholder="To"
            className="rounded-xl border border-slate-800 bg-[#0B0F17] px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
          />
        </div>

        {(exerciseFilter || fromDate || toDate) && (
          <button
            onClick={() => {
              setExerciseFilter('');
              setFromDate('');
              setToDate('');
              setPage(1);
            }}
            className="text-xs text-slate-400 hover:text-white underline ml-auto"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table Content */}
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : error ? (
        <ErrorState title="Failed to load workouts" message={error} onRetry={fetchWorkouts} />
      ) : workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No workouts recorded for this filter"
          description="Log sets in plain English via the assistant or add one manually."
          actionText="Add Workout"
          onAction={() => {
            setEditingWorkout(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="rounded-2xl border border-slate-800 bg-[#131B2A] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="border-b border-slate-800 bg-[#0B0F17]/80 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Exercise</th>
                  <th className="px-4 py-3">Load</th>
                  <th className="px-4 py-3">Reps × Sets</th>
                  <th className="px-4 py-3">RPE</th>
                  <th className="px-4 py-3 text-cyan-400">Est. 1RM</th>
                  <th className="px-4 py-3">Total Volume</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {workouts.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">{w.performed_on}</td>
                    <td className="px-4 py-3 font-bold text-white capitalize">{w.exercise.replace('_', ' ')}</td>
                    <td className="px-4 py-3 font-medium text-white">{w.weight_kg} kg</td>
                    <td className="px-4 py-3">{w.reps} × {w.sets}</td>
                    <td className="px-4 py-3 font-mono">{w.rpe ? `@${w.rpe}` : '-'}</td>
                    <td className="px-4 py-3 font-bold text-cyan-400">{w.estimated_1rm ? `${w.estimated_1rm} kg` : '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-300">{w.total_volume} kg</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingWorkout(w);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
                          title="Edit Workout"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                          title="Delete Workout"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
            <span>
              Showing {workouts.length} of {total} entries (Page {page} of {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                aria-label="Next Page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <WorkoutModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingWorkout(null);
        }}
        onSave={handleSave}
        workout={editingWorkout}
      />
    </div>
  );
};
