import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api, triggerHaptic } from '../api';
import { Icon } from '../components/Icon';
import { TrendingUp, TrendingDown, PiggyBank, Sparkles, ChevronRight } from 'lucide-react';
export const StatisticsView = ({ onOpenMonthlyWrap }) => {
    const [period, setPeriod] = useState('month');
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadSummary();
    }, [period]);
    const loadSummary = async () => {
        setLoading(true);
        try {
            const data = await api.getSummary(period);
            setSummary(data);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const netSavings = summary ? Math.max(0, summary.totalIncome - summary.totalExpense) : 0;
    const savingsRate = summary && summary.totalIncome > 0
        ? Math.round((netSavings / summary.totalIncome) * 100)
        : 0;
    return (_jsxs("div", { className: "space-y-4 max-w-md mx-auto pb-24 px-4 pt-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h2", { className: "text-xl font-black text-white light:text-[#1d2939]", children: "Statistika va Tahlil" }), _jsx("div", { className: "flex p-1 rounded-2xl bg-[#213040] light:bg-[#eaecf0] border border-[#354454] light:border-[#d0d5dd]", children: ['week', 'month', 'year'].map((p) => {
                            const labels = { week: 'Hafta', month: 'Oy', year: 'Yil' };
                            const isActive = period === p;
                            return (_jsx("button", { onClick: () => {
                                    triggerHaptic('light');
                                    setPeriod(p);
                                }, className: `px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${isActive
                                    ? 'bg-[#29c184] text-white shadow-sm'
                                    : 'text-[#899098] hover:text-white light:hover:text-black'}`, children: labels[p] }, p));
                        }) })] }), _jsxs("div", { onClick: () => {
                    triggerHaptic('medium');
                    onOpenMonthlyWrap();
                }, className: "p-4 rounded-3xl bg-gradient-to-r from-[#7a5af8]/25 via-[#2fa8cc]/20 to-[#29c184]/25 border border-[#7a5af8]/40 flex items-center justify-between cursor-pointer active:scale-98 transition-all group shadow-lg", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#7a5af8] to-[#2fa8cc] flex items-center justify-center text-white font-black shadow-md", children: _jsx(Sparkles, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsx("h4", { className: "text-sm font-extrabold text-white light:text-[#1d2939] group-hover:text-[#29c184] transition-colors", children: "Oylik Yakun (Stories)" }), _jsx("p", { className: "text-[11px] text-[#b6bfd0] light:text-[#475467]", children: "Oylik moliyaviy natijalaringiz va xulosalaringiz" })] })] }), _jsx(ChevronRight, { className: "w-5 h-5 text-[#29c184] group-hover:translate-x-1 transition-transform" })] }), summary && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "p-4 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-xs text-[#29c184] font-bold mb-1", children: [_jsx(TrendingUp, { className: "w-4 h-4" }), _jsx("span", { children: "Daromad" })] }), _jsxs("h3", { className: "text-lg font-black text-white light:text-[#1d2939]", children: [summary.totalIncome.toLocaleString('uz-UZ'), " so'm"] })] }), _jsxs("div", { className: "p-4 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-sm", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-xs text-[#f0646e] font-bold mb-1", children: [_jsx(TrendingDown, { className: "w-4 h-4" }), _jsx("span", { children: "Xarajat" })] }), _jsxs("h3", { className: "text-lg font-black text-white light:text-[#1d2939]", children: [summary.totalExpense.toLocaleString('uz-UZ'), " so'm"] })] })] }), _jsxs("div", { className: "p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-sm space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between text-xs font-bold text-[#b6bfd0] light:text-[#475467]", children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx(PiggyBank, { className: "w-4 h-4 text-[#29c184]" }), _jsx("span", { children: "Tejamkorlik Ko'rsatkichi" })] }), _jsxs("span", { className: "text-[#29c184] font-extrabold text-sm", children: [savingsRate, "%"] })] }), _jsx("div", { className: "w-full h-3 rounded-full bg-[#151d27] light:bg-[#eaecf0] overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-[#12A99D] via-[#29c184] to-[#9DFC38] transition-all duration-700", style: { width: `${Math.min(100, Math.max(5, savingsRate))}%` } }) }), _jsxs("div", { className: "flex justify-between text-[11px] text-[#899098]", children: [_jsxs("span", { children: ["Sof jamg'arma: ", netSavings.toLocaleString('uz-UZ'), " so'm"] }), _jsx("span", { children: "Reja: 20%+" })] })] }), _jsxs("div", { className: "space-y-2.5", children: [_jsx("h3", { className: "text-sm font-bold text-white light:text-[#1d2939]", children: "Xarajat Toifalari Bo'yicha Tahlil" }), summary.categoryStats.length === 0 ? (_jsx("p", { className: "text-xs text-[#899098] p-4 text-center rounded-2xl bg-[#213040]", children: "Ushbu davrda xarajatlar qayd etilmagan." })) : (_jsx("div", { className: "space-y-2", children: summary.categoryStats.map((cat) => {
                                    const percent = summary.totalExpense > 0
                                        ? Math.round((cat.amount / summary.totalExpense) * 100)
                                        : 0;
                                    return (_jsxs("div", { className: "p-3 rounded-2xl bg-[#213040] light:bg-white border border-[#354454]/60 light:border-[#eaecf0] shadow-sm space-y-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2.5", children: [_jsx("div", { className: "w-8 h-8 rounded-xl flex items-center justify-center text-white shadow-sm", style: { backgroundColor: cat.color }, children: _jsx(Icon, { name: cat.icon, size: 16 }) }), _jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-white light:text-[#1d2939]", children: cat.name }), _jsxs("p", { className: "text-[10px] text-[#899098]", children: [cat.count, " ta amaliyot"] })] })] }), _jsxs("div", { className: "text-right", children: [_jsxs("span", { className: "text-xs font-black text-white light:text-[#1d2939]", children: [cat.amount.toLocaleString('uz-UZ'), " so'm"] }), _jsxs("span", { className: "block text-[10px] font-bold text-[#29c184]", children: [percent, "%"] })] })] }), _jsx("div", { className: "w-full h-1.5 rounded-full bg-[#151d27] light:bg-[#f2f4f7] overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-500", style: {
                                                        width: `${percent}%`,
                                                        backgroundColor: cat.color
                                                    } }) })] }, cat.id));
                                }) }))] })] }))] }));
};
