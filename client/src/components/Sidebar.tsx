import React from 'react';
import { TabType } from './BottomNav';
import { triggerHaptic } from '../api';
import {
  Home,
  Clock,
  Sparkles,
  HandCoins,
  CreditCard,
  Settings,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  currentTab: TabType;
  onChangeTab: (tab: TabType) => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onChangeTab, className = '' }) => {
  const menuItems = [
    { id: 'home', label: 'Asosiy', icon: Home },
    { id: 'chat', label: 'AI Yordamchi', icon: Sparkles },
    { id: 'stats', label: 'Statistika', icon: Clock },
    { id: 'debts', label: 'Qarzlar', icon: HandCoins },
    { id: 'balances', label: 'Hamyonlar', icon: CreditCard },
    { id: 'settings', label: 'Sozlamalar', icon: Settings }
  ];

  return (
    <aside className={`w-56 shrink-0 bg-[#18222d] border-r border-[#222e3b] flex flex-col justify-between py-6 px-3 min-h-screen select-none ${className}`}>
      {/* Top Menu list */}
      <div className="space-y-2">
        {menuItems.map((item) => {
          const IconComp = item.icon;
          const isActive = currentTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => {
                triggerHaptic('light');
                onChangeTab(item.id as TabType);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#1d3532] text-[#29c184] shadow-sm'
                  : 'text-[#94a3b8] hover:text-white hover:bg-white/5'
              }`}
            >
              <IconComp className={`w-5 h-5 ${isActive ? 'text-[#29c184] stroke-[2.5]' : 'stroke-[1.8]'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bottom Branding */}
      <div className="pt-6 border-t border-[#222e3b]">
        <div className="flex items-center gap-2.5 px-3 py-2 cursor-pointer" onClick={() => onChangeTab('home')}>
          <div className="w-8 h-8 rounded-full bg-[#12A99D]/20 border border-[#29c184]/40 flex items-center justify-center text-[#29c184] shadow-sm">
            <Sparkles className="w-4 h-4 fill-[#29c184]" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white leading-none">Hisobchi AI</h4>
            <p className="text-[10px] text-[#29c184] mt-0.5 font-medium">v2.4 Pro</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
