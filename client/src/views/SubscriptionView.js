import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { triggerHaptic } from '../api';
import { Crown, Check, X, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
export const SubscriptionView = ({ onClose }) => {
    const [plan, setPlan] = useState('yearly');
    const [activated, setActivated] = useState(false);
    const handleSubscribe = () => {
        triggerHaptic('success');
        confetti({
            particleCount: 80,
            spread: 90,
            origin: { y: 0.6 },
            colors: ['#f2c14e', '#29c184', '#1570ef']
        });
        setActivated(true);
        setTimeout(() => {
            onClose();
        }, 2500);
    };
    const features = [
        "Cheksiz AI ovozli va matnli xarajat kiritish",
        "Do'kon cheklarini cheksiz OCR skanerlash",
        "Oilaviy va do'stlar bilan umumiy byudjet (Birga)",
        "Telegram guruhlarida xarajatlarni taqsimlash",
        "Batafsil Excel (CSV) va PDF eksport",
        "Virtual SMS Karta monitoringi"
    ];
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4", children: _jsxs("div", { className: "w-full max-w-md bg-[#19232e] rounded-3xl border border-[#f2c14e]/40 p-6 shadow-2xl relative overflow-hidden space-y-5", children: [_jsx("div", { className: "absolute -top-20 -right-20 w-48 h-48 bg-[#f2c14e]/20 rounded-full blur-3xl pointer-events-none" }), _jsxs("div", { className: "flex justify-between items-center relative z-10", children: [_jsxs("div", { className: "flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f2c14e]/15 border border-[#f2c14e]/30 text-[#f2c14e] text-xs font-black uppercase", children: [_jsx(Crown, { className: "w-3.5 h-3.5" }), _jsx("span", { children: "Hisobchi AI Pro" })] }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#899098] hover:text-white", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsxs("div", { className: "text-center space-y-1 relative z-10", children: [_jsx("h2", { className: "text-2xl font-black text-white", children: "Moliya Ustasi Bo'ling" }), _jsx("p", { className: "text-xs text-[#b6bfd0]", children: "Barcha professional AI imkoniyatlarini oching" })] }), _jsx("div", { className: "space-y-2 relative z-10", children: features.map((f, idx) => (_jsxs("div", { className: "flex items-center gap-2.5 text-xs text-white/90", children: [_jsx("div", { className: "w-4 h-4 rounded-full bg-[#29c184]/20 text-[#29c184] flex items-center justify-center shrink-0", children: _jsx(Check, { className: "w-3 h-3 stroke-[3]" }) }), _jsx("span", { children: f })] }, idx))) }), _jsxs("div", { className: "grid grid-cols-2 gap-3 relative z-10", children: [_jsxs("button", { onClick: () => {
                                triggerHaptic('light');
                                setPlan('yearly');
                            }, className: `p-3.5 rounded-2xl border text-left cursor-pointer transition-all relative ${plan === 'yearly'
                                ? 'bg-[#213040] border-[#f2c14e] ring-2 ring-[#f2c14e]/30'
                                : 'bg-[#151d27] border-[#354454]'}`, children: [_jsx("span", { className: "absolute -top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-[#29c184] text-black", children: "-35% Tejash" }), _jsx("p", { className: "text-xs font-bold text-white", children: "Yillik Obuna" }), _jsx("h4", { className: "text-base font-black text-[#f2c14e] mt-0.5", children: "149 000 so'm" }), _jsx("p", { className: "text-[10px] text-[#899098]", children: "Oyiga 12 400 so'm" })] }), _jsxs("button", { onClick: () => {
                                triggerHaptic('light');
                                setPlan('monthly');
                            }, className: `p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${plan === 'monthly'
                                ? 'bg-[#213040] border-[#f2c14e] ring-2 ring-[#f2c14e]/30'
                                : 'bg-[#151d27] border-[#354454]'}`, children: [_jsx("p", { className: "text-xs font-bold text-white", children: "Oylik Obuna" }), _jsx("h4", { className: "text-base font-black text-[#f2c14e] mt-0.5", children: "19 000 so'm" }), _jsx("p", { className: "text-[10px] text-[#899098]", children: "Har oy yangilanadi" })] })] }), activated ? (_jsx("div", { className: "p-3.5 rounded-2xl bg-[#29c184]/20 border border-[#29c184] text-center text-xs font-bold text-[#29c184]", children: "\uD83C\uDF89 Pro ta'rif muvaffaqiyatli faollashtirildi!" })) : (_jsxs("button", { onClick: handleSubscribe, className: "w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#f2c14e] to-[#ff8d28] hover:opacity-90 active:scale-98 text-black font-black text-sm shadow-xl shadow-[#f2c14e]/30 flex items-center justify-center gap-2 transition-all cursor-pointer", children: [_jsx(Sparkles, { className: "w-4 h-4" }), _jsx("span", { children: "Faollashtirish (Sinov muddati)" })] }))] }) }));
};
