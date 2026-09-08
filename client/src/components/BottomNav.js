import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { triggerHaptic } from '../api';
import { Home, Sparkles, Plus, BarChart3, HandCoins } from 'lucide-react';
export const BottomNav = ({ currentTab, onChangeTab, onOpenAddModal }) => {
    const navItems = [
        { id: 'home', label: 'Asosiy', icon: Home },
        { id: 'chat', label: 'AI Chat', icon: Sparkles, badge: 'AI' },
        { id: 'add', label: "Qo'shish", icon: Plus, isAction: true },
        { id: 'stats', label: 'Statistika', icon: BarChart3 },
        { id: 'debts', label: 'Qarzlar', icon: HandCoins }
    ];
    return (_jsx("nav", { className: "fixed bottom-0 left-0 right-0 z-40 bg-[#19232e]/95 light:bg-white/95 backdrop-blur-xl border-t border-[#354454]/60 light:border-[#eaecf0] px-3 pt-2 pb-5 safe-area-bottom", children: _jsx("div", { className: "max-w-md mx-auto flex items-center justify-around", children: navItems.map((item) => {
                const IconComp = item.icon;
                const isActive = currentTab === item.id;
                if (item.isAction) {
                    return (_jsx("button", { onClick: () => {
                            triggerHaptic('medium');
                            onOpenAddModal();
                        }, className: "relative -top-4 w-13 h-13 rounded-full bg-gradient-to-tr from-[#12A99D] via-[#29c184] to-[#9DFC38] flex items-center justify-center text-white shadow-xl shadow-[#29c184]/35 active:scale-90 transition-transform cursor-pointer", title: "Yangi xarajat yoki daromad qo'shish", children: _jsx(Plus, { className: "w-7 h-7 stroke-[2.8]" }) }, item.id));
                }
                return (_jsxs("button", { onClick: () => {
                        triggerHaptic('light');
                        onChangeTab(item.id);
                    }, className: `flex flex-col items-center justify-center gap-1 py-1 px-3 rounded-2xl transition-all cursor-pointer relative ${isActive
                        ? 'text-[#29c184] font-bold'
                        : 'text-[#899098] light:text-[#98a2b3] hover:text-white light:hover:text-[#1d2939]'}`, children: [_jsxs("div", { className: "relative", children: [_jsx(IconComp, { className: `w-5 h-5 transition-transform ${isActive ? 'scale-115 stroke-[2.5]' : 'stroke-[1.8]'}` }), item.badge && (_jsx("span", { className: "absolute -top-1 -right-2 px-1 py-0.2 text-[8px] font-black uppercase rounded-full bg-[#29c184] text-black", children: item.badge }))] }), _jsx("span", { className: "text-[10px] tracking-tight", children: item.label }), isActive && (_jsx("span", { className: "w-1.5 h-1.5 rounded-full bg-[#29c184] absolute -bottom-1" }))] }, item.id));
            }) }) }));
};
