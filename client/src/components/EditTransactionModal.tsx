import React, { useState, useEffect } from 'react';
import { Transaction, Wallet, Category } from '../types';
import { triggerHaptic } from '../api';
import { Icon } from './Icon';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Trash2, Check, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  wallets: Wallet[];
  categories: Category[];
  onUpdate: (id: string, updates: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  wallets,
  categories,
  onUpdate,
  onDelete
}) => {
  if (!isOpen || !transaction) return null;

  const [type, setType] = useState<'expense' | 'income' | 'transfer'>(transaction.type);
  const [amountStr, setAmountStr] = useState<string>(String(transaction.amount));
  const [selectedWalletId, setSelectedWalletId] = useState<string>(transaction.balance_id || wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState<string>(transaction.to_balance_id || wallets[1]?.id || wallets[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(transaction.category_id || '');
  const [description, setDescription] = useState<string>(transaction.description || '');
  const [date, setDate] = useState<string>(transaction.date ? transaction.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (transaction) {
      setType(transaction.type);
      setAmountStr(String(transaction.amount));
      setSelectedWalletId(transaction.balance_id || wallets[0]?.id || '');
      setToWalletId(transaction.to_balance_id || wallets[1]?.id || wallets[0]?.id || '');
      setSelectedCategoryId(transaction.category_id || '');
      setDescription(transaction.description || '');
      setDate(transaction.date ? transaction.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
      setConfirmDelete(false);
    }
  }, [transaction, wallets]);

  const filteredCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr.replace(/\s+/g, ''));
    if (!amount || amount <= 0) return;

    setLoading(true);
    triggerHaptic('success');

    try {
      await onUpdate(transaction.id, {
        amount,
        type,
        balance_id: selectedWalletId,
        to_balance_id: type === 'transfer' ? toWalletId : undefined,
        category_id: type !== 'transfer' ? selectedCategoryId : undefined,
        description: description.trim() || transaction.description,
        date: new Date(date).toISOString()
      });

      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.8 },
        colors: ['#29c184', '#1570ef']
      });

      onClose();
    } catch (err) {
      console.error('Update tx error:', err);
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
      await onDelete(transaction.id);
      onClose();
    } catch (err) {
      console.error('Delete tx error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#19232e] rounded-t-3xl sm:rounded-3xl border border-[#354454] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#354454]/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-white">Amaliyotni Tahrirlash</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#29c184]/15 text-[#29c184] font-bold">
              ID: {transaction.id.slice(0, 6)}
            </span>
          </div>
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

        {/* Content Form */}
        <form onSubmit={handleSave} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Type Selector Tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#151d27]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setType('expense');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'expense' ? 'bg-[#f0646e] text-white shadow-md' : 'text-[#899098] hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>Xarajat</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setType('income');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'income' ? 'bg-[#29c184] text-white shadow-md' : 'text-[#899098] hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Daromad</span>
            </button>

            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setType('transfer');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'transfer' ? 'bg-[#1570ef] text-white shadow-md' : 'text-[#899098] hover:text-white'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>O'tkazma</span>
            </button>
          </div>

          {/* Amount Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8b9aa8]">Summa (UZS)</label>
            <div className="relative">
              <input
                type="number"
                required
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                className="w-full pl-4 pr-16 py-3 rounded-2xl bg-[#213040] border border-[#354454] text-xl font-mono font-black text-white focus:outline-none focus:border-[#29c184]"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8b9aa8]">
                UZS
              </span>
            </div>
          </div>

          {/* Wallet Selector (Hamyonni almashtirish) */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8b9aa8]">
              {type === 'transfer' ? 'Chiqim hamyoni' : 'Hamyon'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {wallets.map((w) => {
                const isSelected = selectedWalletId === w.id;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => {
                      triggerHaptic('light');
                      setSelectedWalletId(w.id);
                    }}
                    className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#29c184]/15 border-[#29c184] text-white'
                        : 'bg-[#213040] border-[#354454] text-[#8b9aa8] hover:border-[#8b9aa8]'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <p className="text-xs font-bold text-white truncate">{w.name}</p>
                      <p className="text-[10px] text-[#8b9aa8] font-mono">
                        {w.balance.toLocaleString('uz-UZ')} {w.currency}
                      </p>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-[#29c184] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transfer Target Wallet */}
          {type === 'transfer' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8b9aa8]">Kirim hamyoni</label>
              <div className="grid grid-cols-2 gap-2">
                {wallets
                  .filter((w) => w.id !== selectedWalletId)
                  .map((w) => {
                    const isSelected = toWalletId === w.id;
                    return (
                      <button
                        key={w.id}
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setToWalletId(w.id);
                        }}
                        className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#1570ef]/15 border-[#1570ef] text-white'
                            : 'bg-[#213040] border-[#354454] text-[#8b9aa8] hover:border-[#8b9aa8]'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <p className="text-xs font-bold text-white truncate">{w.name}</p>
                          <p className="text-[10px] text-[#8b9aa8] font-mono">
                            {w.balance.toLocaleString('uz-UZ')} {w.currency}
                          </p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#1570ef] shrink-0" />}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Category Selector (Kategoriyani almashtirish) */}
          {type !== 'transfer' && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8b9aa8]">Kategoriya</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 rounded-2xl bg-[#151d27]/70">
                {filteredCategories.map((c) => {
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedCategoryId(c.id);
                      }}
                      className={`p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#29c184]/20 border-[#29c184] text-white ring-1 ring-[#29c184]'
                          : 'bg-[#213040] border-[#354454] text-[#8b9aa8] hover:text-white'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                        style={{ backgroundColor: c.color || '#29c184' }}
                      >
                        <Icon name={c.icon || 'Tag'} size={14} />
                      </div>
                      <span className="text-[10px] font-bold truncate w-full">{c.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8b9aa8]">Izoh / Tavsif</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masalan: Tushlik, Benzin, Oylik"
              className="w-full px-4 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-sm text-white focus:outline-none focus:border-[#29c184]"
            />
          </div>

          {/* Date Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8b9aa8] flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Sana</span>
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-[#213040] border border-[#354454] text-xs text-white focus:outline-none focus:border-[#29c184]"
            />
          </div>

          {/* Action Buttons: Save & Delete */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className={`px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
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
                className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#12A99D] via-[#29c184] to-[#9DFC38] text-black font-extrabold text-xs shadow-lg shadow-[#29c184]/30 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{loading ? 'Saqlanmoqda...' : 'Oʻzgarishlarni Saqlash'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
