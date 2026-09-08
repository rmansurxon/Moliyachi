import React, { useState, useRef, useEffect } from 'react';
import { api, triggerHaptic } from '../api';
import { Sparkles, Send, Mic, MicOff, CheckCircle2, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  time: string;
  transaction?: any;
}

interface ChatViewProps {
  onTransactionCreated?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({ onTransactionCreated }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: "Assalomu alaykum! Men Hisobchi AI moliyaviy yordamchingizman. 🤖\n\nMenga xarajat yoki daromadlaringizni yozing yoki mikrofonga gapiring (masalan: *\"Tushlikka 45 000 so'm\"* yoki *\"5 000 000 oylik tushdi\"*).",
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Initialize real Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'uz-UZ'; // Uzbek speech recognition

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Recognized speech:', transcript);
        setInput(transcript);
        setIsListening(false);
        // Automatically send transcribed voice text
        handleSend(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Mikrofon ruxsati berilmadi. Iltimos, brauzerda mikrofonni yoqing.');
        } else if (event.error === 'no-speech') {
          setSpeechError('Ovoz eshitilmadi. Qaytadan urinib ko\'ring.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleToggleMic = () => {
    triggerHaptic('medium');
    setSpeechError(null);

    if (!recognitionRef.current) {
      // Fallback if browser doesn't have webkitSpeechRecognition
      setSpeechError("Brauzeringizda ovoz tanish (SpeechRecognition) qo'llab-quvvatlanmaydi.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const quickPrompts = [
    "Tushlikka 45 000 so'm",
    "Yandex taksi 18 000",
    "Korzinkadan 180 000 xarid",
    "5 000 000 oylik tushdi",
    "Balansim qancha?",
    "Bu oy eng ko'p nimaga ketdi?"
  ];

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || loading) return;

    triggerHaptic('light');

    const userMsg: Message = {
      id: String(Date.now()),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendAIChat(text);

      if (res.transaction) {
        triggerHaptic('success');
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
        onTransactionCreated?.();
      }

      const aiMsg: Message = {
        id: String(Date.now() + 1),
        sender: 'ai',
        text: res.reply || "Xabaringiz qabul qilindi!",
        time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
        transaction: res.transaction
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: "Kechirasiz, tizimda vaqtinchalik xatolik yuz berdi. Qaytadan urinib ko'ring.",
          time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto pb-4 px-4">
      {/* Header status */}
      <div className="flex items-center justify-between py-2 border-b border-[#263445] mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#12A99D] to-[#29c184] flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#29c184] border-2 border-[#18222d] rounded-full"></span>
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">Hisobchi AI Assistant</h3>
            <p className="text-[10px] text-[#29c184] font-medium">Onlayn • O'zbek tili tahlilchisi</p>
          </div>
        </div>

        <div className="text-[10px] px-2 py-0.5 rounded-full bg-[#29c184]/15 text-[#29c184] font-bold">
          AI v2.4 Live
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} chat-msg-in`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  isUser
                    ? 'bg-[#29c184] text-white rounded-br-xs font-medium'
                    : 'bg-[#1c2733] text-white border border-[#263445] rounded-bl-xs'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

                {m.transaction && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-[#29c184]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Hamyon balansi yangilandi (+15 XP)</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#899098] mt-1 px-1">{m.time}</span>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#1c2733] max-w-[70px] border border-[#263445]">
            <span className="w-2 h-2 rounded-full bg-[#29c184] animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-[#29c184] animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 rounded-full bg-[#29c184] animate-bounce [animation-delay:0.4s]"></span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Speech Error Banner */}
      {speechError && (
        <div className="p-2 mb-2 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center gap-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{speechError}</span>
        </div>
      )}

      {/* Quick prompt suggestions */}
      <div className="py-2">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
          {quickPrompts.map((p) => (
            <button
              key={p}
              onClick={() => handleSend(p)}
              className="px-3 py-1.5 rounded-full bg-[#1c2733] border border-[#263445] text-xs font-medium text-[#b6bfd0] hover:border-[#29c184] hover:text-[#29c184] shrink-0 transition-colors cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input container with Real Speech Recognition & Send */}
      <div className="relative pt-1">
        {isListening ? (
          <div className="flex items-center justify-between px-4 py-3 rounded-2xl bg-[#29c184]/20 border border-[#29c184] animate-pulse">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#29c184] animate-ping"></span>
              <span className="text-xs font-bold text-[#29c184]">
                Mikrofon eshitmoqda... Gapiring!
              </span>
            </div>
            <button
              onClick={handleToggleMic}
              className="px-3 py-1 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer"
            >
              To'xtatish
            </button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Masalan: Tushlik 45000 so'm..."
              className="flex-1 px-4 py-3 rounded-2xl bg-[#1c2733] border border-[#263445] text-sm text-white focus:outline-none focus:border-[#29c184] shadow-inner"
            />

            {/* Real Mic button */}
            <button
              type="button"
              onClick={handleToggleMic}
              className="w-11 h-11 rounded-2xl bg-[#1c2733] border border-[#263445] flex items-center justify-center text-[#29c184] hover:bg-[#29c184] hover:text-white transition-all cursor-pointer shrink-0"
              title="Ovoz bilan kiritish (Mikrofon)"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Send button */}
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="w-11 h-11 rounded-2xl bg-[#29c184] hover:bg-[#25ab75] active:scale-95 disabled:opacity-40 disabled:scale-100 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-lg shadow-[#29c184]/30"
              title="Yuborish"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
