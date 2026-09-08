import React, { useState, useEffect } from 'react';
import { api, triggerHaptic } from '../api';
import { X, ChevronRight, ChevronLeft, Sparkles, Award, TrendingUp, Share2 } from 'lucide-react';
import confetti from 'canvas-confetti';

interface OyYakuniViewProps {
  onClose: () => void;
}

export const OyYakuniView: React.FC<OyYakuniViewProps> = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [wrapData, setWrapData] = useState<any | null>(null);

  useEffect(() => {
    loadWrap();
    confetti({ particleCount: 50, spread: 80, origin: { y: 0.5 } });
  }, []);

  const loadWrap = async () => {
    try {
      const res = await api.getMonthlyWrap();
      setWrapData(res.wrap);
    } catch (err) {
      console.error(err);
    }
  };

  const totalSlides = 4;

  const handleNext = () => {
    triggerHaptic('light');
    if (currentSlide < totalSlides - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      confetti({ particleCount: 70, spread: 100, origin: { y: 0.6 } });
      onClose();
    }
  };

  const handlePrev = () => {
    triggerHaptic('light');
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  if (!wrapData) {
    return (
      <div className="fixed inset-0 z-50 bg-[#19232e] flex items-center justify-center text-white">
        Yuklanmoqda...
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#121820] flex flex-col justify-between p-4 safe-area-top safe-area-bottom">
      {/* Top progress indicators */}
      <div className="space-y-3">
        <div className="flex gap-1.5 pt-2">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <div
              key={idx}
              className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                idx <= currentSlide ? 'bg-[#29c184]' : 'bg-white/20'
              }`}
            />
          ))}
        </div>

        {/* Close Button */}
        <div className="flex justify-end">
          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 py-8">
        {currentSlide === 0 && (
          <div className="space-y-6 animate-fade-in">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-[#12A99D] via-[#29c184] to-[#9DFC38] flex items-center justify-center shadow-2xl shadow-[#29c184]/40">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-black tracking-widest text-[#29c184] uppercase">
                {wrapData.monthName}
              </span>
              <h1 className="text-3xl font-black text-white leading-tight">
                Moliyaviy Oylik Yakuningiz Tayyor!
              </h1>
              <p className="text-sm text-[#b6bfd0] max-w-xs mx-auto">
                Ushbu oyda sarflagan pullaringiz, erishgan yutuqlaringiz va moliyaviy natijalaringiz haqida qisqacha hisobot.
              </p>
            </div>
          </div>
        )}

        {currentSlide === 1 && (
          <div className="space-y-6 animate-fade-in">
            <span className="text-xs font-black tracking-widest text-[#29c184] uppercase">
              Balans va Harakatlar
            </span>
            <div className="space-y-4">
              <div className="p-5 rounded-3xl bg-[#213040] border border-[#354454] space-y-1">
                <p className="text-xs text-[#899098]">Oylik Jami Daromad</p>
                <h3 className="text-2xl font-black text-[#29c184]">
                  +{wrapData.totalIncome.toLocaleString('uz-UZ')} so'm
                </h3>
              </div>

              <div className="p-5 rounded-3xl bg-[#213040] border border-[#354454] space-y-1">
                <p className="text-xs text-[#899098]">Oylik Jami Xarajat</p>
                <h3 className="text-2xl font-black text-[#f0646e]">
                  -{wrapData.totalExpense.toLocaleString('uz-UZ')} so'm
                </h3>
              </div>
            </div>
          </div>
        )}

        {currentSlide === 2 && (
          <div className="space-y-6 animate-fade-in">
            <span className="text-xs font-black tracking-widest text-[#29c184] uppercase">
              Asosiy Xarajat Toifasi
            </span>
            <div className="w-24 h-24 mx-auto rounded-3xl bg-[#ff8d28]/20 border border-[#ff8d28] flex items-center justify-center text-4xl shadow-xl">
              🛒
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-white">
                "{wrapData.topCategory.name}"
              </h2>
              <p className="text-sm text-[#b6bfd0] max-w-xs mx-auto">
                Sizning eng ko'p mablag'ingiz ushbu toifaga sarflandi (
                <span className="text-white font-bold">
                  {wrapData.topCategory.amount.toLocaleString('uz-UZ')} so'm
                </span>
                ).
              </p>
            </div>
          </div>
        )}

        {currentSlide === 3 && (
          <div className="space-y-6 animate-fade-in">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-[#f2c14e] to-[#d99e1f] flex items-center justify-center text-white shadow-2xl">
              <Award className="w-12 h-12 text-black" />
            </div>
            <div className="space-y-2">
              <span className="text-xs font-black tracking-widest text-[#f2c14e] uppercase">
                {wrapData.achievementBadge}
              </span>
              <h2 className="text-4xl font-black text-white">
                {wrapData.financialScore} / 100
              </h2>
              <p className="text-sm text-[#b6bfd0] max-w-xs mx-auto">
                Siz daromadlaringizning {wrapData.savingsRate}% qismini tejamkorlik bilan saqlab qoldingiz!
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-4">
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0}
          className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white disabled:opacity-30 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <button
          onClick={handleNext}
          className="flex-1 py-3.5 rounded-2xl bg-[#29c184] hover:bg-[#25ab75] active:scale-98 text-white font-black text-sm shadow-lg shadow-[#29c184]/40 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>{currentSlide === totalSlides - 1 ? 'Tamomlash' : 'Keyingisi'}</span>
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </button>
      </div>
    </div>
  );
};
