import React, { useState } from 'react';
import { Goal, Wallet } from '../types';
import { api, triggerHaptic } from '../api';
import { Icon } from '../components/Icon';
import { Plus, Target, Calendar, Check, TrendingUp, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GoalsViewProps {
  goals: Goal[];
  wallets: Wallet[];
  onReload: () => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ goals, wallets, onReload }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<Goal | null>(null);
  const [contributeAmountStr, setContributeAmountStr] = useState('');
  const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');

  // New goal form state
  const [title, setTitle] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('0');
  const [deadline, setDeadline] = useState('');
  const [icon, setIcon] = useState('Target');
  const [color, setColor] = useState('#29c184');
  const [loading, setLoading] = useState(false);

  const icons = ['Target', 'Laptop', 'Car', 'Plane', 'Home', 'Smartphone', 'GraduationCap', 'Heart'];
  const colors = ['#29c184', '#1570ef', '#ff8d28', '#7a5af8', '#f0646e', '#eab308'];

  const handleDeleteGoal = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Haqiqatan ham ushbu maqsadni o'chirmoqchimisiz?")) return;
    triggerHaptic('warning');
    try {
      await api.deleteGoal(id);
      onReload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const target_amount = parseFloat(targetAmountStr);
    if (!title || !target_amount) return;

    setLoading(true);
    triggerHaptic('success');

    try {
      await api.createGoal({
        title,
        target_amount,
        current_amount: parseFloat(currentAmountStr) || 0,
        deadline: deadline || undefined,
        icon,
        color
      });

      confetti({ particleCount: 30, spread: 60 });
      setShowAddModal(false);
      setTitle('');
      setTargetAmountStr('');
      setCurrentAmountStr('0');
      onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal) return;
    const amount = parseFloat(contributeAmountStr);
    if (!amount || amount <= 0) return;

    setLoading(true);
    triggerHaptic('success');

    try {
      await api.contributeGoal(contributeGoal.id, amount, selectedWalletId);
      confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
      setContributeGoal(null);
      setContributeAmountStr('');
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
          <h2 className="text-xl font-black text-white light:text-[#1d2939]">Moliyaviy Maqsadlar</h2>
          <p className="text-xs text-[#899098]">Orzularingiz uchun jamg'arma dasturi</p>
        </div>

        <button
          onClick={() => {
            triggerHaptic('medium');
            setShowAddModal(true);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#29c184] text-white text-xs font-bold shadow-md shadow-[#29c184]/30 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Yangi Maqsad</span>
        </button>
      </div>

      {/* Goals list */}
      <div className="space-y-3">
        {goals.length === 0 ? (
          <div className="p-8 text-center rounded-2xl bg-[#213040]/50 border border-[#354454]/40">
            <Target className="w-10 h-10 text-[#899098] mx-auto mb-2 opacity-50" />
            <p className="text-sm font-bold text-white light:text-[#1d2939]">Hozircha maqsadlar yo'q</p>
            <p className="text-xs text-[#899098] mt-1">
              Yangi noutbuk, sayohat yoki mashina uchun maqsad belgilang.
            </p>
          </div>
        ) : (
          goals.map((g) => {
            const percent = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
            const remaining = Math.max(0, g.target_amount - g.current_amount);

            return (
              <div
                key={g.id}
                className="p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                      style={{ backgroundColor: g.color }}
                    >
                      <Icon name={g.icon} size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white light:text-[#1d2939]">{g.title || g.name || 'Maqsad'}</h3>
                      {g.deadline && (
                        <p className="flex items-center gap-1 text-[11px] text-[#899098] mt-0.5">
                          <Calendar className="w-3 h-3" />
                          <span>Muddat: {g.deadline}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[#29c184]">{percent}%</span>
                    <button
                      onClick={(e) => handleDeleteGoal(g.id, e)}
                      className="p-1 rounded-lg text-[#899098] hover:text-[#f0646e] hover:bg-[#f0646e]/10 transition-colors cursor-pointer"
                      title="Maqsadni o'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="w-full h-3 rounded-full bg-[#151d27] light:bg-[#f2f4f7] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${percent}%`,
                        backgroundColor: g.color
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-[#899098]">
                    <span>Yig'ildi: {g.current_amount.toLocaleString('uz-UZ')} so'm</span>
                    <span>Maqsad: {g.target_amount.toLocaleString('uz-UZ')} so'm</span>
                  </div>
                </div>

                {/* Footer action */}
                <div className="pt-2 border-t border-[#354454]/40 flex items-center justify-between">
                  <span className="text-xs text-[#b6bfd0]">
                    Qoldi: <strong className="text-white">{remaining.toLocaleString('uz-UZ')} so'm</strong>
                  </span>

                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setContributeGoal(g);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#29c184] text-white text-xs font-bold hover:bg-[#25ab75] active:scale-95 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Mablag' qo'shish</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Contribute to Goal Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white">
              Maqsadga pul qo'shish: {contributeGoal.title}
            </h3>

            <form onSubmit={handleContribute} className="space-y-3">
              <div>
                <label className="text-xs text-[#b6bfd0]">Qo'shilayotgan summa (so'm)</label>
                <input
                  type="number"
                  required
                  value={contributeAmountStr}
                  onChange={(e) => setContributeAmountStr(e.target.value)}
                  placeholder="0"
                  className="w-full px-4 py-3 rounded-xl bg-[#213040] border border-[#354454] text-white text-xl font-bold focus:border-[#29c184]"
                />
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0]">Qaysi hamyondan yechilsin?</label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.balance.toLocaleString('uz-UZ')} so'm)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#899098] hover:text-white"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Goal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Yangi Maqsad Yaratish</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3">
              <div>
                <label className="text-xs text-[#b6bfd0]">Maqsad nomi</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Masalan: Yangi noutbuk, Umra safari"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0]">Kerakli summa (so'm)</label>
                <input
                  type="number"
                  required
                  value={targetAmountStr}
                  onChange={(e) => setTargetAmountStr(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0]">Mavjud yig'ilgan summa (ixtiyoriy)</label>
                <input
                  type="number"
                  value={currentAmountStr}
                  onChange={(e) => setCurrentAmountStr(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0]">Erishish muddati (ixtiyoriy)</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              {/* Icon selector */}
              <div>
                <label className="text-xs text-[#b6bfd0]">Ikonka</label>
                <div className="flex gap-2 overflow-x-auto py-1.5 no-scrollbar">
                  {icons.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-xl border ${
                        icon === ic ? 'bg-[#29c184] text-white border-[#29c184]' : 'bg-[#213040] text-[#899098] border-[#354454]'
                      }`}
                    >
                      <Icon name={ic} size={18} />
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
    </div>
  );
};
