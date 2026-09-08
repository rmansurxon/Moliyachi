import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { api, triggerHaptic } from '../api';
import { Globe, DollarSign, Moon, Sun, Crown, Shield, Smartphone } from 'lucide-react';
import confetti from 'canvas-confetti';
export const SettingsView = ({ user, theme, onToggleTheme, onOpenPaywall, onReloadUser }) => {
    const [currency, setCurrency] = useState(user.currency || 'UZS');
    const [language, setLanguage] = useState(user.language || 'uz');
    const [pinCode, setPinCode] = useState(user.pin_code || '');
    const [saving, setSaving] = useState(false);
    const [savedSuccess, setSavedSuccess] = useState(false);
    const handleSave = async (newCurrency = currency, newLang = language, newPin = pinCode) => {
        setSaving(true);
        triggerHaptic('success');
        try {
            await api.updateProfile({
                currency: newCurrency,
                language: newLang,
                pin_code: newPin || undefined
            });
            confetti({ particleCount: 25, spread: 50 });
            setSavedSuccess(true);
            onReloadUser();
            setTimeout(() => setSavedSuccess(false), 2000);
        }
        catch (err) {
            console.error(err);
        }
        finally {
            setSaving(false);
        }
    };
    return (_jsxs("div", { className: "space-y-4 max-w-md mx-auto pb-24 px-4 pt-2", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-white light:text-[#1d2939]", children: "Sozlamalar" }), _jsx("p", { className: "text-xs text-[#899098]", children: "Valyuta, til, xavfsizlik va mavzuni boshqarish" })] }), _jsxs("div", { onClick: () => {
                    triggerHaptic('medium');
                    onOpenPaywall();
                }, className: "p-4 rounded-3xl bg-gradient-to-r from-[#f2c14e]/20 via-[#ff8d28]/20 to-[#29c184]/20 border border-[#f2c14e]/40 flex items-center justify-between cursor-pointer active:scale-98 transition-transform shadow-lg group", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#f2c14e] to-[#ff8d28] flex items-center justify-center text-black font-black shadow-md", children: _jsx(Crown, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-1.5", children: [_jsx("h4", { className: "text-xs font-black text-white light:text-[#1d2939] uppercase tracking-wider", children: "Hisobchi AI Pro" }), _jsx("span", { className: "px-1.5 py-0.2 rounded text-[8px] bg-[#f2c14e] text-black font-black uppercase", children: "Premium" })] }), _jsx("p", { className: "text-[11px] text-[#b6bfd0] mt-0.5", children: "Cheksiz AI chat, chek skaneri va oylik tahlil" })] })] }), _jsx("button", { className: "px-3 py-1.5 rounded-xl bg-[#f2c14e] text-black text-xs font-black shadow-sm group-hover:bg-[#e0b040] transition-colors cursor-pointer", children: "Ko'rish" })] }), _jsxs("div", { className: "p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] space-y-2", children: [_jsxs("label", { className: "text-xs font-bold text-white light:text-[#1d2939] flex items-center gap-1.5", children: [_jsx(DollarSign, { className: "w-4 h-4 text-[#29c184]" }), _jsx("span", { children: "Asosiy Valyuta" })] }), _jsx("div", { className: "grid grid-cols-3 gap-2", children: [
                            { code: 'UZS', label: "UZS (so'm)" },
                            { code: 'USD', label: 'USD ($)' },
                            { code: 'RUB', label: 'RUB (₽)' }
                        ].map((c) => (_jsx("button", { onClick: () => {
                                setCurrency(c.code);
                                handleSave(c.code, language, pinCode);
                            }, className: `p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${currency === c.code
                                ? 'border-[#29c184] bg-[#29c184]/15 text-[#29c184] ring-1 ring-[#29c184]'
                                : 'border-[#354454]/60 text-[#899098] hover:text-white'}`, children: c.label }, c.code))) })] }), _jsxs("div", { className: "p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] space-y-2", children: [_jsxs("label", { className: "text-xs font-bold text-white light:text-[#1d2939] flex items-center gap-1.5", children: [_jsx(Globe, { className: "w-4 h-4 text-[#1570ef]" }), _jsx("span", { children: "Ilova Tili" })] }), _jsx("div", { className: "grid grid-cols-2 gap-2", children: [
                            { code: 'uz', label: "O'zbekcha (Lotin)" },
                            { code: 'uz_kr', label: 'Ўзбекча (Кирилл)' },
                            { code: 'ru', label: 'Русский' },
                            { code: 'en', label: 'English' }
                        ].map((l) => (_jsx("button", { onClick: () => {
                                setLanguage(l.code);
                                handleSave(currency, l.code, pinCode);
                            }, className: `p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${language === l.code
                                ? 'border-[#1570ef] bg-[#1570ef]/15 text-[#1570ef] ring-1 ring-[#1570ef]'
                                : 'border-[#354454]/60 text-[#899098] hover:text-white'}`, children: l.label }, l.code))) })] }), _jsxs("div", { className: "p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] flex items-center justify-between", children: [_jsxs("div", { className: "flex items-center gap-2", children: [theme === 'dark' ? _jsx(Moon, { className: "w-5 h-5 text-indigo-400" }) : _jsx(Sun, { className: "w-5 h-5 text-amber-400" }), _jsxs("div", { children: [_jsx("h4", { className: "text-xs font-bold text-white light:text-[#1d2939]", children: "Tungi Mavzu (Dark Mode)" }), _jsx("p", { className: "text-[11px] text-[#899098]", children: "Ko'zlarni toliqtirmaydigan qorong'u rejim" })] })] }), _jsx("button", { onClick: onToggleTheme, className: `w-12 h-6 rounded-full transition-colors relative cursor-pointer ${theme === 'dark' ? 'bg-[#29c184]' : 'bg-[#d0d5dd]'}`, children: _jsx("span", { className: `w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${theme === 'dark' ? 'left-6.5' : 'left-0.5'}` }) })] }), _jsxs("div", { className: "p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] space-y-2", children: [_jsxs("label", { className: "text-xs font-bold text-white light:text-[#1d2939] flex items-center gap-1.5", children: [_jsx(Shield, { className: "w-4 h-4 text-[#f0646e]" }), _jsx("span", { children: "4 xonali PIN Kod Xavfsizligi" })] }), _jsx("p", { className: "text-[11px] text-[#899098]", children: "Ilovaga kirishda maxsus kod so'ralishi uchun 4 xonali PIN kiriting." }), _jsxs("div", { className: "flex gap-2", children: [_jsx("input", { type: "password", maxLength: 4, value: pinCode, onChange: (e) => setPinCode(e.target.value), placeholder: "Masalan: 1234", className: "flex-1 px-3.5 py-2 rounded-xl bg-[#151d27] border border-[#354454] text-white text-sm font-mono text-center tracking-widest focus:border-[#29c184]" }), _jsx("button", { onClick: () => handleSave(currency, language, pinCode), className: "px-4 py-2 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer", children: saving ? '...' : 'O\'rnatish' })] })] }), _jsxs("div", { className: "p-4 rounded-3xl bg-[#151d27] border border-[#354454]/60 space-y-2 text-xs text-[#899098]", children: [_jsxs("div", { className: "flex items-center gap-2 text-white font-bold", children: [_jsx(Smartphone, { className: "w-4 h-4 text-[#29c184]" }), _jsx("span", { children: "Telegram Bot Integratsiyasi Faol" })] }), _jsx("p", { className: "text-[11px]", children: "Ushbu WebApp Telegram boti bilan 100% integratsiyalashgan. Botga yuborilgan ovozli, matnli va chek xabarlari bir zumda ushbu ilovaga tushadi." })] })] }));
};
