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
  action: 'transaction' | 'debt' | 'transfer' | 'none';
  isTransaction?: boolean;
  type?: 'expense' | 'income' | 'transfer';
  amount?: number;
  currency?: string;
  categoryName?: string;
  walletName?: string;
  toWalletName?: string;
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
 * Calls OpenRouter AI to parse Uzbek financial queries with a token-efficient compact prompt.
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

  const categoryNames = categories.map(c => c.name).join(', ') || 'Oziq-ovqat, Transport, Kiyim, Kommunal, Oylik, Boshqa';
  const walletNames = wallets.map(w => w.name).join(', ') || 'Asosiy karta, Naqd pul, Jamgʻarma';

  const systemPrompt = `Sen "Hisobchi AI" maslahatchisisan.
MAVJUD TOIFALAR: [${categoryNames}]
HAMYONLAR: [${walletNames}]
BALANS: ${summary.totalBalance.toLocaleString('uz-UZ')} UZS | Xarajat: ${summary.totalExpense.toLocaleString('uz-UZ')} | Daromad: ${summary.totalIncome.toLocaleString('uz-UZ')}

MUHIM: Javoblaring juda qisqa, aniq va lo'nda bo'lsin (1-2 gap). Hech qachon cho'zma!

QOIDALAR:
1. Xarajat/Daromad (masalan: "Tushlik 45000", "Benzin 120 ming karta", "Oylik 5 mln"):
\`\`\`json
{"action":"transaction","type":"expense","amount":45000,"category":"Oziq-ovqat","wallet":"Asosiy karta","description":"Tushlik","reply":"Tushlik uchun 45 000 so'm qayd etildi."}
\`\`\`
2. Qarz ("Aliga 100 ming qarz berdim" -> lent, "Validan 200 ming qarz oldim" -> borrowed):
\`\`\`json
{"action":"debt","debt":{"type":"lent","counterparty_name":"Ali","amount":100000},"reply":"Ali nomiga 100 000 so'm qarz qayd etildi."}
\`\`\`
3. O'tkazma ("Kartadan naqdga 50 ming o'tkazdim"):
\`\`\`json
{"action":"transfer","amount":50000,"wallet":"Asosiy karta","to_wallet":"Naqd pul","reply":"50 000 so'm naqd pulga o'tkazildi."}
\`\`\`
4. Maslahat/Savol: Faqat 1-2 gap bilan lo'nda javob ber. JSON shart emas.`;

  try {
    const formattedHistory = conversationHistory.slice(-5).map(m => ({
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
        temperature: 0.2,
        max_tokens: 350
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://dashboard.hisobchiai.uz',
          'X-Title': 'Hisobchi AI Assistant',
          'Content-Type': 'application/json'
        },
        timeout: 20000
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

        if (parsed.action === 'transfer' && parsed.amount > 0) {
          return {
            text: cleanText || parsed.reply || `🔄 ${parsed.amount.toLocaleString('uz-UZ')} UZS o'tkazildi.`,
            parsedData: {
              action: 'transfer',
              type: 'transfer',
              amount: Number(parsed.amount),
              walletName: parsed.wallet || 'Asosiy karta',
              toWalletName: parsed.to_wallet || 'Naqd pul',
              description: parsed.description || userQuery,
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
