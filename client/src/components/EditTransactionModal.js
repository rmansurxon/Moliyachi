import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { triggerHaptic } from '../api';
import { Icon } from './Icon';
import { X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Trash2, Check, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
export const EditTransactionModal = ({ isOpen, onClose, transaction, wallets, categories, onUpdate, onDelete }) => {
    if (!isOpen || !transaction)
        return null;
    const [type, setType] = useState(transaction.type);
    const [amountStr, setAmountStr] = useState(String(transaction.amount));
    const [selectedWalletId, setSelectedWalletId] = useState(transaction.balance_id || wallets[0]?.id || '');
    const [toWalletId, setToWalletId] = useState(transaction.to_balance_id || wallets[1]?.id || wallets[0]?.id || '');
    const [selectedCategoryId, setSelectedCategoryId] = useState(transaction.category_id || '');
    const [description, setDescription] = useState(transaction.description || '');
    const [date, setDate] = useState(transaction.date ? transaction.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    useEffect(() => {
        if (transaction) {
            setType(transaction.type);
            setAmountStr(String(transaction.amount));
            setSelectedWalletId(transaction.balance_id || wallets[0]?.id || '');
            setToWalletId(transaction.to_balance_id || wallets[1]?.id || wallets[0]?.id || '');
            setSelectedCategoryId(transaction.category_id || '');
            setDescription(transaction.description || '');
            setDate(transaction.date ? transaction.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
            setConfirmDelete(false);
        }
    }, [transaction, wallets]);
    const filteredCategories = categories.filter((c) => c.type === (type === 'income' ? 'income' : 'expense'));
    const handleSave = async (e) => {
        e.preventDefault();
        const amount = parseFloat(amountStr.replace(/\s+/g, ''));
        if (!amount || amount <= 0)
            return;
        setLoading(true);
        triggerHaptic('success');
        try {
            await onUpdate(transaction.id, {
                amount,
                type,
                balance_id: selectedWalletId,
                to_balance_id: type === 'transfer' ? toWalletId : undefined,
                category_id: type !== 'transfer' ? selectedCategoryId : undefined,
                description: description.trim() || transaction.description,
                date: new Date(date).toISOString()
            });
            confetti({
                particleCount: 30,
                spread: 50,
                origin: { y: 0.8 },
                colors: ['#29c184', '#1570ef']
            });
            onClose();
        }
        catch (err) {
            console.error('Update tx error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleDelete = async () => {
        if (!confirmDelete) {
            triggerHaptic('warning');
            setConfirmDelete(true);
            return;
        }
        setLoading(true);
        triggerHaptic('error');
        try {
            await onDelete(transaction.id);
            onClose();
        }
        catch (err) {
            console.error('Delete tx error:', err);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4", children: _jsxs("div", { className: "w-full max-w-lg bg-[#19232e] rounded-t-3xl sm:rounded-3xl border border-[#354454] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-150", children: [_jsxs("div", { className: "px-5 py-4 border-b border-[#354454]/60 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h3", { className: "font-bold text-lg text-white", children: "Amaliyotni Tahrirlash" }), _jsxs("span", { className: "text-[10px] px-2 py-0.5 rounded-full bg-[#29c184]/15 text-[#29c184] font-bold", children: ["ID: ", transaction.id.slice(0, 6)] })] }), _jsx("button", { type: "button", onClick: () => {
                                triggerHaptic('light');
                                onClose();
                            }, className: "w-8 h-8 rounded-full bg-[#213040] flex items-center justify-center text-[#b6bfd0] hover:text-white", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleSave, className: "p-5 overflow-y-auto space-y-4 flex-1", children: [_jsxs("div", { className: "grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#151d27]", children: [_jsxs("button", { type: "button", onClick: () => {
                                        triggerHaptic('light');
                                        setType('expense');
                                    }, className: `flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${type === 'expense' ? 'bg-[#f0646e] text-white shadow-md' : 'text-[#899098] hover:text-white'}`, children: [_jsx(ArrowDownRight, { className: "w-4 h-4" }), _jsx("span", { children: "Xarajat" })] }), _jsxs("button", { type: "button", onClick: () => {
                                        triggerHaptic('light');
                                        setType('income');
                                    }, className: `flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${type === 'income' ? 'bg-[#29c184] text-white shadow-md' : 'text-[#899098] hover:text-white'}`, children: [_jsx(ArrowUpRight, { className: "w-4 h-4" }), _jsx("span", { children: "Daromad" })] }), _jsxs("button", { type: "button", onClick: () => {
                                        triggerHaptic('light');
                                        setType('transfer');
                                    }, className: `flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${type === 'transfer' ? 'bg-[#1570ef] text-white shadow-md' : 'text-[#899098] hover:text-white'}`, children: [_jsx(ArrowLeftRight, { className: "w-4 h-4" }), _jsx("span", { children: "O'tkazma" })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-xs font-semibold text-[#8b9aa8]", children: "Summa (UZS)" }), _jsxs("div", { className: "relative", children: [_jsx("input", { type: "number", required: true, value: amountStr, onChange: (e) => setAmountStr(e.target.value), placeholder: "0", className: "w-full pl-4 pr-16 py-3 rounded-2xl bg-[#213040] border border-[#354454] text-xl font-mono font-black text-white focus:outline-none focus:border-[#29c184]" }), _jsx("span", { className: "absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8b9aa8]", children: "UZS" })] })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-xs font-semibold text-[#8b9aa8]", children: type === 'transfer' ? 'Chiqim hamyoni' : 'Hamyon' }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: wallets.map((w) => {
                                        const isSelected = selectedWalletId === w.id;
                                        return (_jsxs("button", { type: "button", onClick: () => {
                                                triggerHaptic('light');
                                                setSelectedWalletId(w.id);
                                            }, className: `p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${isSelected
                                                ? 'bg-[#29c184]/15 border-[#29c184] text-white'
                                                : 'bg-[#213040] border-[#354454] text-[#8b9aa8] hover:border-[#8b9aa8]'}`, children: [_jsxs("div", { className: "min-w-0 pr-2", children: [_jsx("p", { className: "text-xs font-bold text-white truncate", children: w.name }), _jsxs("p", { className: "text-[10px] text-[#8b9aa8] font-mono", children: [w.balance.toLocaleString('uz-UZ'), " ", w.currency] })] }), isSelected && _jsx(Check, { className: "w-4 h-4 text-[#29c184] shrink-0" })] }, w.id));
                                    }) })] }), type === 'transfer' && (_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-xs font-semibold text-[#8b9aa8]", children: "Kirim hamyoni" }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: wallets
                                        .filter((w) => w.id !== selectedWalletId)
                                        .map((w) => {
                                        const isSelected = toWalletId === w.id;
                                        return (_jsxs("button", { type: "button", onClick: () => {
                                                triggerHaptic('light');
                                                setToWalletId(w.id);
                                            }, className: `p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${isSelected
                                                ? 'bg-[#1570ef]/15 border-[#1570ef] text-white'
                                                : 'bg-[#213040] border-[#354454] text-[#8b9aa8] hover:border-[#8b9aa8]'}`, children: [_jsxs("div", { className: "min-w-0 pr-2", children: [_jsx("p", { className: "text-xs font-bold text-white truncate", children: w.name }), _jsxs("p", { className: "text-[10px] text-[#8b9aa8] font-mono", children: [w.balance.toLocaleString('uz-UZ'), " ", w.currency] })] }), isSelected && _jsx(Check, { className: "w-4 h-4 text-[#1570ef] shrink-0" })] }, w.id));
                                    }) })] })), type !== 'transfer' && (_jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-xs font-semibold text-[#8b9aa8]", children: "Kategoriya" }), _jsx("div", { className: "grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-44 overflow-y-auto p-1 rounded-2xl bg-[#151d27]/70", children: filteredCategories.map((c) => {
                                        const isSelected = selectedCategoryId === c.id;
                                        return (_jsxs("button", { type: "button", onClick: () => {
                                                triggerHaptic('light');
                                                setSelectedCategoryId(c.id);
                                            }, className: `p-2.5 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${isSelected
                                                ? 'bg-[#29c184]/20 border-[#29c184] text-white ring-1 ring-[#29c184]'
                                                : 'bg-[#213040] border-[#354454] text-[#8b9aa8] hover:text-white'}`, children: [_jsx("div", { className: "w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0", style: { backgroundColor: c.color || '#29c184' }, children: _jsx(Icon, { name: c.icon || 'Tag', size: 14 }) }), _jsx("span", { className: "text-[10px] font-bold truncate w-full", children: c.name })] }, c.id));
                                    }) })] })), _jsxs("div", { className: "space-y-1.5", children: [_jsx("label", { className: "text-xs font-semibold text-[#8b9aa8]", children: "Izoh / Tavsif" }), _jsx("input", { type: "text", value: description, onChange: (e) => setDescription(e.target.value), placeholder: "Masalan: Tushlik, Benzin, Oylik", className: "w-full px-4 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-sm text-white focus:outline-none focus:border-[#29c184]" })] }), _jsxs("div", { className: "space-y-1.5", children: [_jsxs("label", { className: "text-xs font-semibold text-[#8b9aa8] flex items-center gap-1", children: [_jsx(Calendar, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Sana" })] }), _jsx("input", { type: "date", value: date, onChange: (e) => setDate(e.target.value), className: "w-full px-4 py-2 rounded-xl bg-[#213040] border border-[#354454] text-xs text-white focus:outline-none focus:border-[#29c184]" })] }), _jsxs("div", { className: "pt-2 flex items-center gap-3", children: [_jsxs("button", { type: "button", onClick: handleDelete, disabled: loading, className: `px-4 py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${confirmDelete
                                        ? 'bg-red-600 hover:bg-red-700 text-white flex-1 animate-pulse'
                                        : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'}`, children: [_jsx(Trash2, { className: "w-4 h-4" }), _jsx("span", { children: confirmDelete ? "Haqiqatdan o'chirilsinmi?" : "O'chirish" })] }), !confirmDelete && (_jsxs("button", { type: "submit", disabled: loading, className: "flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#12A99D] via-[#29c184] to-[#9DFC38] text-black font-extrabold text-xs shadow-lg shadow-[#29c184]/30 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5", children: [_jsx(Check, { className: "w-4 h-4 stroke-[3]" }), _jsx("span", { children: loading ? 'Saqlanmoqda...' : 'Oʻzgarishlarni Saqlash' })] }))] })] })] }) }));
};
