import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { X, Bell } from 'lucide-react';
export const NotificationsModal = ({ isOpen, onClose }) => {
    if (!isOpen)
        return null;
    const notifications = [
        {
            id: '1',
            title: 'Xarajatlar nazorati',
            desc: 'Bugungi kun xarajatlarini kiritishni unutmang. Seriyangiz davom etmoqda! 🔥',
            time: '15 daqiqa oldin',
            icon: '🔥',
            color: '#ff8d28'
        },
        {
            id: '2',
            title: 'Qarz eslatmasi',
            desc: 'Anvar akaga berilgan qarzning qaytarish muddati yaqinlashmoqda (25-sentabr).',
            time: 'Bugun, 09:30',
            icon: '🤝',
            color: '#1570ef'
        },
        {
            id: '3',
            title: 'Yangi yutuq ochildi!',
            desc: '"Birinchi Qadam" nishoniga sazovor bo\'ldingiz va +50 XP qo\'lga kiritdingiz.',
            time: 'Kecha',
            icon: '🌟',
            color: '#29c184'
        }
    ];
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4", children: _jsxs("div", { className: "w-full max-w-sm bg-[#19232e] light:bg-white rounded-3xl border border-[#354454] light:border-[#eaecf0] p-5 shadow-2xl space-y-4", children: [_jsxs("div", { className: "flex items-center justify-between border-b border-[#354454]/40 light:border-[#eaecf0] pb-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Bell, { className: "w-5 h-5 text-[#29c184]" }), _jsx("h3", { className: "font-bold text-base text-white light:text-[#1d2939]", children: "Xabarnomalar" })] }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full bg-[#213040] light:bg-[#eaecf0] flex items-center justify-center text-[#899098] hover:text-white", children: _jsx(X, { className: "w-4 h-4" }) })] }), _jsx("div", { className: "space-y-2.5 max-h-80 overflow-y-auto", children: notifications.map((n) => (_jsxs("div", { className: "p-3 rounded-2xl bg-[#213040] light:bg-[#f7f9fa] border border-[#354454]/50 light:border-[#eaecf0] flex items-start gap-3", children: [_jsx("div", { className: "text-xl p-1 bg-white/5 rounded-xl", children: n.icon }), _jsxs("div", { className: "flex-1 min-w-0", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h4", { className: "text-xs font-bold text-white light:text-[#1d2939]", children: n.title }), _jsx("span", { className: "text-[10px] text-[#899098]", children: n.time })] }), _jsx("p", { className: "text-[11px] text-[#b6bfd0] light:text-[#475467] mt-0.5 leading-snug", children: n.desc })] })] }, n.id))) })] }) }));
};
