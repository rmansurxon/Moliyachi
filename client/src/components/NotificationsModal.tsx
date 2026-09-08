import React from 'react';
import { X, Bell, Calendar, Sparkles, CheckCircle2 } from 'lucide-react';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: '1',
      title: 'Xarajatlar nazorati',
      desc: 'Bugungi kun xarajatlarini kiritishni unutmang. Seriyangiz davom etmoqda! 🔥',
      time: '15 daqiqa oldin',
      icon: '🔥',
      color: '#ff8d28'
    },
    {
      id: '2',
      title: 'Qarz eslatmasi',
      desc: 'Anvar akaga berilgan qarzning qaytarish muddati yaqinlashmoqda (25-sentabr).',
      time: 'Bugun, 09:30',
      icon: '🤝',
      color: '#1570ef'
    },
    {
      id: '3',
      title: 'Yangi yutuq ochildi!',
      desc: '"Birinchi Qadam" nishoniga sazovor bo\'ldingiz va +50 XP qo\'lga kiritdingiz.',
      time: 'Kecha',
      icon: '🌟',
      color: '#29c184'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-[#19232e] light:bg-white rounded-3xl border border-[#354454] light:border-[#eaecf0] p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[#354454]/40 light:border-[#eaecf0] pb-3">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#29c184]" />
            <h3 className="font-bold text-base text-white light:text-[#1d2939]">Xabarnomalar</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#213040] light:bg-[#eaecf0] flex items-center justify-center text-[#899098] hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="p-3 rounded-2xl bg-[#213040] light:bg-[#f7f9fa] border border-[#354454]/50 light:border-[#eaecf0] flex items-start gap-3"
            >
              <div className="text-xl p-1 bg-white/5 rounded-xl">{n.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white light:text-[#1d2939]">{n.title}</h4>
                  <span className="text-[10px] text-[#899098]">{n.time}</span>
                </div>
                <p className="text-[11px] text-[#b6bfd0] light:text-[#475467] mt-0.5 leading-snug">
                  {n.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
