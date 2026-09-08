import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { triggerHaptic } from '../api';
import { X, Check, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';
export const EditDebtModal = ({ isOpen, onClose, debt, onUpdate, onDelete }) => {
    if (!isOpen || !debt)
        return null;
    const [type, setType] = useState(debt.type);
    const [counterpartyName, setCounterpartyName] = useState(debt.counterparty_name);
    const [phone, setPhone] = useState(debt.phone || '');
    const [amountStr, setAmountStr] = useState(String(debt.amount));
    const [dueDate, setDueDate] = useState(debt.due_date || '');
    const [notes, setNotes] = useState(debt.notes || '');
    const [loading, setLoading] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    useEffect(() => {
        if (debt) {
            setType(debt.type);
            setCounterpartyName(debt.counterparty_name);
            setPhone(debt.phone || '');
            setAmountStr(String(debt.amount));
            setDueDate(debt.due_date || '');
            setNotes(debt.notes || '');
            setConfirmDelete(false);
        }
    }, [debt]);
    const handleSave = async (e) => {
        e.preventDefault();
        const amount = parseFloat(amountStr);
        if (!counterpartyName.trim() || !amount)
            return;
        setLoading(true);
        triggerHaptic('success');
        try {
            await onUpdate(debt.id, {
                type,
                counterparty_name: counterpartyName.trim(),
                phone: phone.trim() || undefined,
                amount,
                due_date: dueDate || undefined,
                notes: notes.trim() || undefined
            });
            confetti({ particleCount: 25, spread: 50 });
            onClose();
        }
        catch (err) {
            console.error(err);
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
            await onDelete(debt.id);
            onClose();
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: _jsxs("div", { className: "w-full max-w-md bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150", children: [_jsxs("div", { className: "flex items-center justify-between pb-2 border-b border-[#354454]/60", children: [_jsx("h3", { className: "font-bold text-lg text-white", children: "Qarzni Tahrirlash" }), _jsx("button", { type: "button", onClick: () => {
                                triggerHaptic('light');
                                onClose();
                            }, className: "w-8 h-8 rounded-full bg-[#213040] flex items-center justify-center text-[#b6bfd0] hover:text-white", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("form", { onSubmit: handleSave, className: "space-y-3", children: [_jsxs("div", { className: "grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#151d27]", children: [_jsx("button", { type: "button", onClick: () => {
                                        triggerHaptic('light');
                                        setType('lent');
                                    }, className: `py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${type === 'lent' ? 'bg-[#29c184] text-white shadow-sm' : 'text-[#8b9aa8]'}`, children: "\uD83D\uDFE2 Men bergan qarz" }), _jsx("button", { type: "button", onClick: () => {
                                        triggerHaptic('light');
                                        setType('borrowed');
                                    }, className: `py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${type === 'borrowed' ? 'bg-[#f0646e] text-white shadow-sm' : 'text-[#8b9aa8]'}`, children: "\uD83D\uDD34 Men olgan qarz" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-[#8b9aa8]", children: "Shaxs / Tashkilot nomi" }), _jsx("input", { type: "text", required: true, value: counterpartyName, onChange: (e) => setCounterpartyName(e.target.value), className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184] outline-none mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-[#8b9aa8]", children: "Qarz summasi (so'm)" }), _jsx("input", { type: "number", required: true, value: amountStr, onChange: (e) => setAmountStr(e.target.value), className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm font-mono font-bold focus:border-[#29c184] outline-none mt-1" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-[#8b9aa8]", children: "Telefon (ixtiyoriy)" }), _jsx("input", { type: "tel", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+998", className: "w-full px-3 py-2 rounded-xl bg-[#213040] border border-[#354454] text-white text-xs focus:border-[#29c184] outline-none mt-1" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-[#8b9aa8]", children: "Qaytarish muddati" }), _jsx("input", { type: "date", value: dueDate, onChange: (e) => setDueDate(e.target.value), className: "w-full px-3 py-2 rounded-xl bg-[#213040] border border-[#354454] text-white text-xs focus:border-[#29c184] outline-none mt-1" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs font-semibold text-[#8b9aa8]", children: "Izoh" }), _jsx("input", { type: "text", value: notes, onChange: (e) => setNotes(e.target.value), placeholder: "Qarz sababi yoki tafsilotlar", className: "w-full px-3.5 py-2 rounded-xl bg-[#213040] border border-[#354454] text-white text-xs focus:border-[#29c184] outline-none mt-1" })] }), _jsxs("div", { className: "pt-2 flex items-center gap-3", children: [_jsxs("button", { type: "button", onClick: handleDelete, disabled: loading, className: `px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${confirmDelete
                                        ? 'bg-red-600 hover:bg-red-700 text-white flex-1 animate-pulse'
                                        : 'bg-red-500/15 hover:bg-red-500/25 text-red-400 border border-red-500/30'}`, children: [_jsx(Trash2, { className: "w-4 h-4" }), _jsx("span", { children: confirmDelete ? "Haqiqatdan o'chirilsinmi?" : "O'chirish" })] }), !confirmDelete && (_jsxs("button", { type: "submit", disabled: loading, className: "flex-1 py-3 rounded-2xl bg-gradient-to-r from-[#12A99D] via-[#29c184] to-[#9DFC38] text-black font-extrabold text-xs shadow-lg shadow-[#29c184]/30 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1.5", children: [_jsx(Check, { className: "w-4 h-4 stroke-[3]" }), _jsx("span", { children: loading ? 'Saqlanmoqda...' : 'Saqlash' })] }))] })] })] }) }));
};
