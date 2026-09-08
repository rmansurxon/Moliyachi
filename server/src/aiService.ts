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
}

export interface ScannedReceipt {
  merchant: string;
  date: string;
  total: number;
  items: { name: string; price: number; quantity?: number }[];
  category: string;
  confidence: number;
}

// Category keywords dictionary for Uzbek language
const categoryKeywords: Record<string, string[]> = {
  'Oziq-ovqat': [
    'tushlik', 'obed', 'nonushta', 'kechki ovqat', 'ovqat', 'osh', 'somsa', 'lagmon', 'shashlik', 'go\'sht',
    'non', 'sut', 'yog\'', 'bozorlik', 'supermarket', 'korzinka', 'makro', 'havas', 'oziq-ovqat', 'meva',
    'sabzavot', 'kartoshka', 'piyoz', 'shirinlik', 'muzqaymoq', 'suv', 'kola', 'choy', 'kofe', 'lavash', 'burger', 'pizza'
  ],
  'Transport & Benzin': [
    'yo\'lkira', 'yol kira', 'taksi', 'taxi', 'yandex', 'indriver', 'avtobus', 'metro', 'benzin', 'gaz',
    'zapravka', 'metan', 'propan', 'moy almashtirish', 'avtomoyka', 'mashina yuvish', 'transport', 'avto',
    'zapchast', 'poyezd', 'samolyot', 'bilet', 'chipta', 'jarima', 'radar'
  ],
  'Kafe & Restoran': [
    'kafe', 'cafe', 'restoran', 'restaurant', 'chayxona', 'kofeynya', 'starbucks', 'kfc', 'evos', 'oqtepa',
    'bar', 'pivo', 'kokteyl', 'oshxona', 'bayram', 'ziyofat'
  ],
  'Kommunal & Uy': [
    'svet', 'elektr', 'gaz to\'lovi', 'suv to\'lovi', 'issiq suv', 'musor', 'kvartplata', 'ijara', 'arenda',
    'domkom', 'internet', 'wifi', 'uzonline', 'beeline', 'ucell', 'mobiuz', 'uy ta\'mirlash', 'remont'
  ],
  'Xaridlar & Kiyim': [
    'kiyim', 'shim', 'ko\'ylak', 'tuya', 'oyoq kiyim', 'krossovka', 'etik', 'kurtka', 'palto', 'sumka',
    'bozor', 'shopping', 'xarid', 'mall', 'parfyum', 'atir', 'kosmetika', 'soat', 'ko\'zoynak'
  ],
  'Salomatlik & Dori': [
    'dori', 'dorixona', 'apteka', 'doktor', 'shifokor', 'vrach', 'poliklinika', 'kasalxona', 'stomatolog',
    'tish', 'davolanish', 'analiz', 'ukol', 'vitamin'
  ],
  'Taʼlim & Kitoblar': [
    'kurs', 'kontrakt', 'repetitor', 'o\'qish', 'dars', 'kitob', 'daftar', 'ruchka', 'kantselyariya',
    'universitet', 'maktab', 'bog\'cha', 'english', 'it kurs', 'webinar', 'seminar'
  ],
  'Koʻngilochar': [
    'kino', 'teatr', 'konsert', 'park', 'attraksion', 'o\'yin', 'playstation', 'ps5', 'bilyard', 'bowling',
    'sayr', 'hovuz', 'basseyn', 'dacha', 'dam olish'
  ],
  'Oylik maosh': [
    'oylik', 'maosh', 'zarplata', 'avans', 'ish haqi', 'premiya', 'bonus', 'gonorar'
  ],
  'Frilans / Biznes': [
    'klient', 'mijoz', 'sotuv', 'foyda', 'daromad', 'zakaz', 'proyekt', 'buyurtma', 'dividend'
  ],
  'Sovgʻa / Mukofot': [
    'sovg\'a', 'podarok', 'mukofot', 'hayitlik', 'hadya', 'yutuq'
  ]
};

// Normalize text: lowercase and clean
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`'ʻʼ’]/g, "'")
    .replace(/[.,!?;:]/g, ' ')
    .trim();
}

// Extract numerical amounts from text
// Handles: "45000", "45 000", "45 ming", "45k", "1.5 mln", "100$", "50 dollar"
export function extractAmount(text: string): { amount: number; currency: string } | null {
  const clean = text.toLowerCase();

  // Pattern: "1.5 mln", "2 million", "500 ming", "45k"
  const mlnMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(mln|million)/);
  if (mlnMatch) {
    const val = parseFloat(mlnMatch[1].replace(',', '.'));
    return { amount: Math.round(val * 1000000), currency: 'UZS' };
  }

  const mingMatch = clean.match(/(\d+(?:[.,]\d+)?)\s*(ming|k|min)/);
  if (mingMatch) {
    const val = parseFloat(mingMatch[1].replace(',', '.'));
    return { amount: Math.round(val * 1000), currency: 'UZS' };
  }

  // USD Dollar pattern: "100$", "$100", "100 dollar", "100 usd"
  const usdMatch = clean.match(/(?:\$|usd|dollar)?\s*(\d+(?:[.,]\d+)?)\s*(?:\$|usd|dollar)/);
  if (usdMatch) {
    const val = parseFloat(usdMatch[1].replace(',', '.'));
    // Convert to UZS roughly at 12,800 or store USD
    return { amount: Math.round(val * 12850), currency: 'USD' };
  }

  // Pure digits with spaces: "45 000", "150 000", "15000"
  const numMatches = clean.match(/\b\d{1,3}(?:[\s_]\d{3})+(?:\b|$)/);
  if (numMatches) {
    const num = parseInt(numMatches[0].replace(/[\s_]/g, ''), 10);
    if (!isNaN(num) && num > 0) return { amount: num, currency: 'UZS' };
  }

  // Standalone digits: "45000", "18000"
  const plainNum = clean.match(/\b\d{3,9}\b/);
  if (plainNum) {
    const num = parseInt(plainNum[0], 10);
    if (!isNaN(num) && num > 0) return { amount: num, currency: 'UZS' };
  }

  // Smaller digits: "5000", "3000"
  const smallNum = clean.match(/\b\d{1,9}\b/);
  if (smallNum) {
    const num = parseInt(smallNum[0], 10);
    if (!isNaN(num) && num >= 500) return { amount: num, currency: 'UZS' };
  }

  return null;
}

// Detect transaction type (income vs expense)
export function detectType(text: string): TransactionType {
  const norm = normalize(text);
  const incomeWords = ['oylik', 'maosh', 'daromad', 'tushdi', 'oldim', 'ishladim', 'keldi', 'bonus', 'foyda', 'sotdim'];

  for (const word of incomeWords) {
    if (norm.includes(word)) return 'income';
  }

  return 'expense';
}

// Classify category from text
export function classifyCategory(text: string, categories: Category[]): { categoryName: string; categoryId?: string } {
  const norm = normalize(text);

  // Check keyword matches
  let bestCategory = 'Boshqa xarajatlar';
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

  // Fallback defaults
  if (bestScore === 0) {
    bestCategory = detectType(text) === 'income' ? 'Oylik maosh' : 'Oziq-ovqat';
  }

  // Match with existing categories in database
  const matched = categories.find(c =>
    c.name.toLowerCase().includes(bestCategory.toLowerCase()) ||
    bestCategory.toLowerCase().includes(c.name.toLowerCase())
  );

  return {
    categoryName: matched ? matched.name : bestCategory,
    categoryId: matched?.id
  };
}

// Main AI NLP Parser for Uzbek commands
export function parseUzbekFinancialText(text: string, userCategories: Category[]): ParsedExpense {
  const amtData = extractAmount(text);
  const isTx = amtData !== null;
  const type = detectType(text);
  const { categoryName, categoryId } = classifyCategory(text, userCategories);

  // Clean description: remove amount and extra words
  let description = text.trim();
  if (isTx) {
    description = description
      .replace(/\b\d+(?:[\s_]\d+)*(?:\s*(?:ming|so'?m|som|k|mln|million|\$|usd|dollar))?\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!description || description.length < 2) {
      description = categoryName;
    }
    // Capitalize first letter
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }

  const amount = amtData?.amount || 0;
  const formattedAmount = amount.toLocaleString('uz-UZ') + ' soʻm';

  const replyMessage = isTx
    ? `✅ **${type === 'expense' ? 'Xarajat' : 'Daromad'} qayd etildi!**\n\n` +
      `🏷 **Kategoriya:** ${categoryName}\n` +
      `💰 **Summa:** ${formattedAmount}\n` +
      `📝 **Izoh:** ${description}\n\n` +
      `Qoldiq balansingiz avtomatik yangilandi.`
    : `Kiritilgan xabarda summa topilmadi. Masalan: *"Tushlikka 45 000 so'm ishlatdim"* yoki *"Benzin 150 ming"* deb yozing.`;

  return {
    isTransaction: isTx,
    type,
    amount,
    currency: amtData?.currency || 'UZS',
    categoryName,
    matchedCategoryId: categoryId,
    description,
    confidence: isTx ? 0.95 : 0.2,
    rawText: text,
    replyMessage
  };
}

// Conversational AI Assistant Response (smart Uzbek financial copilot)
export function getAIConversationalReply(
  userQuery: string,
  userCategories: Category[],
  summary: { totalBalance: number; totalExpense: number; totalIncome: number; categoryStats: any[] }
): { text: string; action?: string; parsedData?: ParsedExpense } {
  const norm = normalize(userQuery);

  // 1. Check if user is logging an expense/income
  const parsed = parseUzbekFinancialText(userQuery, userCategories);
  if (parsed.isTransaction && parsed.amount > 0) {
    return {
      text: parsed.replyMessage,
      action: 'save_transaction',
      parsedData: parsed
    };
  }

  // 2. Questions about balance or summary
  if (norm.includes('balans') || norm.includes('qancha pul') || norm.includes('hisobim')) {
    return {
      text: `💳 **Sizning joriy umumiy balansingiz:**\n` +
            `👉 **${summary.totalBalance.toLocaleString('uz-UZ')} soʻm**\n\n` +
            `📊 Ushbu oydagi daromad: **${summary.totalIncome.toLocaleString('uz-UZ')} soʻm**\n` +
            `💸 Ushbu oydagi xarajat: **${summary.totalExpense.toLocaleString('uz-UZ')} soʻm**`
    };
  }

  // 3. Questions about spending & category breakdown
  if (norm.includes('statistika') || norm.includes('qayerga ketdi') || norm.includes('eng ko\'p')) {
    let topCatText = '';
    if (summary.categoryStats && summary.categoryStats.length > 0) {
      topCatText = summary.categoryStats
        .slice(0, 4)
        .map((c, i) => `${i + 1}. **${c.name}**: ${c.amount.toLocaleString('uz-UZ')} soʻm`)
        .join('\n');
    } else {
      topCatText = 'Hozircha xarajatlar kiritilmagan.';
    }

    return {
      text: `📊 **Bu oy eng koʻp sarflangan yoʻnalishlar:**\n\n${topCatText}\n\n` +
            `💡 *Maslahat: Har kuni xarajatlarni oʻz vaqtida yozib borish pulingizni 20% gacha tejashga yordam beradi.*`
    };
  }

  // 4. Greetings
  if (norm.includes('salom') || norm.includes('assalom') || norm.includes('qalesan') || norm.includes('qandaysan')) {
    return {
      text: `Assalomu alaykum! Men **Hisobchi AI** shaxsiy moliyaviy yordamchingizman. 🤖💰\n\n` +
            `Menga quyidagicha xabarlarni yuborishingiz mumkin:\n` +
            `• *"Tushlikka 45 000 soʻm sarfladim"*\n` +
            `• *"Taksi 20 ming"*\n` +
            `• *"Oylik tushdi 5 000 000"*\n` +
            `• *"Bugungi balansim qancha?"*\n` +
            `• Yoki chek rasmini yuklang.`
    };
  }

  // 5. Help or tips
  if (norm.includes('yordam') || norm.includes('maslahat') || norm.includes('qanday')) {
    return {
      text: `💡 **Hisobchi AI Foydalanish Yoʻriqnomasi:**\n\n` +
            `1. **Tezkor kiritish:** Shunchaki summa va nima uchunligini yozing (masalan: *"Bozorlik 320 000"*).\n` +
            `2. **Ovozli xabar:** Mikrofon tugmasini bosib, ovozli xabar qoldiring.\n` +
            `3. **Chek skaneri:** "Chek skaner" boʻlimiga kirib xarid chekini rasmga oling, AI summani avtomatik ajratadi.\n` +
            `4. **Qarzlar:** Qarz bergan yoki olganingizda Qarzlar boʻlimiga kiriting, bot eslatib turadi.`
    };
  }

  // Default fallback conversational response
  return {
    text: `Sizning soʻrovingizni tushundim. Agar xarajat yoki daromad kiritmoqchi boʻlsangiz, summani koʻrsating. Masalan: *"Oziq-ovqatga 120 000 soʻm"* yoki *"Balansim qancha?"* deb soʻrashingiz mumkin.`
  };
}

// Receipt OCR Simulation and Parser
export function parseReceiptImageSimulation(fileNameOrText?: string): ScannedReceipt {
  // Pre-configured realistic retail receipts for Uzbekistan (Korzinka, Makro, Havas, Texnomart)
  const stores = [
    {
      merchant: 'Korzinka Supermarket (Mega Planet)',
      category: 'Oziq-ovqat',
      items: [
        { name: 'Nestle Sut 3.2% 1L', price: 14990, quantity: 2 },
        { name: 'Qora Non Toshkent', price: 4500, quantity: 1 },
        { name: 'Gouda Pishloq 300g', price: 38900, quantity: 1 },
        { name: 'Banan Ekvador (1.2 kg)', price: 26400, quantity: 1 },
        { name: 'Coca-Cola 1.5L', price: 15500, quantity: 1 }
      ]
    },
    {
      merchant: 'Makro Supermarket (Samarqand Darvoza)',
      category: 'Oziq-ovqat',
      items: [
        { name: 'Mol go\'shti lahm (1 kg)', price: 105000, quantity: 1 },
        { name: 'Kungaboqar yog\'i 1L', price: 19500, quantity: 2 },
        { name: 'Tuxum D-1 (10 dona)', price: 17000, quantity: 1 },
        { name: 'Makaron Makfa 500g', price: 11200, quantity: 2 }
      ]
    },
    {
      merchant: 'Texnomart Electronics',
      category: 'Xaridlar & Kiyim',
      items: [
        { name: 'Baseus 20W Powerbank', price: 260000, quantity: 1 },
        { name: 'Type-C USB Fast Cable', price: 45000, quantity: 1 }
      ]
    }
  ];

  // Pick one randomly or deterministic based on name
  const store = stores[Math.floor(Math.random() * stores.length)];
  const total = store.items.reduce((acc, it) => acc + it.price * (it.quantity || 1), 0);

  return {
    merchant: store.merchant,
    date: new Date().toLocaleDateString('uz-UZ'),
    total,
    items: store.items,
    category: store.category,
    confidence: 0.96
  };
}
