import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { api, triggerHaptic } from '../api';
import { Sparkles, Send, Mic, CheckCircle2, AlertCircle, Camera, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
export const ChatView = ({ onTransactionCreated }) => {
    const [messages, setMessages] = useState([]);
    const [historyLoaded, setHistoryLoaded] = useState(false);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechError, setSpeechError] = useState(null);
    const [scanningReceipt, setScanningReceipt] = useState(false);
    const fileInputRef = useRef(null);
    const recognitionRef = useRef(null);
    const messagesEndRef = useRef(null);
    // Load persistent continuous chat history
    useEffect(() => {
        let isMounted = true;
        async function loadHistory() {
            try {
                const res = await api.getChatHistory();
                if (isMounted && res.success && Array.isArray(res.messages) && res.messages.length > 0) {
                    const loaded = res.messages.map((m) => ({
                        id: m.id || String(Math.random()),
                        sender: m.sender,
                        text: m.text,
                        time: m.created_at
                            ? new Date(m.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                            : '',
                        transaction: m.transaction_data ? (typeof m.transaction_data === 'string' ? JSON.parse(m.transaction_data) : m.transaction_data) : undefined
                    }));
                    setMessages(loaded);
                }
                else if (isMounted) {
                    setMessages([
                        {
                            id: 'initial',
                            sender: 'ai',
                            text: "Assalomu alaykum! Men sizning shaxsiy moliyaviy yordamchingizman. 🤖\n\nXarajat yoki daromadingizni yozing yoki ovoz bilan gapiring (masalan: *\"Tushlik 45 000 so'm\"* yoki *\"5 000 000 oylik tushdi\"*). Shuningdek chek rasmini ham yuborishingiz mumkin.",
                            time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                        }
                    ]);
                }
            }
            catch (err) {
                console.error('History load error:', err);
            }
            finally {
                if (isMounted)
                    setHistoryLoaded(true);
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
    // Initialize real Web Speech API
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'uz-UZ'; // Uzbek speech recognition
            recognition.onstart = () => {
                setIsListening(true);
                setSpeechError(null);
            };
            recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                console.log('Recognized speech:', transcript);
                setInput(transcript);
                setIsListening(false);
                // Automatically send transcribed voice text
                handleSend(transcript);
            };
            recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                setIsListening(false);
                if (event.error === 'not-allowed') {
                    setSpeechError('Mikrofon ruxsati berilmadi. Iltimos, brauzerda mikrofonni yoqing.');
                }
                else if (event.error === 'no-speech') {
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
        }
        else {
            try {
                recognitionRef.current.start();
            }
            catch (err) {
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
    const handleReceiptUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        setScanningReceipt(true);
        triggerHaptic('medium');
        const tempId = String(Date.now());
        const uploadingMsg = {
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
                    }
                    catch (txErr) {
                        console.warn('Auto transaction save warning:', txErr);
                    }
                }
                triggerHaptic('success');
                confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
                onTransactionCreated?.();
                const replyMsg = {
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
            }
            else {
                const replyMsg = {
                    id: String(Date.now() + 1),
                    sender: 'ai',
                    text: res.message || "Chekni tahlil qilib bo'lmadi. Summani matn yoki ovoz bilan yozing.",
                    time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                };
                setMessages(prev => [...prev, replyMsg]);
            }
        }
        catch (err) {
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
        }
        finally {
            setScanningReceipt(false);
            if (fileInputRef.current)
                fileInputRef.current.value = '';
        }
    };
    const handleSend = async (textToSend) => {
        const text = (textToSend || input).trim();
        if (!text || loading)
            return;
        triggerHaptic('light');
        const userMsg = {
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
            if (res.transaction) {
                triggerHaptic('success');
                confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
                onTransactionCreated?.();
            }
            const aiMsg = {
                id: String(Date.now() + 1),
                sender: 'ai',
                text: res.reply || "Xabaringiz qabul qilindi!",
                time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
                transaction: res.transaction
            };
            setMessages((prev) => [...prev, aiMsg]);
        }
        catch (err) {
            console.error(err);
            setMessages((prev) => [
                ...prev,
                {
                    id: String(Date.now() + 1),
                    sender: 'ai',
                    text: "Kechirasiz, vaqtinchalik xatolik yuz berdi. Qaytadan urinib ko'ring.",
                    time: new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsxs("div", { className: "flex flex-col h-[calc(100vh-120px)] max-w-2xl mx-auto pb-4 px-4", children: [_jsxs("div", { className: "flex items-center justify-between py-2 border-b border-[#263445] mb-2", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "relative", children: [_jsx("div", { className: "w-8 h-8 rounded-full bg-gradient-to-tr from-[#12A99D] to-[#29c184] flex items-center justify-center text-white shadow-md", children: _jsx(Sparkles, { className: "w-4 h-4" }) }), _jsx("span", { className: "absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#29c184] border-2 border-[#18222d] rounded-full" })] }), _jsxs("div", { children: [_jsx("h3", { className: "text-xs font-bold text-white", children: "Hisobchi AI Assistant" }), _jsx("p", { className: "text-[10px] text-[#29c184] font-medium", children: "Doimiy suhbat \u2022 Tarix saqlanadi" })] })] }), _jsx("div", { className: "text-[10px] px-2 py-0.5 rounded-full bg-[#29c184]/15 text-[#29c184] font-bold", children: "AI Faol" })] }), _jsxs("div", { className: "flex-1 overflow-y-auto space-y-3 pr-1", children: [messages.map((m) => {
                        const isUser = m.sender === 'user';
                        return (_jsxs("div", { className: `flex flex-col ${isUser ? 'items-end' : 'items-start'} chat-msg-in`, children: [_jsxs("div", { className: `max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${isUser
                                        ? 'bg-[#29c184] text-white rounded-br-xs font-medium'
                                        : 'bg-[#1c2733] text-white border border-[#263445] rounded-bl-xs'}`, children: [_jsx("p", { className: "whitespace-pre-line leading-relaxed", children: m.text }), m.transaction && (_jsxs("div", { className: "mt-2.5 pt-2 border-t border-white/10 flex items-center gap-2 text-xs font-bold text-[#29c184]", children: [_jsx(CheckCircle2, { className: "w-4 h-4" }), _jsx("span", { children: "Hamyon balansi muvaffaqiyatli yangilandi" })] }))] }), _jsx("span", { className: "text-[10px] text-[#899098] mt-1 px-1", children: m.time })] }, m.id));
                    }), (loading || scanningReceipt) && (_jsxs("div", { className: "flex items-center gap-2 p-3 rounded-2xl bg-[#1c2733] max-w-[120px] border border-[#263445]", children: [_jsx(Loader2, { className: "w-4 h-4 text-[#29c184] animate-spin" }), _jsx("span", { className: "text-xs text-[#899098]", children: scanningReceipt ? 'Chek tahlili...' : 'O\'ylanmoqda...' })] })), _jsx("div", { ref: messagesEndRef })] }), speechError && (_jsxs("div", { className: "p-2 mb-2 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center gap-2 text-xs text-red-300", children: [_jsx(AlertCircle, { className: "w-4 h-4 shrink-0" }), _jsx("span", { children: speechError })] })), _jsx("div", { className: "py-2", children: _jsx("div", { className: "flex gap-1.5 overflow-x-auto no-scrollbar py-1", children: quickPrompts.map((p) => (_jsx("button", { onClick: () => handleSend(p), className: "px-3 py-1.5 rounded-full bg-[#1c2733] border border-[#263445] text-xs font-medium text-[#b6bfd0] hover:border-[#29c184] hover:text-[#29c184] shrink-0 transition-colors cursor-pointer", children: p }, p))) }) }), _jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", capture: "environment", onChange: handleReceiptUpload, className: "hidden" }), _jsx("div", { className: "relative pt-1", children: isListening ? (_jsxs("div", { className: "flex items-center justify-between px-4 py-3 rounded-2xl bg-[#29c184]/20 border border-[#29c184] animate-pulse", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "w-3 h-3 rounded-full bg-[#29c184] animate-ping" }), _jsx("span", { className: "text-xs font-bold text-[#29c184]", children: "Mikrofon eshitmoqda... Gapiring!" })] }), _jsx("button", { onClick: handleToggleMic, className: "px-3 py-1 rounded-xl bg-[#29c184] text-white text-xs font-bold shadow-md cursor-pointer", children: "To'xtatish" })] })) : (_jsxs("form", { onSubmit: (e) => {
                        e.preventDefault();
                        handleSend();
                    }, className: "flex items-center gap-2", children: [_jsx("input", { type: "text", value: input, onChange: (e) => setInput(e.target.value), placeholder: "Masalan: Tushlik 45000 so'm...", className: "flex-1 px-4 py-3 rounded-2xl bg-[#1c2733] border border-[#263445] text-sm text-white focus:outline-none focus:border-[#29c184] shadow-inner" }), _jsx("button", { type: "button", onClick: () => fileInputRef.current?.click(), className: "w-11 h-11 rounded-2xl bg-[#1c2733] border border-[#263445] flex items-center justify-center text-[#899098] hover:text-[#29c184] hover:border-[#29c184] transition-all cursor-pointer shrink-0", title: "Chek rasmini yuklash", children: _jsx(Camera, { className: "w-5 h-5" }) }), _jsx("button", { type: "button", onClick: handleToggleMic, className: "w-11 h-11 rounded-2xl bg-[#1c2733] border border-[#263445] flex items-center justify-center text-[#29c184] hover:bg-[#29c184] hover:text-white transition-all cursor-pointer shrink-0", title: "Ovoz bilan kiritish (Mikrofon)", children: _jsx(Mic, { className: "w-5 h-5" }) }), _jsx("button", { type: "submit", disabled: !input.trim() || loading, className: "w-11 h-11 rounded-2xl bg-[#29c184] hover:bg-[#25ab75] active:scale-95 disabled:opacity-40 disabled:scale-100 flex items-center justify-center text-white transition-all cursor-pointer shrink-0 shadow-lg shadow-[#29c184]/30", title: "Yuborish", children: _jsx(Send, { className: "w-5 h-5" }) })] })) })] }));
};
