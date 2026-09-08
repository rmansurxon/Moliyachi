import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api, triggerHaptic } from '../api';
import { X, ChevronRight, ChevronLeft, Sparkles, Award } from 'lucide-react';
import confetti from 'canvas-confetti';
export const OyYakuniView = ({ onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [wrapData, setWrapData] = useState(null);
    useEffect(() => {
        loadWrap();
        confetti({ particleCount: 50, spread: 80, origin: { y: 0.5 } });
    }, []);
    const loadWrap = async () => {
        try {
            const res = await api.getMonthlyWrap();
            setWrapData(res.wrap);
        }
        catch (err) {
            console.error(err);
        }
    };
    const totalSlides = 4;
    const handleNext = () => {
        triggerHaptic('light');
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(currentSlide + 1);
        }
        else {
            confetti({ particleCount: 70, spread: 100, origin: { y: 0.6 } });
            onClose();
        }
    };
    const handlePrev = () => {
        triggerHaptic('light');
        if (currentSlide > 0)
            setCurrentSlide(currentSlide - 1);
    };
    if (!wrapData) {
        return (_jsx("div", { className: "fixed inset-0 z-50 bg-[#19232e] flex items-center justify-center text-white", children: "Yuklanmoqda..." }));
    }
    return (_jsxs("div", { className: "fixed inset-0 z-50 bg-[#121820] flex flex-col justify-between p-4 safe-area-top safe-area-bottom", children: [_jsxs("div", { className: "space-y-3", children: [_jsx("div", { className: "flex gap-1.5 pt-2", children: Array.from({ length: totalSlides }).map((_, idx) => (_jsx("div", { className: `h-1.5 flex-1 rounded-full transition-all duration-300 ${idx <= currentSlide ? 'bg-[#29c184]' : 'bg-white/20'}` }, idx))) }), _jsx("div", { className: "flex justify-end", children: _jsx("button", { onClick: () => {
                                triggerHaptic('light');
                                onClose();
                            }, className: "w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20", children: _jsx(X, { className: "w-5 h-5" }) }) })] }), _jsxs("div", { className: "flex-1 flex flex-col items-center justify-center text-center px-4 py-8", children: [currentSlide === 0 && (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsx("div", { className: "w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#12A99D] via-[#29c184] to-[#9DFC38] flex items-center justify-center shadow-2xl shadow-[#29c184]/40", children: _jsx(Sparkles, { className: "w-10 h-10 text-white" }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("span", { className: "text-xs font-black tracking-widest text-[#29c184] uppercase", children: wrapData.monthName }), _jsx("h1", { className: "text-3xl font-black text-white leading-tight", children: "Moliyaviy Oylik Yakuningiz Tayyor!" }), _jsx("p", { className: "text-sm text-[#b6bfd0] max-w-xs mx-auto", children: "Ushbu oyda sarflagan pullaringiz, erishgan yutuqlaringiz va moliyaviy natijalaringiz haqida qisqacha hisobot." })] })] })), currentSlide === 1 && (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsx("span", { className: "text-xs font-black tracking-widest text-[#29c184] uppercase", children: "Balans va Harakatlar" }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "p-5 rounded-3xl bg-[#213040] border border-[#354454] space-y-1", children: [_jsx("p", { className: "text-xs text-[#899098]", children: "Oylik Jami Daromad" }), _jsxs("h3", { className: "text-2xl font-black text-[#29c184]", children: ["+", wrapData.totalIncome.toLocaleString('uz-UZ'), " so'm"] })] }), _jsxs("div", { className: "p-5 rounded-3xl bg-[#213040] border border-[#354454] space-y-1", children: [_jsx("p", { className: "text-xs text-[#899098]", children: "Oylik Jami Xarajat" }), _jsxs("h3", { className: "text-2xl font-black text-[#f0646e]", children: ["-", wrapData.totalExpense.toLocaleString('uz-UZ'), " so'm"] })] })] })] })), currentSlide === 2 && (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsx("span", { className: "text-xs font-black tracking-widest text-[#29c184] uppercase", children: "Asosiy Xarajat Toifasi" }), _jsx("div", { className: "w-24 h-24 mx-auto rounded-3xl bg-[#ff8d28]/20 border border-[#ff8d28] flex items-center justify-center text-4xl shadow-xl", children: "\uD83D\uDED2" }), _jsxs("div", { className: "space-y-2", children: [_jsxs("h2", { className: "text-2xl font-black text-white", children: ["\"", wrapData.topCategory.name, "\""] }), _jsxs("p", { className: "text-sm text-[#b6bfd0] max-w-xs mx-auto", children: ["Sizning eng ko'p mablag'ingiz ushbu toifaga sarflandi (", _jsxs("span", { className: "text-white font-bold", children: [wrapData.topCategory.amount.toLocaleString('uz-UZ'), " so'm"] }), ")."] })] })] })), currentSlide === 3 && (_jsxs("div", { className: "space-y-6 animate-fade-in", children: [_jsx("div", { className: "w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-[#f2c14e] to-[#d99e1f] flex items-center justify-center text-white shadow-2xl", children: _jsx(Award, { className: "w-12 h-12 text-black" }) }), _jsxs("div", { className: "space-y-2", children: [_jsx("span", { className: "text-xs font-black tracking-widest text-[#f2c14e] uppercase", children: wrapData.achievementBadge }), _jsxs("h2", { className: "text-4xl font-black text-white", children: [wrapData.financialScore, " / 100"] }), _jsxs("p", { className: "text-sm text-[#b6bfd0] max-w-xs mx-auto", children: ["Siz daromadlaringizning ", wrapData.savingsRate, "% qismini tejamkorlik bilan saqlab qoldingiz!"] })] })] }))] }), _jsxs("div", { className: "flex items-center justify-between gap-3 pt-4", children: [_jsx("button", { onClick: handlePrev, disabled: currentSlide === 0, className: "w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white disabled:opacity-30 cursor-pointer", children: _jsx(ChevronLeft, { className: "w-6 h-6" }) }), _jsxs("button", { onClick: handleNext, className: "flex-1 py-3.5 rounded-2xl bg-[#29c184] hover:bg-[#25ab75] active:scale-98 text-white font-black text-sm shadow-lg shadow-[#29c184]/40 flex items-center justify-center gap-2 cursor-pointer", children: [_jsx("span", { children: currentSlide === totalSlides - 1 ? 'Tamomlash' : 'Keyingisi' }), _jsx(ChevronRight, { className: "w-4 h-4 stroke-[3]" })] })] })] }));
};
