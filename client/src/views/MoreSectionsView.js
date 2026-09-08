import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { triggerHaptic } from '../api';
import { CreditCard, HandCoins, Target, Tag, FileText, Sparkles, Users, Award, BookOpen, Crown, Settings, ChevronRight } from 'lucide-react';
export const MoreSectionsView = ({ onNavigate }) => {
    const sections = [
        { id: 'balances', label: 'Hamyonlar va Kartalar', desc: 'Virtual kartalar va monitoring', icon: CreditCard, color: '#1570ef' },
        { id: 'debts', label: 'Qarzlar Daftari', desc: 'Berilgan va olingan qarzlar', icon: HandCoins, color: '#f0646e' },
        { id: 'goals', label: 'Moliyaviy Maqsadlar', desc: 'Jamg\'arma rejalari', icon: Target, color: '#29c184' },
        { id: 'categories', label: 'Kategoriyalar', desc: 'Toifalar va byudjet limitlari', icon: Tag, color: '#ff8d28' },
        { id: 'reports', label: 'Hisobotlar & Eksport', desc: 'Excel (CSV) va audit', icon: FileText, color: '#06b6d4' },
        { id: 'oy-yakuni', label: 'Oylik Yakun (Stories)', desc: 'Spotify wrapped uslubida', icon: Sparkles, color: '#7a5af8', badge: 'Yangi' },
        { id: 'together', label: 'Birga (Oilaviy hisob)', desc: 'Guruhlar va sheriklik byudjeti', icon: Users, color: '#ec4899' },
        { id: 'gamification', label: 'Yutuqlar & Gamifikatsiya', desc: 'Seriya, XP va vaucherlar', icon: Award, color: '#eab308' },
        { id: 'articles', label: 'Moliyaviy Bilimlar', desc: 'Maqolalar va maslahatlar', icon: BookOpen, color: '#3b82f6' },
        { id: 'paywall', label: 'Hisobchi AI Pro', desc: 'Premium imkoniyatlar', icon: Crown, color: '#f2c14e', badge: 'PRO' },
        { id: 'settings', label: 'Sozlamalar', desc: 'Valyuta, til va PIN xavfsizlik', icon: Settings, color: '#899098' }
    ];
    return (_jsxs("div", { className: "space-y-4 max-w-md mx-auto pb-24 px-4 pt-2", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-xl font-black text-white light:text-[#1d2939]", children: "Barcha Bo'limlar" }), _jsx("p", { className: "text-xs text-[#899098]", children: "Hisobchi AI ning to'liq imkoniyatlari" })] }), _jsx("div", { className: "space-y-2", children: sections.map((sec) => {
                    const IconComp = sec.icon;
                    return (_jsxs("div", { onClick: () => {
                            triggerHaptic('light');
                            onNavigate(sec.id);
                        }, className: "p-3.5 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#29c184]/50 active:scale-98 transition-all group", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm", style: { backgroundColor: sec.color }, children: _jsx(IconComp, { className: "w-5 h-5" }) }), _jsxs("div", { children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h4", { className: "text-xs font-bold text-white light:text-[#1d2939] group-hover:text-[#29c184] transition-colors", children: sec.label }), sec.badge && (_jsx("span", { className: "px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-[#29c184] text-black", children: sec.badge }))] }), _jsx("p", { className: "text-[11px] text-[#899098] mt-0.5", children: sec.desc })] })] }), _jsx(ChevronRight, { className: "w-4 h-4 text-[#899098] group-hover:translate-x-1 transition-transform" })] }, sec.id));
                }) })] }));
};
