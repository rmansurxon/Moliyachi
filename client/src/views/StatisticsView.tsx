import React, { useState, useEffect } from 'react';
import { FinancialSummary } from '../types';
import { api, triggerHaptic } from '../api';
import { Icon } from '../components/Icon';
import { BarChart3, TrendingUp, TrendingDown, PiggyBank, Sparkles, ChevronRight } from 'lucide-react';

interface StatisticsViewProps {
  onOpenMonthlyWrap: () => void;
}

export const StatisticsView: React.FC<StatisticsViewProps> = ({ onOpenMonthlyWrap }) => {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSummary();
  }, [period]);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await api.getSummary(period);
      setSummary(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const netSavings = summary ? Math.max(0, summary.totalIncome - summary.totalExpense) : 0;
  const savingsRate = summary && summary.totalIncome > 0
    ? Math.round((netSavings / summary.totalIncome) * 100)
    : 0;

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Header and Period switcher */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-white light:text-[#1d2939]">Statistika va Tahlil</h2>

        <div className="flex p-1 rounded-2xl bg-[#213040] light:bg-[#eaecf0] border border-[#354454] light:border-[#d0d5dd]">
          {(['week', 'month', 'year'] as const).map((p) => {
            const labels = { week: 'Hafta', month: 'Oy', year: 'Yil' };
            const isActive = period === p;
            return (
              <button
                key={p}
                onClick={() => {
                  triggerHaptic('light');
                  setPeriod(p);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#29c184] text-white shadow-sm'
                    : 'text-[#899098] hover:text-white light:hover:text-black'
                }`}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Spotify-Wrapped Style Oylik Yakun Banner */}
      <div
        onClick={() => {
          triggerHaptic('medium');
          onOpenMonthlyWrap();
        }}
        className="p-4 rounded-3xl bg-gradient-to-r from-[#7a5af8]/25 via-[#2fa8cc]/20 to-[#29c184]/25 border border-[#7a5af8]/40 flex items-center justify-between cursor-pointer active:scale-98 transition-all group shadow-lg"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7a5af8] to-[#2fa8cc] flex items-center justify-center text-white font-black shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-white light:text-[#1d2939] group-hover:text-[#29c184] transition-colors">
              Oylik Yakun (Stories)
            </h4>
            <p className="text-[11px] text-[#b6bfd0] light:text-[#475467]">
              Oylik moliyaviy natijalaringiz va xulosalaringiz
            </p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5 text-[#29c184] group-hover:translate-x-1 transition-transform" />
      </div>

      {summary && (
        <>
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Income */}
            <div className="p-4 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-sm">
              <div className="flex items-center gap-1.5 text-xs text-[#29c184] font-bold mb-1">
                <TrendingUp className="w-4 h-4" />
                <span>Daromad</span>
              </div>
              <h3 className="text-lg font-black text-white light:text-[#1d2939]">
                {summary.totalIncome.toLocaleString('uz-UZ')} so'm
              </h3>
            </div>

            {/* Expense */}
            <div className="p-4 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-sm">
              <div className="flex items-center gap-1.5 text-xs text-[#f0646e] font-bold mb-1">
                <TrendingDown className="w-4 h-4" />
                <span>Xarajat</span>
              </div>
              <h3 className="text-lg font-black text-white light:text-[#1d2939]">
                {summary.totalExpense.toLocaleString('uz-UZ')} so'm
              </h3>
            </div>
          </div>

          {/* Savings Rate Card */}
          <div className="p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-[#b6bfd0] light:text-[#475467]">
              <div className="flex items-center gap-1.5">
                <PiggyBank className="w-4 h-4 text-[#29c184]" />
                <span>Tejamkorlik Ko'rsatkichi</span>
              </div>
              <span className="text-[#29c184] font-extrabold text-sm">{savingsRate}%</span>
            </div>

            <div className="w-full h-3 rounded-full bg-[#151d27] light:bg-[#eaecf0] overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#12A99D] via-[#29c184] to-[#9DFC38] transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(5, savingsRate))}%` }}
              ></div>
            </div>

            <div className="flex justify-between text-[11px] text-[#899098]">
              <span>Sof jamg'arma: {netSavings.toLocaleString('uz-UZ')} so'm</span>
              <span>Reja: 20%+</span>
            </div>
          </div>

          {/* Category Breakdown list */}
          <div className="space-y-2.5">
            <h3 className="text-sm font-bold text-white light:text-[#1d2939]">
              Xarajat Toifalari Bo'yicha Tahlil
            </h3>

            {summary.categoryStats.length === 0 ? (
              <p className="text-xs text-[#899098] p-4 text-center rounded-2xl bg-[#213040]">
                Ushbu davrda xarajatlar qayd etilmagan.
              </p>
            ) : (
              <div className="space-y-2">
                {summary.categoryStats.map((cat) => {
                  const percent = summary.totalExpense > 0
                    ? Math.round((cat.amount / summary.totalExpense) * 100)
                    : 0;

                  return (
                    <div
                      key={cat.id}
                      className="p-3 rounded-2xl bg-[#213040] light:bg-white border border-[#354454]/60 light:border-[#eaecf0] shadow-sm space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm"
                            style={{ backgroundColor: cat.color }}
                          >
                            <Icon name={cat.icon} size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-white light:text-[#1d2939]">{cat.name}</p>
                            <p className="text-[10px] text-[#899098]">{cat.count} ta amaliyot</p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-xs font-black text-white light:text-[#1d2939]">
                            {cat.amount.toLocaleString('uz-UZ')} so'm
                          </span>
                          <span className="block text-[10px] font-bold text-[#29c184]">{percent}%</span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full h-1.5 rounded-full bg-[#151d27] light:bg-[#f2f4f7] overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: cat.color
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
