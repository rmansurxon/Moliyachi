import React, { useState } from 'react';
import { User, Wallet, Transaction, FinancialSummary } from '../types';
import { triggerHaptic } from '../api';
import {
  Eye,
  EyeOff,
  Plus,
  Info,
  ChevronsUpDown,
  ShoppingBag,
  Film,
  CreditCard,
  Wallet as WalletIcon,
  MessageSquare,
  Diamond,
  EyeOff as EyeSlash,
  Gauge,
  X,
  ChevronRight,
  RefreshCw,
  PiggyBank,
  HelpCircle,
  Shirt,
  HandCoins,
  DollarSign
} from 'lucide-react';

interface HomeViewProps {
  user: User;
  wallets: Wallet[];
  transactions: Transaction[];
  summary: FinancialSummary | null;
  onOpenAddModal: (defaultType?: 'expense' | 'income' | 'transfer') => void;
  onNavigateTab: (tab: any) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenMonthlyWrap: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  user,
  wallets,
  transactions,
  summary,
  onOpenAddModal,
  onNavigateTab,
  onDeleteTransaction,
  onOpenMonthlyWrap
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [showBanner, setShowBanner] = useState(true);

  // Total balance formatted in UZS
  const totalBalance = wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12850 : w.balance), 0);
  const formattedBalance = totalBalance.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Quick Action Buttons list (as in screenshot)
  const quickActions = [
    { id: 'gamification', label: 'Olmoslaringizni almashtiring', icon: ShoppingBag, color: 'text-emerald-400' },
    { id: 'oy-yakuni', label: 'Avgust Oyingiz sarhisobi', icon: Film, color: 'text-pink-400', isSpecial: true },
    { id: 'card-monitoring', label: 'Karta monitoringi', icon: CreditCard, color: 'text-teal-400' },
    { id: 'payments', label: "To'lovlar", icon: WalletIcon, color: 'text-emerald-300' },
    { id: 'chat', label: 'AI chat', icon: MessageSquare, color: 'text-white' },
    { id: 'gamification', label: 'Olmoslar nima uchun kerak?', icon: Diamond, color: 'text-cyan-300' },
    { id: 'balances', label: 'Karta monitoringi', icon: CreditCard, color: 'text-slate-300' },
    { id: 'hide-stats', label: "Statistikaga qo'shish", icon: EyeSlash, color: 'text-emerald-400' },
    { id: 'goals', label: 'Oylik limit', icon: Gauge, color: 'text-teal-300' }
  ];

  const handleActionClick = (actionId: string) => {
    triggerHaptic('light');
    if (actionId === 'oy-yakuni') onOpenMonthlyWrap();
    else if (actionId === 'chat') onNavigateTab('chat');
    else if (actionId === 'card-monitoring' || actionId === 'balances') onNavigateTab('balances');
    else if (actionId === 'gamification') onNavigateTab('gamification');
    else if (actionId === 'goals') onNavigateTab('goals');
    else onOpenAddModal('expense');
  };

  const getTxIcon = (tx: Transaction) => {
    const desc = tx.description.toLowerCase();
    const cat = (tx.category_name || '').toLowerCase();
    if (desc.includes('balans') || cat.includes('balans')) return <RefreshCw className="w-4 h-4 text-[#7a5af8]" />;
    if (desc.includes('purse') || cat.includes('jamg\'arma')) return <PiggyBank className="w-4 h-4 text-[#23a887]" />;
    if (desc.includes('karona') || desc.includes('kredit')) return <CreditCard className="w-4 h-4 text-[#ff8d28]" />;
    if (desc.includes('bank') || cat.includes('aniqlanmagan')) return <HelpCircle className="w-4 h-4 text-[#3182ce]" />;
    if (desc.includes('naushnik') || cat.includes('kiyim')) return <Shirt className="w-4 h-4 text-[#ec4899]" />;
    if (desc.includes('qarz') || cat.includes('qarz')) return <HandCoins className="w-4 h-4 text-[#29c184]" />;
    return <DollarSign className="w-4 h-4 text-[#10b981]" />;
  };

  return (
    <div className="space-y-6 px-4 md:px-8 py-5 max-w-7xl mx-auto select-none">
      {/* 1. Umumiy Balans Row */}
      <div className="space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#8b9aa8]">
          <span>Umumiy balans:</span>
          <Info className="w-3.5 h-3.5 text-[#8b9aa8]" />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight">
              {showBalance ? formattedBalance : '••••••••'}
            </h1>
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold text-[#8b9aa8]">
              <span>UZS</span>
              <ChevronsUpDown className="w-3.5 h-3.5" />
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              setShowBalance(!showBalance);
            }}
            className="p-2 text-[#8b9aa8] hover:text-white transition-colors cursor-pointer"
          >
            {showBalance ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 2. Wallets / Cards Horizontal Carousel */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4 md:-mx-0 md:px-0">
        {/* Green Plus button */}
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenAddModal('expense');
          }}
          className="w-13 h-24 shrink-0 rounded-2xl bg-[#23a887] hover:bg-[#1f9376] flex items-center justify-center text-white shadow-lg active:scale-95 transition-all cursor-pointer"
          title="Yangi amaliyot yoki karta qo'shish"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Dynamic Cards list matching screenshot */}
        {wallets.map((w) => {
          let cardBg = 'linear-gradient(135deg, #7042f4 0%, #8b5cf6 100%)';
          let iconPrefix = '💳';

          if (w.name.toLowerCase().includes('invest')) {
            cardBg = 'linear-gradient(135deg, #7042f4 0%, #8b5cf6 100%)';
            iconPrefix = '📈';
          } else if (w.name.toLowerCase().includes('asosiy')) {
            cardBg = 'linear-gradient(135deg, #20b2aa 0%, #23a887 100%)';
            iconPrefix = '💳';
          } else if (w.name.toLowerCase().includes('naqd')) {
            cardBg = 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)';
            iconPrefix = '💵';
          } else if (w.name.toLowerCase().includes('dollar')) {
            cardBg = 'linear-gradient(135deg, #2b6cb0 0%, #3182ce 100%)';
            iconPrefix = '💵';
          }

          return (
            <div
              key={w.id}
              onClick={() => {
                triggerHaptic('light');
                onNavigateTab('balances');
              }}
              className="w-56 h-24 shrink-0 p-3 rounded-2xl text-white shadow-lg flex flex-col justify-between relative overflow-hidden cursor-pointer active:scale-98 transition-transform"
              style={{ background: cardBg }}
            >
              {/* Top info */}
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-white/95">
                  <span className="text-sm">{iconPrefix}</span>
                  <span className="truncate">{w.name}</span>
                </div>
                {/* Watermark symbol */}
                <span className="text-white/40 text-xs font-mono">☺</span>
              </div>

              {/* Balance */}
              <div className="relative z-10">
                <h4 className="text-lg font-black tracking-tight leading-none">
                  {showBalance ? w.balance.toLocaleString('uz-UZ') : '••••••'}{' '}
                  <span className="text-xs font-bold text-white/85">{w.currency || 'UZS'}</span>
                </h4>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Quick Action Feature Icons Row */}
      <div className="flex items-start gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4 md:-mx-0 md:px-0">
        {quickActions.map((act, index) => {
          const IconComp = act.icon;
          return (
            <div
              key={index}
              onClick={() => handleActionClick(act.id)}
              className="flex flex-col items-center gap-2 shrink-0 w-20 cursor-pointer group"
            >
              <div
                className={`w-14 h-14 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 shadow-sm ${
                  act.isSpecial
                    ? 'bg-gradient-to-tr from-[#9447d1] to-[#f0646e] border-transparent text-white'
                    : 'bg-[#1e2a37] border-[#2c3d4f] text-white hover:border-[#29c184]/50'
                }`}
              >
                <IconComp className={`w-6 h-6 ${act.color}`} />
              </div>
              <span className="text-[11px] text-[#94a3b8] text-center font-medium leading-tight line-clamp-2">
                {act.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* 4. Xabarlar (Promo Card) */}
      {showBanner && (
        <div className="space-y-1.5">
          <h3 className="text-sm font-bold text-white">Xabarlar</h3>
          <div className="p-4 rounded-2xl bg-[#23a887] relative overflow-hidden flex items-center justify-between text-white max-w-sm shadow-md">
            <button
              onClick={() => setShowBanner(false)}
              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/30 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl">
                🤖
              </div>
              <div>
                <h4 className="text-xs font-black">Hisobchi AI Bot Ishga Tushdi</h4>
                <p className="text-[11px] text-white/90">Telegram orqali ham barcha hisoblaringizni yuritishingiz mumkin</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Main Two-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Column: Oxirgi hisobotlar */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Oxirgi hisobotlar:</h3>
            <button
              onClick={() => onNavigateTab('reports')}
              className="flex items-center gap-1 text-xs font-semibold text-[#8b9aa8] hover:text-white cursor-pointer"
            >
              <span>Barchasi</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Transactions box */}
          <div className="rounded-3xl bg-[#1c2733] border border-[#263445] overflow-hidden p-4 shadow-xl space-y-3">
            {/* Header: Bugun + sums */}
            <div className="flex items-center justify-between text-xs text-[#8b9aa8] pb-2 border-b border-[#263445]">
              <span className="font-bold text-white">Bugun</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[#23a887] font-bold">+581 464,68 uzs</span>
                <span>|</span>
                <span className="text-[#f0646e] font-bold">-400 465,62 uzs</span>
              </div>
            </div>

            {/* Transaction items */}
            <div className="divide-y divide-[#263445]/60">
              {transactions.slice(0, 10).map((tx) => {
                const isExpense = tx.type === 'expense';
                return (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between hover:bg-white/2 rounded-xl px-2 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-4">
                      {/* Icon */}
                      <div className="w-10 h-10 rounded-2xl bg-[#233140] flex items-center justify-center shrink-0 shadow-sm">
                        {getTxIcon(tx)}
                      </div>

                      {/* Title & subtitle */}
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate max-w-sm">
                          {tx.description}
                        </h4>
                        <p className="text-[11px] text-[#8b9aa8] truncate mt-0.5">
                          {tx.category_label || `${tx.category_name || 'Xarajat'} • ${tx.wallet_name || 'Hamyon'}`}
                        </p>
                      </div>
                    </div>

                    {/* Amount & Time */}
                    <div className="text-right shrink-0">
                      <p
                        className={`text-xs font-black font-mono ${
                          isExpense ? 'text-[#f0646e]' : 'text-[#23a887]'
                        }`}
                      >
                        {isExpense ? '-' : '+'}
                        {tx.amount.toLocaleString('uz-UZ')} UZS
                      </p>
                      <p className="text-[10px] text-[#8b9aa8] mt-0.5">
                        {tx.time_str || '11:13'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Joriy oy & Kutilayotgan hisoblar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Joriy oy */}
          <div className="rounded-3xl bg-[#1c2733] border border-[#263445] p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span>Joriy oy:</span>
                <Info className="w-3.5 h-3.5 text-[#8b9aa8]" />
              </div>
              <button
                onClick={() => onNavigateTab('stats')}
                className="flex items-center gap-1 text-xs font-semibold text-[#8b9aa8] hover:text-white cursor-pointer"
              >
                <span>Barchasi</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Kirim block */}
            <div className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-black text-white font-mono">
                  1 587 064,68 <span className="text-xs font-bold text-[#8b9aa8]">uzs</span>
                </h3>
                <span className="text-[11px] font-bold text-[#f0646e]">-79.8%</span>
              </div>
              <p className="text-[10px] text-[#8b9aa8]">kirim • avgustga nisbatan</p>

              {/* Sub-pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1">
                  <span className="text-emerald-400">🟢</span> 561 000 uzs
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1">
                  <span>✈️</span> 520 404 uzs
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1">
                  <span>❓</span> 180 000 uzs
                </span>
              </div>
            </div>

            {/* Chiqim block */}
            <div className="space-y-2 pt-2 border-t border-[#263445]">
              <div className="flex items-baseline justify-between">
                <h3 className="text-xl font-black text-white font-mono">
                  3 928 508,62 <span className="text-xs font-bold text-[#8b9aa8]">uzs</span>
                </h3>
                <span className="text-[11px] font-bold text-[#f0646e]">-49.9%</span>
              </div>
              <p className="text-[10px] text-[#8b9aa8]">chiqim • avgustga nisbatan</p>

              {/* Sub-pills */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1">
                  <span>👚</span> 1 952 000 uzs
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1">
                  <span>🏛️</span> 760 000 uzs
                </span>
                <span className="px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1">
                  <span>🛒</span> 475 170 uzs
                </span>
              </div>
            </div>
          </div>

          {/* Card 2: Kutilayotgan hisoblar */}
          <div className="rounded-3xl bg-[#1c2733] border border-[#263445] p-5 shadow-xl space-y-3">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <span>Kutilayotgan hisoblar:</span>
              <Info className="w-3.5 h-3.5 text-[#8b9aa8]" />
            </div>

            {/* Kirim kutilmoqda */}
            <div
              onClick={() => onNavigateTab('debts')}
              className="p-3 rounded-2xl bg-[#16202b] border border-[#263445] flex items-center justify-between cursor-pointer hover:border-[#23a887]/50 transition-colors"
            >
              <div>
                <p className="text-sm font-black text-white font-mono">0 uzs</p>
                <p className="text-[10px] text-[#23a887]">kirim kutilmoqda...</p>
              </div>
              <span className="text-xs text-[#8b9aa8] flex items-center gap-1">
                0 ta <ChevronRight className="w-3 h-3 text-[#23a887]" />
              </span>
            </div>

            {/* Chiqim kutilmoqda */}
            <div
              onClick={() => onNavigateTab('debts')}
              className="p-3 rounded-2xl bg-[#16202b] border border-[#263445] flex items-center justify-between cursor-pointer hover:border-[#f0646e]/50 transition-colors"
            >
              <div>
                <p className="text-sm font-black text-white font-mono">0 uzs</p>
                <p className="text-[10px] text-[#f0646e]">chiqim kutilmoqda...</p>
              </div>
              <span className="text-xs text-[#8b9aa8] flex items-center gap-1">
                0 ta <ChevronRight className="w-3 h-3 text-[#f0646e]" />
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
