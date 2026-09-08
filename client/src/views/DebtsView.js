import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api, triggerHaptic } from '../api';
import { Plus, Phone, Calendar, ArrowUpRight, ArrowDownRight, Send, Edit3 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { EditDebtModal } from '../components/EditDebtModal';
export const DebtsView = ({ debts, onReload }) => {
    const [tab, setTab] = useState('lent');
    const [statusFilter, setStatusFilter] = useState('active');
    const [showAddModal, setShowAddModal] = useState(false);
    const [payModalDebt, setPayModalDebt] = useState(null);
    const [payAmountStr, setPayAmountStr] = useState('');
    const [selectedDebtForEdit, setSelectedDebtForEdit] = useState(null);
    // Form states for new debt
    const [counterpartyName, setCounterpartyName] = useState('');
    const [phone, setPhone] = useState('');
    const [amountStr, setAmountStr] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const handleUpdateDebt = async (id, updates) => {
        await api.updateDebt(id, updates);
        onReload();
    };
    const handleDeleteDebt = async (id) => {
        await api.deleteDebt(id);
        onReload();
    };
    const filtered = debts.filter((d) => d.type === tab && d.status === statusFilter);
    const handleCreateDebt = async (e) => {
        e.preventDefault();
        const amount = parseFloat(amountStr);
        if (!counterpartyName || !amount)
            return;
        setLoading(true);
        triggerHaptic('success');
        try {
            await api.createDebt({
                type: tab,
                counterparty_name: counterpartyName,
                phone,
                amount,
                due_date: dueDate || undefined,
                notes: notes || undefined
            });
            confetti({ particleCount: 30, spread: 60 });
            setShowAddModal(false);
            setCounterpartyName('');
            setPhone('');
            setAmountStr('');
            setDueDate('');
            setNotes('');
            onReload();
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handlePayDebt = async (e) => {
        e.preventDefault();
        if (!payModalDebt)
            return;
        const amount = parseFloat(payAmountStr);
        if (!amount || amount <= 0)
            return;
        setLoading(true);
        triggerHaptic('success');
        try {
            await api.payDebt(payModalDebt.id, amount);
            confetti({ particleCount: 40, spread: 70 });
            setPayModalDebt(null);
            setPayAmountStr('');
            onReload();
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSendTelegramReminder = (debt) => {
        triggerHaptic('medium');
        const rem = debt.amount - debt.paid_amount;
        const shareText = `Assalomu alaykum, ${debt.counterparty_name}! Hisobchi AI eslatmasi: oramizdagi qarz qoldig'i ${rem.toLocaleString('uz-UZ')} so'm${debt.due_date ? ` (Qaytarish muddati: ${debt.due_date})` : ''}.`;
        const tgUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(shareText)}`;
        window.open(tgUrl, '_blank');
    };
    return (_jsxs("div", { className: "space-y-4 max-w-md mx-auto pb-24 px-4 pt-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-white light:text-[#1d2939]", children: "Qarzlar Daftari" }), _jsx("p", { className: "text-xs text-[#899098]", children: "Berilgan va olingan qarzlar nazorati" })] }), _jsxs("button", { onClick: () => {
                            triggerHaptic('medium');
                            setShowAddModal(true);
                        }, className: "flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#29c184] text-white text-xs font-bold shadow-md shadow-[#29c184]/30 active:scale-95 transition-all cursor-pointer", children: [_jsx(Plus, { className: "w-4 h-4 stroke-[3]" }), _jsx("span", { children: "Qo'shish" })] })] }), _jsxs("div", { className: "grid grid-cols-2 gap-2 p-1 rounded-2xl bg-[#213040] light:bg-[#eaecf0] border border-[#354454] light:border-[#d0d5dd]", children: [_jsxs("button", { onClick: () => {
                            triggerHaptic('light');
                            setTab('lent');
                        }, className: `flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${tab === 'lent'
                            ? 'bg-[#29c184] text-white shadow-sm'
                            : 'text-[#899098] hover:text-white'}`, children: [_jsx(ArrowUpRight, { className: "w-4 h-4" }), _jsx("span", { children: "Men bergan qarzlar" })] }), _jsxs("button", { onClick: () => {
                            triggerHaptic('light');
                            setTab('borrowed');
                        }, className: `flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${tab === 'borrowed'
                            ? 'bg-[#f0646e] text-white shadow-sm'
                            : 'text-[#899098] hover:text-white'}`, children: [_jsx(ArrowDownRight, { className: "w-4 h-4" }), _jsx("span", { children: "Men olgan qarzlar" })] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { onClick: () => {
                            triggerHaptic('light');
                            setStatusFilter('active');
                        }, className: `px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${statusFilter === 'active'
                            ? 'bg-white/15 text-white font-bold'
                            : 'text-[#899098] hover:text-white'}`, children: "Faol Qarzlar" }), _jsx("button", { onClick: () => {
                            triggerHaptic('light');
                            setStatusFilter('closed');
                        }, className: `px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer ${statusFilter === 'closed'
                            ? 'bg-white/15 text-white font-bold'
                            : 'text-[#899098] hover:text-white'}`, children: "Yopilgan Tarix" })] }), _jsx("div", { className: "space-y-3", children: filtered.length === 0 ? (_jsxs("div", { className: "p-8 text-center rounded-2xl bg-[#213040]/50 border border-[#354454]/40", children: [_jsx("p", { className: "text-sm font-bold text-white light:text-[#1d2939]", children: statusFilter === 'active' ? "Faol qarzlar mavjud emas" : "Yopilgan qarzlar tarixi bo'sh" }), _jsx("p", { className: "text-xs text-[#899098] mt-1", children: "Qarz bergan yoki olganingizda ushbu ro'yxatga kiritib boring." })] })) : (filtered.map((d) => {
                    const remaining = d.amount - d.paid_amount;
                    const progress = Math.min(100, Math.round((d.paid_amount / d.amount) * 100));
                    return (_jsxs("div", { className: "p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-md space-y-3", children: [_jsxs("div", { className: "flex items-start justify-between", children: [_jsxs("div", { children: [_jsx("h3", { className: "text-base font-bold text-white light:text-[#1d2939]", children: d.counterparty_name }), d.phone && (_jsxs("p", { className: "flex items-center gap-1 text-[11px] text-[#899098] mt-0.5", children: [_jsx(Phone, { className: "w-3 h-3" }), _jsx("span", { children: d.phone })] }))] }), _jsx("span", { className: `px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${d.status === 'closed'
                                            ? 'bg-[#29c184]/15 text-[#29c184]'
                                            : tab === 'lent'
                                                ? 'bg-[#29c184]/15 text-[#29c184]'
                                                : 'bg-[#f0646e]/15 text-[#f0646e]'}`, children: d.status === 'closed' ? 'Yopilgan' : tab === 'lent' ? 'Berilgan' : 'Olingan' })] }), _jsxs("div", { className: "flex justify-between items-baseline pt-1", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[10px] text-[#899098]", children: "Qoldiq summa" }), _jsxs("p", { className: "text-lg font-black text-white light:text-[#1d2939]", children: [remaining.toLocaleString('uz-UZ'), " so'm"] })] }), _jsxs("div", { className: "text-right", children: [_jsx("p", { className: "text-[10px] text-[#899098]", children: "Umumiy qarz" }), _jsxs("p", { className: "text-xs font-bold text-[#b6bfd0]", children: [d.amount.toLocaleString('uz-UZ'), " so'm"] })] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "w-full h-2 rounded-full bg-[#151d27] light:bg-[#f2f4f7] overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-[#29c184] transition-all", style: { width: `${progress}%` } }) }), _jsxs("div", { className: "flex justify-between text-[10px] text-[#899098]", children: [_jsxs("span", { children: ["To'langan: ", d.paid_amount.toLocaleString('uz-UZ'), " so'm"] }), _jsxs("span", { children: [progress, "%"] })] })] }), _jsxs("div", { className: "pt-2 border-t border-[#354454]/40 flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-1 text-[11px] text-[#899098]", children: [_jsx(Calendar, { className: "w-3.5 h-3.5" }), _jsx("span", { children: d.due_date ? `Muddat: ${d.due_date}` : "Muddatsiz" })] }), _jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("button", { type: "button", onClick: () => {
                                                    triggerHaptic('light');
                                                    setSelectedDebtForEdit(d);
                                                }, className: "p-1.5 rounded-xl bg-[#151d27] border border-[#354454] text-[#899098] hover:text-white hover:border-[#29c184] transition-all cursor-pointer", title: "Tahrirlash", children: _jsx(Edit3, { className: "w-3.5 h-3.5" }) }), d.status === 'active' && tab === 'lent' && (_jsxs("button", { type: "button", onClick: () => handleSendTelegramReminder(d), className: "px-2.5 py-1.5 rounded-xl bg-[#1570ef]/15 text-[#1570ef] text-xs font-bold flex items-center gap-1 hover:bg-[#1570ef]/25 cursor-pointer", title: "Telegram orqali eslatish", children: [_jsx(Send, { className: "w-3 h-3" }), _jsx("span", { children: "Eslatish" })] })), d.status === 'active' && (_jsx("button", { type: "button", onClick: () => {
                                                    triggerHaptic('light');
                                                    setPayModalDebt(d);
                                                    setPayAmountStr(String(remaining));
                                                }, className: "px-3 py-1.5 rounded-xl bg-[#29c184] text-white text-xs font-bold hover:bg-[#25ab75] active:scale-95 cursor-pointer", children: "To'lash" }))] })] })] }, d.id));
                })) }), showAddModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: _jsxs("div", { className: "w-full max-w-md bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4", children: [_jsx("h3", { className: "font-bold text-lg text-white", children: "Yangi Qarz Qo'shish" }), _jsxs("form", { onSubmit: handleCreateDebt, className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Kimga / Kimdan?" }), _jsx("input", { type: "text", required: true, value: counterpartyName, onChange: (e) => setCounterpartyName(e.target.value), placeholder: "Ismi (masalan: Anvar, Sardor)", className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Summa (so'm)" }), _jsx("input", { type: "number", required: true, value: amountStr, onChange: (e) => setAmountStr(e.target.value), placeholder: "0", className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Telefon raqami (ixtiyoriy)" }), _jsx("input", { type: "text", value: phone, onChange: (e) => setPhone(e.target.value), placeholder: "+998 90 123 45 67", className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Qaytarish muddati (ixtiyoriy)" }), _jsx("input", { type: "date", value: dueDate, onChange: (e) => setDueDate(e.target.value), className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]" })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { type: "button", onClick: () => setShowAddModal(false), className: "px-4 py-2 rounded-xl text-xs font-bold text-[#899098] hover:text-white", children: "Bekor qilish" }), _jsx("button", { type: "submit", disabled: loading, className: "px-5 py-2 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer", children: loading ? 'Saqlanmoqda...' : 'Saqlash' })] })] })] }) })), payModalDebt && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: _jsxs("div", { className: "w-full max-w-sm bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4", children: [_jsxs("h3", { className: "font-bold text-base text-white", children: ["Qarzni so'ndirish: ", payModalDebt.counterparty_name] }), _jsx("p", { className: "text-xs text-[#899098]", children: "To'lanayotgan summani kiriting. Agar to'liq to'lansa, qarz avtomatik yopiladi." }), _jsxs("form", { onSubmit: handlePayDebt, className: "space-y-3", children: [_jsx("input", { type: "number", required: true, value: payAmountStr, onChange: (e) => setPayAmountStr(e.target.value), className: "w-full px-4 py-3 rounded-xl bg-[#213040] border border-[#354454] text-white text-xl font-bold focus:border-[#29c184]" }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { type: "button", onClick: () => setPayModalDebt(null), className: "px-4 py-2 rounded-xl text-xs font-bold text-[#899098] hover:text-white", children: "Bekor qilish" }), _jsx("button", { type: "submit", disabled: loading, className: "px-5 py-2 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer", children: "Tasdiqlash" })] })] })] }) })), _jsx(EditDebtModal, { isOpen: !!selectedDebtForEdit, onClose: () => setSelectedDebtForEdit(null), debt: selectedDebtForEdit, onUpdate: handleUpdateDebt, onDelete: handleDeleteDebt })] }));
};
