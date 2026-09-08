import React, { useState } from 'react';
import { Category } from '../types';
import { api, triggerHaptic } from '../api';
import { Icon } from '../components/Icon';
import { Plus, Tag, ArrowDownRight, ArrowUpRight, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EditCategoryModal } from '../components/EditCategoryModal';

interface CategoriesViewProps {
  categories: Category[];
  onReload: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({ categories, onReload }) => {
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('ShoppingBag');
  const [color, setColor] = useState('#29c184');
  const [budgetLimitStr, setBudgetLimitStr] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateCategory = async (id: string, updates: Partial<Category>) => {
    await api.updateCategory(id, updates);
    onReload();
  };

  const handleDeleteCategory = async (id: string) => {
    await api.deleteCategory(id);
    onReload();
  };

  const filtered = categories.filter((c) => c.type === tab);

  const icons = [
    'Utensils', 'Car', 'Coffee', 'Home', 'ShoppingBag', 'HeartPulse', 'BookOpen',
    'Film', 'Briefcase', 'Laptop', 'Gift', 'DollarSign', 'Smartphone', 'Zap'
  ];
  const colors = ['#29c184', '#1570ef', '#ff8d28', '#7a5af8', '#f0646e', '#ec4899', '#eab308', '#06b6d4'];

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    triggerHaptic('success');

    try {
      await api.createCategory({
        name,
        type: tab,
        icon,
        color,
        budget_limit: parseFloat(budgetLimitStr) || 0
      });

      confetti({ particleCount: 30, spread: 60 });
      setShowAddModal(false);
      setName('');
      setBudgetLimitStr('');
      onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Header and Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white light:text-[#1d2939]">Kategoriyalar</h2>
          <p className="text-xs text-[#899098]">Toifalar va oylik byudjet limitlari</p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#29c184] text-white text-xs font-bold shadow-md shadow-[#29c184]/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Yangi Kategoriya</span>
        </button>
      </div>

      {/* Expense vs Income Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#213040] light:bg-[#eaecf0] border border-[#354454] light:border-[#d0d5dd]">
        <button
          onClick={() => {
            triggerHaptic('light');
            setTab('expense');
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'expense'
              ? 'bg-[#f0646e] text-white shadow-sm'
              : 'text-[#899098] hover:text-white'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Xarajat Toifalari</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setTab('income');
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'income'
              ? 'bg-[#29c184] text-white shadow-sm'
              : 'text-[#899098] hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Daromad Toifalari</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {filtered.map((cat) => (
          <div
            key={cat.id}
            onClick={() => {
              triggerHaptic('light');
              setSelectedCategory(cat);
            }}
            className="p-3.5 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] hover:border-[#29c184]/50 shadow-sm flex items-center justify-between cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform"
                style={{ backgroundColor: cat.color }}
              >
                <Icon name={cat.icon} size={18} />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white light:text-[#1d2939] truncate group-hover:text-[#29c184] transition-colors">
                  {cat.name}
                </h4>
                {cat.budget_limit > 0 ? (
                  <p className="text-[10px] text-[#29c184] font-medium truncate">
                    Limit: {cat.budget_limit.toLocaleString('uz-UZ')}
                  </p>
                ) : (
                  <p className="text-[10px] text-[#899098]">Cheklovsiz</p>
                )}
              </div>
            </div>
            <div className="w-6 h-6 rounded-md bg-[#19232e] opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#899098] hover:text-white transition-all shrink-0">
              <Edit3 className="w-3 h-3" />
            </div>
          </div>
        ))}
      </div>

      {/* Add Category Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Yangi Kategoriya Yaratish</h3>
            <form onSubmit={handleCreateCategory} className="space-y-3">
              <div>
                <label className="text-xs text-[#b6bfd0]">Nomi</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: Sport, Kitoblar, Kantselyariya"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0]">Oylik byudjet limiti (so'm, ixtiyoriy)</label>
                <input
                  type="number"
                  value={budgetLimitStr}
                  onChange={(e) => setBudgetLimitStr(e.target.value)}
                  placeholder="0 (cheklovsiz)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              {/* Icon selector */}
              <div>
                <label className="text-xs text-[#b6bfd0]">Ikonka</label>
                <div className="grid grid-cols-7 gap-1.5 py-1.5">
                  {icons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-xl border flex items-center justify-center ${
                        icon === ic ? 'bg-[#29c184] text-white border-[#29c184]' : 'bg-[#213040] text-[#899098] border-[#354454]'
                      }`}
                    >
                      <Icon name={ic} size={16} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color selector */}
              <div>
                <label className="text-xs text-[#b6bfd0]">Rang</label>
                <div className="flex gap-2 py-1">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#899098] hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Category Modal */}
      <EditCategoryModal
        isOpen={!!selectedCategory}
        onClose={() => setSelectedCategory(null)}
        category={selectedCategory}
        onUpdate={handleUpdateCategory}
        onDelete={handleDeleteCategory}
      />
    </div>
  );
};
