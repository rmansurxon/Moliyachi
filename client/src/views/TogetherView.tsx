import React, { useState } from 'react';
import { triggerHaptic } from '../api';
import { Users, UserPlus, Share2, Sparkles, Check, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export const TogetherView: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const inviteCode = 'HISOBCHI-BIRGA-9428';

  const handleShareInvite = () => {
    triggerHaptic('success');
    confetti({ particleCount: 30, spread: 60 });
    const shareText = `Hisobchi AI orqali birgalikda oilaviy yoki do'stlar bilan byudjet yuritaylik! Taklif kodi: ${inviteCode}`;
    const tgUrl = `https://t.me/share/url?url=&text=${encodeURIComponent(shareText)}`;
    window.open(tgUrl, '_blank');
  };

  const handleCopy = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white light:text-[#1d2939]">Birga (Oilaviy hisob)</h2>
          <p className="text-xs text-[#899098]">Do'stlar va oila bilan umumiy xarajatlar</p>
        </div>
        <div className="p-2 rounded-2xl bg-[#7a5af8]/15 text-[#7a5af8]">
          <Users className="w-5 h-5" />
        </div>
      </div>

      {/* Hero card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-[#7a5af8]/20 via-[#213040] to-[#151d27] border border-[#7a5af8]/40 shadow-xl space-y-4">
        <div className="w-14 h-14 rounded-3xl bg-[#7a5af8] flex items-center justify-center text-white shadow-lg shadow-[#7a5af8]/40">
          <Users className="w-7 h-7" />
        </div>

        <div>
          <h3 className="text-lg font-black text-white light:text-[#1d2939]">
            Umumiy Xarajatlarni Oson Boshqaring
          </h3>
          <p className="text-xs text-[#b6bfd0] mt-1 leading-relaxed">
            Oilangiz a'zolarini yoki do'stlaringizni taklif qiling. Har kim o'zi qilgan xarajatni kiritsa, hisobotlar barchaga ko'rinadi va Telegram guruhida avtomatik bo'lib beriladi.
          </p>
        </div>

        {/* Invite Code box */}
        <div className="p-3.5 rounded-2xl bg-[#151d27] border border-[#354454] flex items-center justify-between">
          <div>
            <p className="text-[10px] text-[#899098] uppercase font-bold">Sizning Taklif Kodingiz</p>
            <p className="font-mono text-sm font-black text-[#29c184] mt-0.5">{inviteCode}</p>
          </div>

          <button
            onClick={handleCopy}
            className="px-3 py-1.5 rounded-xl bg-[#213040] text-xs font-bold text-white hover:border-[#29c184] border border-[#354454] cursor-pointer"
          >
            {copied ? 'Nusxalandi!' : 'Nusxa olish'}
          </button>
        </div>

        {/* Telegram share button */}
        <button
          onClick={handleShareInvite}
          className="w-full py-3.5 rounded-2xl bg-[#7a5af8] hover:bg-[#6845e6] active:scale-98 text-white font-extrabold text-sm shadow-lg shadow-[#7a5af8]/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          <span>Telegram orqali taklif qilish</span>
        </button>
      </div>

      {/* Telegram Group Feature preview */}
      <div className="p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] space-y-2">
        <h4 className="text-xs font-bold text-white light:text-[#1d2939] uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#29c184]" />
          <span>Telegram Guruhlarga Botni Qo'shish</span>
        </h4>
        <p className="text-xs text-[#b6bfd0] light:text-[#475467] leading-relaxed">
          Hisobchi AI botini do'stlaringiz bilan bo'lgan Telegram guruhiga qo'shing. Guruhda kiritilgan har bir xarajat ("Choyxona 450 000 5 kishiga") avtomatik har bir ishtirokchiga taqsimlanadi!
        </p>
      </div>
    </div>
  );
};
