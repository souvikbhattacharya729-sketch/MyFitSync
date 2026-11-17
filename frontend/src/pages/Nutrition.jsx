import React, { useState, useEffect } from 'react';
import { Utensils, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
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
    <div className="space-y-6 text-[#F5F7FA]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#F5F7FA] flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#C6FF3D]/10 text-[#C6FF3D] border border-[#C6FF3D]/20">
              <Utensils className="h-4 w-4" />
            </div>
            <span>Nutrition & Macro Tracking</span>
          </h1>
          <p className="text-xs text-[#9AA3B2] mt-0.5">
            Smart nutrition tracking with automatic macro estimation & Atwater 4/4/9 validation
          </p>
        </div>

        <button
          onClick={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-[#C6FF3D] hover:bg-[#b5f526] px-4 py-2.5 text-xs font-black text-[#0B0D10] shadow-lg shadow-[#C6FF3D]/10 active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Log Meal (Smart Auto-Fill)</span>
        </button>
      </div>

      {/* Daily Summary Card for selected date */}
      {dailyTotals && (
        <div className="rounded-2xl border border-[#20252E] bg-[#161A21] p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-[#9AA3B2]">Daily Totals for:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="rounded-xl border border-[#20252E] bg-[#0B0D10] px-3 py-1.5 text-xs font-semibold text-[#F5F7FA] focus:border-[#C6FF3D] focus:outline-none"
              />
            </div>

            <div className="text-xs font-bold text-[#C6FF3D]">
              {dailyTotals.calories} / {dailyTotals.target_calories} kcal ({dailyTotals.calories_pct}%)
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl bg-[#20252E] p-3 border border-[#20252E]">
              <span className="text-[10px] text-[#9AA3B2] font-semibold uppercase">Calories</span>
              <div className="text-lg font-bold text-[#F5F7FA] mt-0.5">{dailyTotals.calories} kcal</div>
              <span className="text-[10px] text-[#9AA3B2]">
                {Math.max(0, dailyTotals.target_calories - dailyTotals.calories)} remaining
              </span>
            </div>

            <div className="rounded-xl bg-[#20252E] p-3 border border-[#20252E]">
              <span className="text-[10px] text-[#C6FF3D] font-bold uppercase">Protein</span>
              <div className="text-lg font-bold text-[#F5F7FA] mt-0.5">{dailyTotals.protein_g}g</div>
              <span className="text-[10px] text-[#9AA3B2]">{dailyTotals.macro_split?.protein_calories || 0} kcal</span>
            </div>

            <div className="rounded-xl bg-[#20252E] p-3 border border-[#20252E]">
              <span className="text-[10px] text-[#4DA3FF] font-bold uppercase">Carbs</span>
              <div className="text-lg font-bold text-[#F5F7FA] mt-0.5">{dailyTotals.carbs_g}g</div>
              <span className="text-[10px] text-[#9AA3B2]">{dailyTotals.macro_split?.carbs_calories || 0} kcal</span>
            </div>

            <div className="rounded-xl bg-[#20252E] p-3 border border-[#20252E]">
              <span className="text-[10px] text-[#FFB020] font-bold uppercase">Fat</span>
              <div className="text-lg font-bold text-[#F5F7FA] mt-0.5">{dailyTotals.fat_g}g</div>
              <span className="text-[10px] text-[#9AA3B2]">{dailyTotals.macro_split?.fat_calories || 0} kcal</span>
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
          description="Type what you ate in natural English (e.g. 'ate 2 boiled eggs') or use the smart meal logger."
          actionText="Log First Meal"
          onAction={() => {
            setEditingEntry(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="rounded-2xl border border-[#20252E] bg-[#161A21] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-[#9AA3B2]">
              <thead className="border-b border-[#20252E] bg-[#0B0D10] text-[#9AA3B2] uppercase text-[10px] font-bold">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Meal</th>
                  <th className="px-4 py-3 text-[#C6FF3D] font-bold">Calories</th>
                  <th className="px-4 py-3 text-[#F5F7FA]">Protein</th>
                  <th className="px-4 py-3 text-[#F5F7FA]">Carbs</th>
                  <th className="px-4 py-3 text-[#F5F7FA]">Fat</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#20252E]">
                {entries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-[#20252E]/50 transition-colors">
                    <td className="px-4 py-3 font-mono text-[#9AA3B2]">{entry.eaten_on}</td>
                    <td className="px-4 py-3 font-bold text-[#F5F7FA]">{entry.meal_title || 'Meal'}</td>
                    <td className="px-4 py-3 font-black text-[#C6FF3D]">{entry.calories ? `${entry.calories} kcal` : '-'}</td>
                    <td className="px-4 py-3 font-medium text-[#F5F7FA]">{entry.protein_g ? `${entry.protein_g}g` : '-'}</td>
                    <td className="px-4 py-3 font-medium text-[#4DA3FF]">{entry.carbs_g ? `${entry.carbs_g}g` : '-'}</td>
                    <td className="px-4 py-3 font-medium text-[#FFB020]">{entry.fat_g ? `${entry.fat_g}g` : '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setEditingEntry(entry);
                            setIsModalOpen(true);
                          }}
                          className="rounded-lg p-1.5 text-[#9AA3B2] hover:text-[#F5F7FA] hover:bg-[#20252E]"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(entry.id)}
                          className="rounded-lg p-1.5 text-[#9AA3B2] hover:text-[#FF5A5F] hover:bg-[#FF5A5F]/10"
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

          <div className="flex items-center justify-between border-t border-[#20252E] px-4 py-3 text-xs text-[#9AA3B2]">
            <span>Showing {entries.length} of {total} entries</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="rounded-lg border border-[#20252E] bg-[#20252E] p-1.5 text-[#9AA3B2] hover:text-[#F5F7FA] disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                disabled={page >= totalPages}
                className="rounded-lg border border-[#20252E] bg-[#20252E] p-1.5 text-[#9AA3B2] hover:text-[#F5F7FA] disabled:opacity-30 disabled:cursor-not-allowed"
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
