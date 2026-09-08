import React, { useState } from 'react';
import { User, Wallet, Transaction, FinancialSummary } from '../types';
import { triggerHaptic } from '../api';
import {
  Eye,
  EyeOff,
  Plus,
  Info,
  ChevronsUpDown,
  CreditCard,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
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
  wallets,
  transactions,
  summary,
  onOpenAddModal,
  onNavigateTab,
}) => {
  const [showBalance, setShowBalance] = useState(true);

  // Total balance formatted in UZS
  const totalBalance = wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12850 : w.balance), 0);
  const formattedBalance = totalBalance.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const totalExpense = summary?.totalExpense || 0;
  const totalIncome = summary?.totalIncome || 0;

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
          title="Yangi amaliyot qo'shish"
        >
          <Plus className="w-6 h-6 stroke-[3]" />
        </button>

        {/* Dynamic Cards list */}
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

      {/* 3. Minimalist Quick Action Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenAddModal('expense');
          }}
          className="p-3 rounded-2xl bg-[#1c2733] border border-[#263445] hover:border-[#f0646e]/50 flex items-center gap-3 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#f0646e]/15 flex items-center justify-center text-[#f0646e] group-hover:scale-105 transition-transform">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">Xarajat</p>
            <p className="text-[10px] text-[#8b9aa8]">Pul chiqimi</p>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenAddModal('income');
          }}
          className="p-3 rounded-2xl bg-[#1c2733] border border-[#263445] hover:border-[#23a887]/50 flex items-center gap-3 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#23a887]/15 flex items-center justify-center text-[#23a887] group-hover:scale-105 transition-transform">
            <ArrowUpRight className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">Daromad</p>
            <p className="text-[10px] text-[#8b9aa8]">Pul kirimi</p>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onOpenAddModal('transfer');
          }}
          className="p-3 rounded-2xl bg-[#1c2733] border border-[#263445] hover:border-[#3182ce]/50 flex items-center gap-3 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#3182ce]/15 flex items-center justify-center text-[#3182ce] group-hover:scale-105 transition-transform">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">O'tkazma</p>
            <p className="text-[10px] text-[#8b9aa8]">Kartalar aro</p>
          </div>
        </button>

        <button
          onClick={() => {
            triggerHaptic('medium');
            onNavigateTab('chat');
          }}
          className="p-3 rounded-2xl bg-[#1c2733] border border-[#263445] hover:border-[#29c184]/50 flex items-center gap-3 transition-all cursor-pointer group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#29c184]/15 flex items-center justify-center text-[#29c184] group-hover:scale-105 transition-transform">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div className="text-left">
            <p className="text-xs font-bold text-white">AI Yordamchi</p>
            <p className="text-[10px] text-[#29c184]">Ovoz & Chat</p>
          </div>
        </button>
      </div>

      {/* 4. Main Two-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Left Column: Oxirgi amaliyotlar */}
        <div className="lg:col-span-8 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Oxirgi amaliyotlar</h3>
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
            {/* Header with real totals */}
            <div className="flex items-center justify-between text-xs text-[#8b9aa8] pb-2 border-b border-[#263445]">
              <span className="font-bold text-white">Bu oy sarhisobi</span>
              <div className="flex items-center gap-2 font-mono">
                <span className="text-[#23a887] font-bold">+{totalIncome.toLocaleString('uz-UZ')} uzs</span>
                <span>|</span>
                <span className="text-[#f0646e] font-bold">-{totalExpense.toLocaleString('uz-UZ')} uzs</span>
              </div>
            </div>

            {/* Transaction items or clean empty state */}
            {transactions.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <p className="text-sm font-bold text-white">Hozircha amaliyotlar mavjud emas</p>
                <p className="text-xs text-[#8b9aa8] max-w-xs mx-auto">
                  Yuqoridagi tugmalar yoki AI Chat orqali birinchi xarajat yoki daromadingizni kiriting.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-[#263445]/60">
                {transactions.slice(0, 15).map((tx) => {
                  const isExpense = tx.type === 'expense';
                  return (
                    <div
                      key={tx.id}
                      className="py-3 flex items-center justify-between hover:bg-white/2 rounded-xl px-2 transition-colors group"
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-4">
                        <div className="w-10 h-10 rounded-2xl bg-[#233140] flex items-center justify-center shrink-0 shadow-sm">
                          {getTxIcon(tx)}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate max-w-sm">
                            {tx.description}
                          </h4>
                          <p className="text-[11px] text-[#8b9aa8] truncate mt-0.5">
                            {tx.category_label || `${tx.category_name || 'Amaliyot'} • ${tx.wallet_name || 'Hamyon'}`}
                          </p>
                        </div>
                      </div>

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
                          {tx.time_str || ''}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Joriy oy & Kutilayotgan qarzlar */}
        <div className="lg:col-span-4 space-y-4">
          {/* Card 1: Joriy oy statistikasi */}
          <div className="rounded-3xl bg-[#1c2733] border border-[#263445] p-5 shadow-xl space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <span>Joriy oy ko'rsatkichlari:</span>
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

            {/* Kirim */}
            <div className="space-y-1">
              <p className="text-[11px] text-[#8b9aa8]">Jami kirim:</p>
              <h3 className="text-xl font-black text-[#23a887] font-mono">
                +{totalIncome.toLocaleString('uz-UZ')} <span className="text-xs font-bold text-[#8b9aa8]">uzs</span>
              </h3>
            </div>

            {/* Chiqim */}
            <div className="space-y-1 pt-3 border-t border-[#263445]">
              <p className="text-[11px] text-[#8b9aa8]">Jami chiqim:</p>
              <h3 className="text-xl font-black text-[#f0646e] font-mono">
                -{totalExpense.toLocaleString('uz-UZ')} <span className="text-xs font-bold text-[#8b9aa8]">uzs</span>
              </h3>
            </div>
          </div>

          {/* Card 2: Qarzlar tezkor havolasi */}
          <div className="rounded-3xl bg-[#1c2733] border border-[#263445] p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Qarzlar & Majburiyatlar</span>
              <button
                onClick={() => onNavigateTab('debts')}
                className="text-xs text-[#29c184] hover:underline cursor-pointer"
              >
                Ko'rish
              </button>
            </div>

            <div
              onClick={() => onNavigateTab('debts')}
              className="p-3 rounded-2xl bg-[#16202b] border border-[#263445] flex items-center justify-between cursor-pointer hover:border-[#23a887]/50 transition-colors"
            >
              <div>
                <p className="text-xs font-bold text-white">Berilgan va olingan qarzlar</p>
                <p className="text-[10px] text-[#8b9aa8]">Muddati bilan nazorat qiling</p>
              </div>
              <ChevronRight className="w-4 h-4 text-[#8b9aa8]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
