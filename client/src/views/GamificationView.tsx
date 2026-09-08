import React, { useState } from 'react';
import { User, Voucher } from '../types';
import { triggerHaptic } from '../api';
import { Flame, Award, Gift, Copy, Check, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GamificationViewProps {
  user: User;
  vouchers: Voucher[];
}

export const GamificationView: React.FC<GamificationViewProps> = ({ user, vouchers }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopyCode = (code: string) => {
    triggerHaptic('success');
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    confetti({ particleCount: 20, spread: 50 });
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const ranks = [
    { id: 'bronze', name: 'Bronza', xp: 0, color: '#d79a63' },
    { id: 'silver', name: 'Kumush', xp: 200, color: '#c3ccd8' },
    { id: 'gold', name: 'Oltin', xp: 500, color: '#f2c14e' },
    { id: 'diamond', name: 'Olmos', xp: 1000, color: '#2fa8cc' }
  ];

  const currentXp = user.xp || 150;
  const nextRank = ranks.find((r) => r.xp > currentXp) || ranks[ranks.length - 1];
  const progressToNext = Math.min(100, Math.round((currentXp / nextRank.xp) * 100));

  const badges = [
    { title: 'Birinchi Qadam', desc: 'Ilk xarajatni qayd etish', icon: '🌟', unlocked: true },
    { title: '5 Kunlik Seriya', desc: '5 kun davomida kiritish', icon: '🔥', unlocked: user.streak >= 5 },
    { title: 'Maqsad sari', desc: 'Birinchi jamg\'arma maqsadi', icon: '🎯', unlocked: true },
    { title: 'Tejamkor Usta', desc: 'Oylik 20% tejash', icon: '💎', unlocked: false }
  ];

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-white light:text-[#1d2939]">Moliyaviy Yutuqlar</h2>
          <p className="text-xs text-[#899098]">Intizom, ballar (XP) va sovg'alar</p>
        </div>
        <div className="p-2 rounded-2xl bg-[#ff8d28]/15 text-[#ff8d28]">
          <Flame className="w-5 h-5 fill-[#ff8d28]" />
        </div>
      </div>

      {/* Streak Hero Card */}
      <div className="p-5 rounded-3xl bg-gradient-to-tr from-[#ff8d28]/25 via-[#ff8d28]/10 to-transparent border border-[#ff8d28]/40 flex items-center justify-between shadow-xl">
        <div>
          <div className="flex items-center gap-1 text-xs font-black text-[#ff8d28] uppercase tracking-wider">
            <Flame className="w-4 h-4 fill-[#ff8d28]" />
            <span>Kundalik Seriya</span>
          </div>
          <h1 className="text-3xl font-black text-white mt-1">
            {user.streak || 1} Kun Ketma-ket!
          </h1>
          <p className="text-xs text-[#b6bfd0] mt-0.5">
            Har kuni xarajat kiritib seriyani boy bermang.
          </p>
        </div>

        <div className="w-16 h-16 rounded-3xl bg-[#ff8d28] flex items-center justify-center text-3xl shadow-lg shadow-[#ff8d28]/30 animate-bounce">
          🔥
        </div>
      </div>

      {/* Rank Progress Card */}
      <div className="p-5 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#f2c14e]" />
            <h3 className="text-sm font-bold text-white light:text-[#1d2939]">
              Daraja: <span className="capitalize text-[#29c184]">{user.rank}</span>
            </h3>
          </div>
          <span className="text-xs font-black text-[#29c184]">{currentXp} XP</span>
        </div>

        {/* XP progress */}
        <div className="space-y-1">
          <div className="w-full h-2.5 rounded-full bg-[#151d27] light:bg-[#eaecf0] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#29c184] to-[#9DFC38] transition-all"
              style={{ width: `${progressToNext}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-[11px] text-[#899098]">
            <span>{currentXp} XP</span>
            <span>Keyingi daraja: {nextRank.name} ({nextRank.xp} XP)</span>
          </div>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-2">
        <h3 className="text-sm font-bold text-white light:text-[#1d2939]">Yutuq Nishonlari</h3>
        <div className="grid grid-cols-2 gap-2.5">
          {badges.map((b, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-2xl border flex items-center gap-2.5 ${
                b.unlocked
                  ? 'bg-[#213040] light:bg-white border-[#29c184]/40 shadow-sm'
                  : 'bg-[#151d27]/40 border-[#354454]/30 opacity-50'
              }`}
            >
              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-xl shrink-0">
                {b.icon}
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-white light:text-[#1d2939] truncate">
                  {b.title}
                </h4>
                <p className="text-[10px] text-[#899098] truncate">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Vouchers & Promocodes */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-sm font-bold text-white light:text-[#1d2939]">
          <Gift className="w-4 h-4 text-[#ff8d28]" />
          <span>Sizning Vaucherlaringiz ({vouchers.length})</span>
        </div>

        <div className="space-y-2">
          {vouchers.map((v) => (
            <div
              key={v.id}
              className="p-3.5 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] flex items-center justify-between shadow-sm"
            >
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-white light:text-[#1d2939]">{v.title}</h4>
                <p className="text-[11px] text-[#899098]">{v.description}</p>
                <div className="flex items-center gap-2 pt-1">
                  <span className="font-mono text-xs font-black text-[#29c184] px-2 py-0.5 bg-[#29c184]/15 rounded-md border border-[#29c184]/30">
                    {v.code}
                  </span>
                  <span className="text-[10px] text-[#899098]">Muddati: {v.expires_at}</span>
                </div>
              </div>

              <button
                onClick={() => handleCopyCode(v.code)}
                className="p-2.5 rounded-xl bg-[#151d27] light:bg-[#f2f4f7] text-[#29c184] hover:bg-[#29c184] hover:text-white transition-all cursor-pointer shrink-0"
                title="Promokoddan nusxa olish"
              >
                {copiedCode === v.code ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
