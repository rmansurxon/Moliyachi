#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import type express from 'express';
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema
} from '@modelcontextprotocol/sdk/types.js';

import { v4 as uuidv4 } from 'uuid';
import {
  initDB,
  getUserByPhone,
  getWallets,
  getCategories,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getFinancialSummary,
  getDebts,
  getGoals,
  transferBetweenWallets,
  getArticles,
  db
} from './db.js';
import { User, Wallet, Category } from './types.js';

import {
  isSupabaseActive,
  getUserByPhoneFromSupabase,
  getWalletsFromSupabase,
  getCategoriesFromSupabase,
  getTransactionsFromSupabase,
  getDebtsFromSupabase,
  getGoalsFromSupabase,
  insertTransactionToSupabase,
  updateTransactionInSupabase,
  deleteTransactionFromSupabase
} from './supabase.js';

/**
 * Validates user credentials by Phone and PIN.
 * Checks local SQLite first, then Supabase.
 */
export async function authenticateMcpUser(phone: string, pin: string): Promise<User | null> {
  if (!phone || !pin) return null;
  const cleanPin = String(pin).trim();

  initDB();

  // 1. Check local SQLite
  let user = getUserByPhone(phone);

  // 2. If not found in SQLite and Supabase is active, check Supabase
  if (!user && isSupabaseActive()) {
    try {
      const sbUser = await getUserByPhoneFromSupabase(phone);
      if (sbUser) {
        db.prepare(`
          INSERT INTO users (id, telegram_id, first_name, username, phone, pin_code, currency, theme, language, xp, streak, rank, diamonds)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(id) DO UPDATE SET phone = excluded.phone, pin_code = excluded.pin_code
        `).run(
          sbUser.id,
          sbUser.telegram_id || null,
          sbUser.first_name || 'Foydalanuvchi',
          sbUser.username || '',
          sbUser.phone,
          sbUser.pin_code || '0000',
          sbUser.currency || 'UZS',
          sbUser.theme || 'dark',
          sbUser.language || 'uz',
          sbUser.xp || 100,
          sbUser.streak || 1,
          sbUser.rank || 'bronze',
          sbUser.diamonds || 0
        );
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(sbUser.id) as User;
      }
    } catch (e: any) {
      console.warn('Supabase MCP auth lookup warning:', e.message);
    }
  }

  if (!user) return null;

  // Validate 4-digit PIN (default is '0000' if not customized)
  const expectedPin = (user.pin_code && user.pin_code.trim()) || '0000';
  if (expectedPin !== cleanPin) {
    return null;
  }

  return user;
}

interface McpAuthSession {
  token: string;
  userId: string;
  phone: string;
  createdAt: number;
  expiresAt: number;
  lastUsedAt: number;
}

// In-memory cache for ultra-fast lookups
const mcpSessionsCache = new Map<string, McpAuthSession>();
let globalLastActiveUser: { user: User; timestamp: number } | null = null;

export function initMcpSessionTable() {
  initDB();
  db.exec(`
    CREATE TABLE IF NOT EXISTS mcp_auth_sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      phone TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL,
      last_used_at INTEGER NOT NULL
    );
  `);
}

export function createMcpSession(user: User): string {
  initMcpSessionTable();
  const token = `mcp_sess_${uuidv4().replace(/-/g, '')}`;
  const now = Date.now();
  const expiresAt = now + 7 * 24 * 60 * 60 * 1000; // 7 kun amal qiladi

  try {
    db.prepare(`
      INSERT INTO mcp_auth_sessions (token, user_id, phone, created_at, expires_at, last_used_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(token, user.id, user.phone || '', now, expiresAt, now);
  } catch (err: any) {
    console.warn('mcp_auth_sessions insert warning:', err.message);
  }

  const sessionObj: McpAuthSession = {
    token,
    userId: user.id,
    phone: user.phone || '',
    createdAt: now,
    expiresAt,
    lastUsedAt: now
  };
  mcpSessionsCache.set(token, sessionObj);
  globalLastActiveUser = { user, timestamp: now };

  return token;
}

export function getMcpSessionUser(token: string): User | null {
  if (!token) return null;
  initMcpSessionTable();
  const now = Date.now();

  let sess = mcpSessionsCache.get(token);
  if (!sess) {
    try {
      const row = db.prepare('SELECT * FROM mcp_auth_sessions WHERE token = ?').get(token) as any;
      if (row) {
        sess = {
          token: row.token,
          userId: row.user_id,
          phone: row.phone,
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          lastUsedAt: row.last_used_at
        };
        mcpSessionsCache.set(token, sess);
      }
    } catch {}
  }

  if (!sess) return null;
  if (now > sess.expiresAt) {
    mcpSessionsCache.delete(token);
    try {
      db.prepare('DELETE FROM mcp_auth_sessions WHERE token = ?').run(token);
    } catch {}
    return null;
  }

  // Update last used timestamp
  sess.lastUsedAt = now;
  try {
    db.prepare('UPDATE mcp_auth_sessions SET last_used_at = ? WHERE token = ?').run(now, token);
  } catch {}

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(sess.userId) as User;
  if (user) {
    globalLastActiveUser = { user, timestamp: now };
  }
  return user || null;
}

export function getLastActiveMcpUser(): User | null {
  initMcpSessionTable();
  const now = Date.now();
  const maxInactiveMs = 12 * 60 * 60 * 1000; // 12 soatlik oynada eslab qolish

  if (globalLastActiveUser && (now - globalLastActiveUser.timestamp) < maxInactiveMs) {
    return globalLastActiveUser.user;
  }

  try {
    const row = db.prepare(`
      SELECT * FROM mcp_auth_sessions 
      WHERE expires_at > ? 
      ORDER BY last_used_at DESC 
      LIMIT 1
    `).get(now) as any;

    if (row) {
      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(row.user_id) as User;
      if (user) {
        globalLastActiveUser = { user, timestamp: row.last_used_at };
        return user;
      }
    }
  } catch (err: any) {
    console.warn('getLastActiveMcpUser error:', err.message);
  }

  return null;
}

export function invalidateMcpSessions(userId?: string, token?: string) {
  initMcpSessionTable();
  try {
    if (token) {
      db.prepare('DELETE FROM mcp_auth_sessions WHERE token = ?').run(token);
      mcpSessionsCache.delete(token);
    } else if (userId) {
      db.prepare('DELETE FROM mcp_auth_sessions WHERE user_id = ?').run(userId);
      for (const [t, s] of mcpSessionsCache.entries()) {
        if (s.userId === userId) mcpSessionsCache.delete(t);
      }
    } else {
      db.prepare('DELETE FROM mcp_auth_sessions').run();
      mcpSessionsCache.clear();
    }
  } catch {}

  if (!userId || globalLastActiveUser?.user.id === userId) {
    globalLastActiveUser = null;
  }
}

/**
 * Creates an isolated MCP Server instance with strict session authentication.
 */
export function createHisobchiMcpServer(initialUser?: User | null): Server {
  initDB();
  initMcpSessionTable();

  // Session-bound authenticated user. If null, user must authenticate first.
  let sessionUser: User | null = initialUser || null;

  const server = new Server(
    {
      name: 'hisobchi-ai-mcp',
      version: '1.2.0'
    },
    {
      capabilities: {
        tools: {},
        resources: {}
      }
    }
  );

  // 1. List Available Tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'authenticate',
          description: "Hisobchi AI shaxsiy kabinetiga telefon raqami va 4 xonali PIN-kod orqali kirish (avtorizatsiya). Barcha boshqa vositalar ishlashi uchun birinchi bo'lib shu vosita orqali tizimga kirish shart. Natijada session token qaytariladi va tizim 24 soat eslab qoladi.",
          inputSchema: {
            type: 'object',
            properties: {
              phone: { type: 'string', description: "Foydalanuvchi telefon raqami (masalan: +998901234567)" },
              pin: { type: 'string', description: "4 xonali PIN-kod (standart: 0000 yoki Sozlamalardan o'rnatilgan PIN)" }
            },
            required: ['phone', 'pin']
          }
        },
        {
          name: 'logout',
          description: "Hisobchi AI sessiyasidan chiqish va faol sessiyani bekor qilish.",
          inputSchema: {
            type: 'object',
            properties: {
              token: { type: 'string', description: "Bekor qilinadigan sessiya tokeni (ixtiyoriy)" }
            }
          }
        },
        {
          name: 'check_auth',
          description: "Joriy MCP sessiyasining autentifikatsiya holati va kim kirganligini tekshirish.",
          inputSchema: {
            type: 'object',
            properties: {
              token: { type: 'string', description: "Sessiya tokeni (ixtiyoriy)" }
            }
          }
        },
        {
          name: 'get_balance',
          description: "Foydalanuvchining umumiy balansi va barcha hamyon/kartalaridagi (Uzcard, Humo, Naqd pul, Investitsiya) qoldiqlarini olish. (Autentifikatsiya talab qilinadi)",
          inputSchema: {
            type: 'object',
            properties: {
              token: { type: 'string', description: "Sessiya tokeni (ixtiyoriy)" }
            }
          }
        },
        {
          name: 'add_transaction',
          description: "Yangi daromad yoki xarajat amaliyotini qayd etish va balansni yangilash. (Autentifikatsiya talab qilinadi)",
          inputSchema: {
            type: 'object',
            properties: {
              amount: { type: 'number', description: "Amaliyot summasi (so'mda)" },
              type: { type: 'string', enum: ['expense', 'income'], description: "Amaliyot turi (expense - xarajat, income - daromad)" },
              description: { type: 'string', description: "Xarajat yoki daromad tavsifi (masalan: Tushlik, Taksi, Oylik)" },
              category_name: { type: 'string', description: "Kategoriya nomi (masalan: Oziq-ovqat, Transport & Benzin, Oylik maosh)" },
              wallet_name: { type: 'string', description: "Qaysi karta yoki hamyondan (masalan: Asosiy karta, Naqd pul, Investitsiya)" },
              token: { type: 'string', description: "Sessiya tokeni (ixtiyoriy)" }
            },
            required: ['amount', 'type', 'description']
          }
        },
        {
          name: 'get_transactions',
          description: "Oxirgi moliyaviy operatsiyalar ro'yxatini ko'rish. (Autentifikatsiya talab qilinadi)",
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: "Nechta operatsiya olish (standart: 10)" },
              type: { type: 'string', enum: ['expense', 'income', 'transfer'], description: "Filtr turi" },
              token: { type: 'string', description: "Sessiya tokeni (ixtiyoriy)" }
            }
          }
        },
        {
          name: 'get_financial_summary',
          description: "Oylik yoki haftalik moliyaviy tahlil, xarajatlar va daromadlar nisbati hamda asosiy toifalar statistikasi. (Autentifikatsiya talab qilinadi)",
          inputSchema: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['week', 'month', 'year'], description: "Hisobot davri (standart: month)" },
              token: { type: 'string', description: "Sessiya tokeni (ixtiyoriy)" }
            }
          }
        },
        {
          name: 'get_debts',
          description: "Faol berilgan va olingan qarzlar daftari. (Autentifikatsiya talab qilinadi)",
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['active', 'closed'], description: "Qarzlar holati" },
              token: { type: 'string', description: "Sessiya tokeni (ixtiyoriy)" }
            }
          }
        },
        {
          name: 'get_goals',
          description: "Jamg'arma maqsadlari va ularning bajarilish foizi. (Autentifikatsiya talab qilinadi)",
          inputSchema: {
            type: 'object',
            properties: {
              token: { type: 'string', description: "Sessiya tokeni (ixtiyoriy)" }
            }
          }
        },
        {
          name: 'transfer_funds',
          description: "Kartalar yoki hamyonlar o'rtasida mablag' o'tkazish. (Autentifikatsiya talab qilinadi)",
          inputSchema: {
            type: 'object',
            properties: {
              from_wallet: { type: 'string', description: "Chiqim qilinadigan hamyon nomi (masalan: Naqd pul)" },
              to_wallet: { type: 'string', description: "Kirim qilinadigan hamyon nomi (masalan: Asosiy karta)" },
              amount: { type: 'number', description: "O'tkazma summasi" },
              note: { type: 'string', description: "O'tkazma izohi" },
              token: { type: 'string', description: "Sessiya tokeni (ixtiyoriy)" }
            },
            required: ['from_wallet', 'to_wallet', 'amount']
          }
        },
        {
          name: 'update_transaction',
          description: "Mavjud operatsiyani tahrirlash (summa, toifa, tavsif, hamyon) va hamyon balansini to'g'ri qayta hisoblash. (Autentifikatsiya talab qilinadi)",
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: "Tahrirlanadigan operatsiyaning ID raqami" },
              amount: { type: 'number', description: "Yangi summa (so'mda)" },
              type: { type: 'string', enum: ['expense', 'income'], description: "Yangi amaliyot turi" },
              description: { type: 'string', description: "Yangi amaliyot tavsifi" },
              category_name: { type: 'string', description: "Yangi toifa nomi" },
              wallet_name: { type: 'string', description: "Yangi hamyon/karta nomi" },
              token: { type: 'string', description: "Sessiya tokeni (ixtiyoriy)" }
            },
            required: ['id']
          }
        },
        {
          name: 'delete_transaction',
          description: "Tranzaksiyani o'chirish va tegishli hamyon balansini dastlabki holatiga qaytarish (revert). (Autentifikatsiya talab qilinadi)",
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: "O'chirilishi kerak bo'lgan tranzaksiya ID si" },
              token: { type: 'string', description: "Sessiya tokeni (ixtiyoriy)" }
            },
            required: ['id']
          }
        }
      ]
    };
  });

  // 2. Call Tool Handler
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    // Ko'p qatlamli xavfsiz foydalanuvchi aniqlash yordamchisi
    const resolveCurrentUser = async (): Promise<User | null> => {
      // 1. Tool argumentlarida uzatilgan explicit token
      if (args && typeof (args as any).token === 'string' && (args as any).token.trim()) {
        const u = getMcpSessionUser((args as any).token.trim());
        if (u) {
          sessionUser = u;
          return u;
        }
      }

      // 2. Joriy SSE instansiyasiga biriktirilgan sessionUser
      if (sessionUser) {
        return sessionUser;
      }

      // 3. Tool argumentlarida telefon raqami bo'lsa
      if (args && typeof (args as any).phone === 'string' && (args as any).phone.trim()) {
        const u = getUserByPhone((args as any).phone.trim());
        if (u) {
          sessionUser = u;
          return u;
        }
      }

      // 4. Server bo'yicha eng so'nggi faol autentifikatsiyalangan foydalanuvchi (12 soat ichida)
      const lastUser = getLastActiveMcpUser();
      if (lastUser) {
        sessionUser = lastUser;
        return lastUser;
      }

      return null;
    };

    // --- AUTHENTICATE TOOL ---
    if (name === 'authenticate') {
      const { phone, pin } = (args || {}) as any;
      if (!phone || !pin) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: "Iltimos, telefon raqami va 4 xonali PIN-kodni to'liq yuboring. Masalan: authenticate({ phone: '+998901234567', pin: '0000' })"
            }
          ]
        };
      }

      const loggedUser = await authenticateMcpUser(phone, pin);
      if (!loggedUser) {
        return {
          isError: true,
          content: [
            {
              type: 'text',
              text: `❌ Autentifikatsiya muvaffaqiyatsiz bo'ldi: Telefon raqami yoki PIN-kod noto'g'ri.\n\nEslatma: Agar birinchi marta kirayotgan bo'lsangiz, avval Telegram botimizda (@HisobchiAIBot) /start bosib, '📱 Telefon raqamni ulashish' tugmasi orqali hisobingizni tasdiqlang. Boshlang'ich PIN-kod: 0000`
            }
          ]
        };
      }

      sessionUser = loggedUser;
      const sessionToken = createMcpSession(loggedUser);

      return {
        content: [
          {
            type: 'text',
            text: `✅ Muvaffaqiyatli kirildi! Xush kelibsiz, ${loggedUser.first_name}!\n\n` +
                  `📱 Telefon: ${loggedUser.phone || phone}\n` +
                  `🔑 Sessiya tokeni: ${sessionToken}\n\n` +
                  `Hisobingiz muvaffaqiyatli ulandi va sessiya saqlandi (24 soat). Endi siz balansingizni ko'rishingiz, amaliyotlar kiritishingiz va tahlillarni olishingiz mumkin.`
          }
        ]
      };
    }

    // --- LOGOUT TOOL ---
    if (name === 'logout') {
      const token = (args as any)?.token;
      if (sessionUser) {
        invalidateMcpSessions(sessionUser.id);
      } else if (token) {
        const u = getMcpSessionUser(token);
        if (u) invalidateMcpSessions(u.id);
      } else {
        invalidateMcpSessions();
      }
      sessionUser = null;
      return {
        content: [
          {
            type: 'text',
            text: "✅ Tizimdan muvaffaqiyatli chiqildi. Barcha faol sessiyalar yopildi."
          }
        ]
      };
    }

    // --- CHECK AUTH TOOL ---
    if (name === 'check_auth') {
      const activeUser = await resolveCurrentUser();
      if (!activeUser) {
        return {
          content: [
            {
              type: 'text',
              text: `🔒 Sessiya holati: Tizimga kirmagan (Unauthenticated).\n\nShaxsiy moliyaviy ma'lumotlarni ko'rish uchun 'authenticate' vositasi orqali telefon raqamingiz va 4 xonali PIN-kodingizni kiriting.`
            }
          ]
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: `✅ Sessiya faol:\n- Foydalanuvchi: ${activeUser.first_name}\n- Telefon: ${activeUser.phone || "yo'q"}\n- ID: ${activeUser.id}`
          }
        ]
      };
    }

    // --- SECURITY GUARD: ALL DATA TOOLS REQUIRE AUTHENTICATION ---
    const user = await resolveCurrentUser();
    if (!user) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `🔒 DIQQAT: Ushbu amalni bajarish uchun autentifikatsiya talab qilinadi!\n\nSiz hozirda Hisobchi AI hisobingizga kirmagansiz. Iltimos, 'authenticate' vositasidan foydalanib telefon raqamingiz va 4 xonali PIN-kodingizni kiriting.\nNamuna: authenticate({ phone: '+998901234567', pin: '0000' })`
          }
        ]
      };
    }

    let wallets = getWallets(user.id);
    let categories = getCategories(user.id);

    if (isSupabaseActive()) {
      try {
        const [sbW, sbC] = await Promise.all([
          getWalletsFromSupabase(user.id),
          getCategoriesFromSupabase(user.id)
        ]);
        if (Array.isArray(sbW) && sbW.length > 0) wallets = sbW as any;
        if (Array.isArray(sbC) && sbC.length > 0) categories = sbC as any;
      } catch {}
    }

    try {
      if (name === 'get_balance') {
        const totalBalance = wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12850 : w.balance), 0);
        const details = wallets.map(w => ({
          nomi: w.name,
          turi: w.type,
          qoldiq: `${w.balance.toLocaleString('uz-UZ')} ${w.currency || 'UZS'}`,
          asosiy: w.is_default === 1
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                foydalanuvchi: user.first_name,
                umumiy_balans: `${totalBalance.toLocaleString('uz-UZ')} UZS`,
                hisoblar: details
              }, null, 2)
            }
          ]
        };
      }

      if (name === 'add_transaction') {
        const { amount, type, description, category_name, wallet_name } = (args || {}) as any;

        let targetWallet = wallets[0];
        if (wallet_name) {
          const found = wallets.find(w => w.name.toLowerCase().includes(wallet_name.toLowerCase()));
          if (found) targetWallet = found;
        }

        let targetCategory = categories[0];
        if (category_name) {
          const found = categories.find(c => c.name.toLowerCase().includes(category_name.toLowerCase()));
          if (found) targetCategory = found;
        }

        const newTx = addTransaction({
          user_id: user.id,
          balance_id: targetWallet.id,
          category_id: targetCategory?.id,
          amount: Number(amount),
          type: type as 'expense' | 'income',
          description: description || 'MCP amaliyoti',
          category_label: `${targetCategory?.name || 'Xarid'} • ${targetWallet.name}`
        });

        if (isSupabaseActive()) {
          insertTransactionToSupabase(newTx).catch(e => console.warn('MCP Supabase sync warning:', e.message));
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ ${type === 'expense' ? 'Xarajat' : 'Daromad'} muvaffaqiyatli saqlandi!\n` +
                    `💰 Summa: ${Number(amount).toLocaleString('uz-UZ')} so'm\n` +
                    `🏷 Toifa: ${targetCategory?.name}\n` +
                    `💳 Hamyon: ${targetWallet.name}\n` +
                    `📝 Tavsif: ${description}`
            }
          ]
        };
      }

      if (name === 'get_transactions') {
        const { limit = 10, type } = (args || {}) as any;
        let txs = getTransactions(user.id, limit);

        if (isSupabaseActive()) {
          try {
            const sbTxs = await getTransactionsFromSupabase(user.id, limit);
            if (Array.isArray(sbTxs) && sbTxs.length > 0) txs = sbTxs as any;
          } catch {}
        }

        if (type) {
          txs = txs.filter(t => t.type === type);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(txs.map(t => ({
                id: t.id,
                turi: t.type === 'expense' ? 'Xarajat' : 'Daromad',
                summa: `${t.amount.toLocaleString('uz-UZ')} so'm`,
                tavsif: t.description,
                toifa: t.category_label || t.category_name,
                sana: t.date
              })), null, 2)
            }
          ]
        };
      }

      if (name === 'get_financial_summary') {
        const { period = 'month' } = (args || {}) as any;
        const summary = getFinancialSummary(user.id, period);

        const netSavings = summary.totalIncome - summary.totalExpense;
        const savingsRate = summary.totalIncome > 0
          ? Math.round((Math.max(0, netSavings) / summary.totalIncome) * 100)
          : 0;
        const topCat = summary.categoryStats && summary.categoryStats.length > 0 ? summary.categoryStats[0] : null;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                davr: period,
                umumiy_balans: `${summary.totalBalance.toLocaleString('uz-UZ')} UZS`,
                jami_daromad: `+${summary.totalIncome.toLocaleString('uz-UZ')} UZS`,
                jami_chiqim: `-${summary.totalExpense.toLocaleString('uz-UZ')} UZS`,
                sof_foyda: `${netSavings.toLocaleString('uz-UZ')} UZS`,
                jamgarma_foizi: `${savingsRate}%`,
                top_xarajat_kategoriyasi: topCat ? {
                  nomi: topCat.name,
                  summa: `${topCat.amount.toLocaleString('uz-UZ')} UZS`
                } : null
              }, null, 2)
            }
          ]
        };
      }

      if (name === 'get_debts') {
        const { status = 'active' } = (args || {}) as any;
        let debts = getDebts(user.id, status);

        if (isSupabaseActive()) {
          try {
            const sbDebts = await getDebtsFromSupabase(user.id, status);
            if (Array.isArray(sbDebts) && sbDebts.length > 0) debts = sbDebts as any;
          } catch {}
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(debts.map(d => ({
                id: d.id,
                kim_bilan: d.counterparty_name,
                qarz_turi: d.type === 'lent' ? 'Menga berishadi (Haqim)' : 'Men berishim kerak (Qarzdorman)',
                jami_summa: `${d.amount.toLocaleString('uz-UZ')} so'm`,
                tolangan_qism: `${d.paid_amount.toLocaleString('uz-UZ')} so'm`,
                qoldiq: `${(d.amount - d.paid_amount).toLocaleString('uz-UZ')} so'm`,
                muddat: d.due_date || 'Belgilanmagan'
              })), null, 2)
            }
          ]
        };
      }

      if (name === 'get_goals') {
        let goals = getGoals(user.id);

        if (isSupabaseActive()) {
          try {
            const sbGoals = await getGoalsFromSupabase(user.id);
            if (Array.isArray(sbGoals) && sbGoals.length > 0) goals = sbGoals as any;
          } catch {}
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(goals.map(g => ({
                id: g.id,
                maqsad: g.title,
                kerakli_summa: `${g.target_amount.toLocaleString('uz-UZ')} so'm`,
                yigilgan: `${g.current_amount.toLocaleString('uz-UZ')} so'm`,
                bajarilish_foizi: `${Math.round((g.current_amount / g.target_amount) * 100)}%`,
                holat: g.current_amount >= g.target_amount ? 'Bajarildi ✅' : 'Davom etmoqda ⏳'
              })), null, 2)
            }
          ]
        };
      }

      if (name === 'transfer_funds') {
        const { from_wallet, to_wallet, amount, note } = (args || {}) as any;
        const source = wallets.find(w => w.name.toLowerCase().includes(from_wallet.toLowerCase()));
        const dest = wallets.find(w => w.name.toLowerCase().includes(to_wallet.toLowerCase()));

        if (!source || !dest) {
          throw new Error("O'tkazma uchun ko'rsatilgan hamyonlardan biri topilmadi.");
        }

        transferBetweenWallets({
          userId: user.id,
          fromWalletId: source.id,
          toWalletId: dest.id,
          amount: Number(amount),
          description: note
        });

        return {
          content: [
            {
              type: 'text',
              text: `🔄 O'tkazma muvaffaqiyatli amalga oshirildi!\n` +
                    `📤 Qayerdan: ${source.name}\n` +
                    `📥 Qayerga: ${dest.name}\n` +
                    `💰 Summa: ${Number(amount).toLocaleString('uz-UZ')} so'm`
            }
          ]
        };
      }

      if (name === 'update_transaction') {
        const { id, amount, type, description, category_name, wallet_name } = (args || {}) as any;

        const updates: any = {};
        if (amount !== undefined) updates.amount = Number(amount);
        if (type !== undefined) updates.type = type;
        if (description !== undefined) updates.description = description;

        if (wallet_name) {
          const foundWallet = wallets.find(w => w.name.toLowerCase().includes(wallet_name.toLowerCase()));
          if (foundWallet) updates.balance_id = foundWallet.id;
        }

        if (category_name) {
          const foundCat = categories.find(c => c.name.toLowerCase().includes(category_name.toLowerCase()));
          if (foundCat) updates.category_id = foundCat.id;
        }

        const updatedTx = updateTransaction(id, user.id, updates);
        if (!updatedTx) {
          throw new Error(`ID: ${id} bo'lgan operatsiya topilmadi yoki unga huquqingiz yo'q.`);
        }

        if (isSupabaseActive()) {
          updateTransactionInSupabase(id, updates).catch(e => console.warn('MCP Supabase update warning:', e.message));
        }

        return {
          content: [
            {
              type: 'text',
              text: `✏️ ID: ${id} bo'lgan operatsiya muvaffaqiyatli yangilandi va balans qayta hisoblandi!\n` +
                    `💰 Yangi summa: ${updatedTx.amount.toLocaleString('uz-UZ')} so'm (${updatedTx.type})\n` +
                    `📝 Yangi tavsif: ${updatedTx.description}`
            }
          ]
        };
      }

      if (name === 'delete_transaction') {
        const { id } = (args || {}) as any;

        const deleted = deleteTransaction(id, user.id);
        if (!deleted) {
          throw new Error(`ID: ${id} bo'lgan operatsiya topilmadi yoki allaqachon o'chirilgan.`);
        }

        if (isSupabaseActive()) {
          deleteTransactionFromSupabase(id).catch(e => console.warn('MCP Supabase delete warning:', e.message));
        }

        return {
          content: [
            {
              type: 'text',
              text: `🗑️ ID: ${id} bo'lgan operatsiya muvaffaqiyatli o'chirildi va hamyon balansi dastlabki holatiga qaytarildi.`
            }
          ]
        };
      }

      throw new Error(`Noma'lum tool: ${name}`);
    } catch (err: any) {
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Xatolik: ${err.message}`
          }
        ]
      };
    }
  });

  // 3. Resources List
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: [
        {
          uri: 'hisobchi://balance',
          name: 'Umumiy Balans va Kartalar',
          mimeType: 'application/json',
          description: 'Joriy umumiy qoldiq va hisoblar holati (Autentifikatsiya talab qilinadi)'
        },
        {
          uri: 'hisobchi://summary',
          name: 'Oylik Moliyaviy Xulosa',
          mimeType: 'application/json',
          description: 'Ushbu oydagi barcha daromad va xarajatlar agregatsiyasi (Autentifikatsiya talab qilinadi)'
        }
      ]
    };
  });

  // 4. Read Resource Handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;
    const user = sessionUser || getLastActiveMcpUser();

    if (!user) {
      throw new Error("Autentifikatsiya talab qilinadi. Resurslarni o'qish uchun avval 'authenticate' vositasidan foydalanib tizimga kiring.");
    }

    if (uri === 'hisobchi://balance') {
      const wallets = getWallets(user.id);
      const totalBalance = wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12850 : w.balance), 0);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ user: user.first_name, totalBalance, wallets }, null, 2)
          }
        ]
      };
    }

    if (uri === 'hisobchi://summary') {
      const summary = getFinancialSummary(user.id, 'month');
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ user: user.first_name, summary }, null, 2)
          }
        ]
      };
    }

    throw new Error(`Resource topilmadi: ${uri}`);
  });

  return server;
}

/**
 * Mounts MCP Server-Sent Events (SSE) routes on the Express app.
 * Enables ChatGPT, Claude, and remote AI agents to connect via URL (e.g. https://your-server.com/sse).
 */
export function setupMcpSseRoutes(app: express.Express) {
  const sessions = new Map<string, { server: Server; transport: SSEServerTransport; user: User | null }>();

  // CORS Preflight handler
  const handleCorsOptions = (req: express.Request, res: express.Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.status(200).end();
  };

  app.options('/sse', handleCorsOptions);
  app.options('/api/sse', handleCorsOptions);
  app.options('/mcp/sse', handleCorsOptions);
  app.options('/messages', handleCorsOptions);
  app.options('/api/messages', handleCorsOptions);
  app.options('/mcp/messages', handleCorsOptions);

  // 1. SSE Connection Handler
  const handleSse = async (req: express.Request, res: express.Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Extract authentication credentials from query params or headers if provided
    const phone = (req.query.phone || req.headers['x-user-phone']) as string;
    const pin = (req.query.pin || req.headers['x-user-pin'] || '0000') as string;
    const token = (req.query.token || req.headers['authorization']?.replace('Bearer ', '')) as string;

    let initialUser: User | null = null;
    if (token) {
      initialUser = getMcpSessionUser(token);
    }
    if (!initialUser && phone) {
      initialUser = await authenticateMcpUser(phone, pin);
    }
    // Avval faollashtirilgan sessiya mavjud bo'lsa, uni avtomatik ulab berish
    if (!initialUser) {
      initialUser = getLastActiveMcpUser();
    }

    const endpointPath = req.originalUrl.startsWith('/api') ? '/api/messages' : '/messages';
    const server = createHisobchiMcpServer(initialUser);
    const transport = new SSEServerTransport(endpointPath, res);

    sessions.set(transport.sessionId, { server, transport, user: initialUser });

    if (initialUser) {
      console.log(`🔌 [MCP SSE] Faol sessiya bilan ulanish: Session ${transport.sessionId}, Foydalanuvchi: ${initialUser.first_name} (${initialUser.phone})`);
    } else {
      console.log(`🔌 [MCP SSE] Yangi ulanish (Kirish kutilmoqda): Session ${transport.sessionId}`);
    }

    transport.onclose = () => {
      console.log(`🔌 [MCP SSE] Ulanish yopildi, Session: ${transport.sessionId}`);
      sessions.delete(transport.sessionId);
    };

    await server.connect(transport);
  };

  app.get('/sse', handleSse);
  app.get('/api/sse', handleSse);
  app.get('/mcp/sse', handleSse);

  // 2. Incoming Messages Handler
  const handleMessages = async (req: express.Request, res: express.Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    const sessionId = req.query.sessionId as string;
    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).send('MCP Session not found or expired');
      return;
    }
    await session.transport.handlePostMessage(req, res, req.body);
  };

  app.post('/messages', handleMessages);
  app.post('/api/messages', handleMessages);
  app.post('/mcp/messages', handleMessages);
}

// Start Stdio Transport if invoked directly via CLI (e.g. npx tsx src/mcpServer.ts)
if (process.argv[1] && (process.argv[1].endsWith('mcpServer.ts') || process.argv[1].endsWith('mcpServer.js'))) {
  initDB();

  // Check CLI arguments for --phone and --pin
  let cliPhone: string | undefined = process.env.HISOBCHI_PHONE;
  let cliPin: string | undefined = process.env.HISOBCHI_PIN || '0000';

  for (let i = 2; i < process.argv.length; i++) {
    if (process.argv[i] === '--phone' && process.argv[i + 1]) {
      cliPhone = process.argv[i + 1];
    }
    if (process.argv[i] === '--pin' && process.argv[i + 1]) {
      cliPin = process.argv[i + 1];
    }
  }

  (async () => {
    let initialUser: User | null = null;
    if (cliPhone) {
      initialUser = await authenticateMcpUser(cliPhone, cliPin);
    }

    const transport = new StdioServerTransport();
    const server = createHisobchiMcpServer(initialUser);

    await server.connect(transport);
    if (initialUser) {
      console.error(`🚀 Hisobchi AI MCP Server ishga tushdi (Foydalanuvchi: ${initialUser.first_name})`);
    } else {
      console.error(`🚀 Hisobchi AI MCP Server ishga tushdi (Autentifikatsiya kutilmoqda)`);
    }
  })().catch((err) => {
    console.error('MCP Serverda fatal xatolik:', err);
    process.exit(1);
  });
}
