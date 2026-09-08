import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { User, Wallet, Category, Transaction, Debt, Goal, Voucher, Article } from './types.js';

const dataDir = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'hisobchi.db');
export const db = new Database(dbPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      telegram_id TEXT UNIQUE,
      first_name TEXT NOT NULL,
      username TEXT,
      currency TEXT DEFAULT 'UZS',
      theme TEXT DEFAULT 'dark',
      language TEXT DEFAULT 'uz',
      pin_code TEXT,
      xp INTEGER DEFAULT 365,
      diamonds INTEGER DEFAULT 365,
      streak INTEGER DEFAULT 1,
      rank TEXT DEFAULT 'bronze',
      last_active_date TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS wallets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      balance REAL DEFAULT 0,
      currency TEXT DEFAULT 'UZS',
      color TEXT NOT NULL,
      card_number_last4 TEXT,
      is_default INTEGER DEFAULT 0,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      budget_limit REAL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      balance_id TEXT NOT NULL,
      category_id TEXT,
      amount REAL NOT NULL,
      type TEXT NOT NULL,
      to_balance_id TEXT,
      description TEXT NOT NULL,
      category_label TEXT,
      time_str TEXT,
      date TEXT NOT NULL,
      receipt_image TEXT,
      tags TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (balance_id) REFERENCES wallets(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS debts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      counterparty_name TEXT NOT NULL,
      phone TEXT,
      amount REAL NOT NULL,
      paid_amount REAL DEFAULT 0,
      due_date TEXT,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline TEXT,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS vouchers (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      code TEXT NOT NULL,
      discount TEXT NOT NULL,
      is_used INTEGER DEFAULT 0,
      expires_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      read_time TEXT NOT NULL,
      summary TEXT NOT NULL,
      content TEXT NOT NULL,
      image_url TEXT NOT NULL,
      date TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      text TEXT NOT NULL,
      transaction_data TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Seed default articles
  const articlesCount = (db.prepare('SELECT COUNT(*) as count FROM articles').get() as { count: number }).count;
  if (articlesCount === 0) {
    seedArticles();
  }
}

function seedArticles() {
  const sampleArticles = [
    {
      id: 'art-1',
      title: "50/30/20 qoidasi: Maoshingizni qanday to'g'ri taqsimlash kerak?",
      category: 'Moliyaviy savodxonlik',
      read_time: '4 daqiqa',
      summary: "Ushbu mashhur qoida orqali daromadingizning 50%ini ehtiyojlarga, 30%ini istaklarga, 20%ini esa jamg'armaga ajratishni o'rganing.",
      content: `Moliyaviy barqarorlikka erishishning eng ishonchli usullaridan biri — 50/30/20 qoidasidir.\n1. **50% — Asosiy ehtiyojlar**: Ijara, oziq-ovqat, kommunal to'lovlar, transport.\n2. **30% — Xohish va istaklar**: Kafe va restoranlar, sayohatlar, yangi kiyimlar.\n3. **20% — Jamg'arma va qarzlar**: Favqulodda vaziyatlar fondi va investitsiya.`,
      image_url: 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=600&q=80',
      date: '2026-09-01'
    },
    {
      id: 'art-2',
      title: "Kundalik xarajatlarni hisobga olib borish nega muhim?",
      category: 'Tejamkorlik',
      read_time: '3 daqiqa',
      summary: "Kichik mayda xarajatlar oy oxirida katta summaga aylanishi mumkin. Buni qanday nazorat qilish mumkin?",
      content: `Har bir xarajatni qayd etib borish pul ustidan 100% nazorat o'rnatishga va tejashni 20-30% ga oshirishga imkon beradi.`,
      image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80',
      date: '2026-09-03'
    }
  ];

  const insert = db.prepare(`
    INSERT INTO articles (id, title, category, read_time, summary, content, image_url, date)
    VALUES (@id, @title, @category, @read_time, @summary, @content, @image_url, @date)
  `);
  for (const art of sampleArticles) {
    insert.run(art);
  }
}

export function getOrCreateDefaultUser(telegramUser?: { id: string | number; first_name?: string; username?: string }): User {
  let user: User | undefined;

  if (telegramUser?.id) {
    user = db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(String(telegramUser.id)) as User | undefined;
    if (!user) {
      // Check if primary user exists and link telegram_id to it, or create new
      const existingPrimary = db.prepare('SELECT * FROM users ORDER BY created_at ASC LIMIT 1').get() as User | undefined;
      if (existingPrimary && !existingPrimary.telegram_id) {
        db.prepare('UPDATE users SET telegram_id = ?, first_name = COALESCE(?, first_name), username = COALESCE(?, username) WHERE id = ?')
          .run(String(telegramUser.id), telegramUser.first_name, telegramUser.username, existingPrimary.id);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(existingPrimary.id) as User;
      } else {
        const newId = uuidv4();
        db.prepare(`
          INSERT INTO users (id, telegram_id, first_name, username, currency, theme, language, xp, streak, rank, diamonds)
          VALUES (?, ?, ?, ?, 'UZS', 'dark', 'uz', 365, 1, 'bronze', 365)
        `).run(newId, String(telegramUser.id), telegramUser.first_name || 'Mansurxon', telegramUser.username || '');
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(newId) as User;
        createDefaultDataForUser(newId);
      }
    }
  } else {
    user = db.prepare('SELECT * FROM users ORDER BY created_at ASC LIMIT 1').get() as User | undefined;
    if (!user) {
      const newId = 'user-mansurxon';
      db.prepare(`
        INSERT INTO users (id, telegram_id, first_name, username, currency, theme, language, xp, streak, rank, diamonds)
        VALUES (?, NULL, 'Mansurxon', 'mansurxon_ai', 'UZS', 'dark', 'uz', 365, 1, 'bronze', 365)
      `).run(newId);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(newId) as User;
      createDefaultDataForUser(newId);
    }
  }

  return user;
}

export function createDefaultDataForUser(userId: string) {
  // 1. Wallets matching exact screenshot:
  // Investitsiya: 13 677,62 UZS (purple)
  // Asosiy karta: 0 UZS (teal)
  // Naqd pul: 21 000 UZS (green)
  // Dollar: 0 USD (blue)
  const wallets = [
    { id: uuidv4(), user_id: userId, name: 'Investitsiya', type: 'invest', balance: 0, currency: 'UZS', color: '#7a5af8', card_number_last4: null, is_default: 0 },
    { id: uuidv4(), user_id: userId, name: 'Asosiy karta', type: 'uzcard', balance: 0, currency: 'UZS', color: '#23a887', card_number_last4: '8600', is_default: 1 },
    { id: uuidv4(), user_id: userId, name: 'Naqd pul', type: 'cash', balance: 0, currency: 'UZS', color: '#38a169', card_number_last4: null, is_default: 0 },
    { id: uuidv4(), user_id: userId, name: 'Dollar', type: 'visa', balance: 0, currency: 'USD', color: '#3182ce', card_number_last4: '4100', is_default: 0 }
  ];

  const insertWallet = db.prepare(`
    INSERT INTO wallets (id, user_id, name, type, balance, currency, color, card_number_last4, is_default)
    VALUES (@id, @user_id, @name, @type, @balance, @currency, @color, @card_number_last4, @is_default)
  `);
  wallets.forEach(w => insertWallet.run(w));

  // 2. Categories
  const categories = [
    { id: uuidv4(), user_id: userId, name: 'Balansni o\'zgartirish', type: 'expense', icon: 'RefreshCw', color: '#7a5af8', budget_limit: 0 },
    { id: uuidv4(), user_id: userId, name: 'Jamg\'arma va investitsiyalar', type: 'expense', icon: 'PiggyBank', color: '#23a887', budget_limit: 0 },
    { id: uuidv4(), user_id: userId, name: 'Kredit va Nasiya savdo', type: 'expense', icon: 'CreditCard', color: '#ff8d28', budget_limit: 0 },
    { id: uuidv4(), user_id: userId, name: 'Aniqlanmagan', type: 'income', icon: 'HelpCircle', color: '#3182ce', budget_limit: 0 },
    { id: uuidv4(), user_id: userId, name: 'Kiyim-kechak', type: 'expense', icon: 'Shirt', color: '#ec4899', budget_limit: 2000000 },
    { id: uuidv4(), user_id: userId, name: 'Qarzlar', type: 'expense', icon: 'HandCoins', color: '#29c184', budget_limit: 0 },
    { id: uuidv4(), user_id: userId, name: 'Boshqa daromadlar', type: 'income', icon: 'DollarSign', color: '#10b981', budget_limit: 0 },
    { id: uuidv4(), user_id: userId, name: 'Oziq-ovqat', type: 'expense', icon: 'Utensils', color: '#29c184', budget_limit: 2500000 },
    { id: uuidv4(), user_id: userId, name: 'Transport & Benzin', type: 'expense', icon: 'Car', color: '#1570ef', budget_limit: 800000 }
  ];

  const insertCategory = db.prepare(`
    INSERT INTO categories (id, user_id, name, type, icon, color, budget_limit)
    VALUES (@id, @user_id, @name, @type, @icon, @color, @budget_limit)
  `);
  categories.forEach(c => insertCategory.run(c));
}

export function addTransaction(params: {
  user_id: string;
  balance_id: string;
  category_id?: string;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  to_balance_id?: string;
  description: string;
  category_label?: string;
  time_str?: string;
  date?: string;
  receipt_image?: string;
  tags?: string;
}): Transaction {
  const id = uuidv4();
  const txDate = params.date || new Date().toISOString();
  const nowTime = params.time_str || new Date().toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  const insert = db.transaction(() => {
    db.prepare(`
      INSERT INTO transactions (id, user_id, balance_id, category_id, amount, type, to_balance_id, description, category_label, time_str, date, receipt_image, tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      params.user_id,
      params.balance_id,
      params.category_id || null,
      params.amount,
      params.type,
      params.to_balance_id || null,
      params.description,
      params.category_label || null,
      nowTime,
      txDate,
      params.receipt_image || null,
      params.tags || null
    );

    // Adjust wallet balance
    if (params.type === 'expense') {
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(params.amount, params.balance_id);
    } else if (params.type === 'income') {
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(params.amount, params.balance_id);
    } else if (params.type === 'transfer' && params.to_balance_id) {
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(params.amount, params.balance_id);
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(params.amount, params.to_balance_id);
    }

    db.prepare(`
      UPDATE users
      SET xp = xp + 15,
          diamonds = diamonds + 2,
          last_active_date = date('now')
      WHERE id = ?
    `).run(params.user_id);
  });

  insert();
  return getTransactionById(id)!;
}

export function deleteTransaction(id: string, userId: string): boolean {
  const tx = getTransactionById(id);
  if (!tx || tx.user_id !== userId) return false;

  const remove = db.transaction(() => {
    if (tx.type === 'expense') {
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(tx.amount, tx.balance_id);
    } else if (tx.type === 'income') {
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(tx.amount, tx.balance_id);
    } else if (tx.type === 'transfer' && tx.to_balance_id) {
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(tx.amount, tx.balance_id);
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(tx.amount, tx.to_balance_id);
    }
    db.prepare('DELETE FROM transactions WHERE id = ?').run(id);
  });

  remove();
  return true;
}

export function updateTransaction(
  id: string,
  userId: string,
  updates: {
    amount?: number;
    description?: string;
    category_id?: string;
    balance_id?: string;
    date?: string;
    type?: 'expense' | 'income' | 'transfer';
    to_balance_id?: string;
  }
): Transaction | null {
  const oldTx = getTransactionById(id);
  if (!oldTx || oldTx.user_id !== userId) return null;

  const newAmount = updates.amount !== undefined ? Number(updates.amount) : oldTx.amount;
  const newType = updates.type || oldTx.type;
  const newBalanceId = updates.balance_id || oldTx.balance_id;
  const newCategoryId = updates.category_id !== undefined ? updates.category_id : oldTx.category_id;
  const newDescription = updates.description !== undefined ? updates.description : oldTx.description;
  const newDate = updates.date || oldTx.date;
  const newToBalanceId = updates.to_balance_id !== undefined ? updates.to_balance_id : oldTx.to_balance_id;

  let catName = 'Toifa';
  if (newCategoryId) {
    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(newCategoryId) as any;
    if (cat) catName = cat.name;
  }
  let walletName = 'Hamyon';
  if (newBalanceId) {
    const wal = db.prepare('SELECT name FROM wallets WHERE id = ?').get(newBalanceId) as any;
    if (wal) walletName = wal.name;
  }
  const newCategoryLabel = `${catName} • ${walletName}`;

  const update = db.transaction(() => {
    // 1. Revert old transaction wallet balance impact
    if (oldTx.type === 'expense') {
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(oldTx.amount, oldTx.balance_id);
    } else if (oldTx.type === 'income') {
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(oldTx.amount, oldTx.balance_id);
    } else if (oldTx.type === 'transfer' && oldTx.to_balance_id) {
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(oldTx.amount, oldTx.balance_id);
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(oldTx.amount, oldTx.to_balance_id);
    }

    // 2. Apply new transaction wallet balance impact
    if (newType === 'expense') {
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(newAmount, newBalanceId);
    } else if (newType === 'income') {
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(newAmount, newBalanceId);
    } else if (newType === 'transfer' && newToBalanceId) {
      db.prepare('UPDATE wallets SET balance = balance - ? WHERE id = ?').run(newAmount, newBalanceId);
      db.prepare('UPDATE wallets SET balance = balance + ? WHERE id = ?').run(newAmount, newToBalanceId);
    }

    // 3. Update transaction row
    db.prepare(`
      UPDATE transactions
      SET amount = ?,
          type = ?,
          balance_id = ?,
          category_id = ?,
          description = ?,
          category_label = ?,
          date = ?,
          to_balance_id = ?
      WHERE id = ? AND user_id = ?
    `).run(
      newAmount,
      newType,
      newBalanceId,
      newCategoryId || null,
      newDescription,
      newCategoryLabel,
      newDate,
      newToBalanceId || null,
      id,
      userId
    );
  });

  update();
  return getTransactionById(id) || null;
}

export function getTransactionById(id: string): Transaction | undefined {
  return db.prepare(`
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           w.name as wallet_name, w.type as wallet_type
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN wallets w ON t.balance_id = w.id
    WHERE t.id = ?
  `).get(id) as Transaction | undefined;
}

export function getTransactions(userId: string, limit = 50, offset = 0, type?: string, categoryId?: string): Transaction[] {
  let query = `
    SELECT t.*, c.name as category_name, c.icon as category_icon, c.color as category_color,
           w.name as wallet_name, w.type as wallet_type
    FROM transactions t
    LEFT JOIN categories c ON t.category_id = c.id
    LEFT JOIN wallets w ON t.balance_id = w.id
    WHERE t.user_id = ?
  `;
  const params: (string | number)[] = [userId];

  if (type) {
    query += ' AND t.type = ?';
    params.push(type);
  }
  if (categoryId) {
    query += ' AND t.category_id = ?';
    params.push(categoryId);
  }

  query += ' ORDER BY t.date DESC, t.created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params) as Transaction[];
}

export function getWallets(userId: string): Wallet[] {
  return db.prepare('SELECT * FROM wallets WHERE user_id = ? ORDER BY is_default DESC, created_at ASC').all(userId) as Wallet[];
}

export function updateWallet(id: string, userId: string, updates: Partial<Wallet>): Wallet | undefined {
  const current = db.prepare('SELECT * FROM wallets WHERE id = ? AND user_id = ?').get(id, userId) as Wallet | undefined;
  if (!current) return undefined;

  if (updates.is_default === 1) {
    db.prepare('UPDATE wallets SET is_default = 0 WHERE user_id = ?').run(userId);
  }

  db.prepare(`
    UPDATE wallets
    SET name = COALESCE(?, name),
        type = COALESCE(?, type),
        balance = COALESCE(?, balance),
        currency = COALESCE(?, currency),
        color = COALESCE(?, color),
        card_number_last4 = COALESCE(?, card_number_last4),
        is_default = COALESCE(?, is_default)
    WHERE id = ? AND user_id = ?
  `).run(
    updates.name ?? null,
    updates.type ?? null,
    updates.balance !== undefined ? updates.balance : null,
    updates.currency ?? null,
    updates.color ?? null,
    updates.card_number_last4 ?? null,
    updates.is_default !== undefined ? updates.is_default : null,
    id,
    userId
  );

  return db.prepare('SELECT * FROM wallets WHERE id = ?').get(id) as Wallet;
}

export function deleteWallet(id: string, userId: string): boolean {
  const wallet = db.prepare('SELECT * FROM wallets WHERE id = ? AND user_id = ?').get(id, userId);
  if (!wallet) return false;
  db.prepare('DELETE FROM wallets WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

export function transferBetweenWallets(params: {
  userId: string;
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  description?: string;
}) {
  const fromW = db.prepare('SELECT * FROM wallets WHERE id = ? AND user_id = ?').get(params.fromWalletId, params.userId) as Wallet;
  const toW = db.prepare('SELECT * FROM wallets WHERE id = ? AND user_id = ?').get(params.toWalletId, params.userId) as Wallet;

  if (!fromW || !toW) {
    throw new Error("Hamyonlar topilmadi");
  }

  return addTransaction({
    user_id: params.userId,
    balance_id: params.fromWalletId,
    to_balance_id: params.toWalletId,
    amount: params.amount,
    type: 'transfer',
    description: params.description || `${fromW.name} ➡️ ${toW.name} o'tkazma`,
    category_label: `${fromW.name} ➡️ ${toW.name}`
  });
}


export function updateCategory(
  id: string,
  userId: string,
  updates: { name?: string; type?: string; icon?: string; color?: string; budget_limit?: number }
): Category | null {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(id, userId) as Category | undefined;
  if (!cat) return null;

  db.prepare(`
    UPDATE categories
    SET name = COALESCE(?, name),
        type = COALESCE(?, type),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        budget_limit = COALESCE(?, budget_limit)
    WHERE id = ? AND user_id = ?
  `).run(
    updates.name ?? null,
    updates.type ?? null,
    updates.icon ?? null,
    updates.color ?? null,
    updates.budget_limit !== undefined ? updates.budget_limit : null,
    id,
    userId
  );

  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as Category;
}

export function deleteCategory(id: string, userId: string): boolean {
  const cat = db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(id, userId);
  if (!cat) return false;
  db.prepare('UPDATE transactions SET category_id = NULL WHERE category_id = ? AND user_id = ?').run(id, userId);
  db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

export function getCategories(userId: string): Category[] {
  return db.prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY type ASC, name ASC').all(userId) as Category[];
}

export function getDebts(userId: string, status?: 'active' | 'closed'): Debt[] {
  if (status) {
    return db.prepare('SELECT * FROM debts WHERE user_id = ? AND status = ? ORDER BY due_date ASC, created_at DESC').all(userId, status) as Debt[];
  }
  return db.prepare('SELECT * FROM debts WHERE user_id = ? ORDER BY due_date ASC, created_at DESC').all(userId) as Debt[];
}

export function addDebt(params: {
  user_id: string;
  type: 'lent' | 'borrowed';
  counterparty_name: string;
  amount: number;
  phone?: string;
  due_date?: string;
  notes?: string;
}): Debt {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO debts (id, user_id, type, counterparty_name, phone, amount, paid_amount, due_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, 0, ?, 'active', ?)
  `).run(id, params.user_id, params.type, params.counterparty_name, params.phone || null, params.amount, params.due_date || null, params.notes || null);

  return db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as Debt;
}

export function updateDebt(
  id: string,
  userId: string,
  updates: {
    type?: 'lent' | 'borrowed';
    counterparty_name?: string;
    phone?: string;
    amount?: number;
    due_date?: string;
    notes?: string;
    status?: string;
  }
): Debt | null {
  const debt = db.prepare('SELECT * FROM debts WHERE id = ? AND user_id = ?').get(id, userId) as Debt | undefined;
  if (!debt) return null;

  db.prepare(`
    UPDATE debts
    SET type = COALESCE(?, type),
        counterparty_name = COALESCE(?, counterparty_name),
        phone = COALESCE(?, phone),
        amount = COALESCE(?, amount),
        due_date = COALESCE(?, due_date),
        notes = COALESCE(?, notes),
        status = COALESCE(?, status)
    WHERE id = ? AND user_id = ?
  `).run(
    updates.type ?? null,
    updates.counterparty_name ?? null,
    updates.phone ?? null,
    updates.amount !== undefined ? updates.amount : null,
    updates.due_date ?? null,
    updates.notes ?? null,
    updates.status ?? null,
    id,
    userId
  );

  return db.prepare('SELECT * FROM debts WHERE id = ?').get(id) as Debt;
}

export function deleteDebt(id: string, userId: string): boolean {
  const debt = db.prepare('SELECT * FROM debts WHERE id = ? AND user_id = ?').get(id, userId);
  if (!debt) return false;
  db.prepare('DELETE FROM debts WHERE id = ? AND user_id = ?').run(id, userId);
  return true;
}

export function deleteLastTransaction(userId: string): Transaction | null {
  const lastTx = db.prepare('SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1').get(userId) as Transaction | undefined;
  if (!lastTx) return null;
  const success = deleteTransaction(lastTx.id, userId);
  return success ? lastTx : null;
}

export function getGoals(userId: string): Goal[] {
  return db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC').all(userId) as Goal[];
}

export function getVouchers(userId: string): Voucher[] {
  return db.prepare('SELECT * FROM vouchers WHERE user_id = ? ORDER BY is_used ASC, expires_at ASC').all(userId) as Voucher[];
}

export function getArticles(): Article[] {
  return db.prepare('SELECT * FROM articles ORDER BY date DESC').all() as Article[];
}

export function getFinancialSummary(userId: string, period: 'week' | 'month' | 'year' = 'month') {
  const wallets = getWallets(userId);
  const totalBalance = wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12850 : w.balance), 0);

  const totals = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income
    FROM transactions
    WHERE user_id = ?
  `).get(userId) as { total_expense: number; total_income: number };

  const categoryStats = db.prepare(`
    SELECT c.id, c.name, c.icon, c.color, COALESCE(SUM(t.amount), 0) as amount, COUNT(t.id) as count
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id AND t.user_id = ? AND t.type = 'expense'
    WHERE c.user_id = ? AND c.type = 'expense'
    GROUP BY c.id
    HAVING amount > 0
    ORDER BY amount DESC
  `).all(userId, userId) as { id: string; name: string; icon: string; color: string; amount: number; count: number }[];

  const dailyPoints = db.prepare(`
    SELECT date(date) as day,
           COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expense,
           COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income
    FROM transactions
    WHERE user_id = ?
    GROUP BY date(date)
    ORDER BY day ASC
  `).all(userId) as { day: string; expense: number; income: number }[];

  return {
    totalBalance,
    totalExpense: totals.total_expense,
    totalIncome: totals.total_income,
    categoryStats,
    dailyPoints,
    period
  };
}

export interface ChatMessageRecord {
  id: string;
  user_id: string;
  sender: 'user' | 'ai';
  text: string;
  transaction_data?: string | null;
  created_at?: string;
}

export function getChatMessages(userId: string): ChatMessageRecord[] {
  try {
    return db.prepare('SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC').all(userId) as ChatMessageRecord[];
  } catch (err: any) {
    console.error('getChatMessages error:', err.message);
    return [];
  }
}

export function saveChatMessage(userId: string, sender: 'user' | 'ai', text: string, txData?: any): ChatMessageRecord {
  const id = uuidv4();
  const txDataStr = txData ? JSON.stringify(txData) : null;
  db.prepare(`
    INSERT INTO chat_messages (id, user_id, sender, text, transaction_data, created_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'))
  `).run(id, userId, sender, text, txDataStr);

  return { id, user_id: userId, sender, text, transaction_data: txDataStr, created_at: new Date().toISOString() };
}

export function resetAllBalancesAndTransactions(userId?: string) {
  if (userId) {
    db.prepare('UPDATE wallets SET balance = 0 WHERE user_id = ?').run(userId);
    db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
  } else {
    db.prepare('UPDATE wallets SET balance = 0').run();
    db.prepare('DELETE FROM transactions').run();
  }
}
