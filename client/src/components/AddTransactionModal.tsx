import React, { useState } from 'react';
import { Wallet, Category } from '../types';
import { triggerHaptic } from '../api';
import { Icon } from './Icon';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  wallets: Wallet[];
  categories: Category[];
  onSubmit: (tx: {
    balance_id: string;
    category_id?: string;
    amount: number;
    type: 'expense' | 'income' | 'transfer';
    to_balance_id?: string;
    description: string;
  }) => Promise<void>;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  wallets,
  categories,
  onSubmit
}) => {
  if (!isOpen) return null;

  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState<string>(wallets[1]?.id || wallets[0]?.id || '');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const filteredCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));

  // Quick amount chips in UZS
  const quickAmounts = [15000, 30000, 50000, 100000, 200000, 500000];

  const handleQuickAmount = (val: number) => {
    triggerHaptic('light');
    setAmountStr(String(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr.replace(/\s+/g, ''));
    if (!amount || amount <= 0) return;

    setLoading(true);
    triggerHaptic('success');

    try {
      const selectedCat = categories.find((c) => c.id === selectedCategoryId);
      const desc = description.trim() || (type === 'transfer' ? "O'tkazma" : selectedCat?.name || (type === 'expense' ? 'Xarajat' : 'Daromad'));

      await onSubmit({
        balance_id: selectedWalletId,
        category_id: type !== 'transfer' ? (selectedCategoryId || filteredCategories[0]?.id) : undefined,
        to_balance_id: type === 'transfer' ? toWalletId : undefined,
        amount,
        type,
        description: desc
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#29c184', '#1570ef', '#ff8d28']
      });

      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-lg bg-[#19232e] light:bg-white rounded-t-3xl sm:rounded-3xl border border-[#354454] light:border-[#eaecf0] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#354454]/60 light:border-[#eaecf0] flex items-center justify-between">
          <h3 className="font-bold text-lg text-white light:text-[#1d2939]">Yangi Amaliyot</h3>
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-[#213040] light:bg-[#eaecf0] flex items-center justify-center text-[#b6bfd0] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Type Selector tabs */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#151d27] light:bg-[#f2f4f7]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setType('expense');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'expense'
                  ? 'bg-[#f0646e] text-white shadow-md'
                  : 'text-[#899098] hover:text-white light:hover:text-black'
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
                type === 'income'
                  ? 'bg-[#29c184] text-white shadow-md'
                  : 'text-[#899098] hover:text-white light:hover:text-black'
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
                type === 'transfer'
                  ? 'bg-[#1570ef] text-white shadow-md'
                  : 'text-[#899098] hover:text-white light:hover:text-black'
              }`}
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>O'tkazma</span>
            </button>
          </div>

          {/* Amount input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#b6bfd0] light:text-[#475467]">Summa (so'm)</label>
            <div className="relative">
              <input
                type="number"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0"
                autoFocus
                className="w-full px-4 py-3.5 rounded-2xl bg-[#213040] light:bg-[#f7f9fa] border border-[#354454] light:border-[#eaecf0] text-2xl font-black text-white light:text-[#1d2939] focus:outline-none focus:border-[#29c184] transition-colors"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#899098]">
                UZS
              </span>
            </div>

            {/* Quick chips */}
            <div className="flex gap-1.5 overflow-x-auto pt-1.5 pb-1 no-scrollbar">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleQuickAmount(amt)}
                  className="px-2.5 py-1 rounded-xl bg-[#213040] light:bg-[#f2f4f7] border border-[#354454]/50 text-xs font-semibold text-[#b6bfd0] light:text-[#475467] hover:border-[#29c184] shrink-0"
                >
                  +{amt.toLocaleString('uz-UZ')}
                </button>
              ))}
            </div>
          </div>

          {/* Wallet / Card selector */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#b6bfd0] light:text-[#475467]">
              {type === 'transfer' ? "Qaysi hisobdan?" : "Hisob / Karta"}
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
                    className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#213040] light:bg-[#f0fdf4] border-[#29c184] ring-1 ring-[#29c184]'
                        : 'bg-[#151d27]/70 light:bg-white border-[#354454]/50 hover:border-[#29c184]/40'
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{ backgroundColor: w.color }}
                    >
                      {w.type === 'cash' ? '💵' : '💳'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-white light:text-[#1d2939] truncate">{w.name}</p>
                      <p className="text-[11px] text-[#899098] truncate">{w.balance.toLocaleString('uz-UZ')} so'm</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Transfer Target Wallet (if transfer) */}
          {type === 'transfer' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#b6bfd0] light:text-[#475467]">Qaysi hisobga?</label>
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
                        className={`flex items-center gap-2 p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-[#213040] light:bg-[#eff8ff] border-[#1570ef] ring-1 ring-[#1570ef]'
                            : 'bg-[#151d27]/70 light:bg-white border-[#354454]/50'
                        }`}
                      >
                        <div
                          className="w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0"
                          style={{ backgroundColor: w.color }}
                        >
                          {w.type === 'cash' ? '💵' : '💳'}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white light:text-[#1d2939] truncate">{w.name}</p>
                          <p className="text-[11px] text-[#899098] truncate">{w.balance.toLocaleString('uz-UZ')} so'm</p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Category Picker (if not transfer) */}
          {type !== 'transfer' && (
            <div className="space-y-1">
              <label className="text-xs font-medium text-[#b6bfd0] light:text-[#475467]">Kategoriya</label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1">
                {filteredCategories.map((c) => {
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedCategoryId(c.id);
                        if (!description) setDescription(c.name);
                      }}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#213040] light:bg-slate-100 border-[#29c184] ring-2 ring-[#29c184]/40 scale-102'
                          : 'bg-[#151d27]/60 light:bg-white border-[#354454]/40 hover:border-[#29c184]/40'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-white mb-1 shadow-sm"
                        style={{ backgroundColor: c.color }}
                      >
                        <Icon name={c.icon} size={16} />
                      </div>
                      <span className="text-[11px] font-semibold text-white light:text-[#1d2939] truncate w-full">
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Description input */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-[#b6bfd0] light:text-[#475467]">Izoh (ixtiyoriy)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Masalan: Korzinka xaridi, Taksi, Restoran..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#213040] light:bg-[#f7f9fa] border border-[#354454] light:border-[#eaecf0] text-sm text-white light:text-[#1d2939] focus:outline-none focus:border-[#29c184]"
            />
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading || !amountStr}
            className="w-full py-3.5 rounded-2xl bg-[#29c184] hover:bg-[#25ab75] active:scale-98 text-white font-extrabold text-base shadow-lg shadow-[#29c184]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            <Check className="w-5 h-5 stroke-[2.5]" />
            <span>{loading ? 'Saqlanmoqda...' : 'Saqlash'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
