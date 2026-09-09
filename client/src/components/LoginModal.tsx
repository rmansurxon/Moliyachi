import React, { useState } from 'react';
import { Shield, Phone, KeyRound, ArrowRight, AlertCircle, Bot } from 'lucide-react';
import { api, triggerHaptic } from '../api';
import { User } from '../types';

interface LoginModalProps {
  onSuccess: (user: User) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('+998 ');
  const [pinCode, setPinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Format phone input nicely as user types: +998 90 123 45 67
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('+998')) {
      val = '+998 ' + val.replace(/[^\d]/g, '');
    }
    setPhoneNumber(val);
    setErrorMessage('');
  };

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^\d]/g, '').slice(0, 4);
    setPinCode(val);
    setErrorMessage('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (pinCode.length !== 4) {
      setErrorMessage("Iltimos, 4 xonali PIN-kodni to'liq kiriting.");
      return;
    }

    setLoading(true);
    triggerHaptic('medium');

    try {
      const res = await api.loginWithPhoneAndPin(phoneNumber, pinCode);
      if (res.success && res.user) {
        triggerHaptic('success');
        onSuccess(res.user);
      } else {
        triggerHaptic('error');
        setErrorMessage(res.error || "Kirishda xatolik yuz berdi.");
      }
    } catch (err: any) {
      triggerHaptic('error');
      setErrorMessage(err?.message || "Server bilan aloqa uzildi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0d141c]/95 backdrop-blur-md">
      <div className="w-full max-w-md bg-[#18222d] border border-[#2b3a4a] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden animate-fadeIn">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#29c184]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#1570ef]/20 rounded-full blur-3xl pointer-events-none" />

        {/* Logo & Header */}
        <div className="text-center relative z-10 space-y-2 mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-[#29c184] to-[#1570ef] p-0.5 shadow-lg flex items-center justify-center">
            <div className="w-full h-full bg-[#18222d] rounded-[14px] flex items-center justify-center">
              <Shield className="w-8 h-8 text-[#29c184]" />
            </div>
          </div>

          <h2 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
            Hisobchi AI <span className="text-xs px-2 py-0.5 rounded-full bg-[#29c184]/20 text-[#29c184] border border-[#29c184]/30 font-bold">Veb</span>
          </h2>
          <p className="text-xs text-[#899098]">
            Shaxsiy moliyaviy kabinetingizga xavfsiz kirish
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-400 text-xs animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="leading-relaxed">{errorMessage}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4 relative z-10">
          {/* Phone input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#899098] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-[#29c184]" />
              <span>Telefon raqami</span>
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="+998 90 123 45 67"
              className="w-full px-4 py-3 rounded-2xl bg-[#121922] border border-[#2b3a4a] text-white font-mono text-sm focus:outline-none focus:border-[#29c184] focus:ring-1 focus:ring-[#29c184] transition-all"
              required
            />
          </div>

          {/* PIN code input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#899098] flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-[#1570ef]" />
                <span>4 xonali PIN-kod</span>
              </label>
              <span className="text-[11px] text-[#29c184] font-medium">Boshlang'ich PIN: 0000</span>
            </div>
            <input
              type="password"
              maxLength={4}
              value={pinCode}
              onChange={handlePinChange}
              placeholder="••••"
              className="w-full px-4 py-3 rounded-2xl bg-[#121922] border border-[#2b3a4a] text-white font-mono text-center tracking-[0.5em] text-lg focus:outline-none focus:border-[#1570ef] focus:ring-1 focus:ring-[#1570ef] transition-all"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#29c184] to-[#1570ef] text-white font-bold text-sm shadow-lg shadow-[#29c184]/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Kabinatga kirish</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Info & Telegram Bot registration guide */}
        <div className="mt-6 pt-5 border-t border-[#2b3a4a]/60 space-y-2.5 text-center relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#121922] border border-[#2b3a4a] text-[11px] text-[#899098]">
            <Bot className="w-3.5 h-3.5 text-[#29c184]" />
            <span>Birinchi marta foydalanyapsizmi?</span>
          </div>

          <p className="text-[11px] text-[#899098] leading-relaxed">
            Avval Telegram botimizda <code className="text-[#29c184] font-mono font-bold">/start</code> bosib, 
            <strong className="text-white"> "📱 Telefon raqamni ulashish"</strong> tugmasi orqali hisobingizni tasdiqlang.
          </p>
        </div>
      </div>
    </div>
  );
};
