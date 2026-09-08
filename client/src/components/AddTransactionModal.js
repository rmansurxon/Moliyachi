import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { triggerHaptic } from '../api';
import { Icon } from './Icon';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
export const AddTransactionModal = ({ isOpen, onClose, wallets, categories, onSubmit }) => {
    if (!isOpen)
        return null;
    const [type, setType] = useState('expense');
    const [amountStr, setAmountStr] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');
    const [toWalletId, setToWalletId] = useState(wallets[1]?.id || wallets[0]?.id || '');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const filteredCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));
    // Quick amount chips in UZS
    const quickAmounts = [15000, 30000, 50000, 100000, 200000, 500000];
    const handleQuickAmount = (val) => {
        triggerHaptic('light');
        setAmountStr(String(val));
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        const amount = parseFloat(amountStr.replace(/\s+/g, ''));
        if (!amount || amount <= 0)
            return;
        setLoading(true);
        triggerHaptic('success');
        try {
            const selectedCat = categories.find((c) => c.id === selectedCategoryId);
            const desc = description.trim() || (type === 'transfer' ? "O'tkazma" : selectedCat?.name || (type === 'expense' ? 'Xarajat' : 'Daromad'));
            await onSubmit({
                balance_id: selectedWalletId,
                category_id: type !== 'transfer' ? (selectedCategoryId || filteredCategories[0]?.id) : undefined,
                to_balance_id: type === 'transfer' ? toWalletId : undefined,
                amount,
                type,
                description: desc
            });
            confetti({
                particleCount: 40,
                spread: 60,
                origin: { y: 0.8 },
                colors: ['#29c184', '#1570ef', '#ff8d28']
            });
            onClose();
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4", children: _jsxs("div", { className: "w-full max-w-lg bg-[#19232e] light:bg-white rounded-t-3xl sm:rounded-3xl border border-[#354454] light:border-[#eaecf0] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col", children: [_jsxs("div", { className: "px-5 py-4 border-b border-[#354454]/60 light:border-[#eaecf0] flex items-center justify-between", children: [_jsx("h3", { className: "font-bold text-lg text-white light:text-[#1d2939]", children: "Yangi Amaliyot" }), _jsx("button", { onClick: () => {
                                triggerHaptic('light');
                                onClose();
                            }, className: "w-8 h-8 rounded-full bg-[#213040] light:bg-[#eaecf0] flex items-center justify-center text-[#b6bfd0] hover:text-white", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleSubmit, className: "p-5 overflow-y-auto space-y-4 flex-1", children: [_jsxs("div", { className: "grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#151d27] light:bg-[#f2f4f7]", children: [_jsxs("button", { type: "button", onClick: () => {
                                        triggerHaptic('light');
                                        setType('expense');
                                    }, className: `flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${type === 'expense'
                                        ? 'bg-[#f0646e] text-white shadow-md'
                                        : 'text-[#899098] hover:text-white light:hover:text-black'}`, children: [_jsx(ArrowDownRight, { className: "w-4 h-4" }), _jsx("span", { children: "Xarajat" })] }), _jsxs("button", { type: "button", onClick: () => {
                                        triggerHaptic('light');
                                        setType('income');
                                    }, className: `flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${type === 'income'
                                        ? 'bg-[#29c184] text-white shadow-md'
                                        : 'text-[#899098] hover:text-white light:hover:text-black'}`, children: [_jsx(ArrowUpRight, { className: "w-4 h-4" }), _jsx("span", { children: "Daromad" })] }), _jsxs("button", { type: "button", onClick: () => {
                                        triggerHaptic('light');
                                        setType('transfer');
                                    }, className: `flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${type === 'transfer'
                                        ? 'bg-[#1570ef] text-white shadow-md'
                                        : 'text-[#899098] hover:text-white light:hover:text-black'}`, children: [_jsx(ArrowLeftRight, { className: "w-4 h-4" }), _jsx("span", { children: "O'tkazma" })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-medium text-[#b6bfd0] light:text-[#475467]", children: "Summa (so'm)" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "number", value: amountStr, onChange: (e) => setAmountStr(e.target.value), placeholder: "0", autoFocus: true, className: "w-full px-4 py-3.5 rounded-2xl bg-[#213040] light:bg-[#f7f9fa] border border-[#354454] light:border-[#eaecf0] text-2xl font-black text-white light:text-[#1d2939] focus:outline-none focus:border-[#29c184] transition-colors" }), _jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#899098]", children: "UZS" })] }), _jsx("div", { className: "flex gap-1.5 overflow-x-auto pt-1.5 pb-1 no-scrollbar", children: quickAmounts.map((amt) => (_jsxs("button", { type: "button", onClick: () => handleQuickAmount(amt), className: "px-2.5 py-1 rounded-xl bg-[#213040] light:bg-[#f2f4f7] border border-[#354454]/50 text-xs font-semibold text-[#b6bfd0] light:text-[#475467] hover:border-[#29c184] shrink-0", children: ["+", amt.toLocaleString('uz-UZ')] }, amt))) })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-medium text-[#b6bfd0] light:text-[#475467]", children: type === 'transfer' ? "Qaysi hisobdan?" : "Hisob / Karta" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: wallets.map((w) => {
                                        const isSelected = selectedWalletId === w.id;
                                        return (_jsxs("button", { type: "button", onClick: () => {
                                                triggerHaptic('light');
                                                setSelectedWalletId(w.id);
                                            }, className: `flex items-center gap-2 p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${isSelected
                                                ? 'bg-[#213040] light:bg-[#f0fdf4] border-[#29c184] ring-1 ring-[#29c184]'
                                                : 'bg-[#151d27]/70 light:bg-white border-[#354454]/50 hover:border-[#29c184]/40'}`, children: [_jsx("div", { className: "w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0", style: { backgroundColor: w.color }, children: w.type === 'cash' ? '💵' : '💳' }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-xs font-bold text-white light:text-[#1d2939] truncate", children: w.name }), _jsxs("p", { className: "text-[11px] text-[#899098] truncate", children: [w.balance.toLocaleString('uz-UZ'), " so'm"] })] })] }, w.id));
                                    }) })] }), type === 'transfer' && (_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-medium text-[#b6bfd0] light:text-[#475467]", children: "Qaysi hisobga?" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: wallets
                                        .filter((w) => w.id !== selectedWalletId)
                                        .map((w) => {
                                        const isSelected = toWalletId === w.id;
                                        return (_jsxs("button", { type: "button", onClick: () => {
                                                triggerHaptic('light');
                                                setToWalletId(w.id);
                                            }, className: `flex items-center gap-2 p-2.5 rounded-2xl border text-left cursor-pointer transition-all ${isSelected
                                                ? 'bg-[#213040] light:bg-[#eff8ff] border-[#1570ef] ring-1 ring-[#1570ef]'
                                                : 'bg-[#151d27]/70 light:bg-white border-[#354454]/50'}`, children: [_jsx("div", { className: "w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0", style: { backgroundColor: w.color }, children: w.type === 'cash' ? '💵' : '💳' }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "text-xs font-bold text-white light:text-[#1d2939] truncate", children: w.name }), _jsxs("p", { className: "text-[11px] text-[#899098] truncate", children: [w.balance.toLocaleString('uz-UZ'), " so'm"] })] })] }, w.id));
                                    }) })] })), type !== 'transfer' && (_jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-medium text-[#b6bfd0] light:text-[#475467]", children: "Kategoriya" }), _jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1", children: filteredCategories.map((c) => {
                                        const isSelected = selectedCategoryId === c.id;
                                        return (_jsxs("button", { type: "button", onClick: () => {
                                                triggerHaptic('light');
                                                setSelectedCategoryId(c.id);
                                                if (!description)
                                                    setDescription(c.name);
                                            }, className: `flex flex-col items-center justify-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${isSelected
                                                ? 'bg-[#213040] light:bg-slate-100 border-[#29c184] ring-2 ring-[#29c184]/40 scale-102'
                                                : 'bg-[#151d27]/60 light:bg-white border-[#354454]/40 hover:border-[#29c184]/40'}`, children: [_jsx("div", { className: "w-8 h-8 rounded-xl flex items-center justify-center text-white mb-1 shadow-sm", style: { backgroundColor: c.color }, children: _jsx(Icon, { name: c.icon, size: 16 }) }), _jsx("span", { className: "text-[11px] font-semibold text-white light:text-[#1d2939] truncate w-full", children: c.name })] }, c.id));
                                    }) })] })), _jsxs("div", { className: "space-y-1", children: [_jsx("label", { className: "text-xs font-medium text-[#b6bfd0] light:text-[#475467]", children: "Izoh (ixtiyoriy)" }), _jsx("input", { type: "text", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Masalan: Korzinka xaridi, Taksi, Restoran...", className: "w-full px-4 py-2.5 rounded-xl bg-[#213040] light:bg-[#f7f9fa] border border-[#354454] light:border-[#eaecf0] text-sm text-white light:text-[#1d2939] focus:outline-none focus:border-[#29c184]" })] }), _jsxs("button", { type: "submit", disabled: loading || !amountStr, className: "w-full py-3.5 rounded-2xl bg-[#29c184] hover:bg-[#25ab75] active:scale-98 text-white font-extrabold text-base shadow-lg shadow-[#29c184]/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mt-4", children: [_jsx(Check, { className: "w-5 h-5 stroke-[2.5]" }), _jsx("span", { children: loading ? 'Saqlanmoqda...' : 'Saqlash' })] })] })] }) }));
};
