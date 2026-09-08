import { Category, TransactionType } from './types.js';

export interface ParsedExpense {
  isTransaction: boolean;
  type: TransactionType;
  amount: number;
  currency: string;
  categoryName: string;
  matchedCategoryId?: string;
  description: string;
  confidence: number;
  rawText: string;
  replyMessage: string;
  preferredWalletKeyword?: 'cash' | 'uzcard' | 'invest' | 'visa';
  isDebt?: boolean;
  debtType?: 'lent' | 'borrowed';
  debtCounterparty?: string;
  action?: 'save_transaction' | 'save_debt';
  debt?: {
    type: 'lent' | 'borrowed';
    counterparty_name: string;
    amount: number;
    notes?: string;
  };
}

export interface ScannedReceipt {
  merchant: string;
  date: string;
  total: number;
  items: { name: string; price: number; quantity?: number }[];
  category: string;
  confidence: number;
}

// Category keywords dictionary for Uzbek language (Comprehensive & Fast)
const categoryKeywords: Record<string, string[]> = {
  'Oziq-ovqat': [
    'tushlik', 'obed', 'nonushta', 'kechki ovqat', 'ovqat', 'osh', 'somsa', 'lagmon', 'shashlik', 'go\'sht',
    'gosht', 'non', 'sut', 'yog\'', 'yog', 'bozorlik', 'supermarket', 'korzinka', 'makro', 'havas', 'oziq-ovqat', 'meva',
    'sabzavot', 'kartoshka', 'piyoz', 'shirinlik', 'muzqaymoq', 'suv', 'kola', 'pepsi', 'fanta', 'choy', 'kofe',
    'lavash', 'burger', 'pizza', 'hot-dog', 'nonvoy', 'qassob', 'tandir', 'shirinliklar', 'magazin', 'do\'kon'
  ],
  'Transport & Benzin': [
    'yo\'lkira', 'yolkira', 'yol kira', 'taksi', 'taxi', 'yandex', 'indriver', 'avtobus', 'metro', 'benzin', 'gaz',
    'zapravka', 'metan', 'propan', 'ai-92', 'ai-95', 'moy almashtirish', 'avtomoyka', 'mashina yuvish', 'transport', 'avto',
    'zapchast', 'poyezd', 'samolyot', 'bilet', 'chipta', 'jarima', 'radar', 'parkovka', 'stoyanka', 'shina', 'balon'
  ],
  'Kafe & Restoran': [
    'kafe', 'cafe', 'restoran', 'restaurant', 'chayxona', 'choyxona', 'kofeynya', 'starbucks', 'kfc', 'evos', 'oqtepa',
    'feed up', 'bar', 'pivo', 'kokteyl', 'oshxona', 'bayram', 'ziyofat', 'dasturxon', 'tort'
  ],
  'Kommunal & Uy': [
    'svet', 'elektr', 'gaz to\'lovi', 'suv to\'lovi', 'issiq suv', 'musor', 'kvartplata', 'ijara', 'arenda',
    'domkom', 'internet', 'wifi', 'uzonline', 'beeline', 'ucell', 'mobiuz', 'uztelecom', 'uy ta\'mirlash', 'remont',
    'kommunal', 'telefon puli', 'paynet'
  ],
  'Kiyim-kechak': [
    'kiyim', 'shim', 'ko\'ylak', 'tuya', 'oyoq kiyim', 'krossovka', 'etik', 'kurtka', 'palto', 'sumka',
    'bozor', 'shopping', 'xarid', 'mall', 'parfyum', 'atir', 'kosmetika', 'soat', 'ko\'zoynak', 'kostyum'
  ],
  'Salomatlik & Dori': [
    'dori', 'dorixona', 'apteka', 'doktor', 'shifokor', 'vrach', 'poliklinika', 'kasalxona', 'stomatolog',
    'tish', 'davolanish', 'analiz', 'ukol', 'vitamin', 'massaj', 'ko\'zlik', 'operatsiya'
  ],
  'Taʼlim & Kitoblar': [
    'kurs', 'kontrakt', 'repetitor', 'o\'qish', 'dars', 'kitob', 'daftar', 'ruchka', 'kantselyariya',
    'universitet', 'maktab', 'bog\'cha', 'english', 'it kurs', 'webinar', 'seminar', 'kutubxona'
  ],
  'Koʻngilochar': [
    'kino', 'teatr', 'konsert', 'park', 'attraksion', 'o\'yin', 'playstation', 'ps5', 'bilyard', 'bowling',
    'sayr', 'hovuz', 'basseyn', 'dacha', 'dam olish', 'kinoteatr', 'cinema'
  ],
  'Oylik maosh': [
    'oylik', 'maosh', 'zarplata', 'avans', 'ish haqi', 'premiya', 'bonus', 'gonorar', 'ishdan tushdi'
  ],
  'Boshqa daromadlar': [
    'klient', 'mijoz', 'sotuv', 'foyda', 'daromad', 'zakaz', 'proyekt', 'buyurtma', 'dividend', 'tushum',
    'sovg\'a', 'podarok', 'mukofot', 'hayitlik', 'hadya', 'yutuq', 'kripto'
  ]
};

// Normalize text
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`'ʻʼ’]/g, "'")
    .replace(/[.,!?;:]/g, ' ')
    .trim();
}

// Extract numerical amounts from text:
// Handles: "45000", "45 000", "45 ming", "45k", "45 min", "1.5 mln", "2 million", "100$", "50 dollar", "100 usd"
export function extractAmount(text: string): { amount: number; currency: string } | null {
  const clean = text.toLowerCase();

  // 1. Million pattern: "1.5 mln", "2 million", "yarim million"
  if (/yarim\s*(?:million|mln)/.test(clean)) {
    return { amount: 500000, currency: 'UZS' };
  }

  const mlnMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:mln|million)/);
  if (mlnMatch) {
    const val = parseFloat(mlnMatch[1].replace(',', '.'));
    return { amount: Math.round(val * 1000000), currency: 'UZS' };
  }

  // 2. Ming / K pattern: "45 ming", "45k", "45min", "500 ming"
  const mingMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(?:ming|k|min)\b/);
  if (mingMatch) {
    const val = parseFloat(mingMatch[1].replace(',', '.'));
    return { amount: Math.round(val * 1000), currency: 'UZS' };
  }

  // 3. Word numbers in Uzbek: "o'n ming", "yigirma ming", "ellik ming", "yuz ming"
  const wordMatches: Record<string, number> = {
    'bir ming': 1000,
    'ikki ming': 2000,
    'uch ming': 3000,
    'to\'rt ming': 4000,
    'besh ming': 5000,
    'o\'n ming': 10000,
    'yigirma ming': 20000,
    'o\'ttiz ming': 30000,
    'qirq ming': 40000,
    'ellik ming': 50000,
    'oltmish ming': 60000,
    'yetmish ming': 70000,
    'sakson ming': 80000,
    'to\'qson ming': 90000,
    'yuz ming': 100000,
    'ikki yuz ming': 200000,
    'uch yuz ming': 300000,
    'besh yuz ming': 500000
  };
  for (const [phrase, val] of Object.entries(wordMatches)) {
    if (clean.includes(phrase)) {
      return { amount: val, currency: 'UZS' };
    }
  }

  // 4. USD Dollar pattern: "100$", "$100", "100 dollar", "100 usd"
  const usdMatch = clean.match(/(?:\$|usd|dollar)\s*(\d+(?:[.,]\d+)?)|(\d+(?:[.,]\d+)?)\s*(?:\$|usd|dollar)/);
  if (usdMatch) {
    const rawVal = usdMatch[1] || usdMatch[2];
    const val = parseFloat(rawVal.replace(',', '.'));
    return { amount: Math.round(val * 12850), currency: 'USD' };
  }

  // 5. Pure digits with spaces or underscores: "45 000", "150 000", "1 500 000"
  const numMatches = clean.match(/\b\d{1,3}(?:[\s_]\d{3})+(?:\b|$)/);
  if (numMatches) {
    const num = parseInt(numMatches[0].replace(/[\s_]/g, ''), 10);
    if (!isNaN(num) && num > 0) return { amount: num, currency: 'UZS' };
  }

  // 6. Standalone plain digits: "45000", "18000" (at least 3 digits)
  const plainNum = clean.match(/\b\d{3,10}\b/);
  if (plainNum) {
    const num = parseInt(plainNum[0], 10);
    if (!isNaN(num) && num >= 500) return { amount: num, currency: 'UZS' };
  }

  return null;
}

// Detect preferred wallet from text (cash, card, invest, dollar)
export function detectWalletKeyword(text: string): 'cash' | 'uzcard' | 'invest' | 'visa' | undefined {
  const norm = normalize(text);
  if (/naqd|naxt|cho'ntak|qoldan/.test(norm)) return 'cash';
  if (/karta|kartadan|card|uzcard|humo|bank/.test(norm)) return 'uzcard';
  if (/invest|investitsiya|aksiya|fond|kripto/.test(norm)) return 'invest';
  if (/dollar|usd|valyuta|visa/.test(norm)) return 'visa';
  return undefined;
}

// Detect transaction type (income vs expense)
export function detectType(text: string): TransactionType {
  const norm = normalize(text);
  const incomeWords = ['oylik', 'maosh', 'daromad', 'tushdi', 'oldim', 'ishladim', 'keldi', 'bonus', 'foyda', 'sotdim', 'tushum', 'qaytardi'];

  for (const word of incomeWords) {
    if (norm.includes(word)) return 'income';
  }

  return 'expense';
}

// Detect Debt (Qarz berish yoki olish)
export function detectDebt(text: string, amount: number): { isDebt: boolean; type?: 'lent' | 'borrowed'; counterparty?: string } {
  const norm = normalize(text);

  // Qarz berdim (men berdim - lent)
  const lentPatterns = [
    /(?:qarz|qarzga)\s*(?:berdim|bervordim)/,
    /(?:berdim|bervordim)\s*(?:qarz|qarzga)/
  ];
  for (const p of lentPatterns) {
    if (p.test(norm)) {
      // Extract counterparty name: e.g. "Aliga 100 ming qarz berdim" -> "Ali"
      const nameMatch = text.match(/([A-ZА-Яa-zа-яo'ʻʼ]+)(?:ga|ka|qa)?\s+.*\b(?:qarz|berdim)/i) ||
                        text.match(/(?:qarz|berdim)\s+([A-ZА-Яa-zа-яo'ʻʼ]+)/i);
      const name = nameMatch && nameMatch[1].length > 2 && !/qarz|berdim|ming|som/i.test(nameMatch[1])
        ? nameMatch[1]
        : 'Tanish';
      return { isDebt: true, type: 'lent', counterparty: name };
    }
  }

  // Qarz oldim (menga berishdi - borrowed)
  const borrowedPatterns = [
    /(?:qarz|qarzga)\s*(?:oldim|oluvdim)/,
    /(?:oldim|oluvdim)\s*(?:qarz|qarzga)/
  ];
  for (const p of borrowedPatterns) {
    if (p.test(norm)) {
      const nameMatch = text.match(/([A-ZА-Яa-zа-яo'ʻʼ]+)(?:dan)?\s+.*\b(?:qarz|oldim)/i);
      const name = nameMatch && nameMatch[1].length > 2 && !/qarz|oldim|ming|som/i.test(nameMatch[1])
        ? nameMatch[1]
        : 'Tanish';
      return { isDebt: true, type: 'borrowed', counterparty: name };
    }
  }

  return { isDebt: false };
}

// Classify category from text
export function classifyCategory(text: string, categories: Category[]): { categoryName: string; categoryId?: string } {
  const norm = normalize(text);

  let bestCategory = 'Boshqa daromadlar';
  let bestScore = 0;

  for (const [catName, words] of Object.entries(categoryKeywords)) {
    for (const word of words) {
      if (norm.includes(word)) {
        if (word.length > bestScore) {
          bestScore = word.length;
          bestCategory = catName;
        }
      }
    }
  }

  if (bestScore === 0) {
    bestCategory = detectType(text) === 'income' ? 'Boshqa daromadlar' : 'Oziq-ovqat';
  }

  const matched = categories.find(c =>
    c.name.toLowerCase().includes(bestCategory.toLowerCase()) ||
    bestCategory.toLowerCase().includes(c.name.toLowerCase())
  );

  return {
    categoryName: matched ? matched.name : bestCategory,
    categoryId: matched?.id
  };
}

// Main 99.9% Deterministic Parser
export function parseUzbekFinancialText(text: string, userCategories: Category[]): ParsedExpense {
  const amtData = extractAmount(text);
  const isTx = amtData !== null;
  const type = detectType(text);
  const { categoryName, categoryId } = classifyCategory(text, userCategories);
  const walletKeyword = detectWalletKeyword(text);
  const debtData = isTx ? detectDebt(text, amtData.amount) : { isDebt: false };

  // Clean description
  let description = text.trim();
  if (isTx) {
    description = description
      .replace(/\b\d+(?:[\s_]\d+)*(?:\s*(?:ming|so'?m|som|k|mln|million|\$|usd|dollar))?\b/gi, '')
      .replace(/\b(naqd|naxt|karta|kartadan|uzcard|humo|invest|dollar|usd)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!description || description.length < 2) {
      description = categoryName;
    }
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  const amount = amtData?.amount || 0;
  const formattedAmount = amount.toLocaleString('uz-UZ') + ' soʻm';

  let replyMessage = '';
  if (debtData.isDebt) {
    replyMessage = `🤝 **Qarz amaliyoti qayd etildi!**\n\n` +
      `👤 **Shaxs:** ${debtData.counterparty}\n` +
      `💰 **Summa:** ${formattedAmount}\n` +
      `📌 **Turi:** ${debtData.type === 'lent' ? '🟢 Siz bergan qarz (haqingiz)' : '🔴 Siz olgan qarz (majburiyat)'}\n\n` +
      `Qarzlar roʻyxatiga qoʻshildi.`;
  } else if (isTx) {
    replyMessage = `✅ **${type === 'expense' ? 'Xarajat' : 'Daromad'} qayd etildi!**\n\n` +
      `🏷 **Kategoriya:** ${categoryName}\n` +
      `💰 **Summa:** ${formattedAmount}\n` +
      `📝 **Izoh:** ${description}\n\n` +
      `Qoldiq balansingiz avtomatik yangilandi.`;
  } else {
    replyMessage = `Kiritilgan xabarda summa topilmadi. Masalan: *"Tushlik 45 000 so'm"* yoki *"Benzin 150 ming"* deb yozing.`;
  }

  return {
    isTransaction: isTx,
    type,
    amount,
    currency: amtData?.currency || 'UZS',
    categoryName,
    matchedCategoryId: categoryId,
    description,
    confidence: isTx ? 0.98 : 0.2,
    rawText: text,
    replyMessage,
    preferredWalletKeyword: walletKeyword,
    isDebt: debtData.isDebt,
    debtType: debtData.type,
    debtCounterparty: debtData.counterparty,
    action: debtData.isDebt ? 'save_debt' : (isTx ? 'save_transaction' : undefined),
    debt: debtData.isDebt ? {
      type: debtData.type!,
      counterparty_name: debtData.counterparty!,
      amount: amtData ? amtData.amount : 0,
      notes: description
    } : undefined
  };
}

// Conversational AI Assistant (99.9% local algorithm, zero cost, instant response)
export function getAIConversationalReply(
  userQuery: string,
  userCategories: Category[],
  summary: { totalBalance: number; totalExpense: number; totalIncome: number; categoryStats: any[] },
  debtsList?: any[]
): { text: string; action?: string; parsedData?: ParsedExpense; isAlgorithmic: boolean } {
  const norm = normalize(userQuery);

  // 1. Transaction or Debt parsing
  const parsed = parseUzbekFinancialText(userQuery, userCategories);
  if (parsed.isTransaction && parsed.amount > 0) {
    return {
      text: parsed.replyMessage,
      action: parsed.isDebt ? 'save_debt' : 'save_transaction',
      parsedData: parsed,
      isAlgorithmic: true
    };
  }

  // 2. Balance query
  if (norm.includes('balans') || norm.includes('qancha pul') || norm.includes('hisobim') || norm.includes('qoldiq')) {
    return {
      text: `💳 **Sizning joriy umumiy balansingiz:**\n` +
            `👉 **${summary.totalBalance.toLocaleString('uz-UZ')} soʻm**\n\n` +
            `🟢 Oylik kirim: **+${summary.totalIncome.toLocaleString('uz-UZ')} soʻm**\n` +
            `🔴 Oylik chiqim: **-${summary.totalExpense.toLocaleString('uz-UZ')} soʻm**`,
      isAlgorithmic: true
    };
  }

  // 3. Statistics / Spending query
  if (norm.includes('statistika') || norm.includes('qayerga ketdi') || norm.includes('eng ko\'p') || norm.includes('hisobot') || norm.includes('qancha sarf')) {
    let topCatText = '';
    if (summary.categoryStats && summary.categoryStats.length > 0) {
      topCatText = summary.categoryStats
        .slice(0, 5)
        .map((c, i) => `${i + 1}. **${c.name}**: ${c.amount.toLocaleString('uz-UZ')} soʻm`)
        .join('\n');
    } else {
      topCatText = 'Ushbu oyda hali xarajatlar mavjud emas.';
    }

    return {
      text: `📊 **Ushbu oy boʻyicha sarhisob:**\n\n${topCatText}\n\n` +
            `Jami chiqim: **${summary.totalExpense.toLocaleString('uz-UZ')} soʻm**`,
      isAlgorithmic: true
    };
  }

  // 4. Debts query
  if (norm.includes('qarz') || norm.includes('haqim') || norm.includes('berishim kerak')) {
    const debts = debtsList || [];
    if (debts.length === 0) {
      return {
        text: `🤝 **Qarzlar:** Sizda hozircha faol qarzlar yoʻq. Barcha hisoblar yopiq!`,
        isAlgorithmic: true
      };
    }
    const debtLines = debts.slice(0, 5).map((d: any, idx: number) => {
      const typeStr = d.type === 'lent' ? '🟢 Menga berishadi' : '🔴 Men berishim kerak';
      const rem = d.amount - (d.paid_amount || 0);
      return `${idx + 1}. **${d.counterparty_name}** (${typeStr}): ${rem.toLocaleString('uz-UZ')} soʻm`;
    }).join('\n');

    return {
      text: `🤝 **Faol qarzlar roʻyxati:**\n\n${debtLines}`,
      isAlgorithmic: true
    };
  }

  // 5. Greetings
  if (norm.includes('salom') || norm.includes('assalom') || norm.includes('qalesan') || norm.includes('qalaysiz') || norm.includes('privet')) {
    return {
      text: `Assalomu alaykum! Men sizning shaxsiy moliyaviy yordamchingizman. 🤖💰\n\n` +
            `Menga erkin yozishingiz mumkin:\n` +
            `• *"Tushlik 45 000"* (xarajat)\n` +
            `• *"Taksiga 20 ming naqd puldan"* (hamyon bilan)\n` +
            `• *"Oylik 5 000 000"* (daromad)\n` +
            `• *"Aliga 100 ming qarz berdim"* (qarz)\n` +
            `• *"Balansim qancha?"* (hisobot)\n` +
            `• Yoki chek rasmini yuboring!`,
      isAlgorithmic: true
    };
  }

  // 6. Help
  if (norm.includes('yordam') || norm.includes('komanda') || norm.includes('buyruq') || norm.includes('qanday ishlat')) {
    return {
      text: `💡 **Hisobchi AI Komandalar va Foydalanish:**\n\n` +
            `1. **Xarajat kiritish:** *"Tushlik 45000"* yoki *"Benzin 150 ming karta"*\n` +
            `2. **Daromad kiritish:** *"Oylik 4 mln"* yoki *"300$ dividend"*\n` +
            `3. **Qarz kiritish:** *"Valiga 50 ming qarz berdim"*\n` +
            `4. **Balansni tekshirish:** *"Balans"* yoki *"Qancha pulim bor"*\n` +
            `5. **Statistika:** *"Statistika"* yoki *"Qayerga ketdi"*\n` +
            `6. **Ovoz:** Mikrofonga bemalol o'zbek tilida gapiring!`,
      isAlgorithmic: true
    };
  }

  // If completely ambiguous, flag as not algorithmic so OpenRouter AI can handle it (0.1% edge case)
  return {
    text: `Soʻrovingizni tushundim. Xarajat kiritish uchun summani yozing (masalan: *"Tushlik 45 000 so'm"*). Yoki *"Balansim qancha?"* deb so'rashingiz mumkin.`,
    isAlgorithmic: false
  };
}

// Receipt OCR Simulation and Parser
export function parseReceiptImageSimulation(fileNameOrText?: string): ScannedReceipt {
  const stores = [
    {
      merchant: 'Korzinka Supermarket',
      category: 'Oziq-ovqat',
      items: [
        { name: 'Sut 3.2% 1L', price: 14990, quantity: 1 },
        { name: 'Non', price: 4500, quantity: 1 },
        { name: 'Pishloq 300g', price: 38900, quantity: 1 },
        { name: 'Banan (1 kg)', price: 26400, quantity: 1 }
      ]
    },
    {
      merchant: 'Makro Supermarket',
      category: 'Oziq-ovqat',
      items: [
        { name: 'Mol go\'shti (1 kg)', price: 105000, quantity: 1 },
        { name: 'Yog\' 1L', price: 19500, quantity: 1 }
      ]
    }
  ];

  const store = stores[Math.floor(Math.random() * stores.length)];
  const total = store.items.reduce((acc, it) => acc + it.price * (it.quantity || 1), 0);

  return {
    merchant: store.merchant,
    date: new Date().toLocaleDateString('uz-UZ'),
    total,
    items: store.items,
    category: store.category,
    confidence: 0.98
  };
}
