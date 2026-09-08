import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { triggerHaptic } from '../api';
import { Flame, Award, Gift, Copy, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
export const GamificationView = ({ user, vouchers }) => {
    const [copiedCode, setCopiedCode] = useState(null);
    const handleCopyCode = (code) => {
        triggerHaptic('success');
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        confetti({ particleCount: 20, spread: 50 });
        setTimeout(() => setCopiedCode(null), 2000);
    };
    const ranks = [
        { id: 'bronze', name: 'Bronza', xp: 0, color: '#d79a63' },
        { id: 'silver', name: 'Kumush', xp: 200, color: '#c3ccd8' },
        { id: 'gold', name: 'Oltin', xp: 500, color: '#f2c14e' },
        { id: 'diamond', name: 'Olmos', xp: 1000, color: '#2fa8cc' }
    ];
    const currentXp = user.xp || 150;
    const nextRank = ranks.find((r) => r.xp > currentXp) || ranks[ranks.length - 1];
    const progressToNext = Math.min(100, Math.round((currentXp / nextRank.xp) * 100));
    const badges = [
        { title: 'Birinchi Qadam', desc: 'Ilk xarajatni qayd etish', icon: '🌟', unlocked: true },
        { title: '5 Kunlik Seriya', desc: '5 kun davomida kiritish', icon: '🔥', unlocked: user.streak >= 5 },
        { title: 'Maqsad sari', desc: 'Birinchi jamg\'arma maqsadi', icon: '🎯', unlocked: true },
        { title: 'Tejamkor Usta', desc: 'Oylik 20% tejash', icon: '💎', unlocked: false }
    ];
    return (_jsxs("div", { className: "space-y-4 max-w-md mx-auto pb-24 px-4 pt-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-white light:text-[#1d2939]", children: "Moliyaviy Yutuqlar" }), _jsx("p", { className: "text-xs text-[#899098]", children: "Intizom, ballar (XP) va sovg'alar" })] }), _jsx("div", { className: "p-2 rounded-2xl bg-[#ff8d28]/15 text-[#ff8d28]", children: _jsx(Flame, { className: "w-5 h-5 fill-[#ff8d28]" }) })] }), _jsxs("div", { className: "p-5 rounded-3xl bg-gradient-to-tr from-[#ff8d28]/25 via-[#ff8d28]/10 to-transparent border border-[#ff8d28]/40 flex items-center justify-between shadow-xl", children: [_jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1 text-xs font-black text-[#ff8d28] uppercase tracking-wider", children: [_jsx(Flame, { className: "w-4 h-4 fill-[#ff8d28]" }), _jsx("span", { children: "Kundalik Seriya" })] }), _jsxs("h1", { className: "text-3xl font-black text-white mt-1", children: [user.streak || 1, " Kun Ketma-ket!"] }), _jsx("p", { className: "text-xs text-[#b6bfd0] mt-0.5", children: "Har kuni xarajat kiritib seriyani boy bermang." })] }), _jsx("div", { className: "w-16 h-16 rounded-3xl bg-[#ff8d28] flex items-center justify-center text-3xl shadow-lg shadow-[#ff8d28]/30 animate-bounce", children: "\uD83D\uDD25" })] }), _jsxs("div", { className: "p-5 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] space-y-3", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Award, { className: "w-5 h-5 text-[#f2c14e]" }), _jsxs("h3", { className: "text-sm font-bold text-white light:text-[#1d2939]", children: ["Daraja: ", _jsx("span", { className: "capitalize text-[#29c184]", children: user.rank })] })] }), _jsxs("span", { className: "text-xs font-black text-[#29c184]", children: [currentXp, " XP"] })] }), _jsxs("div", { className: "space-y-1", children: [_jsx("div", { className: "w-full h-2.5 rounded-full bg-[#151d27] light:bg-[#eaecf0] overflow-hidden", children: _jsx("div", { className: "h-full rounded-full bg-gradient-to-r from-[#29c184] to-[#9DFC38] transition-all", style: { width: `${progressToNext}%` } }) }), _jsxs("div", { className: "flex justify-between text-[11px] text-[#899098]", children: [_jsxs("span", { children: [currentXp, " XP"] }), _jsxs("span", { children: ["Keyingi daraja: ", nextRank.name, " (", nextRank.xp, " XP)"] })] })] })] }), _jsxs("div", { className: "space-y-2", children: [_jsx("h3", { className: "text-sm font-bold text-white light:text-[#1d2939]", children: "Yutuq Nishonlari" }), _jsx("div", { className: "grid grid-cols-2 gap-2.5", children: badges.map((b, idx) => (_jsxs("div", { className: `p-3 rounded-2xl border flex items-center gap-2.5 ${b.unlocked
                                ? 'bg-[#213040] light:bg-white border-[#29c184]/40 shadow-sm'
                                : 'bg-[#151d27]/40 border-[#354454]/30 opacity-50'}`, children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xl shrink-0", children: b.icon }), _jsxs("div", { className: "min-w-0", children: [_jsx("h4", { className: "text-xs font-bold text-white light:text-[#1d2939] truncate", children: b.title }), _jsx("p", { className: "text-[10px] text-[#899098] truncate", children: b.desc })] })] }, idx))) })] }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { className: "flex items-center gap-1.5 text-sm font-bold text-white light:text-[#1d2939]", children: [_jsx(Gift, { className: "w-4 h-4 text-[#ff8d28]" }), _jsxs("span", { children: ["Sizning Vaucherlaringiz (", vouchers.length, ")"] })] }), _jsx("div", { className: "space-y-2", children: vouchers.map((v) => (_jsxs("div", { className: "p-3.5 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] flex items-center justify-between shadow-sm", children: [_jsxs("div", { className: "space-y-0.5", children: [_jsx("h4", { className: "text-xs font-bold text-white light:text-[#1d2939]", children: v.title }), _jsx("p", { className: "text-[11px] text-[#899098]", children: v.description }), _jsxs("div", { className: "flex items-center gap-2 pt-1", children: [_jsx("span", { className: "font-mono text-xs font-black text-[#29c184] px-2 py-0.5 bg-[#29c184]/15 rounded-md border border-[#29c184]/30", children: v.code }), _jsxs("span", { className: "text-[10px] text-[#899098]", children: ["Muddati: ", v.expires_at] })] })] }), _jsx("button", { onClick: () => handleCopyCode(v.code), className: "p-2.5 rounded-xl bg-[#151d27] light:bg-[#f2f4f7] text-[#29c184] hover:bg-[#29c184] hover:text-white transition-all cursor-pointer shrink-0", title: "Promokoddan nusxa olish", children: copiedCode === v.code ? _jsx(Check, { className: "w-4 h-4" }) : _jsx(Copy, { className: "w-4 h-4" }) })] }, v.id))) })] })] }));
};
