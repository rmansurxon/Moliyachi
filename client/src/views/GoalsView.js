import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api, triggerHaptic } from '../api';
import { Icon } from '../components/Icon';
import { Plus, Target, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';
export const GoalsView = ({ goals, wallets, onReload }) => {
    const [showAddModal, setShowAddModal] = useState(false);
    const [contributeGoal, setContributeGoal] = useState(null);
    const [contributeAmountStr, setContributeAmountStr] = useState('');
    const [selectedWalletId, setSelectedWalletId] = useState(wallets[0]?.id || '');
    // New goal form state
    const [title, setTitle] = useState('');
    const [targetAmountStr, setTargetAmountStr] = useState('');
    const [currentAmountStr, setCurrentAmountStr] = useState('0');
    const [deadline, setDeadline] = useState('');
    const [icon, setIcon] = useState('Target');
    const [color, setColor] = useState('#29c184');
    const [loading, setLoading] = useState(false);
    const icons = ['Target', 'Laptop', 'Car', 'Plane', 'Home', 'Smartphone', 'GraduationCap', 'Heart'];
    const colors = ['#29c184', '#1570ef', '#ff8d28', '#7a5af8', '#f0646e', '#eab308'];
    const handleCreateGoal = async (e) => {
        e.preventDefault();
        const target_amount = parseFloat(targetAmountStr);
        if (!title || !target_amount)
            return;
        setLoading(true);
        triggerHaptic('success');
        try {
            await api.createGoal({
                title,
                target_amount,
                current_amount: parseFloat(currentAmountStr) || 0,
                deadline: deadline || undefined,
                icon,
                color
            });
            confetti({ particleCount: 30, spread: 60 });
            setShowAddModal(false);
            setTitle('');
            setTargetAmountStr('');
            setCurrentAmountStr('0');
            onReload();
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleContribute = async (e) => {
        e.preventDefault();
        if (!contributeGoal)
            return;
        const amount = parseFloat(contributeAmountStr);
        if (!amount || amount <= 0)
            return;
        setLoading(true);
        triggerHaptic('success');
        try {
            await api.contributeGoal(contributeGoal.id, amount, selectedWalletId);
            confetti({ particleCount: 50, spread: 80, origin: { y: 0.6 } });
            setContributeGoal(null);
            setContributeAmountStr('');
            onReload();
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "space-y-4 max-w-md mx-auto pb-24 px-4 pt-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-white light:text-[#1d2939]", children: "Moliyaviy Maqsadlar" }), _jsx("p", { className: "text-xs text-[#899098]", children: "Orzularingiz uchun jamg'arma dasturi" })] }), _jsxs("button", { onClick: () => {
                            triggerHaptic('medium');
                            setShowAddModal(true);
                        }, className: "flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#29c184] text-white text-xs font-bold shadow-md shadow-[#29c184]/30 active:scale-95 transition-all cursor-pointer", children: [_jsx(Plus, { className: "w-4 h-4 stroke-[3]" }), _jsx("span", { children: "Yangi Maqsad" })] })] }), _jsx("div", { className: "space-y-3", children: goals.length === 0 ? (_jsxs("div", { className: "p-8 text-center rounded-2xl bg-[#213040]/50 border border-[#354454]/40", children: [_jsx(Target, { className: "w-10 h-10 text-[#899098] mx-auto mb-2 opacity-50" }), _jsx("p", { className: "text-sm font-bold text-white light:text-[#1d2939]", children: "Hozircha maqsadlar yo'q" }), _jsx("p", { className: "text-xs text-[#899098] mt-1", children: "Yangi noutbuk, sayohat yoki mashina uchun maqsad belgilang." })] })) : (goals.map((g) => {
                    const percent = Math.min(100, Math.round((g.current_amount / g.target_amount) * 100));
                    const remaining = Math.max(0, g.target_amount - g.current_amount);
                    return (_jsxs("div", { className: "p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-md space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm", style: { backgroundColor: g.color }, children: _jsx(Icon, { name: g.icon, size: 20 }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-base font-bold text-white light:text-[#1d2939]", children: g.title }), g.deadline && (_jsxs("p", { className: "flex items-center gap-1 text-[11px] text-[#899098] mt-0.5", children: [_jsx(Calendar, { className: "w-3 h-3" }), _jsxs("span", { children: ["Muddat: ", g.deadline] })] }))] })] }), _jsxs("span", { className: "text-sm font-black text-[#29c184]", children: [percent, "%"] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "w-full h-3 rounded-full bg-[#151d27] light:bg-[#f2f4f7] overflow-hidden", children: _jsx("div", { className: "h-full rounded-full transition-all duration-700", style: {
                                                width: `${percent}%`,
                                                backgroundColor: g.color
                                            } }) }), _jsxs("div", { className: "flex justify-between text-[11px] text-[#899098]", children: [_jsxs("span", { children: ["Yig'ildi: ", g.current_amount.toLocaleString('uz-UZ'), " so'm"] }), _jsxs("span", { children: ["Maqsad: ", g.target_amount.toLocaleString('uz-UZ'), " so'm"] })] })] }), _jsxs("div", { className: "pt-2 border-t border-[#354454]/40 flex items-center justify-between", children: [_jsxs("span", { className: "text-xs text-[#b6bfd0]", children: ["Qoldi: ", _jsxs("strong", { className: "text-white", children: [remaining.toLocaleString('uz-UZ'), " so'm"] })] }), _jsxs("button", { onClick: () => {
                                            triggerHaptic('light');
                                            setContributeGoal(g);
                                        }, className: "px-3.5 py-1.5 rounded-xl bg-[#29c184] text-white text-xs font-bold hover:bg-[#25ab75] active:scale-95 transition-all flex items-center gap-1 cursor-pointer", children: [_jsx(Plus, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Mablag' qo'shish" })] })] })] }, g.id));
                })) }), contributeGoal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: _jsxs("div", { className: "w-full max-w-sm bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4", children: [_jsxs("h3", { className: "font-bold text-base text-white", children: ["Maqsadga pul qo'shish: ", contributeGoal.title] }), _jsxs("form", { onSubmit: handleContribute, className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Qo'shilayotgan summa (so'm)" }), _jsx("input", { type: "number", required: true, value: contributeAmountStr, onChange: (e) => setContributeAmountStr(e.target.value), placeholder: "0", className: "w-full px-4 py-3 rounded-xl bg-[#213040] border border-[#354454] text-white text-xl font-bold focus:border-[#29c184]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Qaysi hamyondan yechilsin?" }), _jsx("select", { value: selectedWalletId, onChange: (e) => setSelectedWalletId(e.target.value), className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]", children: wallets.map((w) => (_jsxs("option", { value: w.id, children: [w.name, " (", w.balance.toLocaleString('uz-UZ'), " so'm)"] }, w.id))) })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { type: "button", onClick: () => setContributeGoal(null), className: "px-4 py-2 rounded-xl text-xs font-bold text-[#899098] hover:text-white", children: "Bekor qilish" }), _jsx("button", { type: "submit", disabled: loading, className: "px-5 py-2 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer", children: "Qo'shish" })] })] })] }) })), showAddModal && (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: _jsxs("div", { className: "w-full max-w-md bg-[#19232e] rounded-3xl border border-[#354454] p-5 shadow-2xl space-y-4", children: [_jsx("h3", { className: "font-bold text-lg text-white", children: "Yangi Maqsad Yaratish" }), _jsxs("form", { onSubmit: handleCreateGoal, className: "space-y-3", children: [_jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Maqsad nomi" }), _jsx("input", { type: "text", required: true, value: title, onChange: (e) => setTitle(e.target.value), placeholder: "Masalan: Yangi noutbuk, Umra safari", className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Kerakli summa (so'm)" }), _jsx("input", { type: "number", required: true, value: targetAmountStr, onChange: (e) => setTargetAmountStr(e.target.value), placeholder: "0", className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Mavjud yig'ilgan summa (ixtiyoriy)" }), _jsx("input", { type: "number", value: currentAmountStr, onChange: (e) => setCurrentAmountStr(e.target.value), placeholder: "0", className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Erishish muddati (ixtiyoriy)" }), _jsx("input", { type: "date", value: deadline, onChange: (e) => setDeadline(e.target.value), className: "w-full px-3.5 py-2.5 rounded-xl bg-[#213040] border border-[#354454] text-white text-sm focus:border-[#29c184]" })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Ikonka" }), _jsx("div", { className: "flex gap-2 overflow-x-auto py-1.5 no-scrollbar", children: icons.map((ic) => (_jsx("button", { type: "button", onClick: () => setIcon(ic), className: `p-2 rounded-xl border ${icon === ic ? 'bg-[#29c184] text-white border-[#29c184]' : 'bg-[#213040] text-[#899098] border-[#354454]'}`, children: _jsx(Icon, { name: ic, size: 18 }) }, ic))) })] }), _jsxs("div", { children: [_jsx("label", { className: "text-xs text-[#b6bfd0]", children: "Rang" }), _jsx("div", { className: "flex gap-2 py-1", children: colors.map((c) => (_jsx("button", { type: "button", onClick: () => setColor(c), className: `w-7 h-7 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-white' : ''}`, style: { backgroundColor: c } }, c))) })] }), _jsxs("div", { className: "flex justify-end gap-2 pt-2", children: [_jsx("button", { type: "button", onClick: () => setShowAddModal(false), className: "px-4 py-2 rounded-xl text-xs font-bold text-[#899098] hover:text-white", children: "Bekor qilish" }), _jsx("button", { type: "submit", disabled: loading, className: "px-5 py-2 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer", children: "Yaratish" })] })] })] }) }))] }));
};
