import React, { useState } from 'react';
import { Debt } from '../types';
import { api, triggerHaptic } from '../api';
import { Plus, Check, Phone, Calendar, ArrowUpRight, ArrowDownRight, Send, CheckCircle2, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EditDebtModal } from '../components/EditDebtModal';

interface DebtsViewProps {
  debts: Debt[];
  onReload: () => void;
}

export const DebtsView: React.FC<DebtsViewProps> = ({ debts, onReload }) => {
  const [tab, setTab] = useState<'lent' | 'borrowed'>('lent');
  const [statusFilter, setStatusFilter] = useState<'active' | 'closed'>('active');
  const [showAddModal, setShowAddModal] = useState(false);
  const [payModalDebt, setPayModalDebt] = useState<Debt | null>(null);
  const [payAmountStr, setPayAmountStr] = useState('');
  const [selectedDebtForEdit, setSelectedDebtForEdit] = useState<Debt | null>(null);

  // Form states for new debt
  const [counterpartyName, setCounterpartyName] = useState('');
  const [phone, setPhone] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUpdateDebt = async (id: string, updates: Partial<Debt>) => {
    await api.updateDebt(id, updates);
    onReload();
  };

  const handleDeleteDebt = async (id: string) => {
    await api.deleteDebt(id);
    onReload();
  };

  const filtered = debts.filter(
    (d) => d.type === tab && d.status === statusFilter
  );

  const handleCreateDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(amountStr);
    if (!counterpartyName || !amount) return;

    setLoading(true);
    triggerHaptic('success');

    try {
      await api.createDebt({
        type: tab,
        counterparty_name: counterpartyName,
        phone,
        amount,
        due_date: dueDate || undefined,
        notes: notes || undefined
      });

      confetti({ particleCount: 30, spread: 60 });
      setShowAddModal(false);
      setCounterpartyName('');
      setPhone('');
      setAmountStr('');
      setDueDate('');
      setNotes('');
      onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payModalDebt) return;
    const amount = parseFloat(payAmountStr);
    if (!amount || amount <= 0) return;

    setLoading(true);
    triggerHaptic('success');

    try {
      await api.payDebt(payModalDebt.id, amount);
      confetti({ particleCount: 40, spread: 70 });
      setPayModalDebt(null);
      setPayAmountStr('');
      onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTelegramReminder = (debt: Debt) => {
    triggerHaptic('medium');
    const rem = debt.amount - debt.paid_amount;
    const shareText = `Assalomu alaykum, ${debt.counterparty_name}! Hisobchi AI eslatmasi: oramizdagi qarz qoldig'i ${rem.toLocaleString('uz-UZ')} so'm${debt.due_date ? ` (Qaytarish muddati: ${debt.due_date})` : ''}.`;
    const tgUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, '_blank');
  };

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Header and Add button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white light:text-[#1d2939]">Qarzlar Daftari</h2>
          <p className="text-xs text-[#899098]">Berilgan va olingan qarzlar nazorati</p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#29c184] text-white text-xs font-bold shadow-md shadow-[#29c184]/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Qo'shish</span>
        </button>
      </div>

      {/* Lent vs Borrowed Main Tabs */}
      <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#213040] light:bg-[#eaecf0] border border-[#354454] light:border-[#d0d5dd]">
        <button
          onClick={() => {
            triggerHaptic('light');
            setTab('lent');
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'lent'
              ? 'bg-[#29c184] text-white shadow-sm'
              : 'text-[#899098] hover:text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Men bergan qarzlar</span>
        </button>

        <button
          onClick={() => {
            triggerHaptic('light');
            setTab('borrowed');
          }}
          className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            tab === 'borrowed'
              ? 'bg-[#f0646e] text-white shadow-sm'
              : 'text-[#899098] hover:text-white'
          }`}
        >
          <ArrowDownRight className="w-4 h-4" />
          <span>Men olgan qarzlar</span>
        </button>
      </div>

      {/* Status pills: Faol vs Tarix */}
      <div className="flex gap-2">
        <button
          onClick={() => {
            triggerHaptic('light');
            setStatusFilter('active');
          }}
          className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
            statusFilter === 'active'
              ? 'bg-white/15 text-white font-bold'
              : 'text-[#899098] hover:text-white'
          }`}
        >
          Faol Qarzlar
        </button>
        <button
          onClick={() => {
            triggerHaptic('light');
            setStatusFilter('closed');
          }}
          className={`px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${
            statusFilter === 'closed'
              ? 'bg-white/15 text-white font-bold'
              : 'text-[#899098] hover:text-white'
          }`}
        >
          Yopilgan Tarix
        </button>
      </div>

      {/* Debts list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#213040]/50 border border-[#354454]/40">
            <p className="text-sm font-bold text-white light:text-[#1d2939]">
              {statusFilter === 'active' ? "Faol qarzlar mavjud emas" : "Yopilgan qarzlar tarixi bo'sh"}
            </p>
            <p className="text-xs text-[#899098] mt-1">
              Qarz bergan yoki olganingizda ushbu ro'yxatga kiritib boring.
            </p>
          </div>
        ) : (
          filtered.map((d) => {
            const remaining = d.amount - d.paid_amount;
            const progress = Math.min(100, Math.round((d.paid_amount / d.amount) * 100));

            return (
              <div
                key={d.id}
                className="p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-md space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-white light:text-[#1d2939]">
                      {d.counterparty_name}
                    </h3>
                    {d.phone && (
                      <p className="flex items-center gap-1 text-[11px] text-[#899098] mt-0.5">
                        <Phone className="w-3 h-3" />
                        <span>{d.phone}</span>
                      </p>
                    )}
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                      d.status === 'closed'
                        ? 'bg-[#29c184]/15 text-[#29c184]'
                        : tab === 'lent'
                        ? 'bg-[#29c184]/15 text-[#29c184]'
                        : 'bg-[#f0646e]/15 text-[#f0646e]'
                    }`}
                  >
                    {d.status === 'closed' ? 'Yopilgan' : tab === 'lent' ? 'Berilgan' : 'Olingan'}
                  </span>
                </div>

                {/* Amounts info */}
                <div className="flex justify-between items-baseline pt-1">
                  <div>
                    <p className="text-[10px] text-[#899098]">Qoldiq summa</p>
                    <p className="text-lg font-black text-white light:text-[#1d2939]">
                      {remaining.toLocaleString('uz-UZ')} so'm
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[#899098]">Umumiy qarz</p>
                    <p className="text-xs font-bold text-[#b6bfd0]">
                      {d.amount.toLocaleString('uz-UZ')} so'm
                    </p>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-2 rounded-full bg-[#151d27] light:bg-[#f2f4f7] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#29c184] transition-all"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-[#899098]">
                    <span>To'langan: {d.paid_amount.toLocaleString('uz-UZ')} so'm</span>
                    <span>{progress}%</span>
                  </div>
                </div>

                {/* Date & Action Buttons */}
                <div className="pt-2 border-t border-[#354454]/40 flex items-center justify-between">
                  <div className="flex items-center gap-1 text-[11px] text-[#899098]">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{d.due_date ? `Muddat: ${d.due_date}` : "Muddatsiz"}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('light');
                        setSelectedDebtForEdit(d);
                      }}
                      className="p-1.5 rounded-xl bg-[#151d27] border border-[#354454] text-[#899098] hover:text-white hover:border-[#29c184] transition-all cursor-pointer"
                      title="Tahrirlash"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>

                    {d.status === 'active' && tab === 'lent' && (
                      <button
                        type="button"
                        onClick={() => handleSendTelegramReminder(d)}
                        className="px-2.5 py-1.5 rounded-xl bg-[#1570ef]/15 text-[#1570ef] text-xs font-bold flex items-center gap-1 hover:bg-[#1570ef]/25 cursor-pointer"
                        title="Telegram orqali eslatish"
                      >
                        <Send className="w-3 h-3" />
                        <span>Eslatish</span>
                      </button>
                    )}

                    {d.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerHaptic('light');
                          setPayModalDebt(d);
                          setPayAmountStr(String(remaining));
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#29c184] text-white text-xs font-bold hover:bg-[#25ab75] active:scale-95 cursor-pointer"
                      >
                        To'lash
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add New Debt Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Yangi Qarz Qo'shish</h3>
            <form onSubmit={handleCreateDebt} className="space-y-3">
              <div>
                <label className="text-xs text-[#b6bfd0]">Kimga / Kimdan?</label>
                <input
                  type="text"
                  required
                  value={counterpartyName}
                  onChange={(e) => setCounterpartyName(e.target.value)}
                  placeholder="Ismi (masalan: Anvar, Sardor)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0]">Summa (so'm)</label>
                <input
                  type="number"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0]">Telefon raqami (ixtiyoriy)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0]">Qaytarish muddati (ixtiyoriy)</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
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
                  {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt Modal */}
      {payModalDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white">
              Qarzni so'ndirish: {payModalDebt.counterparty_name}
            </h3>
            <p className="text-xs text-[#899098]">
              To'lanayotgan summani kiriting. Agar to'liq to'lansa, qarz avtomatik yopiladi.
            </p>

            <form onSubmit={handlePayDebt} className="space-y-3">
              <input
                type="number"
                required
                value={payAmountStr}
                onChange={(e) => setPayAmountStr(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[#213040] border border-[#354454] text-white text-xl font-bold focus:border-[#29c184]"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayModalDebt(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#899098] hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Debt Modal */}
      <EditDebtModal
        isOpen={!!selectedDebtForEdit}
        onClose={() => setSelectedDebtForEdit(null)}
        debt={selectedDebtForEdit}
        onUpdate={handleUpdateDebt}
        onDelete={handleDeleteDebt}
      />
    </div>
  );
};
