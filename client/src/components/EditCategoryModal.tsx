import React, { useState, useEffect } from 'react';
import { Category } from '../types';
import { triggerHaptic } from '../api';
import { Icon } from './Icon';
import { X, Check, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onUpdate: (id: string, updates: Partial<Category>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditCategoryModal: React.FC<EditCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onUpdate,
  onDelete
}) => {
  if (!isOpen || !category) return null;

  const [name, setName] = useState(category.name);
  const [icon, setIcon] = useState(category.icon || 'ShoppingBag');
  const [color, setColor] = useState(category.color || '#29c184');
  const [budgetLimitStr, setBudgetLimitStr] = useState(category.budget_limit ? String(category.budget_limit) : '');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (category) {
      setName(category.name);
      setIcon(category.icon || 'ShoppingBag');
      setColor(category.color || '#29c184');
      setBudgetLimitStr(category.budget_limit ? String(category.budget_limit) : '');
      setConfirmDelete(false);
    }
  }, [category]);

  const icons = [
    'Utensils', 'Car', 'Coffee', 'Home', 'ShoppingBag', 'HeartPulse', 'BookOpen',
    'Film', 'Briefcase', 'Laptop', 'Gift', 'DollarSign', 'Smartphone', 'Zap',
    'CreditCard', 'PiggyBank', 'Shirt', 'HandCoins', 'Sparkles', 'RefreshCw'
  ];
  const colors = ['#29c184', '#1570ef', '#ff8d28', '#7a5af8', '#f0646e', '#ec4899', '#eab308', '#06b6d4', '#10b981', '#6366f1'];

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    triggerHaptic('success');

    try {
      await onUpdate(category.id, {
        name: name.trim(),
        icon,
        color,
        budget_limit: parseFloat(budgetLimitStr) || 0
      });

      confetti({ particleCount: 25, spread: 50 });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      triggerHaptic('warning');
      setConfirmDelete(true);
      return;
    }

    setLoading(true);
    triggerHaptic('error');

    try {
      await onDelete(category.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-[#354454]/60">
          <h3 className="font-bold text-lg text-white">Kategoriyani Tahrirlash</h3>
          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#213040] flex items-center justify-center text-[#b6bfd0] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-[#8b9aa8]">Kategoriya nomi</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184] outline-none mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8b9aa8]">Oylik byudjet limiti (so'm)</label>
            <input
              type="number"
              value={budgetLimitStr}
              onChange={(e) => setBudgetLimitStr(e.target.value)}
              placeholder="0 (cheklovsiz)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184] outline-none mt-1"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="text-xs font-semibold text-[#8b9aa8]">Ikonka</label>
            <div className="grid grid-cols-7 gap-1.5 py-1.5 max-h-32 overflow-y-auto">
              {icons.map((ic) => (
                <button
                  key={ic}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setIcon(ic);
                  }}
                  className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
                    icon === ic ? 'bg-[#29c184] text-white border-[#29c184]' : 'bg-[#213040] text-[#899098] border-[#354454]'
                  }`}
                >
                  <Icon name={ic} size={16} />
                </button>
              ))}
            </div>
          </div>

          {/* Color Selector */}
          <div>
            <label className="text-xs font-semibold text-[#8b9aa8]">Rang</label>
            <div className="flex gap-2 py-1 flex-wrap">
              {colors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setColor(c);
                  }}
                  className={`w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                confirmDelete
                  ? 'bg-red-600 hover:bg-red-700 text-white flex-1 animate-pulse'
                  : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>{confirmDelete ? "Haqiqatdan o'chirilsinmi?" : "O'chirish"}</span>
            </button>

            {!confirmDelete && (
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#12A99D] via-[#29c184] to-[#9DFC38] text-black font-extrabold text-xs shadow-lg shadow-[#29c184]/30 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{loading ? 'Saqlanmoqda...' : 'Saqlash'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
