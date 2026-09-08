import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { triggerHaptic } from '../api';
import { Eye, EyeOff, Plus, Info, ChevronsUpDown, ShoppingBag, Film, CreditCard, Wallet as WalletIcon, MessageSquare, Diamond, EyeOff as EyeSlash, Gauge, X, ChevronRight, RefreshCw, PiggyBank, HelpCircle, Shirt, HandCoins, DollarSign } from 'lucide-react';
export const HomeView = ({ user, wallets, transactions, summary, onOpenAddModal, onNavigateTab, onDeleteTransaction, onOpenMonthlyWrap }) => {
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
    const handleActionClick = (actionId) => {
        triggerHaptic('light');
        if (actionId === 'oy-yakuni')
            onOpenMonthlyWrap();
        else if (actionId === 'chat')
            onNavigateTab('chat');
        else if (actionId === 'card-monitoring' || actionId === 'balances')
            onNavigateTab('balances');
        else if (actionId === 'gamification')
            onNavigateTab('gamification');
        else if (actionId === 'goals')
            onNavigateTab('goals');
        else
            onOpenAddModal('expense');
    };
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
                        }, className: "w-13 h-24 shrink-0 rounded-2xl bg-[#23a887] hover:bg-[#1f9376] flex items-center justify-center text-white shadow-lg active:scale-95 transition-all cursor-pointer", title: "Yangi amaliyot yoki karta qo'shish", children: _jsx(Plus, { className: "w-6 h-6 stroke-[3]" }) }), wallets.map((w) => {
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
                    })] }), _jsx("div", { className: "flex items-start gap-3 overflow-x-auto pb-2 pt-1 no-scrollbar -mx-4 px-4 md:-mx-0 md:px-0", children: quickActions.map((act, index) => {
                    const IconComp = act.icon;
                    return (_jsxs("div", { onClick: () => handleActionClick(act.id), className: "flex flex-col items-center gap-2 shrink-0 w-20 cursor-pointer group", children: [_jsx("div", { className: `w-14 h-14 rounded-2xl border flex items-center justify-center transition-all group-hover:scale-105 active:scale-95 shadow-sm ${act.isSpecial
                                    ? 'bg-gradient-to-tr from-[#9447d1] to-[#f0646e] border-transparent text-white'
                                    : 'bg-[#1e2a37] border-[#2c3d4f] text-white hover:border-[#29c184]/50'}`, children: _jsx(IconComp, { className: `w-6 h-6 ${act.color}` }) }), _jsx("span", { className: "text-[11px] text-[#94a3b8] text-center font-medium leading-tight line-clamp-2", children: act.label })] }, index));
                }) }), showBanner && (_jsxs("div", { className: "space-y-1.5", children: [_jsx("h3", { className: "text-sm font-bold text-white", children: "Xabarlar" }), _jsxs("div", { className: "p-4 rounded-2xl bg-[#23a887] relative overflow-hidden flex items-center justify-between text-white max-w-sm shadow-md", children: [_jsx("button", { onClick: () => setShowBanner(false), className: "absolute top-2 right-2 w-6 h-6 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/30 cursor-pointer", children: _jsx(X, { className: "w-3.5 h-3.5" }) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl", children: "\uD83E\uDD16" }), _jsxs("div", { children: [_jsx("h4", { className: "text-xs font-black", children: "Hisobchi AI Bot Ishga Tushdi" }), _jsx("p", { className: "text-[11px] text-white/90", children: "Telegram orqali ham barcha hisoblaringizni yuritishingiz mumkin" })] })] })] })] })), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2", children: [_jsxs("div", { className: "lg:col-span-8 space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h3", { className: "text-sm font-bold text-white", children: "Oxirgi hisobotlar:" }), _jsxs("button", { onClick: () => onNavigateTab('reports'), className: "flex items-center gap-1 text-xs font-semibold text-[#8b9aa8] hover:text-white cursor-pointer", children: [_jsx("span", { children: "Barchasi" }), _jsx(ChevronRight, { className: "w-3.5 h-3.5" })] })] }), _jsxs("div", { className: "rounded-3xl bg-[#1c2733] border border-[#263445] overflow-hidden p-4 shadow-xl space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between text-xs text-[#8b9aa8] pb-2 border-b border-[#263445]", children: [_jsx("span", { className: "font-bold text-white", children: "Bugun" }), _jsxs("div", { className: "flex items-center gap-2 font-mono", children: [_jsx("span", { className: "text-[#23a887] font-bold", children: "+581 464,68 uzs" }), _jsx("span", { children: "|" }), _jsx("span", { className: "text-[#f0646e] font-bold", children: "-400 465,62 uzs" })] })] }), _jsx("div", { className: "divide-y divide-[#263445]/60", children: transactions.slice(0, 10).map((tx) => {
                                            const isExpense = tx.type === 'expense';
                                            return (_jsxs("div", { className: "py-3 flex items-center justify-between hover:bg-white/2 rounded-xl px-2 transition-colors group", children: [_jsxs("div", { className: "flex items-center gap-3 min-w-0 pr-4", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-[#233140] flex items-center justify-center shrink-0 shadow-sm", children: getTxIcon(tx) }), _jsxs("div", { className: "min-w-0", children: [_jsx("h4", { className: "text-xs font-bold text-white truncate max-w-sm", children: tx.description }), _jsx("p", { className: "text-[11px] text-[#8b9aa8] truncate mt-0.5", children: tx.category_label || `${tx.category_name || 'Xarajat'} • ${tx.wallet_name || 'Hamyon'}` })] })] }), _jsxs("div", { className: "text-right shrink-0", children: [_jsxs("p", { className: `text-xs font-black font-mono ${isExpense ? 'text-[#f0646e]' : 'text-[#23a887]'}`, children: [isExpense ? '-' : '+', tx.amount.toLocaleString('uz-UZ'), " UZS"] }), _jsx("p", { className: "text-[10px] text-[#8b9aa8] mt-0.5", children: tx.time_str || '11:13' })] })] }, tx.id));
                                        }) })] })] }), _jsxs("div", { className: "lg:col-span-4 space-y-4", children: [_jsxs("div", { className: "rounded-3xl bg-[#1c2733] border border-[#263445] p-5 shadow-xl space-y-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold text-white", children: [_jsx("span", { children: "Joriy oy:" }), _jsx(Info, { className: "w-3.5 h-3.5 text-[#8b9aa8]" })] }), _jsxs("button", { onClick: () => onNavigateTab('stats'), className: "flex items-center gap-1 text-xs font-semibold text-[#8b9aa8] hover:text-white cursor-pointer", children: [_jsx("span", { children: "Barchasi" }), _jsx(ChevronRight, { className: "w-3.5 h-3.5" })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-baseline justify-between", children: [_jsxs("h3", { className: "text-xl font-black text-white font-mono", children: ["1 587 064,68 ", _jsx("span", { className: "text-xs font-bold text-[#8b9aa8]", children: "uzs" })] }), _jsx("span", { className: "text-[11px] font-bold text-[#f0646e]", children: "-79.8%" })] }), _jsx("p", { className: "text-[10px] text-[#8b9aa8]", children: "kirim \u2022 avgustga nisbatan" }), _jsxs("div", { className: "flex flex-wrap gap-1.5 pt-1", children: [_jsxs("span", { className: "px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1", children: [_jsx("span", { className: "text-emerald-400", children: "\uD83D\uDFE2" }), " 561 000 uzs"] }), _jsxs("span", { className: "px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1", children: [_jsx("span", { children: "\u2708\uFE0F" }), " 520 404 uzs"] }), _jsxs("span", { className: "px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1", children: [_jsx("span", { children: "\u2753" }), " 180 000 uzs"] })] })] }), _jsxs("div", { className: "space-y-2 pt-2 border-t border-[#263445]", children: [_jsxs("div", { className: "flex items-baseline justify-between", children: [_jsxs("h3", { className: "text-xl font-black text-white font-mono", children: ["3 928 508,62 ", _jsx("span", { className: "text-xs font-bold text-[#8b9aa8]", children: "uzs" })] }), _jsx("span", { className: "text-[11px] font-bold text-[#f0646e]", children: "-49.9%" })] }), _jsx("p", { className: "text-[10px] text-[#8b9aa8]", children: "chiqim \u2022 avgustga nisbatan" }), _jsxs("div", { className: "flex flex-wrap gap-1.5 pt-1", children: [_jsxs("span", { className: "px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1", children: [_jsx("span", { children: "\uD83D\uDC5A" }), " 1 952 000 uzs"] }), _jsxs("span", { className: "px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1", children: [_jsx("span", { children: "\uD83C\uDFDB\uFE0F" }), " 760 000 uzs"] }), _jsxs("span", { className: "px-2.5 py-1 rounded-full bg-[#233140] text-xs font-bold text-white flex items-center gap-1", children: [_jsx("span", { children: "\uD83D\uDED2" }), " 475 170 uzs"] })] })] })] }), _jsxs("div", { className: "rounded-3xl bg-[#1c2733] border border-[#263445] p-5 shadow-xl space-y-3", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-xs font-bold text-white", children: [_jsx("span", { children: "Kutilayotgan hisoblar:" }), _jsx(Info, { className: "w-3.5 h-3.5 text-[#8b9aa8]" })] }), _jsxs("div", { onClick: () => onNavigateTab('debts'), className: "p-3 rounded-2xl bg-[#16202b] border border-[#263445] flex items-center justify-between cursor-pointer hover:border-[#23a887]/50 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-black text-white font-mono", children: "0 uzs" }), _jsx("p", { className: "text-[10px] text-[#23a887]", children: "kirim kutilmoqda..." })] }), _jsxs("span", { className: "text-xs text-[#8b9aa8] flex items-center gap-1", children: ["0 ta ", _jsx(ChevronRight, { className: "w-3 h-3 text-[#23a887]" })] })] }), _jsxs("div", { onClick: () => onNavigateTab('debts'), className: "p-3 rounded-2xl bg-[#16202b] border border-[#263445] flex items-center justify-between cursor-pointer hover:border-[#f0646e]/50 transition-colors", children: [_jsxs("div", { children: [_jsx("p", { className: "text-sm font-black text-white font-mono", children: "0 uzs" }), _jsx("p", { className: "text-[10px] text-[#f0646e]", children: "chiqim kutilmoqda..." })] }), _jsxs("span", { className: "text-xs text-[#8b9aa8] flex items-center gap-1", children: ["0 ta ", _jsx(ChevronRight, { className: "w-3 h-3 text-[#f0646e]" })] })] })] })] })] })] }));
};
