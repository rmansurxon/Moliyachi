import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { triggerHaptic } from '../api';
import { Icon } from '../components/Icon';
import { FileDown, ArrowLeftRight, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
export const ReportsView = ({ transactions, onEditTransaction }) => {
    const [periodFilter, setPeriodFilter] = useState('month');
    const [typeFilter, setTypeFilter] = useState('all');
    const now = new Date();
    const filtered = transactions.filter((tx) => {
        // Type filter
        if (typeFilter !== 'all' && tx.type !== typeFilter)
            return false;
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
    return (_jsxs("div", { className: "space-y-4 max-w-md mx-auto pb-24 px-4 pt-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-white light:text-[#1d2939]", children: "Hisobotlar" }), _jsx("p", { className: "text-xs text-[#899098]", children: "Batafsil moliyaviy hisobot va eksport" })] }), _jsxs("button", { onClick: handleExportCSV, className: "flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#1570ef] text-white text-xs font-bold shadow-md shadow-[#1570ef]/30 active:scale-95 transition-all cursor-pointer", children: [_jsx(FileDown, { className: "w-4 h-4" }), _jsx("span", { children: "Excel (CSV)" })] })] }), _jsx("div", { className: "flex gap-2 overflow-x-auto no-scrollbar py-1", children: ['today', 'week', 'month', 'all'].map((p) => {
                    const labels = { today: 'Bugun', week: 'Bu hafta', month: 'Bu oy', all: 'Hammasi' };
                    const isActive = periodFilter === p;
                    return (_jsx("button", { onClick: () => {
                            triggerHaptic('light');
                            setPeriodFilter(p);
                        }, className: `px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap cursor-pointer transition-all ${isActive
                            ? 'bg-[#29c184] text-white shadow-sm'
                            : 'bg-[#213040] light:bg-white text-[#899098] border border-[#354454]/60'}`, children: labels[p] }, p));
                }) }), _jsxs("div", { className: "grid grid-cols-2 gap-3", children: [_jsxs("div", { className: "p-3.5 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] space-y-1", children: [_jsx("p", { className: "text-[10px] text-[#899098] font-semibold", children: "Jami Xarajat" }), _jsxs("p", { className: "text-base font-black text-[#f0646e]", children: ["-", totalExpense.toLocaleString('uz-UZ'), " so'm"] })] }), _jsxs("div", { className: "p-3.5 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] space-y-1", children: [_jsx("p", { className: "text-[10px] text-[#899098] font-semibold", children: "Jami Daromad" }), _jsxs("p", { className: "text-base font-black text-[#29c184]", children: ["+", totalIncome.toLocaleString('uz-UZ'), " so'm"] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("div", { className: "flex items-center justify-between text-xs text-[#899098]", children: _jsxs("span", { children: ["Topilgan amaliyotlar: ", _jsxs("strong", { children: [filtered.length, " ta"] })] }) }), filtered.length === 0 ? (_jsx("p", { className: "text-xs text-[#899098] text-center p-6 bg-[#213040] rounded-2xl", children: "Tanlangan oraliqda amaliyotlar mavjud emas." })) : (_jsx("div", { className: "space-y-1.5", children: filtered.map((t) => (_jsxs("div", { onClick: () => {
                                triggerHaptic('light');
                                onEditTransaction?.(t);
                            }, className: "p-3 rounded-2xl bg-[#213040] light:bg-white border border-[#354454]/60 hover:border-[#29c184]/50 flex items-center justify-between cursor-pointer transition-all group", children: [_jsxs("div", { className: "flex items-center gap-2.5 min-w-0", children: [_jsx("div", { className: "w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 group-hover:scale-105 transition-transform", style: {
                                                backgroundColor: t.type === 'transfer' ? '#1570ef' : t.category_color || '#29c184'
                                            }, children: t.type === 'transfer' ? (_jsx(ArrowLeftRight, { className: "w-4 h-4" })) : (_jsx(Icon, { name: t.category_icon || 'Tag', size: 16 })) }), _jsxs("div", { className: "min-w-0", children: [_jsx("p", { className: "text-xs font-bold text-white light:text-[#1d2939] truncate group-hover:text-[#29c184] transition-colors", children: t.description }), _jsxs("p", { className: "text-[10px] text-[#899098]", children: [new Date(t.date).toLocaleDateString('uz-UZ'), " \u2022 ", t.wallet_name] })] })] }), _jsxs("div", { className: "flex items-center gap-2 shrink-0", children: [_jsxs("span", { className: `text-xs font-black font-mono ${t.type === 'expense' ? 'text-[#f0646e]' : t.type === 'transfer' ? 'text-[#1570ef]' : 'text-[#29c184]'}`, children: [t.type === 'expense' ? '-' : t.type === 'transfer' ? '⇄ ' : '+', t.amount.toLocaleString('uz-UZ'), " so'm"] }), _jsx("div", { className: "w-6 h-6 rounded-md bg-[#19232e] opacity-0 group-hover:opacity-100 flex items-center justify-center text-[#899098] hover:text-white transition-all", children: _jsx(Edit3, { className: "w-3 h-3" }) })] })] }, t.id))) }))] })] }));
};
