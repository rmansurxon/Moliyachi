import axios from 'axios';
import dotenv from 'dotenv';
import { Category, Wallet } from './types.js';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openai/gpt-oss-120b';

export function isOpenRouterConfigured(): boolean {
  return !!OPENROUTER_API_KEY && OPENROUTER_API_KEY.trim().length > 10;
}

export interface OpenRouterFinancialResponse {
  action: 'transaction' | 'debt' | 'none';
  isTransaction?: boolean;
  type?: 'expense' | 'income' | 'transfer';
  amount?: number;
  currency?: string;
  categoryName?: string;
  walletName?: string;
  description?: string;
  replyText?: string;
  debt?: {
    type: 'lent' | 'borrowed';
    counterparty_name: string;
    amount: number;
    due_date?: string | null;
    notes?: string | null;
  };
}

/**
 * Calls OpenRouter AI to parse Uzbek financial queries, manage debts/expenses, or provide smart advice
 */
export async function callOpenRouterAI(
  userQuery: string,
  categories: Category[],
  summary: { totalBalance: number; totalExpense: number; totalIncome: number; categoryStats: any[] },
  conversationHistory: { role?: string; sender?: string; content?: string; text?: string }[] = [],
  wallets: Wallet[] = []
): Promise<{ text: string; parsedData?: OpenRouterFinancialResponse }> {
  if (!isOpenRouterConfigured()) {
    throw new Error('OPENROUTER_API_KEY belgilanmagan');
  }

  const categoryNames = categories.map(c => c.name).join(', ') || 'Oziq-ovqat, Transport & Benzin, Kiyim-kechak, Kommunal & Uy, Oylik maosh, Boshqa daromad';
  const walletNames = wallets.map(w => w.name).join(', ') || 'Asosiy karta, Naqd pul, Jamgʻarma';

  const systemPrompt = `Sen "Hisobchi AI" platformasining oliy darajadagi aqlli, do'stona va tajribali moliyaviy maslahatchisisan.
Sening vazifang — foydalanuvchining o'zbek tilidagi (yoki aralash) xabarlarini tahlil qilish, daromad/xarajatlarni hisobga olish, qarz munosabatlarini yuritish va professional moliyaviy maslahatlar berish.

MAVJUD TOIFALAR: [${categoryNames}]
MAVJUD HAMYONLAR: [${walletNames}]
FOYDALANUVCHI MOLIYAVIY HOLATI:
- Joriy umumiy balans: ${summary.totalBalance.toLocaleString('uz-UZ')} UZS
- Ushbu oydagi jami xarajat: ${summary.totalExpense.toLocaleString('uz-UZ')} UZS
- Ushbu oydagi jami daromad: ${summary.totalIncome.toLocaleString('uz-UZ')} UZS

QOIDALAR:

1. XARAJAT YOKI DAROMAD BO'LSA (masalan: "Tushlikka 45 000 so'm ishlatdim", "Oylik tushdi 6 mln karta", "Benzin 150 ming", "100 dollar almashtirdim"):
   - Summani aniq raqamga aylantir (ming = 000, mln = 000000).
   - Mavjud toifalar ichidan eng to'g'risini tanla.
   - Qaysi karta yoki hamyon aytilgan bo'lsa (karta, naqd, uzcard va h.k.) mos keluvchi hamyon nomini tanla.
   - Javobing oxirida doim quyidagi JSON blokni qo'sh:
   \`\`\`json
   {
     "action": "transaction",
     "is_transaction": true,
     "type": "expense" yoki "income",
     "amount": 45000,
     "currency": "UZS",
     "category": "Oziq-ovqat",
     "wallet": "Asosiy karta",
     "description": "Tushlik",
     "reply": "Do'stona qisqa tasdiq xabari"
   }
   \`\`\`

2. QARZ MUNOSABATI BO'LSA (masalan: "Aliga 200 ming qarz berdim", "Validan 500 ming qarz oldim 25-sanagacha", "Umar akadan 1 mln qarz oldim"):
   - Qarz turini aniqla: "lent" (men qarz berdim, menga qaytarishadi) yoki "borrowed" (men qarz oldim, men qaytarishim kerak).
   - Odamning ismini counterparty_name qilib ol.
   - Javobing oxirida quyidagi JSON blokni qo'sh:
   \`\`\`json
   {
     "action": "debt",
     "debt": {
       "type": "lent" yoki "borrowed",
       "counterparty_name": "Ali",
       "amount": 200000,
       "due_date": "2026-09-25",
       "notes": "Qarz berildi"
     },
     "reply": "Ali nomiga 200 000 so'm qarz muvaffaqiyatli qayd etildi."
   }
   \`\`\`

3. SAVOLLAR, MASLAHAT YOKI UMUMIY SUHBAT BO'LSA (masalan: "Salom", "Qancha pulim qoldi?", "Qanday tejashim mumkin?", "Bu oy qayerga eng ko'p ketdi?"):
   - Foydalanuvchiga do'stona, samimiy va moliyaviy jihatdan aniq ma'lumotlar bilan javob qaytar.
   - Balans so'ralsa yuqoridagi joriy balansni ko'rsat.
   - JSON blok qo'shish shart emas yoki:
   \`\`\`json
   {
     "action": "none"
   }
   \`\`\`

O'zbek tilida (lotin alifbosida), chiroyli formatda javob ber. Emojilardan me'yorida foydalan.`;

  try {
    const formattedHistory = conversationHistory.slice(-8).map(m => ({
      role: (m.role || m.sender === 'user') ? 'user' : 'assistant',
      content: m.content || m.text || ''
    })).filter(m => m.content.trim().length > 0);

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: userQuery }
    ];

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 1000
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://dashboard.hisobchiai.uz',
          'X-Title': 'Hisobchi AI Assistant',
          'Content-Type': 'application/json'
        },
        timeout: 25000
      }
    );

    const replyContent: string = response.data.choices?.[0]?.message?.content || '';

    // Check for embedded JSON
    const jsonMatch = replyContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        const cleanText = replyContent.replace(/```json[\s\S]*?```/, '').trim();

        if (parsed.action === 'debt' && parsed.debt && parsed.debt.amount > 0) {
          return {
            text: cleanText || parsed.reply || `🤝 ${parsed.debt.counterparty_name} nomiga ${parsed.debt.amount.toLocaleString('uz-UZ')} UZS qarz qayd etildi.`,
            parsedData: {
              action: 'debt',
              debt: {
                type: parsed.debt.type === 'borrowed' ? 'borrowed' : 'lent',
                counterparty_name: parsed.debt.counterparty_name || "Noma'lum shaxs",
                amount: Number(parsed.debt.amount),
                due_date: parsed.debt.due_date || null,
                notes: parsed.debt.notes || userQuery
              },
              replyText: parsed.reply || cleanText
            }
          };
        }

        if ((parsed.action === 'transaction' || parsed.is_transaction) && parsed.amount > 0) {
          return {
            text: cleanText || parsed.reply || `✅ ${parsed.type === 'income' ? 'Daromad' : 'Xarajat'} qayd etildi: ${parsed.amount.toLocaleString('uz-UZ')} UZS (${parsed.category || 'Xarid'})`,
            parsedData: {
              action: 'transaction',
              isTransaction: true,
              type: parsed.type === 'income' ? 'income' : 'expense',
              amount: Number(parsed.amount),
              currency: parsed.currency || 'UZS',
              categoryName: parsed.category || 'Boshqa xarajatlar',
              walletName: parsed.wallet || 'Asosiy karta',
              description: parsed.description || userQuery,
              replyText: parsed.reply || cleanText
            }
          };
        }

        return {
          text: cleanText || replyContent,
          parsedData: { action: 'none' }
        };
      } catch (e) {
        console.warn('JSON parse error from OpenRouter response:', e);
      }
    }

    return {
      text: replyContent
    };
  } catch (err: any) {
    console.error('OpenRouter API xatosi:', err.response?.data || err.message);
    throw err;
  }
}
