import React, { useState, useRef, useEffect } from 'react';
import { api, triggerHaptic } from '../api';
import { Sparkles, Send, CheckCircle2, AlertCircle, Camera, Loader2 } from 'lucide-react';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanningReceipt, setScanningReceipt] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load persistent continuous chat history
  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        const res = await api.getChatHistory();
        if (isMounted && res.success && Array.isArray(res.messages) && res.messages.length > 0) {
          const loaded = res.messages.map((m: any) => ({
            id: m.id || String(Math.random()),
            sender: m.sender,
            text: m.text,
            time: m.created_at
              ? new Date(m.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
              : '',
            transaction: m.transaction_data ? (typeof m.transaction_data === 'string' ? JSON.parse(m.transaction_data) : m.transaction_data) : undefined
          }));
          setMessages(loaded);
        } else if (isMounted) {
          // Default initial friendly greeting
          setMessages([
            {
              id: '1',
              sender: 'ai',
              text: "Assalomu alaykum! Men sizning shaxsiy moliyaviy yordamchingizman. 🤖\n\nMenga erkin yozishingiz mumkin:\n• *\"Tushlik 45000\"* (xarajat)\n• *\"Oylik 5 000 000\"* (daromad)\n• *\"Aliga 100 ming qarz berdim\"* (qarz)\n• *\"Balansim qancha?\"* (hisobot)\n• Yoki pastdagi kamera tugmasi orqali chek rasmini yuklang!",
              time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } catch {
        if (isMounted) {
          setMessages([
            {
              id: '1',
              sender: 'ai',
              text: "Assalomu alaykum! Moliyaviy xarajat yoki daromadingizni yozing, darhol hisoblab boraman.",
              time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
            }
          ]);
        }
      } finally {
        if (isMounted) setHistoryLoaded(true);
      }
    }

    loadHistory();
    return () => { isMounted = false; };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const quickPrompts = [
    "Tushlikka 45 000 so'm",
    "Yandex taksi 18 000",
    "Korzinkadan 180 000 xarid",
    "5 000 000 oylik tushdi",
    "Balansim qancha?",
    "Bu oy eng ko'p nimaga ketdi?"
  ];

  const handleReceiptUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setScanningReceipt(true);
    triggerHaptic('medium');

    const tempId = String(Date.now());
    const uploadingMsg: Message = {
      id: tempId,
      sender: 'user',
      text: `📷 Chek yuklandi: ${file.name}`,
      time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, uploadingMsg]);

    try {
      const res = await api.scanReceipt(file);
      const receiptData = res.receipt || res.transaction || res.extracted;

      if (res.success && receiptData) {
        const merchant = receiptData.merchant || receiptData.description || "Do'kon xaridi";
        const amount = Number(receiptData.total || receiptData.amount || 0);
        const category = receiptData.category || receiptData.category_name || "Oziq-ovqat";

        let createdTx = res.transaction;
        if (!createdTx && amount > 0) {
          try {
            const wallets = await api.getWallets();
            const targetWallet = wallets.find(w => w.is_default === 1) || wallets[0];
            if (targetWallet) {
              createdTx = await api.createTransaction({
                balance_id: targetWallet.id,
                amount,
                type: 'expense',
                description: merchant,
                category_label: category
              });
            }
          } catch (txErr) {
            console.warn('Auto transaction save warning:', txErr);
          }
        }

        triggerHaptic('success');
        confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
        onTransactionCreated?.();

        const replyMsg: Message = {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: `🧾 **Chek o'qildi va xarajat qayd etildi!**\n\n` +
            `🏪 **Do'kon:** ${merchant}\n` +
            `💰 **Summa:** **${amount.toLocaleString('uz-UZ')} so'm**\n` +
            `🏷 **Kategoriya:** ${category}`,
          time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
          transaction: createdTx
        };
        setMessages(prev => [...prev, replyMsg]);
      } else {
        const replyMsg: Message = {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: res.message || "Chekni tahlil qilib bo'lmadi. Summani matn yoki ovoz bilan yozing.",
          time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, replyMsg]);
      }
    } catch (err: any) {
      console.error(err);
      setMessages(prev => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: "Chekni o'qishda xatolik yuz berdi. Qaytadan urinib ko'ring.",
          time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setScanningReceipt(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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

    const currentHistory = [...messages, userMsg].slice(-10).map(m => ({
      sender: m.sender,
      text: m.text
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await api.sendAIChat(text, currentHistory);

      if (res?.transaction || res?.parsed?.action === 'transaction' || res?.parsed?.action === 'debt' || res?.parsed?.action === 'transfer') {
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
    } catch (err: any) {
      console.error(err);
      const errText = err?.message || "Kechirasiz, vaqtinchalik xatolik yuz berdi. Qaytadan urinib ko'ring.";
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          sender: 'ai',
          text: errText,
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
            <p className="text-[10px] text-[#29c184] font-medium">Doimiy suhbat • Tarix saqlanadi</p>
          </div>
        </div>

        <div className="text-[10px] px-2 py-0.5 rounded-full bg-[#29c184]/15 text-[#29c184] font-bold">
          AI Faol
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
                    <span>Hamyon balansi muvaffaqiyatli yangilandi</span>
                  </div>
                )}
              </div>
              <span className="text-[10px] text-[#899098] mt-1 px-1">{m.time}</span>
            </div>
          );
        })}

        {(loading || scanningReceipt) && (
          <div className="flex items-center gap-2 p-3 rounded-2xl bg-[#1c2733] max-w-[120px] border border-[#263445]">
            <Loader2 className="w-4 h-4 text-[#29c184] animate-spin" />
            <span className="text-xs text-[#899098]">{scanningReceipt ? 'Chek tahlili...' : 'O\'ylanmoqda...'}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>


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

      {/* Hidden file input for Receipt scanning */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleReceiptUpload}
        className="hidden"
      />

      {/* Input container with Camera & Send */}
      <div className="relative pt-1">
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

          {/* Camera / Receipt Scan button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-11 h-11 rounded-2xl bg-[#1c2733] border border-[#263445] flex items-center justify-center text-[#899098] hover:text-[#29c184] hover:border-[#29c184] transition-all cursor-pointer shrink-0"
            title="Chek rasmini yuklash"
          >
            <Camera className="w-5 h-5" />
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
      </div>
    </div>
  );
};
