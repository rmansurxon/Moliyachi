import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { triggerHaptic } from '../api';
import { Eye, EyeOff, Plus, Info, ChevronsUpDown, CreditCard, MessageSquare, ArrowUpRight, ArrowDownLeft, ArrowLeftRight, ChevronRight, RefreshCw, PiggyBank, HelpCircle, Shirt, HandCoins, DollarSign } from 'lucide-react';
export const HomeView = ({ wallets, transactions, summary, onOpenAddModal, onNavigateTab, }) => {
    const [showBalance, setShowBalance] = useState(true);
    // Total balance formatted in UZS
    const totalBalance = wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12850 : w.balance), 0);
    const formattedBalance = totalBalance.toLocaleString('uz-UZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const totalExpense = summary?.totalExpense || 0;
    const totalIncome = summary?.totalIncome || 0;
    const getTxIcon = (tx) => {
        const desc = tx.description.toLowerCase();
        const cat = (tx.category_name || '').toLowerCase();
        if (desc.includes('balans') || cat.includes('balans'))
            return _jsx(RefreshCw, { className: "w-4 h-4 text-[#7a5af8]" });
        if (desc.includes('purse') || cat.includes('jamg\'arma'))
            return _jsx(PiggyBank, { className: "w-4 h-4 text-[#23a887]" });
        if (desc.includes('karona') || desc.includes('kredit'))
            return _jsx(CreditCard, { className: "w-4 h-4 text-[#ff8d28]" });
        if (desc.includes('bank') || cat.includes('aniqlanmagan'))
            return _jsx(HelpCircle, { className: "w-4 h-4 text-[#3182ce]" });
        if (desc.includes('naushnik') || cat.includes('kiyim'))
            return _jsx(Shirt, { className: "w-4 h-4 text-[#ec4899]" });
        if (desc.includes('qarz') || cat.includes('qarz'))
            return _jsx(HandCoins, { className: "w-4 h-4 text-[#29c184]" });
        return _jsx(DollarSign, { className: "w-4 h-4 text-[#10b981]" });
    };
    return (_jsxs("div", { className: "space-y-6 px-4 md:px-8 py-5 max-w-7xl mx-auto select-none", children: [_jsxs("div", { className: "space-y-1", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-xs font-semibold text-[#8b9aa8]", children: [_jsx("span", { children: "Umumiy balans:" }), _jsx(Info, { className: "w-3.5 h-3.5 text-[#8b9aa8]" })] }), _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h1", { className: "text-3xl md:text-4xl font-black text-white tracking-tight", children: showBalance ? formattedBalance : '••••••••' }), _jsxs("div", { className: "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-xs font-bold text-[#8b9aa8]", children: [_jsx("span", { children: "UZS" }), _jsx(ChevronsUpDown, { className: "w-3.5 h-3.5" })] })] }), _jsx("button", { onClick: () => {
                                    triggerHaptic('light');
                                    setShowBalance(!showBalance);
                                }, className: "p-2 text-[#8b9aa8] hover:text-white transition-colors cursor-pointer", children: showBalance ? _jsx(Eye, { className: "w-5 h-5" }) : _jsx(EyeOff, { className: "w-5 h-5" }) })] })] }), _jsxs("div", { className: "flex items-center gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4 md:-mx-0 md:px-0", children: [_jsx("button", { onClick: () => {
                            triggerHaptic('medium');
                            onOpenAddModal('expense');
                        }, className: "w-13 h-24 shrink-0 rounded-2xl bg-[#23a887] hover:bg-[#1f9376] flex items-center justify-center text-white shadow-lg active:scale-95 transition-all cursor-pointer", title: "Yangi amaliyot qo'shish", children: _jsx(Plus, { className: "w-6 h-6 stroke-[3]" }) }), wallets.map((w) => {
                        let cardBg = 'linear-gradient(135deg, #7042f4 0%, #8b5cf6 100%)';
                        let iconPrefix = '💳';
                        if (w.name.toLowerCase().includes('invest')) {
                            cardBg = 'linear-gradient(135deg, #7042f4 0%, #8b5cf6 100%)';
                            iconPrefix = '📈';
                        }
                        else if (w.name.toLowerCase().includes('asosiy')) {
                            cardBg = 'linear-gradient(135deg, #20b2aa 0%, #23a887 100%)';
                            iconPrefix = '💳';
                        }
                        else if (w.name.toLowerCase().includes('naqd')) {
                            cardBg = 'linear-gradient(135deg, #38a169 0%, #48bb78 100%)';
                            iconPrefix = '💵';
                        }
                        else if (w.name.toLowerCase().includes('dollar')) {
                            cardBg = 'linear-gradient(135deg, #2b6cb0 0%, #3182ce 100%)';
                            iconPrefix = '💵';
                        }
                        return (_jsxs("div", { onClick: () => {
                                triggerHaptic('light');
                                onNavigateTab('balances');
                            }, className: "w-56 h-24 shrink-0 p-3 rounded-2xl text-white shadow-lg flex flex-col justify-between relative overflow-hidden cursor-pointer active:scale-98 transition-transform", style: { background: cardBg }, children: [_jsxs("div", { className: "flex items-center justify-between relative z-10", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold text-white/95", children: [_jsx("span", { className: "text-sm", children: iconPrefix }), _jsx("span", { className: "truncate", children: w.name })] }), _jsx("span", { className: "text-white/40 text-xs font-mono", children: "\u263A" })] }), _jsx("div", { className: "relative z-10", children: _jsxs("h4", { className: "text-lg font-black tracking-tight leading-none", children: [showBalance ? w.balance.toLocaleString('uz-UZ') : '••••••', ' ', _jsx("span", { className: "text-xs font-bold text-white/85", children: w.currency || 'UZS' })] }) })] }, w.id));
                    })] }), _jsxs("div", { className: "grid grid-cols-2 sm:grid-cols-4 gap-2.5", children: [_jsxs("button", { onClick: () => {
                            triggerHaptic('medium');
                            onOpenAddModal('expense');
                        }, className: "p-3 rounded-2xl bg-[#1c2733] border border-[#263445] hover:border-[#f0646e]/50 flex items-center gap-3 transition-all cursor-pointer group", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-[#f0646e]/15 flex items-center justify-center text-[#f0646e] group-hover:scale-105 transition-transform", children: _jsx(ArrowDownLeft, { className: "w-5 h-5" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-xs font-bold text-white", children: "Xarajat" }), _jsx("p", { className: "text-[10px] text-[#8b9aa8]", children: "Pul chiqimi" })] })] }), _jsxs("button", { onClick: () => {
                            triggerHaptic('medium');
                            onOpenAddModal('income');
                        }, className: "p-3 rounded-2xl bg-[#1c2733] border border-[#263445] hover:border-[#23a887]/50 flex items-center gap-3 transition-all cursor-pointer group", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-[#23a887]/15 flex items-center justify-center text-[#23a887] group-hover:scale-105 transition-transform", children: _jsx(ArrowUpRight, { className: "w-5 h-5" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-xs font-bold text-white", children: "Daromad" }), _jsx("p", { className: "text-[10px] text-[#8b9aa8]", children: "Pul kirimi" })] })] }), _jsxs("button", { onClick: () => {
                            triggerHaptic('medium');
                            onOpenAddModal('transfer');
                        }, className: "p-3 rounded-2xl bg-[#1c2733] border border-[#263445] hover:border-[#3182ce]/50 flex items-center gap-3 transition-all cursor-pointer group", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-[#3182ce]/15 flex items-center justify-center text-[#3182ce] group-hover:scale-105 transition-transform", children: _jsx(ArrowLeftRight, { className: "w-5 h-5" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-xs font-bold text-white", children: "O'tkazma" }), _jsx("p", { className: "text-[10px] text-[#8b9aa8]", children: "Kartalar aro" })] })] }), _jsxs("button", { onClick: () => {
                            triggerHaptic('medium');
                            onNavigateTab('chat');
                        }, className: "p-3 rounded-2xl bg-[#1c2733] border border-[#263445] hover:border-[#29c184]/50 flex items-center gap-3 transition-all cursor-pointer group", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-[#29c184]/15 flex items-center justify-center text-[#29c184] group-hover:scale-105 transition-transform", children: _jsx(MessageSquare, { className: "w-5 h-5" }) }), _jsxs("div", { className: "text-left", children: [_jsx("p", { className: "text-xs font-bold text-white", children: "AI Yordamchi" }), _jsx("p", { className: "text-[10px] text-[#29c184]", children: "Ovoz & Chat" })] })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2", children: [_jsxs("div", { className: "lg:col-span-8 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-bold text-white", children: "Oxirgi amaliyotlar" }), _jsxs("button", { onClick: () => onNavigateTab('reports'), className: "flex items-center gap-1 text-xs font-semibold text-[#8b9aa8] hover:text-white cursor-pointer", children: [_jsx("span", { children: "Barchasi" }), _jsx(ChevronRight, { className: "w-3.5 h-3.5" })] })] }), _jsxs("div", { className: "rounded-3xl bg-[#1c2733] border border-[#263445] overflow-hidden p-4 shadow-xl space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-[#8b9aa8] pb-2 border-b border-[#263445]", children: [_jsx("span", { className: "font-bold text-white", children: "Bu oy sarhisobi" }), _jsxs("div", { className: "flex items-center gap-2 font-mono", children: [_jsxs("span", { className: "text-[#23a887] font-bold", children: ["+", totalIncome.toLocaleString('uz-UZ'), " uzs"] }), _jsx("span", { children: "|" }), _jsxs("span", { className: "text-[#f0646e] font-bold", children: ["-", totalExpense.toLocaleString('uz-UZ'), " uzs"] })] })] }), transactions.length === 0 ? (_jsxs("div", { className: "py-12 text-center space-y-2", children: [_jsx("p", { className: "text-sm font-bold text-white", children: "Hozircha amaliyotlar mavjud emas" }), _jsx("p", { className: "text-xs text-[#8b9aa8] max-w-xs mx-auto", children: "Yuqoridagi tugmalar yoki AI Chat orqali birinchi xarajat yoki daromadingizni kiriting." })] })) : (_jsx("div", { className: "divide-y divide-[#263445]/60", children: transactions.slice(0, 15).map((tx) => {
                                            const isExpense = tx.type === 'expense';
                                            return (_jsxs("div", { className: "py-3 flex items-center justify-between hover:bg-white/2 rounded-xl px-2 transition-colors group", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0 pr-4", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-[#233140] flex items-center justify-center shrink-0 shadow-sm", children: getTxIcon(tx) }), _jsxs("div", { className: "min-w-0", children: [_jsx("h4", { className: "text-xs font-bold text-white truncate max-w-sm", children: tx.description }), _jsx("p", { className: "text-[11px] text-[#8b9aa8] truncate mt-0.5", children: tx.category_label || `${tx.category_name || 'Amaliyot'} • ${tx.wallet_name || 'Hamyon'}` })] })] }), _jsxs("div", { className: "text-right shrink-0", children: [_jsxs("p", { className: `text-xs font-black font-mono ${isExpense ? 'text-[#f0646e]' : 'text-[#23a887]'}`, children: [isExpense ? '-' : '+', tx.amount.toLocaleString('uz-UZ'), " UZS"] }), _jsx("p", { className: "text-[10px] text-[#8b9aa8] mt-0.5", children: tx.time_str || '' })] })] }, tx.id));
                                        }) }))] })] }), _jsxs("div", { className: "lg:col-span-4 space-y-4", children: [_jsxs("div", { className: "rounded-3xl bg-[#1c2733] border border-[#263445] p-5 shadow-xl space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold text-white", children: [_jsx("span", { children: "Joriy oy ko'rsatkichlari:" }), _jsx(Info, { className: "w-3.5 h-3.5 text-[#8b9aa8]" })] }), _jsxs("button", { onClick: () => onNavigateTab('stats'), className: "flex items-center gap-1 text-xs font-semibold text-[#8b9aa8] hover:text-white cursor-pointer", children: [_jsx("span", { children: "Barchasi" }), _jsx(ChevronRight, { className: "w-3.5 h-3.5" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("p", { className: "text-[11px] text-[#8b9aa8]", children: "Jami kirim:" }), _jsxs("h3", { className: "text-xl font-black text-[#23a887] font-mono", children: ["+", totalIncome.toLocaleString('uz-UZ'), " ", _jsx("span", { className: "text-xs font-bold text-[#8b9aa8]", children: "uzs" })] })] }), _jsxs("div", { className: "space-y-1 pt-3 border-t border-[#263445]", children: [_jsx("p", { className: "text-[11px] text-[#8b9aa8]", children: "Jami chiqim:" }), _jsxs("h3", { className: "text-xl font-black text-[#f0646e] font-mono", children: ["-", totalExpense.toLocaleString('uz-UZ'), " ", _jsx("span", { className: "text-xs font-bold text-[#8b9aa8]", children: "uzs" })] })] })] }), _jsxs("div", { className: "rounded-3xl bg-[#1c2733] border border-[#263445] p-5 shadow-xl space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("span", { className: "text-xs font-bold text-white", children: "Qarzlar & Majburiyatlar" }), _jsx("button", { onClick: () => onNavigateTab('debts'), className: "text-xs text-[#29c184] hover:underline cursor-pointer", children: "Ko'rish" })] }), _jsxs("div", { onClick: () => onNavigateTab('debts'), className: "p-3 rounded-2xl bg-[#16202b] border border-[#263445] flex items-center justify-between cursor-pointer hover:border-[#23a887]/50 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs font-bold text-white", children: "Berilgan va olingan qarzlar" }), _jsx("p", { className: "text-[10px] text-[#8b9aa8]", children: "Muddati bilan nazorat qiling" })] }), _jsx(ChevronRight, { className: "w-4 h-4 text-[#8b9aa8]" })] })] })] })] })] }));
};
