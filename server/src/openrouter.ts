import axios from 'axios';
import dotenv from 'dotenv';
import { Category } from './types.js';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

export function isOpenRouterConfigured(): boolean {
  return !!OPENROUTER_API_KEY && OPENROUTER_API_KEY.trim().length > 10;
}

export interface OpenRouterFinancialResponse {
  isTransaction: boolean;
  type: 'expense' | 'income' | 'transfer';
  amount: number;
  currency: string;
  categoryName: string;
  description: string;
  replyText: string;
}

/**
 * Calls OpenRouter AI to parse Uzbek financial queries or provide smart advice
 */
export async function callOpenRouterAI(
  userQuery: string,
  categories: Category[],
  summary: { totalBalance: number; totalExpense: number; totalIncome: number; categoryStats: any[] },
  conversationHistory: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<{ text: string; parsedData?: OpenRouterFinancialResponse }> {
  if (!isOpenRouterConfigured()) {
    throw new Error('OPENROUTER_API_KEY belgilanmagan');
  }

  const categoryNames = categories.map(c => c.name).join(', ');

  const systemPrompt = `Sen "Hisobchi AI" ilovasining aqlli moliyaviy yordamchisisan.
Sening vazifang — foydalanuvchining o'zbek tilidagi xabarlarini tahlil qilish, daromad va xarajatlarini hisobga olish va moliyaviy maslahatlar berish.

Mavjud toifalar ro'yxati: [${categoryNames}]
Foydalanuvchining joriy umumiy balansi: ${summary.totalBalance.toLocaleString('uz-UZ')} UZS.
Joriy oy xarajati: ${summary.totalExpense.toLocaleString('uz-UZ')} UZS, daromadi: ${summary.totalIncome.toLocaleString('uz-UZ')} UZS.

Qoidalar:
1. Agar foydalanuvchi xarajat, daromad yoki pul sarflagani/olganini aytsa (masalan: "Tushlikka 45 000 so'm ishlatdim", "Oylik tushdi 5 mln", "Benzin 120 ming"):
   - Summani aniq raqamga aylantir (ming = 000, mln = 000000).
   - Eng mos toifani tanla.
   - Javobingni oxirida doim quyidagi JSON blokni qo'sh:
   \`\`\`json
   {
     "is_transaction": true,
     "type": "expense" yoki "income",
     "amount": 45000,
     "currency": "UZS",
     "category": "Oziq-ovqat",
     "description": "Tushlik",
     "reply": "Do'stona va chiroyli o'zbekcha tasdiq matni"
   }
   \`\`\`

2. Agar foydalanuvchi umumiy savol bersa, maslahat so'rasa yoki balansini so'rasa:
   - Do'stona, aniq va foydali moliyaviy maslahat ber.
   - JSON blok qo'shish shart emas, yoki "is_transaction": false deb ber.

3. O'zbek tilida (lotin alifbosida), samimiy va professional javob qaytar. Emoji lardan o'rinli foydalan.`;

  try {
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-5),
      { role: 'user', content: userQuery }
    ];

    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 800
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://dashboard.hisobchiai.uz',
          'X-Title': 'Hisobchi AI Assistant',
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    const replyContent: string = response.data.choices?.[0]?.message?.content || '';

    // Check for embedded JSON
    const jsonMatch = replyContent.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        if (parsed.is_transaction && parsed.amount > 0) {
          const cleanText = replyContent.replace(/```json[\s\S]*?```/, '').trim();
          return {
            text: cleanText || parsed.reply || `✅ ${parsed.type === 'expense' ? 'Xarajat' : 'Daromad'} qayd etildi: ${parsed.amount.toLocaleString('uz-UZ')} UZS (${parsed.category})`,
            parsedData: {
              isTransaction: true,
              type: parsed.type === 'income' ? 'income' : 'expense',
              amount: Number(parsed.amount),
              currency: parsed.currency || 'UZS',
              categoryName: parsed.category || 'Boshqa xarajatlar',
              description: parsed.description || userQuery,
              replyText: parsed.reply || cleanText
            }
          };
        }
      } catch (e) {
        console.warn('JSON parse error from OpenRouter:', e);
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
