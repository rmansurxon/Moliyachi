import React, { useState } from 'react';
import { triggerHaptic } from '../api';
import { Lock, Delete } from 'lucide-react';

interface LockScreenProps {
  correctPin: string;
  onUnlock: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ correctPin, onUnlock }) => {
  const [pin, setPin] = useState('');
  const [errorShake, setErrorShake] = useState(false);

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return;
    triggerHaptic('light');

    const newPin = pin + d;
    setPin(newPin);

    if (newPin.length === 4) {
      if (newPin === correctPin) {
        triggerHaptic('success');
        onUnlock();
      } else {
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

  return (
    <div className="fixed inset-0 z-50 bg-[#19232e] flex flex-col items-center justify-between p-6 safe-area-top safe-area-bottom">
      <div className="flex-1 flex flex-col items-center justify-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#213040] border border-[#354454] flex items-center justify-center text-[#29c184] shadow-xl">
          <Lock className="w-8 h-8" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-black text-white">Hisobchi AI</h2>
          <p className="text-xs text-[#899098]">Ilovaga kirish uchun PIN kodni kiriting</p>
        </div>

        {/* 4 Pin Dots */}
        <div className={`flex gap-4 py-2 ${errorShake ? 'animate-bounce text-red-500' : ''}`}>
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                idx < pin.length
                  ? 'bg-[#29c184] border-[#29c184] scale-110'
                  : 'border-[#354454] bg-transparent'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Numeric Keypad */}
      <div className="w-full max-w-xs grid grid-cols-3 gap-3 pb-6">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleDigit(digit)}
            className="w-16 h-16 mx-auto rounded-full bg-[#213040] border border-[#354454]/60 text-xl font-bold text-white hover:bg-[#293a4d] active:scale-90 transition-all cursor-pointer shadow-md flex items-center justify-center"
          >
            {digit}
          </button>
        ))}

        <div></div>
        <button
          onClick={() => handleDigit('0')}
          className="w-16 h-16 mx-auto rounded-full bg-[#213040] border border-[#354454]/60 text-xl font-bold text-white hover:bg-[#293a4d] active:scale-90 transition-all cursor-pointer shadow-md flex items-center justify-center"
        >
          0
        </button>
        <button
          onClick={handleDelete}
          className="w-16 h-16 mx-auto rounded-full bg-[#213040]/50 text-white hover:bg-[#213040] active:scale-90 transition-all cursor-pointer flex items-center justify-center"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};
