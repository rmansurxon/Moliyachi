import React from 'react';
import { User } from '../types';
import { triggerHaptic } from '../api';
import { Settings } from 'lucide-react';

interface HeaderProps {
  user: User;
  onOpenNotifications?: () => void;
  onOpenGamification?: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onOpenSettings
}) => {
  return (
    <header className="w-full bg-[#18222d] border-b border-[#222e3b] px-4 md:px-8 py-3.5 flex items-center justify-between select-none">
      {/* Left: User Avatar + Name */}
      <div
        className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
        onClick={onOpenSettings}
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#12A99D] to-[#29c184] flex items-center justify-center font-bold text-xs text-white shadow-sm">
          {user.first_name ? user.first_name.charAt(0).toUpperCase() : 'M'}
        </div>
        <div>
          <span className="font-bold text-sm text-white tracking-tight block leading-tight">
            {user.first_name || 'Mansurxon'}
          </span>
          <span className="text-[10px] text-[#29c184] font-medium">Shaxsiy moliyachi</span>
        </div>
      </div>

      {/* Right: Settings Quick Icon */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => {
            triggerHaptic('light');
            onOpenSettings();
          }}
          className="w-9 h-9 rounded-xl bg-[#1c2733] border border-[#263445] flex items-center justify-center text-[#94a3b8] hover:text-white hover:border-[#29c184]/50 transition-colors cursor-pointer"
          title="Sozlamalar"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
