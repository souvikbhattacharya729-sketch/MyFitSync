import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { api } from '../services/api';
import { useFitness } from '../context/FitnessContext';
import { NutritionModal } from '../components/nutrition/NutritionModal';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';
import { Card3D } from '../components/common/Card3D';

export const Nutrition = () => {
  const { user } = useFitness();
  const [entries, setEntries] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyTotals, setDailyTotals] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  const fetchNutrition = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [listRes, totalsRes] = await Promise.all([
        api.getNutrition({ page, page_size: pageSize }),
        api.getNutritionTotals(selectedDate).catch(() => null),
      ]);
      setEntries(listRes.items);
      setTotal(listRes.total);
      setTotalPages(listRes.total_pages);
      setDailyTotals(totalsRes);
    } catch (err) {
      setError(err.message || 'Failed to load nutrition entries.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNutrition();
  }, [page, selectedDate]);

  const handleSave = async (data) => {
    try {
      if (editingEntry) {
        await api.updateNutrition(editingEntry.id, data);
      } else {
        await api.createNutrition(data);
      }
      setIsModalOpen(false);
      setEditingEntry(null);
      fetchNutrition();
    } catch (err) {
      alert(`Error saving nutrition: ${err.message}`);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this nutrition entry?')) return;
    try {
      await api.deleteNutrition(id);
      fetchNutrition();
    } catch (err) {
      alert(`Error deleting entry: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 text-sage-forest">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-sage-forest flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-mint text-sage-action border border-sage-sage/30 shadow-sm">
              <Utensils className="h-5 w-5" />
            </div>
            <span>Nutrition & Macro Tracking</span>
          </h1>
          <p className="text-xs text-sage-muted mt-0.5">
            Smart nutrition tracking with automatic macro estimation & Atwater 4/4/9 validation
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-sage-action hover:bg-sage-forest px-5 py-2.5 text-xs font-bold text-white shadow-card active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Log Meal (Smart Auto-Fill)</span>
        </button>
      </div>

      {/* Daily Summary Card for selected date */}
      {dailyTotals && (
        <Card3D className="rounded-2xl border border-sage-border bg-white p-5 shadow-card">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-sage-muted">Daily Totals for:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-sage-border bg-white px-3 py-1.5 text-xs font-semibold text-sage-forest focus:border-sage-action focus:outline-none shadow-sm"
              />
            </div>

            <div className="text-xs font-bold text-sage-action">
              {dailyTotals.calories} / {dailyTotals.target_calories} kcal ({dailyTotals.calories_pct}%)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-sage-surface/80 p-3.5 border border-sage-border/60">
              <span className="text-[10px] text-sage-muted font-bold uppercase">Calories</span>
              <div className="text-xl font-black text-sage-forest mt-0.5">{dailyTotals.calories} <span className="text-xs font-normal text-sage-muted">kcal</span></div>
              <span className="text-[10px] text-sage-muted">
                {Math.max(0, dailyTotals.target_calories - dailyTotals.calories)} remaining
              </span>
            </div>

            <div className="rounded-xl bg-sage-mint/40 p-3.5 border border-sage-sage/30">
              <span className="text-[10px] text-sage-action font-bold uppercase">Protein</span>
              <div className="text-xl font-black text-sage-forest mt-0.5">{dailyTotals.protein_g}g</div>
              <span className="text-[10px] text-sage-muted">{dailyTotals.macro_split?.protein_calories || 0} kcal</span>
            </div>

            <div className="rounded-xl bg-sage-surface/80 p-3.5 border border-sage-border/60">
              <span className="text-[10px] text-sage-forest font-bold uppercase">Carbs</span>
              <div className="text-xl font-black text-sage-forest mt-0.5">{dailyTotals.carbs_g}g</div>
              <span className="text-[10px] text-sage-muted">{dailyTotals.macro_split?.carbs_calories || 0} kcal</span>
            </div>

            <div className="rounded-xl bg-sage-surface/80 p-3.5 border border-sage-border/60">
              <span className="text-[10px] text-sage-muted font-bold uppercase">Fat</span>
              <div className="text-xl font-black text-sage-forest mt-0.5">{dailyTotals.fat_g}g</div>
              <span className="text-[10px] text-sage-muted">{dailyTotals.macro_split?.fat_calories || 0} kcal</span>
            </div>
          </div>
        </Card3D>
      )}

      {/* Entries List */}
      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : error ? (
        <ErrorState title="Failed to load nutrition" message={error} onRetry={fetchNutrition} />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No meals logged yet"
          description="Type what you ate in natural English (e.g. 'ate 2 boiled eggs') or use the smart meal logger."
          actionText="Log First Meal"
          onAction={() => {
            setEditingEntry(null);
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
                  <th className="px-4 py-3.5">Meal</th>
                  <th className="px-4 py-3.5 text-sage-action font-black">Calories</th>
                  <th className="px-4 py-3.5 text-sage-forest font-bold">Protein</th>
                  <th className="px-4 py-3.5 text-sage-forest font-bold">Carbs</th>
                  <th className="px-4 py-3.5 text-sage-forest font-bold">Fat</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sage-border">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-sage-surface/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-sage-muted">{entry.eaten_on}</td>
                    <td className="px-4 py-3 font-bold text-sage-forest">{entry.meal_title || 'Meal'}</td>
                    <td className="px-4 py-3 font-black text-sage-action">{entry.calories ? `${entry.calories} kcal` : '-'}</td>
                    <td className="px-4 py-3 font-semibold text-sage-forest">{entry.protein_g ? `${entry.protein_g}g` : '-'}</td>
                    <td className="px-4 py-3 font-semibold text-sage-forest">{entry.carbs_g ? `${entry.carbs_g}g` : '-'}</td>
                    <td className="px-4 py-3 font-semibold text-sage-muted">{entry.fat_g ? `${entry.fat_g}g` : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-sage-muted hover:text-sage-forest hover:bg-sage-mint transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-lg p-1.5 text-sage-muted hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Delete"
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

          <div className="flex items-center justify-between border-t border-sage-border px-4 py-3.5 text-xs text-sage-muted bg-white">
            <span>Showing {entries.length} of {total} entries</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="rounded-xl border border-sage-border bg-white p-2 text-sage-muted hover:text-sage-forest hover:bg-sage-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded-xl border border-sage-border bg-white p-2 text-sage-muted hover:text-sage-forest hover:bg-sage-surface disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <NutritionModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingEntry(null);
        }}
        onSave={handleSave}
        entry={editingEntry}
      />
    </div>
  );
};
