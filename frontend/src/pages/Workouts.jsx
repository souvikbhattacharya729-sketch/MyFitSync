import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Trash2, Edit2, Filter, ChevronLeft, ChevronRight, Activity, Zap } from 'lucide-react';
import { api } from '../services/api';
import { WorkoutModal } from '../components/workouts/WorkoutModal';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Card3D } from '../components/common/Card3D';

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
          <h1 className="text-2xl font-black tracking-tight text-sage-forest flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30 shadow-sm">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span>Training & Workout Logs</span>
          </h1>
          <p className="text-xs text-sage-muted mt-0.5">
            Full history of your training sets, tonnage, and calculated 1-rep maximums
          </p>
        </div>

        <button
          onClick={() => {
            setEditingWorkout(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-sage-action hover:bg-sage-forest px-5 py-2.5 text-xs font-bold text-white shadow-card active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Manual Entry</span>
        </button>
      </div>

      {/* Filters Bar */}
      <Card3D className="flex flex-wrap items-center gap-3 rounded-2xl border border-sage-border bg-white p-4 text-sage-forest shadow-card">
        <div className="flex items-center gap-2 text-xs font-semibold text-sage-muted">
          <Filter className="h-3.5 w-3.5" />
          <span>Filters:</span>
        </div>

        <select
          value={exerciseFilter}
          onChange={(e) => {
            setExerciseFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-xl border border-sage-border bg-white px-3 py-1.5 text-xs font-semibold text-sage-forest focus:border-sage-action focus:outline-none shadow-sm"
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
            className="rounded-xl border border-sage-border bg-white px-2.5 py-1.5 text-xs text-sage-forest focus:border-sage-action focus:outline-none shadow-sm"
          />
          <span className="text-sage-muted text-xs">to</span>
          <input
            type="date"
            value={toDate}
            onChange={(e) => {
              setToDate(e.target.value);
              setPage(1);
            }}
            placeholder="To"
            className="rounded-xl border border-sage-border bg-white px-2.5 py-1.5 text-xs text-sage-forest focus:border-sage-action focus:outline-none shadow-sm"
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
            className="text-xs text-sage-muted hover:text-sage-action underline ml-auto font-medium"
          >
            Clear Filters
          </button>
        )}
      </Card3D>

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
        <div className="rounded-2xl border border-sage-border bg-white overflow-hidden shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-sage-muted">
              <thead className="border-b border-sage-border bg-sage-surface text-sage-forest uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3.5">Date</th>
                  <th className="px-4 py-3.5">Exercise</th>
                  <th className="px-4 py-3.5">Load</th>
                  <th className="px-4 py-3.5">Reps × Sets</th>
                  <th className="px-4 py-3.5">RPE</th>
                  <th className="px-4 py-3.5 text-sage-action font-black">Est. 1RM</th>
                  <th className="px-4 py-3.5">Total Volume</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-border">
                {workouts.map((w) => (
                  <tr key={w.id} className="hover:bg-sage-surface/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-sage-forest">{w.performed_on}</td>
                    <td className="px-4 py-3 font-bold text-sage-forest capitalize">{w.exercise.replace('_', ' ')}</td>
                    <td className="px-4 py-3 font-semibold text-sage-forest">{w.weight_kg} kg</td>
                    <td className="px-4 py-3 font-medium text-sage-forest">{w.reps} × {w.sets}</td>
                    <td className="px-4 py-3 font-mono text-sage-muted">{w.rpe ? `@${w.rpe}` : '-'}</td>
                    <td className="px-4 py-3 font-black text-sage-action">{w.estimated_1rm ? `${w.estimated_1rm} kg` : '-'}</td>
                    <td className="px-4 py-3 font-medium text-sage-forest">{w.total_volume} kg</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingWorkout(w);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-sage-muted hover:text-sage-forest hover:bg-sage-mint transition-colors"
                          title="Edit Workout"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(w.id)}
                          className="rounded-lg p-1.5 text-sage-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
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
          <div className="flex items-center justify-between border-t border-sage-border px-4 py-3.5 text-xs text-sage-muted bg-white">
            <span>
              Showing {workouts.length} of {total} entries (Page {page} of {totalPages})
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="rounded-xl border border-sage-border p-2 text-sage-muted hover:text-sage-forest hover:bg-sage-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded-xl border border-sage-border p-2 text-sage-muted hover:text-sage-forest hover:bg-sage-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
