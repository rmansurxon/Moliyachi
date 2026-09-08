import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { triggerHaptic } from '../api';
import { Home, Sparkles, CreditCard, HandCoins, Target, Tag, BarChart3, FileText, BookOpen, Settings } from 'lucide-react';
export const Sidebar = ({ currentTab, onChangeTab, className = '' }) => {
    const menuItems = [
        { id: 'home', label: 'Asosiy', icon: Home },
        { id: 'chat', label: 'AI Yordamchi', icon: Sparkles },
        { id: 'balances', label: 'Hamyonlar', icon: CreditCard },
        { id: 'debts', label: 'Qarzlar', icon: HandCoins },
        { id: 'goals', label: 'Maqsadlar', icon: Target },
        { id: 'categories', label: 'Kategoriyalar', icon: Tag },
        { id: 'stats', label: 'Statistika', icon: BarChart3 },
        { id: 'reports', label: 'Hisobotlar', icon: FileText },
        { id: 'articles', label: 'Bilimlar', icon: BookOpen },
        { id: 'settings', label: 'Sozlamalar', icon: Settings }
    ];
    return (_jsxs("aside", { className: `w-56 shrink-0 bg-[#18222d] border-r border-[#222e3b] flex flex-col justify-between py-6 px-3 min-h-screen select-none ${className}`, children: [_jsx("div", { className: "space-y-1 overflow-y-auto no-scrollbar pr-1", children: menuItems.map((item) => {
                    const IconComp = item.icon;
                    const isActive = currentTab === item.id;
                    return (_jsxs("button", { onClick: () => {
                            triggerHaptic('light');
                            onChangeTab(item.id);
                        }, className: `w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all cursor-pointer ${isActive
                            ? 'bg-[#1d3532] text-[#29c184] shadow-sm'
                            : 'text-[#94a3b8] hover:text-white hover:bg-white/5'}`, children: [_jsx(IconComp, { className: `w-4 h-4 ${isActive ? 'text-[#29c184] stroke-[2.5]' : 'stroke-[1.8]'}` }), _jsx("span", { className: "truncate", children: item.label })] }, item.id));
                }) }), _jsx("div", { className: "pt-4 border-t border-[#222e3b]", children: _jsxs("div", { className: "flex items-center gap-2.5 px-3 py-2 cursor-pointer", onClick: () => onChangeTab('home'), children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-[#12A99D]/20 border border-[#29c184]/40 flex items-center justify-center text-[#29c184] shadow-sm", children: _jsx(Sparkles, { className: "w-4 h-4 fill-[#29c184]" }) }), _jsxs("div", { children: [_jsx("h4", { className: "text-xs font-bold text-white leading-none", children: "Hisobchi AI" }), _jsx("p", { className: "text-[10px] text-[#29c184] mt-0.5 font-medium", children: "Supabase Cloud" })] })] }) })] }));
};
