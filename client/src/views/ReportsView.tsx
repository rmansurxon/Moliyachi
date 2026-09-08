import React, { useState } from 'react';
import { Transaction } from '../types';
import { triggerHaptic } from '../api';
import { Icon } from '../components/Icon';
import { FileDown, Calendar, Filter, ArrowDownRight, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReportsViewProps {
  transactions: Transaction[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ transactions }) => {
  const [periodFilter, setPeriodFilter] = useState<'today' | 'week' | 'month' | 'all'>('month');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');

  const now = new Date();

  const filtered = transactions.filter((tx) => {
    // Type filter
    if (typeFilter !== 'all' && tx.type !== typeFilter) return false;

    // Date filter
    const txDate = new Date(tx.date);
    if (periodFilter === 'today') {
      return txDate.toDateString() === now.toDateString();
    }
    if (periodFilter === 'week') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(now.getDate() - 7);
      return txDate >= oneWeekAgo;
    }
    if (periodFilter === 'month') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(now.getMonth() - 1);
      return txDate >= oneMonthAgo;
    }
    return true;
  });

  const totalExpense = filtered
    .filter((t) => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalIncome = filtered
    .filter((t) => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  // Export to CSV
  const handleExportCSV = () => {
    triggerHaptic('success');
    confetti({ particleCount: 30, spread: 60 });

    const headers = ['Sana', 'Turi', 'Kategoriya', 'Hamyon', 'Summa', 'Izoh'];
    const rows = filtered.map((t) => [
      new Date(t.date).toLocaleDateString('uz-UZ'),
      t.type,
      t.category_name || '',
      t.wallet_name || '',
      t.amount,
      `"${t.description.replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `hisobchi_ai_hisobot_${periodFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Header and export button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white light:text-[#1d2939]">Hisobotlar</h2>
          <p className="text-xs text-[#899098]">Batafsil moliyaviy hisobot va eksport</p>
        </div>

        <button
          onClick={handleExportCSV}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#1570ef] text-white text-xs font-bold shadow-md shadow-[#1570ef]/30 active:scale-95 transition-all cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          <span>Excel (CSV)</span>
        </button>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
        {(['today', 'week', 'month', 'all'] as const).map((p) => {
          const labels = { today: 'Bugun', week: 'Bu hafta', month: 'Bu oy', all: 'Hammasi' };
          const isActive = periodFilter === p;
          return (
            <button
              key={p}
              onClick={() => {
                triggerHaptic('light');
                setPeriodFilter(p);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${
                isActive
                  ? 'bg-[#29c184] text-white shadow-sm'
                  : 'bg-[#213040] light:bg-white text-[#899098] border border-[#354454]/60'
              }`}
            >
              {labels[p]}
            </button>
          );
        })}
      </div>

      {/* Summary figures */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3.5 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] space-y-1">
          <p className="text-[10px] text-[#899098] font-semibold">Jami Xarajat</p>
          <p className="text-base font-black text-[#f0646e]">
            -{totalExpense.toLocaleString('uz-UZ')} so'm
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] space-y-1">
          <p className="text-[10px] text-[#899098] font-semibold">Jami Daromad</p>
          <p className="text-base font-black text-[#29c184]">
            +{totalIncome.toLocaleString('uz-UZ')} so'm
          </p>
        </div>
      </div>

      {/* Transactions list in report */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-[#899098]">
          <span>Topilgan amaliyotlar: <strong>{filtered.length} ta</strong></span>
        </div>

        {filtered.length === 0 ? (
          <p className="text-xs text-[#899098] text-center p-6 bg-[#213040] rounded-2xl">
            Tanlangan oraliqda amaliyotlar mavjud emas.
          </p>
        ) : (
          <div className="space-y-1.5">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="p-3 rounded-2xl bg-[#213040] light:bg-white border border-[#354454]/60 flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0"
                    style={{
                      backgroundColor:
                        t.type === 'transfer' ? '#1570ef' : t.category_color || '#29c184'
                    }}
                  >
                    {t.type === 'transfer' ? (
                      <ArrowLeftRight className="w-4 h-4" />
                    ) : (
                      <Icon name={t.category_icon || 'Tag'} size={16} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white light:text-[#1d2939] truncate">
                      {t.description}
                    </p>
                    <p className="text-[10px] text-[#899098]">
                      {new Date(t.date).toLocaleDateString('uz-UZ')} • {t.wallet_name}
                    </p>
                  </div>
                </div>

                <span
                  className={`text-xs font-black shrink-0 ${
                    t.type === 'expense' ? 'text-[#f0646e]' : t.type === 'transfer' ? 'text-[#1570ef]' : 'text-[#29c184]'
                  }`}
                >
                  {t.type === 'expense' ? '-' : t.type === 'transfer' ? '⇄ ' : '+'}
                  {t.amount.toLocaleString('uz-UZ')} so'm
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
