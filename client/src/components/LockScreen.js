import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { triggerHaptic } from '../api';
import { Lock, Delete } from 'lucide-react';
export const LockScreen = ({ correctPin, onUnlock }) => {
    const [pin, setPin] = useState('');
    const [errorShake, setErrorShake] = useState(false);
    const handleDigit = (d) => {
        if (pin.length >= 4)
            return;
        triggerHaptic('light');
        const newPin = pin + d;
        setPin(newPin);
        if (newPin.length === 4) {
            if (newPin === correctPin) {
                triggerHaptic('success');
                onUnlock();
            }
            else {
                triggerHaptic('error');
                setErrorShake(true);
                setTimeout(() => {
                    setPin('');
                    setErrorShake(false);
                }, 600);
            }
        }
    };
    const handleDelete = () => {
        triggerHaptic('light');
        setPin(pin.slice(0, -1));
    };
    return (_jsxs("div", { className: "fixed inset-0 z-50 bg-[#19232e] flex flex-col items-center justify-between p-6 safe-area-top safe-area-bottom", children: [_jsxs("div", { className: "flex-1 flex flex-col items-center justify-center space-y-6", children: [_jsx("div", { className: "w-16 h-16 rounded-3xl bg-[#213040] border border-[#354454] flex items-center justify-center text-[#29c184] shadow-xl", children: _jsx(Lock, { className: "w-8 h-8" }) }), _jsxs("div", { className: "text-center space-y-1", children: [_jsx("h2", { className: "text-xl font-black text-white", children: "Hisobchi AI" }), _jsx("p", { className: "text-xs text-[#899098]", children: "Ilovaga kirish uchun PIN kodni kiriting" })] }), _jsx("div", { className: `flex gap-4 py-2 ${errorShake ? 'animate-bounce text-red-500' : ''}`, children: [0, 1, 2, 3].map((idx) => (_jsx("div", { className: `w-4 h-4 rounded-full border-2 transition-all ${idx < pin.length
                                ? 'bg-[#29c184] border-[#29c184] scale-110'
                                : 'border-[#354454] bg-transparent'}` }, idx))) })] }), _jsxs("div", { className: "w-full max-w-xs grid grid-cols-3 gap-3 pb-6", children: [['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (_jsx("button", { onClick: () => handleDigit(digit), className: "w-16 h-16 mx-auto rounded-full bg-[#213040] border border-[#354454]/60 text-xl font-bold text-white hover:bg-[#293a4d] active:scale-90 transition-all cursor-pointer shadow-md flex items-center justify-center", children: digit }, digit))), _jsx("div", {}), _jsx("button", { onClick: () => handleDigit('0'), className: "w-16 h-16 mx-auto rounded-full bg-[#213040] border border-[#354454]/60 text-xl font-bold text-white hover:bg-[#293a4d] active:scale-90 transition-all cursor-pointer shadow-md flex items-center justify-center", children: "0" }), _jsx("button", { onClick: handleDelete, className: "w-16 h-16 mx-auto rounded-full bg-[#213040]/50 text-white hover:bg-[#213040] active:scale-90 transition-all cursor-pointer flex items-center justify-center", children: _jsx(Delete, { className: "w-6 h-6" }) })] })] }));
};
