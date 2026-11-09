import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';
import { useFitness } from '../context/FitnessContext';
import { NutritionModal } from '../components/nutrition/NutritionModal';
import { TableSkeleton } from '../components/common/Skeleton';
import { EmptyState } from '../components/common/EmptyState';
import { ErrorState } from '../components/common/ErrorState';

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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Utensils className="h-6 w-6 text-emerald-400" />
            <span>Nutrition & Macro Tracking</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Real macronutrient distribution with Atwater 4/4/9 caloric validation
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-emerald-500/20 hover:opacity-90 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Log Meal</span>
        </button>
      </div>

      {/* Daily Summary Card for selected date */}
      {dailyTotals && (
        <div className="rounded-2xl border border-slate-800 bg-[#131B2A] p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Daily Totals for:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-slate-800 bg-[#0B0F17] px-3 py-1.5 text-xs font-semibold text-white focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="text-xs font-bold text-emerald-400">
              {dailyTotals.calories} / {dailyTotals.target_calories} kcal ({dailyTotals.calories_pct}%)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[#0B0F17]/60 p-3 border border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Calories</span>
              <div className="text-lg font-bold text-white mt-0.5">{dailyTotals.calories} kcal</div>
              <span className="text-[10px] text-slate-500">{dailyTotals.target_calories - dailyTotals.calories} remaining</span>
            </div>

            <div className="rounded-xl bg-[#0B0F17]/60 p-3 border border-slate-800/80">
              <span className="text-[10px] text-cyan-400 font-semibold uppercase">Protein</span>
              <div className="text-lg font-bold text-white mt-0.5">{dailyTotals.protein_g}g</div>
              <span className="text-[10px] text-slate-500">{dailyTotals.macro_split?.protein_calories || 0} kcal</span>
            </div>

            <div className="rounded-xl bg-[#0B0F17]/60 p-3 border border-slate-800/80">
              <span className="text-[10px] text-amber-400 font-semibold uppercase">Carbs</span>
              <div className="text-lg font-bold text-white mt-0.5">{dailyTotals.carbs_g}g</div>
              <span className="text-[10px] text-slate-500">{dailyTotals.macro_split?.carbs_calories || 0} kcal</span>
            </div>

            <div className="rounded-xl bg-[#0B0F17]/60 p-3 border border-slate-800/80">
              <span className="text-[10px] text-rose-400 font-semibold uppercase">Fat</span>
              <div className="text-lg font-bold text-white mt-0.5">{dailyTotals.fat_g}g</div>
              <span className="text-[10px] text-slate-500">{dailyTotals.macro_split?.fat_calories || 0} kcal</span>
            </div>
          </div>
        </div>
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
          description="Type what you ate in natural English (e.g. 'ate 2200 kcal with 160 g protein') or add a meal manually."
          actionText="Add Meal"
          onAction={() => {
            setEditingEntry(null);
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
                  <th className="px-4 py-3">Meal</th>
                  <th className="px-4 py-3 text-emerald-400 font-bold">Calories</th>
                  <th className="px-4 py-3">Protein</th>
                  <th className="px-4 py-3">Carbs</th>
                  <th className="px-4 py-3">Fat</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-400">{entry.eaten_on}</td>
                    <td className="px-4 py-3 font-bold text-white">{entry.meal_title || 'Meal'}</td>
                    <td className="px-4 py-3 font-bold text-emerald-400">{entry.calories ? `${entry.calories} kcal` : '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-300">{entry.protein_g ? `${entry.protein_g}g` : '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-300">{entry.carbs_g ? `${entry.carbs_g}g` : '-'}</td>
                    <td className="px-4 py-3 font-medium text-slate-300">{entry.fat_g ? `${entry.fat_g}g` : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-lg p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
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

          <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3 text-xs text-slate-400">
            <span>Showing {entries.length} of {total} entries</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded-lg border border-slate-800 p-1.5 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
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
