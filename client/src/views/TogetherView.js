import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { triggerHaptic } from '../api';
import { Users, Share2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
export const TogetherView = () => {
    const [copied, setCopied] = useState(false);
    const inviteCode = 'HISOBCHI-BIRGA-9428';
    const handleShareInvite = () => {
        triggerHaptic('success');
        confetti({ particleCount: 30, spread: 60 });
        const shareText = `Hisobchi AI orqali birgalikda oilaviy yoki do'stlar bilan byudjet yuritaylik! Taklif kodi: ${inviteCode}`;
        const tgUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(shareText)}`;
        window.open(tgUrl, '_blank');
    };
    const handleCopy = () => {
        triggerHaptic('light');
        navigator.clipboard.writeText(inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (_jsxs("div", { className: "space-y-4 max-w-md mx-auto pb-24 px-4 pt-2", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-white light:text-[#1d2939]", children: "Birga (Oilaviy hisob)" }), _jsx("p", { className: "text-xs text-[#899098]", children: "Do'stlar va oila bilan umumiy xarajatlar" })] }), _jsx("div", { className: "p-2 rounded-2xl bg-[#7a5af8]/15 text-[#7a5af8]", children: _jsx(Users, { className: "w-5 h-5" }) })] }), _jsxs("div", { className: "p-6 rounded-3xl bg-gradient-to-br from-[#7a5af8]/20 via-[#213040] to-[#151d27] border border-[#7a5af8]/40 shadow-xl space-y-4", children: [_jsx("div", { className: "w-14 h-14 rounded-3xl bg-[#7a5af8] flex items-center justify-center text-white shadow-lg shadow-[#7a5af8]/40", children: _jsx(Users, { className: "w-7 h-7" }) }), _jsxs("div", { children: [_jsx("h3", { className: "text-lg font-black text-white light:text-[#1d2939]", children: "Umumiy Xarajatlarni Oson Boshqaring" }), _jsx("p", { className: "text-xs text-[#b6bfd0] mt-1 leading-relaxed", children: "Oilangiz a'zolarini yoki do'stlaringizni taklif qiling. Har kim o'zi qilgan xarajatni kiritsa, hisobotlar barchaga ko'rinadi va Telegram guruhida avtomatik bo'lib beriladi." })] }), _jsxs("div", { className: "p-3.5 rounded-2xl bg-[#151d27] border border-[#354454] flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-[10px] text-[#899098] uppercase font-bold", children: "Sizning Taklif Kodingiz" }), _jsx("p", { className: "font-mono text-sm font-black text-[#29c184] mt-0.5", children: inviteCode })] }), _jsx("button", { onClick: handleCopy, className: "px-3 py-1.5 rounded-xl bg-[#213040] text-xs font-bold text-white hover:border-[#29c184] border border-[#354454] cursor-pointer", children: copied ? 'Nusxalandi!' : 'Nusxa olish' })] }), _jsxs("button", { onClick: handleShareInvite, className: "w-full py-3.5 rounded-2xl bg-[#7a5af8] hover:bg-[#6845e6] active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-[#7a5af8]/30 flex items-center justify-center gap-2 transition-all cursor-pointer", children: [_jsx(Share2, { className: "w-4 h-4" }), _jsx("span", { children: "Telegram orqali taklif qilish" })] })] }), _jsxs("div", { className: "p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] space-y-2", children: [_jsxs("h4", { className: "text-xs font-bold text-white light:text-[#1d2939] uppercase tracking-wider flex items-center gap-1.5", children: [_jsx(Sparkles, { className: "w-4 h-4 text-[#29c184]" }), _jsx("span", { children: "Telegram Guruhlarga Botni Qo'shish" })] }), _jsx("p", { className: "text-xs text-[#b6bfd0] light:text-[#475467] leading-relaxed", children: "Hisobchi AI botini do'stlaringiz bilan bo'lgan Telegram guruhiga qo'shing. Guruhda kiritilgan har bir xarajat (\"Choyxona 450 000 5 kishiga\") avtomatik har bir ishtirokchiga taqsimlanadi!" })] })] }));
};
