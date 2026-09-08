import React, { useState, useEffect } from 'react';
import { Debt } from '../types';
import { triggerHaptic } from '../api';
import { X, Check, Trash2, Calendar, Phone, User, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';

interface EditDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
  debt: Debt | null;
  onUpdate: (id: string, updates: Partial<Debt>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const EditDebtModal: React.FC<EditDebtModalProps> = ({
  isOpen,
  onClose,
  debt,
  onUpdate,
  onDelete
}) => {
  if (!isOpen || !debt) return null;

  const [type, setType] = useState<'lent' | 'borrowed'>(debt.type);
  const [counterpartyName, setCounterpartyName] = useState(debt.counterparty_name);
  const [phone, setPhone] = useState(debt.phone || '');
  const [amountStr, setAmountStr] = useState(String(debt.amount));
  const [dueDate, setDueDate] = useState(debt.due_date || '');
  const [notes, setNotes] = useState(debt.notes || '');
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (debt) {
      setType(debt.type);
      setCounterpartyName(debt.counterparty_name);
      setPhone(debt.phone || '');
      setAmountStr(String(debt.amount));
      setDueDate(debt.due_date || '');
      setNotes(debt.notes || '');
      setConfirmDelete(false);
    }
  }, [debt]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!counterpartyName.trim() || !amount) return;

    setLoading(true);
    triggerHaptic('success');

    try {
      await onUpdate(debt.id, {
        type,
        counterparty_name: counterpartyName.trim(),
        phone: phone.trim() || undefined,
        amount,
        due_date: dueDate || undefined,
        notes: notes.trim() || undefined
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
      await onDelete(debt.id);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-2 border-b border-[#354454]/60">
          <h3 className="font-bold text-lg text-white">Qarzni Tahrirlash</h3>
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

        <form onSubmit={handleSave} className="space-y-3">
          {/* Type Toggle */}
          <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#151d27]">
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setType('lent');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'lent' ? 'bg-[#29c184] text-white shadow-sm' : 'text-[#8b9aa8]'
              }`}
            >
              🟢 Men bergan qarz
            </button>
            <button
              type="button"
              onClick={() => {
                triggerHaptic('light');
                setType('borrowed');
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                type === 'borrowed' ? 'bg-[#f0646e] text-white shadow-sm' : 'text-[#8b9aa8]'
              }`}
            >
              🔴 Men olgan qarz
            </button>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8b9aa8]">Shaxs / Tashkilot nomi</label>
            <input
              type="text"
              required
              value={counterpartyName}
              onChange={(e) => setCounterpartyName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184] outline-none mt-1"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8b9aa8]">Qarz summasi (so'm)</label>
            <input
              type="number"
              required
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm font-mono font-bold focus:border-[#29c184] outline-none mt-1"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-[#8b9aa8]">Telefon (ixtiyoriy)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+998"
                className="w-full px-3 py-2 rounded-xl bg-[#213040] border border-[#354454] text-white text-xs focus:border-[#29c184] outline-none mt-1"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-[#8b9aa8]">Qaytarish muddati</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-[#213040] border border-[#354454] text-white text-xs focus:border-[#29c184] outline-none mt-1"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8b9aa8]">Izoh</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Qarz sababi yoki tafsilotlar"
              className="w-full px-3.5 py-2 rounded-xl bg-[#213040] border border-[#354454] text-white text-xs focus:border-[#29c184] outline-none mt-1"
            />
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
