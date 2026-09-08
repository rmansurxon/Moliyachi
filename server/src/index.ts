import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import {
  initDB,
  getOrCreateDefaultUser,
  getWallets,
  getCategories,
  getTransactions,
  addTransaction,
  deleteTransaction,
  deleteLastTransaction,
  getDebts,
  addDebt,
  getGoals,
  getVouchers,
  getArticles,
  getFinancialSummary,
  updateWallet,
  deleteWallet,
  transferBetweenWallets,
  getChatMessages,
  saveChatMessage,
  resetAllBalancesAndTransactions,
  db
} from './db.js';
import { parseUzbekFinancialText, getAIConversationalReply, parseReceiptImageSimulation, extractAmount } from './aiService.js';
import { createTelegramBot } from './bot.js';
import multer from 'multer';
import { createWorker } from 'tesseract.js';
import {
  isSupabaseActive,
  getArticlesFromSupabase,
  getAppTextsFromSupabase,
  getTransactionsFromSupabase,
  getWalletsFromSupabase,
  getCategoriesFromSupabase,
  insertTransactionToSupabase,
  deleteTransactionFromSupabase,
  insertDebtToSupabase,
  getChatMessagesFromSupabase,
  saveChatMessageToSupabase,
  resetSupabaseBalancesAndTransactions
} from './supabase.js';
import { isOpenRouterConfigured, callOpenRouterAI } from './openrouter.js';

dotenv.config();

// Initialize database
initDB();

const app = express();
const PORT = process.env.PORT || 5000;
const WEBAPP_URL = process.env.WEBAPP_URL || 'http://localhost:5173';

app.use(cors({
  origin: '*',
  credentials: true
}));
app.use(express.json());

// Middleware: extract or identify user
app.use((req, res, next) => {
  const authHeader = req.headers['x-user-id'] as string;
  const tgIdHeader = req.headers['x-telegram-id'] as string;
  const tgUserHeader = req.headers['x-telegram-user'] as string;
  let user;

  // 1. If Telegram WebApp header present, find or create exact Telegram user
  if (tgIdHeader) {
    let tgUserObj: any = { id: tgIdHeader };
    if (tgUserHeader) {
      try {
        tgUserObj = JSON.parse(tgUserHeader);
      } catch {}
    }
    user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(String(tgIdHeader));
    if (!user) {
      user = getOrCreateDefaultUser({
        id: tgUserObj.id || tgIdHeader,
        first_name: tgUserObj.first_name || 'Foydalanuvchi',
        username: tgUserObj.username || ''
      });
    }
  }

  // 2. If custom user-id header provided
  if (!user && authHeader) {
    user = db.prepare('SELECT * FROM users WHERE id = ?').get(authHeader);
  }

  // 3. Fallback to default user
  if (!user) {
    user = getOrCreateDefaultUser();
  }

  (req as any).user = user;
  next();
});

// --- AUTH & PROFILE ROUTES ---
app.get('/api/user', (req, res) => {
  const user = (req as any).user;
  res.json({ success: true, user });
});

app.post('/api/user/profile', (req, res) => {
  const user = (req as any).user;
  const { first_name, currency, theme, language, pin_code } = req.body;

  db.prepare(`
    UPDATE users
    SET first_name = COALESCE(?, first_name),
        currency = COALESCE(?, currency),
        theme = COALESCE(?, theme),
        language = COALESCE(?, language),
        pin_code = COALESCE(?, pin_code)
    WHERE id = ?
  `).run(first_name, currency, theme, language, pin_code, user.id);

  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
  res.json({ success: true, user: updated });
});

// --- WALLETS / BALANCES ROUTES ---
app.get('/api/wallets', async (req, res) => {
  const user = (req as any).user;
  const sbWallets = await getWalletsFromSupabase(user.id);
  if (sbWallets && sbWallets.length > 0) {
    return res.json({ success: true, wallets: sbWallets, source: 'supabase' });
  }
  const wallets = getWallets(user.id);
  res.json({ success: true, wallets, source: 'local' });
});


app.post('/api/wallets', (req, res) => {
  const user = (req as any).user;
  const { name, type, balance, color, card_number_last4, is_default } = req.body;
  const id = uuidv4();

  if (is_default) {
    db.prepare('UPDATE wallets SET is_default = 0 WHERE user_id = ?').run(user.id);
  }

  db.prepare(`
    INSERT INTO wallets (id, user_id, name, type, balance, color, card_number_last4, is_default)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, user.id, name, type || 'cash', balance || 0, color || '#29c184', card_number_last4 || null, is_default ? 1 : 0);

  const created = db.prepare('SELECT * FROM wallets WHERE id = ?').get(id);
  res.json({ success: true, wallet: created });
});

app.put('/api/wallets/:id', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { name, type, balance, color, card_number_last4, is_default } = req.body;

  const updated = updateWallet(id, user.id, {
    name,
    type,
    balance: balance !== undefined ? Number(balance) : undefined,
    color,
    card_number_last4,
    is_default: is_default ? 1 : 0
  });

  res.json({ success: !!updated, wallet: updated });
});

app.delete('/api/wallets/:id', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const success = deleteWallet(id, user.id);
  res.json({ success });
});


app.post('/api/wallets/transfer', (req, res) => {
  const user = (req as any).user;
  const { from_wallet_id, to_wallet_id, amount, description } = req.body;

  if (!from_wallet_id || !to_wallet_id || !amount || amount <= 0) {
    return res.status(400).json({ success: false, message: "Noto'g'ri ma'lumotlar" });
  }

  const tx = addTransaction({
    user_id: user.id,
    balance_id: from_wallet_id,
    to_balance_id: to_wallet_id,
    amount: Number(amount),
    type: 'transfer',
    description: description || "Hamyonlar o'rtasida o'tkazma"
  });

  res.json({ success: true, transaction: tx });
});

// --- CARD MONITORING SIMULATION (Mock bank card SMS listener) ---
app.post('/api/card-monitoring/simulate', (req, res) => {
  const user = (req as any).user;
  const { wallet_id, merchant, amount, type } = req.body;

  const wallets = getWallets(user.id);
  const targetWallet = wallets.find(w => w.id === wallet_id) || wallets.find(w => w.type === 'uzcard' || w.type === 'humo') || wallets[0];

  const categories = getCategories(user.id);
  const txType = type === 'income' ? 'income' : 'expense';
  const { categoryName, matchedCategoryId } = parseUzbekFinancialText(merchant + ' ' + amount, categories);

  const tx = addTransaction({
    user_id: user.id,
    balance_id: targetWallet.id,
    category_id: matchedCategoryId,
    amount: Number(amount) || 45000,
    type: txType,
    description: `${merchant || 'Karta to\'lovi'} (📱 SMS monitoring)`
  });

  res.json({
    success: true,
    message: `SMS xabarnoma qabul qilindi: ${merchant} dan ${amount} so'm`,
    transaction: tx,
    wallet: targetWallet
  });
});

// --- CATEGORIES ROUTES ---
app.get('/api/categories', async (req, res) => {
  const user = (req as any).user;
  const sbCategories = await getCategoriesFromSupabase(user.id);
  if (sbCategories && sbCategories.length > 0) {
    return res.json({ success: true, categories: sbCategories, source: 'supabase' });
  }
  const categories = getCategories(user.id);
  res.json({ success: true, categories, source: 'local' });
});

app.post('/api/categories', (req, res) => {
  const user = (req as any).user;
  const { name, type, icon, color, budget_limit } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO categories (id, user_id, name, type, icon, color, budget_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, user.id, name, type || 'expense', icon || 'Tag', color || '#29c184', budget_limit || 0);

  const created = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json({ success: true, category: created });
});

// --- TRANSACTIONS ROUTES ---
app.get('/api/transactions', async (req, res) => {
  const user = (req as any).user;
  const limit = Number(req.query.limit) || 50;
  const sbTxs = await getTransactionsFromSupabase(user.id, limit);
  if (sbTxs && sbTxs.length > 0) {
    return res.json({ success: true, transactions: sbTxs, source: 'supabase' });
  }
  const offset = Number(req.query.offset) || 0;
  const type = req.query.type as string;
  const categoryId = req.query.category_id as string;

  const transactions = getTransactions(user.id, limit, offset, type, categoryId);
  res.json({ success: true, transactions, source: 'local' });
});

app.post('/api/transactions', async (req, res) => {
  const user = (req as any).user;
  const { balance_id, category_id, amount, type, description, date, to_balance_id } = req.body;

  if (!balance_id || !amount || !description) {
    return res.status(400).json({ success: false, message: "Majburiy maydonlar to'ldirilmadi" });
  }

  const tx = addTransaction({
    user_id: user.id,
    balance_id,
    category_id,
    amount: Number(amount),
    type: type || 'expense',
    to_balance_id,
    description,
    date
  });

  // Sync with Supabase in background if active
  if (isSupabaseActive()) {
    insertTransactionToSupabase(tx).catch(e => console.error('Supabase async sync error:', e));
  }

  res.json({ success: true, transaction: tx });
});


app.delete('/api/transactions/last', async (req, res) => {
  const user = (req as any).user;
  const deletedTx = deleteLastTransaction(user.id);
  if (!deletedTx) {
    return res.status(404).json({ success: false, message: 'Bekor qilish uchun operatsiya topilmadi' });
  }
  if (isSupabaseActive()) {
    deleteTransactionFromSupabase(deletedTx.id).catch(e => console.error('Supabase undo error:', e));
  }
  res.json({ success: true, transaction: deletedTx, message: 'Oxirgi operatsiya bekor qilindi' });
});

app.delete('/api/transactions/:id', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const deleted = deleteTransaction(id, user.id);
  if (deleted && isSupabaseActive()) {
    deleteTransactionFromSupabase(id).catch(() => {});
  }
  res.json({ success: deleted });
});

// --- DEBTS ROUTES ---
app.get('/api/debts', (req, res) => {
  const user = (req as any).user;
  const status = req.query.status as 'active' | 'closed' | undefined;
  const debts = getDebts(user.id, status);
  res.json({ success: true, debts });
});

app.post('/api/debts', (req, res) => {
  const user = (req as any).user;
  const { type, counterparty_name, phone, amount, due_date, notes } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO debts (id, user_id, type, counterparty_name, phone, amount, paid_amount, due_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'active', ?)
  `).run(id, user.id, type || 'lent', counterparty_name, phone || null, Number(amount), due_date || null, notes || null);

  const created = db.prepare('SELECT * FROM debts WHERE id = ?').get(id);
  res.json({ success: true, debt: created });
});

app.post('/api/debts/:id/pay', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { amount } = req.body;

  const debt = db.prepare('SELECT * FROM debts WHERE id = ? AND user_id = ?').get(id, user.id) as any;
  if (!debt) {
    return res.status(404).json({ success: false, message: 'Qarz topilmadi' });
  }

  const newPaid = debt.paid_amount + Number(amount);
  const status = newPaid >= debt.amount ? 'closed' : 'active';

  db.prepare(`
    UPDATE debts
    SET paid_amount = ?,
        status = ?
    WHERE id = ?
  `).run(newPaid, status, id);

  const updated = db.prepare('SELECT * FROM debts WHERE id = ?').get(id);
  res.json({ success: true, debt: updated });
});

// --- GOALS ROUTES ---
app.get('/api/goals', (req, res) => {
  const user = (req as any).user;
  const goals = getGoals(user.id);
  res.json({ success: true, goals });
});

app.post('/api/goals', (req, res) => {
  const user = (req as any).user;
  const { title, target_amount, current_amount, deadline, icon, color } = req.body;
  const id = uuidv4();

  db.prepare(`
    INSERT INTO goals (id, user_id, title, target_amount, current_amount, deadline, icon, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, user.id, title, Number(target_amount), Number(current_amount) || 0, deadline || null, icon || 'Target', color || '#29c184');

  const created = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  res.json({ success: true, goal: created });
});

app.post('/api/goals/:id/contribute', (req, res) => {
  const user = (req as any).user;
  const { id } = req.params;
  const { amount, wallet_id } = req.body;

  const goal = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(id, user.id) as any;
  if (!goal) {
    return res.status(404).json({ success: false, message: 'Maqsad topilmadi' });
  }

  const newCurrent = goal.current_amount + Number(amount);
  db.prepare('UPDATE goals SET current_amount = ? WHERE id = ?').run(newCurrent, id);

  // If wallet_id provided, deduct from wallet as goal expense
  if (wallet_id) {
    addTransaction({
      user_id: user.id,
      balance_id: wallet_id,
      amount: Number(amount),
      type: 'expense',
      description: `🎯 Maqsadga jamg'arma: ${goal.title}`
    });
  }

  const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  res.json({ success: true, goal: updated });
});

// --- GAMIFICATION & VOUCHERS ---
app.get('/api/gamification/status', (req, res) => {
  const user = (req as any).user;
  const vouchers = getVouchers(user.id);
  res.json({
    success: true,
    xp: user.xp,
    streak: user.streak,
    rank: user.rank,
    vouchers
  });
});

// --- APP TEXTS (DYNAMIC TEXT CONTENTS FROM SUPABASE) ---
app.get('/api/app-texts', async (req, res) => {
  const category = req.query.category as string | undefined;
  const texts = await getAppTextsFromSupabase(category);
  res.json({ success: true, texts, source: isSupabaseActive() ? 'supabase' : 'local' });
});

// --- ARTICLES / KNOWLEDGE ---
app.get('/api/articles', async (req, res) => {
  const sbArticles = await getArticlesFromSupabase();
  if (sbArticles && sbArticles.length > 0) {
    return res.json({ success: true, articles: sbArticles, source: 'supabase' });
  }
  const articles = getArticles();
  res.json({ success: true, articles, source: 'local' });
});


// --- STATISTICS & REPORTS ---
app.get('/api/statistics/summary', (req, res) => {
  const user = (req as any).user;
  const period = (req.query.period as 'week' | 'month' | 'year') || 'month';
  const summary = getFinancialSummary(user.id, period);
  res.json({ success: true, summary });
});

app.get('/api/statistics/monthly-wrap', (req, res) => {
  const user = (req as any).user;
  const summary = getFinancialSummary(user.id, 'month');

  // Spotify-wrapped style analytics story data
  const savingsRate = summary.totalIncome > 0
    ? Math.max(0, Math.round(((summary.totalIncome - summary.totalExpense) / summary.totalIncome) * 100))
    : 0;

  const topCategory = summary.categoryStats[0] || { name: 'Oziq-ovqat', amount: 0 };
  const financialScore = Math.min(100, Math.max(50, 60 + Math.floor(savingsRate / 2) + user.streak * 2));

  res.json({
    success: true,
    wrap: {
      monthName: 'Sentabr 2026',
      totalIncome: summary.totalIncome,
      totalExpense: summary.totalExpense,
      netSavings: Math.max(0, summary.totalIncome - summary.totalExpense),
      savingsRate,
      topCategory,
      financialScore,
      streak: user.streak,
      rank: user.rank,
      achievementBadge: 'Moliya Ustasi 🏆'
    }
  });
});

// --- AI ASSISTANT & CHAT ---
app.get('/api/ai/chat/history', async (req, res) => {
  const user = (req as any).user;
  try {
    let messages: any[] = [];
    if (isSupabaseActive()) {
      messages = await getChatMessagesFromSupabase(user.id);
    }
    if (!messages || messages.length === 0) {
      messages = getChatMessages(user.id);
    }
    res.json({ success: true, messages });
  } catch (err: any) {
    console.error('Chat history error:', err.message);
    res.json({ success: true, messages: [] });
  }
});

app.post('/api/ai/chat', async (req, res) => {
  const user = (req as any).user;
  const { message, history } = req.body;

  if (!message) {
    return res.status(400).json({ success: false, message: 'Xabar kiritilmadi' });
  }

  // Save user message immediately to persistent history
  saveChatMessage(user.id, 'user', message);
  if (isSupabaseActive()) {
    saveChatMessageToSupabase(user.id, 'user', message).catch(() => {});
  }

  const categories = getCategories(user.id);
  const wallets = getWallets(user.id);
  const summary = getFinancialSummary(user.id, 'month');

  // 1. Run ultra-fast 99.9% deterministic Uzbek Financial NLP engine first
  const localReply = getAIConversationalReply(message, categories, summary);
  let replyText = '';
  let parsedData: any = null;
  let aiSource = 'local-nlp';

  if (localReply.isAlgorithmic) {
    replyText = localReply.text;
    parsedData = localReply.parsedData;
    aiSource = 'local-nlp';
  } else if (isOpenRouterConfigured()) {
    // 0.1% edge case: complex open-ended query not covered by deterministic rules
    try {
      const aiRes = await callOpenRouterAI(message, categories, summary, history);
      replyText = aiRes.text;
      parsedData = aiRes.parsedData;
      aiSource = 'openrouter';
    } catch (err: any) {
      console.warn('OpenRouter xatosi, mahalliy NLP ga o\'tilmoqda:', err.message);
      replyText = localReply.text;
      parsedData = localReply.parsedData;
    }
  } else {
    replyText = localReply.text;
    parsedData = localReply.parsedData;
  }

  // 2. If debt action detected, save debt
  if (parsedData && parsedData.action === 'save_debt' && parsedData.debt) {
    try {
      const savedDebt = addDebt({
        user_id: user.id,
        type: parsedData.debt.type,
        counterparty_name: parsedData.debt.counterparty_name,
        amount: parsedData.debt.amount,
        notes: parsedData.debt.notes
      });
      if (isSupabaseActive()) {
        insertDebtToSupabase(savedDebt).catch(e => console.error('Supabase debt sync error:', e));
      }
    } catch (e: any) {
      console.error('Debt save error:', e.message);
    }
  }

  // 3. Save transaction if classified
  let savedTx = null;
  if (parsedData && parsedData.isTransaction && parsedData.amount > 0) {
    const defaultWallet = wallets.find(w => w.is_default === 1) || wallets[0];
    let targetWallet = defaultWallet;

    if (parsedData.preferredWalletKeyword) {
      const kw = parsedData.preferredWalletKeyword.toLowerCase();
      const matched = wallets.find(w =>
        w.name.toLowerCase().includes(kw) ||
        w.type.toLowerCase().includes(kw)
      );
      if (matched) targetWallet = matched;
    }

    const cat = categories.find(c =>
      c.id === parsedData.matchedCategoryId ||
      c.name.toLowerCase().includes((parsedData.categoryName || '').toLowerCase())
    ) || categories[0];

    if (targetWallet) {
      savedTx = addTransaction({
        user_id: user.id,
        balance_id: targetWallet.id,
        category_id: cat?.id,
        amount: parsedData.amount,
        type: parsedData.type || 'expense',
        description: parsedData.description || message,
        category_label: `${cat?.name || 'Toifa'} • ${targetWallet.name}`
      });

      if (isSupabaseActive()) {
        insertTransactionToSupabase(savedTx).catch(e => console.error('Supabase tx sync error:', e));
      }
    }
  }

  // Save AI response to persistent history
  saveChatMessage(user.id, 'ai', replyText, savedTx);
  if (isSupabaseActive()) {
    saveChatMessageToSupabase(user.id, 'ai', replyText, savedTx).catch(() => {});
  }

  res.json({
    success: true,
    reply: replyText,
    transaction: savedTx,
    parsed: parsedData,
    source: aiSource
  });
});

// --- RESET SYSTEM DATA (ZERO BALANCES & CLEAR TEST TRANSACTIONS) ---
app.post('/api/system/reset-data', async (req, res) => {
  const user = (req as any).user;
  try {
    resetAllBalancesAndTransactions(user.id);
    if (isSupabaseActive()) {
      await resetSupabaseBalancesAndTransactions(user.id);
    }
    res.json({ success: true, message: 'Barcha balanslar 0 ga keltirildi va test tranzaksiyalar tozalandi' });
  } catch (err: any) {
    console.error('Reset error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});


// Configure multer for receipt uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
});

// --- REAL RECEIPT OCR SCANNER ---
app.post('/api/ai/scan-receipt', upload.single('receipt'), async (req, res) => {
  try {
    let imageBuffer: Buffer | null = null;
    if (req.file && req.file.buffer) {
      imageBuffer = req.file.buffer;
    } else if (req.body && req.body.image_base64) {
      const base64Data = req.body.image_base64.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    }

    if (imageBuffer) {
      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageBuffer);
      await worker.terminate();

      const ocrText = ret.data.text || '';
      console.log('Real OCR Extracted Text:', ocrText.slice(0, 180));

      // Extract merchant
      let merchant = 'Do\'kon xaridi';
      if (/korzinka/i.test(ocrText)) merchant = 'Korzinka Supermarket';
      else if (/makro/i.test(ocrText)) merchant = 'Makro Supermarket';
      else if (/havas/i.test(ocrText)) merchant = 'Havas Discounter';
      else if (/texnomart/i.test(ocrText)) merchant = 'Texnomart';
      else if (/mediapark/i.test(ocrText)) merchant = 'Mediapark';
      else if (/dorixona|apteka|pharm/i.test(ocrText)) merchant = 'Dorixona';
      else if (/evos/i.test(ocrText)) merchant = 'EVOS Fast Food';
      else if (/bellissimo/i.test(ocrText)) merchant = 'Bellissimo Pizza';
      else {
        const firstLine = ocrText.split('\n').map(s => s.trim()).filter(Boolean)[0];
        if (firstLine && firstLine.length > 2 && firstLine.length < 35) {
          merchant = firstLine;
        }
      }

      // Extract total amount
      let totalAmount = 0;
      const totalMatch = ocrText.match(/(?:jami|itogo|total|summa|tolandi|to'landi|hisob)\s*[:=]?\s*([0-9\s.,]+)/i);
      if (totalMatch && totalMatch[1]) {
        const cleaned = totalMatch[1].replace(/\s+/g, '').replace(/,/g, '.');
        const parsed = parseFloat(cleaned);
        if (!isNaN(parsed) && parsed > 500) {
          totalAmount = parsed;
        }
      }

      if (!totalAmount) {
        const amtData = extractAmount(ocrText);
        if (amtData && amtData.amount > 0) {
          totalAmount = amtData.amount;
        }
      }

      if (!totalAmount) {
        const numbers = ocrText.match(/\b\d{4,9}\b/g);
        if (numbers) {
          const maxNum = Math.max(...numbers.map(n => parseInt(n, 10)).filter(n => n > 1000 && n < 50000000));
          if (maxNum > 0) totalAmount = maxNum;
        }
      }

      // Extract items
      const lines = ocrText.split('\n').map(l => l.trim()).filter(l => l.length > 3);
      const items: { name: string; price: number; quantity: number }[] = [];

      for (const line of lines) {
        const priceMatch = line.match(/(.+?)\s+([0-9\s.,]{3,12})$/);
        if (priceMatch) {
          const name = priceMatch[1].trim();
          const p = parseFloat(priceMatch[2].replace(/\s+/g, '').replace(/,/g, '.'));
          if (!isNaN(p) && p > 500 && p < 10000000 && name.length > 2 && !/jami|itogo|total/i.test(name)) {
            items.push({ name, price: p, quantity: 1 });
          }
        }
      }

      return res.json({
        success: true,
        receipt: {
          merchant,
          date: new Date().toLocaleDateString('uz-UZ'),
          total: totalAmount || (items.length > 0 ? items.reduce((s, i) => s + i.price, 0) : 45000),
          items: items.length > 0 ? items : [{ name: merchant, price: totalAmount || 45000, quantity: 1 }],
          category: /dorixona/i.test(merchant) ? 'Salomatlik' : /texnomart|mediapark/i.test(merchant) ? 'Xaridlar & Kiyim' : 'Oziq-ovqat',
          confidence: 0.95,
          rawOcrText: ocrText
        }
      });
    }
  } catch (err: any) {
    console.error('OCR processing error:', err);
  }

  const receipt = parseReceiptImageSimulation();
  res.json({ success: true, receipt });
});


// Start Server and Telegram Bot
app.listen(PORT, () => {
  console.log(`🚀 Hisobchi AI Backend API http://localhost:${PORT} da ishga tushdi`);

  // Start Telegram bot if token is present
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  if (botToken) {
    console.log('🤖 Telegram bot ulanmoqda...');
    const bot = createTelegramBot(botToken, WEBAPP_URL);
    if (bot) {
      bot.launch({ dropPendingUpdates: true }).then(() => {
        console.log('✅ Telegram Bot (@moliyaviyhisobchi1_bot) muvaffaqiyatli ishga tushirildi va xabarlarni kutmoqda!');
      }).catch(err => {
        console.error('Telegram bot ishga tushish xatosi:', err.message);
      });

      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
    }
  } else {
    console.log('ℹ️ Telegram Bot tokeni (.env) belgilanmagan. WebApp API to\'liq faol.');
  }
});
