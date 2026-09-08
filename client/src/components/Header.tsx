import React from 'react';
import { User } from '../types';
import { triggerHaptic } from '../api';
import { Bell, Flame, Search } from 'lucide-react';

interface HeaderProps {
  user: User;
  onOpenNotifications: () => void;
  onOpenGamification: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenNotifications,
  onOpenGamification,
  onOpenSettings
}) => {
  return (
    <header className="w-full bg-[#18222d] border-b border-[#222e3b] px-4 md:px-8 py-3.5 flex items-center justify-between select-none">
      {/* Left: User Avatar + Name */}
      <div
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={onOpenSettings}
      >
        <div className="w-8 h-8 rounded-full bg-[#334155] border border-[#475569] flex items-center justify-center font-bold text-xs text-white shadow-sm">
          {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'M'}
        </div>
        <span className="font-bold text-sm text-white tracking-tight">
          {user.first_name || 'Mansurxon'}
        </span>
      </div>

      {/* Right: Streak & Diamonds pill, Bell, Search */}
      <div className="flex items-center gap-3">
        {/* Streak & Diamonds Badge */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenGamification();
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#151f28] border border-[#2b3a4a] text-xs font-bold shadow-inner cursor-pointer hover:border-[#29c184]/50 transition-colors"
          title="Seriya va Olmoslar"
        >
          <div className="flex items-center gap-1 text-[#ff8d28]">
            <Flame className="w-3.5 h-3.5 fill-[#ff8d28]" />
            <span>{user.streak || 1}</span>
          </div>

          <div className="flex items-center gap-1 text-[#29c184]">
            <span className="text-xs">💎</span>
            <span>{user.diamonds || 365}</span>
          </div>
        </button>

        {/* Bell Notifications */}
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenNotifications();
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors cursor-pointer relative"
          title="Xabarnomalar"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#f0646e] rounded-full ring-2 ring-[#18222d]"></span>
        </button>

        {/* Search icon */}
        <button
          onClick={() => {
            triggerHaptic('light');
          }}
          className="w-8 h-8 rounded-full flex items-center justify-center text-[#94a3b8] hover:text-white transition-colors cursor-pointer"
          title="Qidirish"
        >
          <Search className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
