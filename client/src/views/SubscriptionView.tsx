import React, { useState } from 'react';
import { triggerHaptic } from '../api';
import { Crown, Check, X, Sparkles, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SubscriptionViewProps {
  onClose: () => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onClose }) => {
  const [plan, setPlan] = useState<'yearly' | 'monthly'>('yearly');
  const [activated, setActivated] = useState(false);

  const handleSubscribe = () => {
    triggerHaptic('success');
    confetti({
      particleCount: 80,
      spread: 90,
      origin: { y: 0.6 },
      colors: ['#f2c14e', '#29c184', '#1570ef']
    });
    setActivated(true);
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  const features = [
    "Cheksiz AI ovozli va matnli xarajat kiritish",
    "Do'kon cheklarini cheksiz OCR skanerlash",
    "Oilaviy va do'stlar bilan umumiy byudjet (Birga)",
    "Telegram guruhlarida xarajatlarni taqsimlash",
    "Batafsil Excel (CSV) va PDF eksport",
    "Virtual SMS Karta monitoringi"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
      <div className="w-full max-w-md bg-[#19232e] rounded-3xl border border-[#f2c14e]/40 p-6 shadow-2xl relative overflow-hidden space-y-5">
        {/* Glow decoration */}
        <div className="absolute -top-20 -right-20 w-48 h-48 bg-[#f2c14e]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Close button */}
        <div className="flex justify-between items-center relative z-10">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#f2c14e]/15 border border-[#f2c14e]/30 text-[#f2c14e] text-xs font-black uppercase">
            <Crown className="w-3.5 h-3.5" />
            <span>Hisobchi AI Pro</span>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[#899098] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <div className="text-center space-y-1 relative z-10">
          <h2 className="text-2xl font-black text-white">Moliya Ustasi Bo'ling</h2>
          <p className="text-xs text-[#b6bfd0]">
            Barcha professional AI imkoniyatlarini oching
          </p>
        </div>

        {/* Features List */}
        <div className="space-y-2 relative z-10">
          {features.map((f, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-white/90">
              <div className="w-4 h-4 rounded-full bg-[#29c184]/20 text-[#29c184] flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <span>{f}</span>
            </div>
          ))}
        </div>

        {/* Plan Switcher */}
        <div className="grid grid-cols-2 gap-3 relative z-10">
          <button
            onClick={() => {
              triggerHaptic('light');
              setPlan('yearly');
            }}
            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all relative ${
              plan === 'yearly'
                ? 'bg-[#213040] border-[#f2c14e] ring-2 ring-[#f2c14e]/30'
                : 'bg-[#151d27] border-[#354454]'
            }`}
          >
            <span className="absolute -top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-[#29c184] text-black">
              -35% Tejash
            </span>
            <p className="text-xs font-bold text-white">Yillik Obuna</p>
            <h4 className="text-base font-black text-[#f2c14e] mt-0.5">149 000 so'm</h4>
            <p className="text-[10px] text-[#899098]">Oyiga 12 400 so'm</p>
          </button>

          <button
            onClick={() => {
              triggerHaptic('light');
              setPlan('monthly');
            }}
            className={`p-3.5 rounded-2xl border text-left cursor-pointer transition-all ${
              plan === 'monthly'
                ? 'bg-[#213040] border-[#f2c14e] ring-2 ring-[#f2c14e]/30'
                : 'bg-[#151d27] border-[#354454]'
            }`}
          >
            <p className="text-xs font-bold text-white">Oylik Obuna</p>
            <h4 className="text-base font-black text-[#f2c14e] mt-0.5">19 000 so'm</h4>
            <p className="text-[10px] text-[#899098]">Har oy yangilanadi</p>
          </button>
        </div>

        {/* Action Button */}
        {activated ? (
          <div className="p-3.5 rounded-2xl bg-[#29c184]/20 border border-[#29c184] text-center text-xs font-bold text-[#29c184]">
            🎉 Pro ta'rif muvaffaqiyatli faollashtirildi!
          </div>
        ) : (
          <button
            onClick={handleSubscribe}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#f2c14e] to-[#ff8d28] hover:opacity-90 active:scale-98 text-black font-black text-sm shadow-xl shadow-[#f2c14e]/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Faollashtirish (Sinov muddati)</span>
          </button>
        )}
      </div>
    </div>
  );
};
