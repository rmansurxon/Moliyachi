import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { triggerHaptic } from '../api';
import { Bell, Flame, Search } from 'lucide-react';
export const Header = ({ user, onOpenNotifications, onOpenGamification, onOpenSettings }) => {
    return (_jsxs("header", { className: "w-full bg-[#18222d] border-b border-[#222e3b] px-4 md:px-8 py-3.5 flex items-center justify-between select-none", children: [_jsxs("div", { className: "flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity", onClick: onOpenSettings, children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-[#334155] border border-[#475569] flex items-center justify-center font-bold text-xs text-white shadow-sm", children: user.first_name ? user.first_name.charAt(0).toUpperCase() : 'M' }), _jsx("span", { className: "font-bold text-sm text-white tracking-tight", children: user.first_name || 'Mansurxon' })] }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsxs("button", { onClick: () => {
                            triggerHaptic('light');
                            onOpenGamification();
                        }, className: "flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151f28] border border-[#2b3a4a] text-xs font-bold shadow-inner cursor-pointer hover:border-[#29c184]/50 transition-colors", title: "Seriya va Olmoslar", children: [_jsxs("div", { className: "flex items-center gap-1 text-[#ff8d28]", children: [_jsx(Flame, { className: "w-3.5 h-3.5 fill-[#ff8d28]" }), _jsx("span", { children: user.streak || 1 })] }), _jsxs("div", { className: "flex items-center gap-1 text-[#29c184]", children: [_jsx("span", { className: "text-xs", children: "\uD83D\uDC8E" }), _jsx("span", { children: user.diamonds || 365 })] })] }), _jsxs("button", { onClick: () => {
                            triggerHaptic('light');
                            onOpenNotifications();
                        }, className: "w-8 h-8 rounded-full flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors cursor-pointer relative", title: "Xabarnomalar", children: [_jsx(Bell, { className: "w-4 h-4" }), _jsx("span", { className: "absolute top-1.5 right-1.5 w-2 h-2 bg-[#f0646e] rounded-full ring-2 ring-[#18222d]" })] }), _jsx("button", { onClick: () => {
                            triggerHaptic('light');
                        }, className: "w-8 h-8 rounded-full flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors cursor-pointer", title: "Qidirish", children: _jsx(Search, { className: "w-4 h-4" }) })] })] }));
};
