import React, { useState } from 'react';
import { User } from '../types';
import { api, triggerHaptic } from '../api';
import { Settings, Globe, DollarSign, Lock, Moon, Sun, Crown, Shield, Smartphone, Check, Phone, LogOut } from 'lucide-react';
import confetti from 'canvas-confetti';

interface SettingsViewProps {
  user: User;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onOpenPaywall: () => void;
  onReloadUser: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  user,
  theme,
  onToggleTheme,
  onOpenPaywall,
  onReloadUser
}) => {
  const [currency, setCurrency] = useState(user.currency || 'UZS');
  const [language, setLanguage] = useState(user.language || 'uz');
  const [pinCode, setPinCode] = useState(user.pin_code || '');
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (newCurrency = currency, newLang = language, newPin = pinCode) => {
    setSaving(true);
    triggerHaptic('success');

    try {
      await api.updateProfile({
        currency: newCurrency as any,
        language: newLang as any,
        pin_code: newPin || undefined
      });

      confetti({ particleCount: 25, spread: 50 });
      setSavedSuccess(true);
      onReloadUser();
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24 px-4 pt-2">
      {/* Title */}
      <div>
        <h2 className="text-xl font-black text-white light:text-[#1d2939]">Sozlamalar</h2>
        <p className="text-xs text-[#899098]">Valyuta, til, xavfsizlik va mavzuni boshqarish</p>
      </div>

      {/* Pro Subscription Banner */}
      <div
        onClick={() => {
          triggerHaptic('medium');
          onOpenPaywall();
        }}
        className="p-4 rounded-3xl bg-gradient-to-r from-[#f2c14e]/20 via-[#ff8d28]/20 to-[#29c184]/20 border border-[#f2c14e]/40 flex items-center justify-between cursor-pointer active:scale-98 transition-transform shadow-lg group"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#f2c14e] to-[#ff8d28] flex items-center justify-center text-black font-black shadow-md">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="text-xs font-black text-white light:text-[#1d2939] uppercase tracking-wider">
                Hisobchi AI Pro
              </h4>
              <span className="px-1.5 py-0.2 rounded text-[8px] bg-[#f2c14e] text-black font-black uppercase">
                Premium
              </span>
            </div>
            <p className="text-[11px] text-[#b6bfd0] mt-0.5">
              Cheksiz AI chat, chek skaneri va oylik tahlil
            </p>
          </div>
        </div>

        <button className="px-3 py-1.5 rounded-xl bg-[#f2c14e] text-black text-xs font-black shadow-sm group-hover:bg-[#e0b040] transition-colors cursor-pointer">
          Ko'rish
        </button>
      </div>

      {/* Currency Setting */}
      <div className="p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] space-y-2">
        <label className="text-xs font-bold text-white light:text-[#1d2939] flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-[#29c184]" />
          <span>Asosiy Valyuta</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { code: 'UZS', label: "UZS (so'm)" },
            { code: 'USD', label: 'USD ($)' },
            { code: 'RUB', label: 'RUB (₽)' }
          ].map((c) => (
            <button
              key={c.code}
              onClick={() => {
                setCurrency(c.code as any);
                handleSave(c.code as any, language, pinCode);
              }}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                currency === c.code
                  ? 'border-[#29c184] bg-[#29c184]/15 text-[#29c184] ring-1 ring-[#29c184]'
                  : 'border-[#354454]/60 text-[#899098] hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Language Setting */}
      <div className="p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] space-y-2">
        <label className="text-xs font-bold text-white light:text-[#1d2939] flex items-center gap-1.5">
          <Globe className="w-4 h-4 text-[#1570ef]" />
          <span>Ilova Tili</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { code: 'uz', label: "O'zbekcha (Lotin)" },
            { code: 'uz_kr', label: 'Ўзбекча (Кирилл)' },
            { code: 'ru', label: 'Русский' },
            { code: 'en', label: 'English' }
          ].map((l) => (
            <button
              key={l.code}
              onClick={() => {
                setLanguage(l.code as any);
                handleSave(currency, l.code as any, pinCode);
              }}
              className={`p-2.5 rounded-2xl border text-xs font-bold transition-all cursor-pointer ${
                language === l.code
                  ? 'border-[#1570ef] bg-[#1570ef]/15 text-[#1570ef] ring-1 ring-[#1570ef]'
                  : 'border-[#354454]/60 text-[#899098] hover:text-white'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Theme Setting */}
      <div className="p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] flex items-center justify-between">
        <div className="flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
          <div>
            <h4 className="text-xs font-bold text-white light:text-[#1d2939]">Tungi Mavzu (Dark Mode)</h4>
            <p className="text-[11px] text-[#899098]">Ko'zlarni toliqtirmaydigan qorong'u rejim</p>
          </div>
        </div>

        <button
          onClick={onToggleTheme}
          className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
            theme === 'dark' ? 'bg-[#29c184]' : 'bg-[#d0d5dd]'
          }`}
        >
          <span
            className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
              theme === 'dark' ? 'left-6.5' : 'left-0.5'
            }`}
          />
        </button>
      </div>

      {/* Bog'langan telefon raqam */}
      <div className="p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#29c184]/15 flex items-center justify-center text-[#29c184]">
            <Phone className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white light:text-[#1d2939]">Bog'langan telefon raqam</h4>
            <p className="text-xs font-mono font-bold text-[#29c184]">
              {user.phone || "Telegram orqali tasdiqlanmagan"}
            </p>
          </div>
        </div>
        {user.phone ? (
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-[#29c184]/20 text-[#29c184] border border-[#29c184]/30 flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>Faol</span>
          </span>
        ) : (
          <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
            Botda /start
          </span>
        )}
      </div>

      {/* Security PIN Code Lock */}
      <div className="p-4 rounded-3xl bg-[#213040] light:bg-white border border-[#354454] space-y-2">
        <label className="text-xs font-bold text-white light:text-[#1d2939] flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-[#f0646e]" />
          <span>4 xonali PIN Kod (Veb-kirish)</span>
        </label>
        <p className="text-[11px] text-[#899098]">
          Brauzerdan (Chrome) kirish uchun 4 xonali PIN-kod (Boshlang'ich: 0000).
        </p>
        <div className="flex gap-2">
          <input
            type="password"
            maxLength={4}
            value={pinCode}
            onChange={(e) => setPinCode(e.target.value)}
            placeholder="Masalan: 1234"
            className="flex-1 px-3.5 py-2 rounded-xl bg-[#151d27] border border-[#354454] text-white text-sm font-mono text-center tracking-widest focus:border-[#29c184]"
          />
          <button
            onClick={() => handleSave(currency, language, pinCode)}
            className="px-4 py-2 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer"
          >
            {saving ? '...' : 'O\'rnatish'}
          </button>
        </div>
      </div>

      {/* Telegram Bot Integration info */}
      <div className="p-4 rounded-3xl bg-[#151d27] border border-[#354454]/60 space-y-2 text-xs text-[#899098]">
        <div className="flex items-center gap-2 text-white font-bold">
          <Smartphone className="w-4 h-4 text-[#29c184]" />
          <span>Telegram Mini App Integratsiyasi</span>
        </div>
        <p className="text-[11px]">
          Telegram ichida Mini App ochilganda hech qanday parol kiritish shart emas. Har bir Telegram hisob faqat o'ziga tegishli ma'lumotlarni ko'radi.
        </p>
      </div>

      {/* Logout button */}
      <button
        onClick={() => {
          if (window.confirm("Haqiqatan ham ushbu qurilmadan chiqmoqchimisiz?")) {
            api.logoutUser();
            window.location.reload();
          }
        }}
        className="w-full py-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/25 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2"
      >
        <LogOut className="w-4 h-4" />
        <span>Hisobdan chiqish (Logout)</span>
      </button>
    </div>
  );
};
