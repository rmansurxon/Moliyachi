import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { triggerHaptic } from '../api';
import { Settings } from 'lucide-react';
export const Header = ({ user, onOpenSettings }) => {
    return (_jsxs("header", { className: "w-full bg-[#18222d] border-b border-[#222e3b] px-4 md:px-8 py-3.5 flex items-center justify-between select-none", children: [_jsxs("div", { className: "flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity", onClick: onOpenSettings, children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-gradient-to-tr from-[#12A99D] to-[#29c184] flex items-center justify-center font-bold text-xs text-white shadow-sm", children: user.first_name ? user.first_name.charAt(0).toUpperCase() : 'M' }), _jsxs("div", { children: [_jsx("span", { className: "font-bold text-sm text-white tracking-tight block leading-tight", children: user.first_name || 'Mansurxon' }), _jsx("span", { className: "text-[10px] text-[#29c184] font-medium", children: "Shaxsiy moliyachi" })] })] }), _jsx("div", { className: "flex items-center gap-2", children: _jsx("button", { onClick: () => {
                        triggerHaptic('light');
                        onOpenSettings();
                    }, className: "w-9 h-9 rounded-xl bg-[#1c2733] border border-[#263445] flex items-center justify-center text-[#94a3b8] hover:text-white hover:border-[#29c184]/50 transition-colors cursor-pointer", title: "Sozlamalar", children: _jsx(Settings, { className: "w-4 h-4" }) }) })] }));
};
