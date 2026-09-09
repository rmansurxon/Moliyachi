import React from 'react';
import { triggerHaptic } from '../api';
import {
  CreditCard,
  HandCoins,
  Target,
  Tag,
  FileText,
  BarChart3,
  Users,
  Award,
  Settings,
  ChevronRight
} from 'lucide-react';

interface MoreSectionsViewProps {
  onNavigate: (view: string) => void;
}

export const MoreSectionsView: React.FC<MoreSectionsViewProps> = ({ onNavigate }) => {
  const sections = [
    { id: 'balances', label: 'Hamyonlar va Kartalar', desc: 'Virtual kartalar va monitoring', icon: CreditCard, color: '#1570ef' },
    { id: 'debts', label: 'Qarzlar Daftari', desc: 'Berilgan va olingan qarzlar', icon: HandCoins, color: '#f0646e' },
    { id: 'goals', label: 'Moliyaviy Maqsadlar', desc: 'Jamg\'arma rejalari', icon: Target, color: '#29c184' },
    { id: 'categories', label: 'Kategoriyalar', desc: 'Toifalar va byudjet limitlari', icon: Tag, color: '#ff8d28' },
    { id: 'reports', label: 'Hisobotlar & Eksport', desc: 'Excel (CSV) va audit', icon: FileText, color: '#06b6d4' },
    { id: 'together', label: 'Birga (Oilaviy hisob)', desc: 'Guruhlar va sheriklik byudjeti', icon: Users, color: '#ec4899' },
    { id: 'gamification', label: 'Yutuqlar & Gamifikatsiya', desc: 'Seriya, XP va vaucherlar', icon: Award, color: '#eab308' },
    { id: 'settings', label: 'Sozlamalar', desc: 'Valyuta, til va PIN xavfsizlik', icon: Settings, color: '#899098' }
  ];

  return (
    <div className="space-y-4 max-w-md mx-auto pb-24 px-4 pt-2">
      <div>
        <h2 className="text-xl font-black text-white light:text-[#1d2939]">Barcha Bo'limlar</h2>
        <p className="text-xs text-[#899098]">Hisobchi AI ning to'liq imkoniyatlari</p>
      </div>

      <div className="space-y-2">
        {sections.map((sec) => {
          const IconComp = sec.icon;
          return (
            <div
              key={sec.id}
              onClick={() => {
                triggerHaptic('light');
                onNavigate(sec.id);
              }}
              className="p-3.5 rounded-2xl bg-[#213040] light:bg-white border border-[#354454] light:border-[#eaecf0] shadow-sm flex items-center justify-between cursor-pointer hover:border-[#29c184]/50 active:scale-98 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-sm"
                  style={{ backgroundColor: sec.color }}
                >
                  <IconComp className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white light:text-[#1d2939] group-hover:text-[#29c184] transition-colors">
                      {sec.label}
                    </h4>
                  </div>
                  <p className="text-[11px] text-[#899098] mt-0.5">{sec.desc}</p>
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-[#899098] group-hover:translate-x-1 transition-transform" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
