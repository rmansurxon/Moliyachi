import React, { useState } from 'react';
import { Wallet } from '../types';
import { api, triggerHaptic } from '../api';
import { Plus, CreditCard, ArrowLeftRight, Check, Trash2, Star, Edit, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';

interface BalancesViewProps {
  wallets: Wallet[];
  onReload: () => void;
  onOpenTransferModal: () => void;
}

export const BalancesView: React.FC<BalancesViewProps> = ({
  wallets,
  onReload
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selectedWalletForAdjust, setSelectedWalletForAdjust] = useState<Wallet | null>(null);

  // New Wallet form
  const [name, setName] = useState('');
  const [type, setType] = useState<any>('uzcard');
  const [balanceStr, setBalanceStr] = useState('');
  const [cardLast4, setCardLast4] = useState('');
  const [color, setColor] = useState('#23a887');
  const [loading, setLoading] = useState(false);

  // Transfer form
  const [fromWalletId, setFromWalletId] = useState(wallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(wallets[1]?.id || wallets[0]?.id || '');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNote, setTransferNote] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);

  // Adjust balance form
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustType, setAdjustType] = useState<'set' | 'add'>('set');
  const [adjustLoading, setAdjustLoading] = useState(false);

  const colors = ['#23a887', '#7a5af8', '#1570ef', '#ff8d28', '#38a169', '#f0646e'];

  const totalBalance = wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12850 : w.balance), 0);

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setLoading(true);
    triggerHaptic('success');

    try {
      await api.createWallet({
        name,
        type,
        balance: parseFloat(balanceStr) || 0,
        color,
        card_number_last4: cardLast4 || undefined,
        is_default: 0
      });

      confetti({ particleCount: 30, spread: 60 });
      setShowAddModal(false);
      setName('');
      setBalanceStr('');
      setCardLast4('');
      onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount);
    if (!fromWalletId || !toWalletId || fromWalletId === toWalletId || !amt || amt <= 0) return;

    setTransferLoading(true);
    triggerHaptic('success');

    try {
      await api.transfer({
        from_wallet_id: fromWalletId,
        to_wallet_id: toWalletId,
        amount: amt,
        description: transferNote || undefined
      });

      confetti({ particleCount: 40, spread: 70 });
      setShowTransferModal(false);
      setTransferAmount('');
      setTransferNote('');
      onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setTransferLoading(false);
    }
  };

  const handleSetDefault = async (walletId: string) => {
    triggerHaptic('medium');
    try {
      await api.updateWallet(walletId, { is_default: 1 });
      onReload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteWallet = async (walletId: string) => {
    if (wallets.length <= 1) {
      alert("Kamida bitta asosiy hamyon qolishi kerak!");
      return;
    }
    if (!confirm("Ushbu kartani o'chirishni xohlaysizmi?")) return;

    triggerHaptic('medium');
    try {
      await api.deleteWallet(walletId);
      onReload();
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenAdjust = (wallet: Wallet) => {
    setSelectedWalletForAdjust(wallet);
    setAdjustAmount(String(wallet.balance));
    setShowAdjustModal(true);
  };

  const handleSaveAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWalletForAdjust) return;
    const newBal = parseFloat(adjustAmount);
    if (isNaN(newBal)) return;

    setAdjustLoading(true);
    triggerHaptic('success');

    try {
      const diff = newBal - selectedWalletForAdjust.balance;
      if (diff !== 0) {
        await api.createTransaction({
          balance_id: selectedWalletForAdjust.id,
          amount: Math.abs(diff),
          type: diff > 0 ? 'income' : 'expense',
          description: "Balans to'g'rilandi"
        });
      }

      setShowAdjustModal(false);
      onReload();
    } catch (err) {
      console.error(err);
    } finally {
      setAdjustLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-24 px-4 pt-2">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white light:text-[#1d2939]">Hamyonlar va Kartalar</h2>
          <p className="text-xs text-[#899098]">
            Umumiy jamg'arma: <span className="text-[#29c184] font-bold font-mono">{totalBalance.toLocaleString('uz-UZ')} UZS</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              triggerHaptic('medium');
              setShowTransferModal(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#213040] hover:bg-[#2b3e52] border border-[#354454] text-white text-xs font-bold active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeftRight className="w-4 h-4 text-[#7a5af8]" />
            <span>O'tkazma</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic('medium');
              setShowAddModal(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-[#23a887] hover:bg-[#1f9376] text-white text-xs font-bold shadow-lg shadow-[#23a887]/30 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Karta qo'shish</span>
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {wallets.map((w) => {
          let cardBg = w.color || '#23a887';
          if (w.name.toLowerCase().includes('invest')) cardBg = 'linear-gradient(135deg, #7042f4 0%, #8b5cf6 100%)';
          else if (w.name.toLowerCase().includes('asosiy')) cardBg = 'linear-gradient(135deg, #20b2aa 0%, #23a887 100%)';
          else if (w.name.toLowerCase().includes('naqd')) cardBg = 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)';
          else if (w.name.toLowerCase().includes('dollar')) cardBg = 'linear-gradient(135deg, #2b6cb0 0%, #3182ce 100%)';
          else cardBg = `linear-gradient(135deg, ${w.color} 0%, ${w.color}cc 100%)`;

          return (
            <div
              key={w.id}
              className="p-5 rounded-3xl relative overflow-hidden text-white shadow-xl flex flex-col justify-between min-h-[170px] group transition-all"
              style={{ background: cardBg }}
            >
              {/* Background card sheen effect */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

              {/* Card top */}
              <div className="flex items-start justify-between relative z-10">
                <div className="flex items-center gap-2.5">
                  {/* Chip icon */}
                  <div className="w-8 h-6 rounded-md bg-amber-300/80 border border-amber-400/90 flex items-center justify-center shadow-sm">
                    <div className="w-5 h-3 border border-amber-700/40 rounded-sm"></div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-black tracking-tight">{w.name}</h3>
                      {w.is_default === 1 && (
                        <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-black uppercase tracking-wider backdrop-blur-sm">
                          Asosiy
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/80 uppercase font-medium">
                      {w.type} • {w.currency || 'UZS'}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenAdjust(w)}
                    className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white/90 transition-colors cursor-pointer"
                    title="Balansni to'g'rilash"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  {w.is_default !== 1 && (
                    <button
                      onClick={() => handleSetDefault(w.id)}
                      className="p-1.5 rounded-xl bg-black/20 hover:bg-black/40 text-white/90 transition-colors cursor-pointer"
                      title="Asosiy karta qilish"
                    >
                      <Star className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {wallets.length > 1 && (
                    <button
                      onClick={() => handleDeleteWallet(w.id)}
                      className="p-1.5 rounded-xl bg-black/20 hover:bg-red-500/80 text-white/90 transition-colors cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card bottom */}
              <div className="mt-4 pt-2 relative z-10 flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-white/75 font-medium uppercase tracking-wider">Joriy Qoldiq</p>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
                    {w.balance.toLocaleString('uz-UZ')} <span className="text-sm font-bold">{w.currency || 'UZS'}</span>
                  </h2>
                </div>

                {w.card_number_last4 ? (
                  <p className="text-xs font-mono tracking-widest text-white/80 pb-1">
                    •••• {w.card_number_last4}
                  </p>
                ) : (
                  <p className="text-[11px] text-white/60 font-semibold pb-1 uppercase">
                    {w.type}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#7a5af8]/20 text-[#7a5af8] flex items-center justify-center">
                <ArrowLeftRight className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Kartalararo O'tkazma</h3>
                <p className="text-xs text-[#899098]">Hamyonlar o'rtasida mablag' o'tkazish</p>
              </div>
            </div>

            <form onSubmit={handleTransfer} className="space-y-3.5">
              <div>
                <label className="text-xs text-[#b6bfd0] font-semibold">Qaysi hisobdan (Chiqim):</label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.balance.toLocaleString('uz-UZ')} {w.currency || 'UZS'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0] font-semibold">Qaysi hisobga (Kirim):</label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                >
                  {wallets
                    .filter((w) => w.id !== fromWalletId)
                    .map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({w.balance.toLocaleString('uz-UZ')} {w.currency || 'UZS'})
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0] font-semibold">O'tkazma summasi:</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Masalan: 50000"
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0] font-semibold">Izoh (ixtiyoriy):</label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Karta to'ldirish, naqdlashtirish va h.k."
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#899098] hover:text-white cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={transferLoading}
                  className="px-5 py-2.5 rounded-xl bg-[#29c184] hover:bg-[#25ab75] text-white text-xs font-bold shadow-md cursor-pointer disabled:opacity-50"
                >
                  {transferLoading ? "O'tkazilmoqda..." : "O'tkazish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Balance Modal */}
      {showAdjustModal && selectedWalletForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-base text-white">
              {selectedWalletForAdjust.name} balansini to'g'rilash
            </h3>

            <form onSubmit={handleSaveAdjust} className="space-y-3">
              <div>
                <label className="text-xs text-[#b6bfd0]">Yangi qoldiq summasi:</label>
                <input
                  type="number"
                  required
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
                <p className="text-[11px] text-[#899098] mt-1">
                  Farq avtomatik ravishda hisobotlarga "Balans to'g'rilandi" deb yoziladi.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjustModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#899098] hover:text-white cursor-pointer"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={adjustLoading}
                  className="px-5 py-2 rounded-xl bg-[#29c184] text-white text-xs font-bold cursor-pointer"
                >
                  {adjustLoading ? "Saqlanmoqda..." : "Saqlash"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Wallet Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-white">Yangi Karta / Hamyon Qo'shish</h3>
            <form onSubmit={handleCreateWallet} className="space-y-3">
              <div>
                <label className="text-xs text-[#b6bfd0]">Nomi</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: TBC Bank Humo, Oylik Karta"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-[#b6bfd0]">Turi</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                  >
                    <option value="uzcard">Uzcard</option>
                    <option value="humo">Humo</option>
                    <option value="visa">Visa</option>
                    <option value="cash">Naqd pul</option>
                    <option value="invest">Investitsiya</option>
                    <option value="bank">Bank hisobi</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#b6bfd0]">Oxirgi 4 raqami (ixtiyoriy)</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLast4}
                    onChange={(e) => setCardLast4(e.target.value)}
                    placeholder="8600"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#b6bfd0]">Boshlang'ich qoldiq (so'm)</label>
                <input
                  type="number"
                  value={balanceStr}
                  onChange={(e) => setBalanceStr(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]"
                />
              </div>

              {/* Color selector */}
              <div>
                <label className="text-xs text-[#b6bfd0]">Karta rangi</label>
                <div className="flex gap-2 py-1">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${color === c ? 'scale-125 ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-[#899098] hover:text-white cursor-pointer"
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
    </div>
  );
};
