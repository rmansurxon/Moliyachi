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

import {
  initDB,
  getOrCreateDefaultUser,
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
import { User } from './types.js';

import {
  isSupabaseActive,
  insertTransactionToSupabase,
  updateTransactionInSupabase,
  deleteTransactionFromSupabase
} from './supabase.js';

/**
 * Creates an isolated MCP Server instance for a specific user session.
 */
export function createHisobchiMcpServer(targetUser?: User): Server {
  initDB();
  const user = targetUser || getOrCreateDefaultUser();

  const server = new Server(
    {
      name: 'hisobchi-ai-mcp',
      version: '1.0.0'
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
          name: 'get_balance',
          description: "Foydalanuvchining umumiy balansi va barcha hamyon/kartalaridagi (Uzcard, Humo, Naqd pul, Investitsiya) qoldiqlarini olish.",
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'add_transaction',
          description: "Yangi daromad yoki xarajat amaliyotini qayd etish va balansni yangilash.",
          inputSchema: {
            type: 'object',
            properties: {
              amount: { type: 'number', description: "Amaliyot summasi (so'mda)" },
              type: { type: 'string', enum: ['expense', 'income'], description: "Amaliyot turi (expense - xarajat, income - daromad)" },
              description: { type: 'string', description: "Xarajat yoki daromad tavsifi (masalan: Tushlik, Taksi, Oylik)" },
              category_name: { type: 'string', description: "Kategoriya nomi (masalan: Oziq-ovqat, Transport & Benzin, Oylik maosh)" },
              wallet_name: { type: 'string', description: "Qaysi karta yoki hamyondan (masalan: Asosiy karta, Naqd pul, Investitsiya)" }
            },
            required: ['amount', 'type', 'description']
          }
        },
        {
          name: 'get_transactions',
          description: "Oxirgi moliyaviy operatsiyalar ro'yxatini ko'rish.",
          inputSchema: {
            type: 'object',
            properties: {
              limit: { type: 'number', description: "Nechta operatsiya olish (standart: 10)" },
              type: { type: 'string', enum: ['expense', 'income', 'transfer'], description: "Filtr turi" }
            }
          }
        },
        {
          name: 'get_financial_summary',
          description: "Oylik yoki haftalik moliyaviy tahlil, xarajatlar va daromadlar nisbati hamda asosiy toifalar statistikasi.",
          inputSchema: {
            type: 'object',
            properties: {
              period: { type: 'string', enum: ['week', 'month', 'year'], description: "Hisobot davri (standart: month)" }
            }
          }
        },
        {
          name: 'get_debts',
          description: "Faol berilgan va olingan qarzlar daftari.",
          inputSchema: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['active', 'closed'], description: "Qarzlar holati" }
            }
          }
        },
        {
          name: 'get_goals',
          description: "Jamg'arma maqsadlari va ularning bajarilish foizi.",
          inputSchema: {
            type: 'object',
            properties: {}
          }
        },
        {
          name: 'transfer_funds',
          description: "Kartalar yoki hamyonlar o'rtasida mablag' o'tkazish.",
          inputSchema: {
            type: 'object',
            properties: {
              from_wallet: { type: 'string', description: "Chiqim qilinadigan hamyon nomi (masalan: Naqd pul)" },
              to_wallet: { type: 'string', description: "Kirim qilinadigan hamyon nomi (masalan: Asosiy karta)" },
              amount: { type: 'number', description: "O'tkazma summasi" },
              note: { type: 'string', description: "O'tkazma izohi" }
            },
            required: ['from_wallet', 'to_wallet', 'amount']
          }
        },
        {
          name: 'update_transaction',
          description: "Mavjud operatsiyani tahrirlash (summa, toifa, tavsif, hamyon) va hamyon balansini to'g'ri qayta hisoblash.",
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: "Tahrirlanadigan operatsiyaning ID raqami" },
              amount: { type: 'number', description: "Yangi summa (so'mda)" },
              type: { type: 'string', enum: ['expense', 'income'], description: "Yangi amaliyot turi" },
              description: { type: 'string', description: "Yangi amaliyot tavsifi" },
              category_name: { type: 'string', description: "Yangi toifa nomi" },
              wallet_name: { type: 'string', description: "Yangi hamyon/karta nomi" }
            },
            required: ['id']
          }
        },
        {
          name: 'delete_transaction',
          description: "Tranzaksiyani o'chirish va tegishli hamyon balansini dastlabki holatiga qaytarish (revert).",
          inputSchema: {
            type: 'object',
            properties: {
              id: { type: 'string', description: "O'chirilishi kerak bo'lgan tranzaksiya ID si" }
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
    const wallets = getWallets(user.id);
    const categories = getCategories(user.id);

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

        const tx = addTransaction({
          user_id: user.id,
          balance_id: targetWallet.id,
          category_id: targetCategory?.id,
          amount: Number(amount),
          type: type || 'expense',
          description: description || 'Amaliyot (MCP)',
          category_label: `${targetCategory?.name || 'Toifa'} • ${targetWallet.name}`
        });

        if (isSupabaseActive()) {
          insertTransactionToSupabase(tx).catch(e => console.warn('MCP Supabase sync warning:', e.message));
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ ${type === 'expense' ? 'Xarajat' : 'Daromad'} muvaffaqiyatli saqlandi:\n- ID: ${tx.id}\n- Summa: ${Number(amount).toLocaleString('uz-UZ')} UZS\n- Toifa: ${targetCategory?.name}\n- Hamyon: ${targetWallet.name}\n- Yangi qoldiq: ${targetWallet.balance.toLocaleString('uz-UZ')} UZS`
            }
          ]
        };
      }

      if (name === 'get_transactions') {
        const limit = Number((args as any)?.limit) || 10;
        const type = (args as any)?.type;
        const txs = getTransactions(user.id, limit, 0, type);

        const formatted = txs.map(t => ({
          id: t.id,
          sana: t.time_str || t.date,
          turi: t.type,
          summa: `${t.amount.toLocaleString('uz-UZ')} UZS`,
          tavsif: t.description,
          toifa: t.category_name || t.category_label,
          hamyon: t.wallet_name
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(formatted, null, 2)
            }
          ]
        };
      }

      if (name === 'get_financial_summary') {
        const period = ((args as any)?.period as 'week' | 'month' | 'year') || 'month';
        const summary = getFinancialSummary(user.id, period);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                davr: period,
                umumiy_balans: `${summary.totalBalance.toLocaleString('uz-UZ')} UZS`,
                daromad: `${summary.totalIncome.toLocaleString('uz-UZ')} UZS`,
                xarajat: `${summary.totalExpense.toLocaleString('uz-UZ')} UZS`,
                sof_foyda: `${(summary.totalIncome - summary.totalExpense).toLocaleString('uz-UZ')} UZS`,
                top_xarajatlar: summary.categoryStats.slice(0, 5).map(c => ({
                  toifa: c.name,
                  summa: `${c.amount.toLocaleString('uz-UZ')} UZS`
                }))
              }, null, 2)
            }
          ]
        };
      }

      if (name === 'get_debts') {
        const status = (args as any)?.status as 'active' | 'closed' | undefined;
        const debts = getDebts(user.id, status);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(debts.map(d => ({
                id: d.id,
                shaxs: d.counterparty_name,
                turi: d.type === 'lent' ? 'Menga berishadi' : 'Men berishim kerak',
                summa: `${d.amount.toLocaleString('uz-UZ')} UZS`,
                qoldiq: `${(d.amount - d.paid_amount).toLocaleString('uz-UZ')} UZS`,
                muddat: d.due_date,
                holat: d.status
              })), null, 2)
            }
          ]
        };
      }

      if (name === 'get_goals') {
        const goals = getGoals(user.id);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(goals.map(g => ({
                id: g.id,
                maqsad: g.title,
                kerakli_summa: `${g.target_amount.toLocaleString('uz-UZ')} UZS`,
                yigilgan: `${g.current_amount.toLocaleString('uz-UZ')} UZS`,
                foiz: `${Math.round((g.current_amount / g.target_amount) * 100)}%`
              })), null, 2)
            }
          ]
        };
      }

      if (name === 'transfer_funds') {
        const { from_wallet, to_wallet, amount, note } = (args || {}) as any;
        const fromW = wallets.find(w => w.name.toLowerCase().includes(from_wallet.toLowerCase()));
        const toW = wallets.find(w => w.name.toLowerCase().includes(to_wallet.toLowerCase()));

        if (!fromW || !toW) {
          throw new Error(`Hamyon topilmadi. Mavjud hamyonlar: ${wallets.map(w => w.name).join(', ')}`);
        }

        transferBetweenWallets({
          userId: user.id,
          fromWalletId: fromW.id,
          toWalletId: toW.id,
          amount: Number(amount),
          description: note
        });

        return {
          content: [
            {
              type: 'text',
              text: `✅ ${Number(amount).toLocaleString('uz-UZ')} UZS muvaffaqiyatli ${fromW.name} dan ${toW.name} ga o'tkazildi!`
            }
          ]
        };
      }

      if (name === 'update_transaction') {
        const { id, amount, type, description, category_name, wallet_name } = (args || {}) as any;
        if (!id) throw new Error("Operatsiya 'id' si kiritilishi shart!");

        let targetWalletId: string | undefined;
        if (wallet_name) {
          const found = wallets.find(w => w.name.toLowerCase().includes(wallet_name.toLowerCase()));
          if (found) targetWalletId = found.id;
        }

        let targetCategoryId: string | undefined;
        if (category_name) {
          const found = categories.find(c => c.name.toLowerCase().includes(category_name.toLowerCase()));
          if (found) targetCategoryId = found.id;
        }

        const updated = updateTransaction(id, user.id, {
          ...(amount !== undefined ? { amount: Number(amount) } : {}),
          ...(type ? { type } : {}),
          ...(description ? { description } : {}),
          ...(targetCategoryId ? { category_id: targetCategoryId } : {}),
          ...(targetWalletId ? { balance_id: targetWalletId } : {})
        });

        if (!updated) {
          throw new Error(`ID: ${id} bo'lgan tranzaksiya topilmadi yoki o'zgartirish muvaffaqiyatsiz tugadi.`);
        }

        if (isSupabaseActive()) {
          updateTransactionInSupabase(id, {
            ...(amount !== undefined ? { amount: Number(amount) } : {}),
            ...(type ? { type } : {}),
            ...(description ? { description } : {}),
            ...(targetCategoryId ? { category_id: targetCategoryId } : {}),
            ...(targetWalletId ? { balance_id: targetWalletId } : {})
          }).catch(e => console.warn('MCP Supabase update warning:', e.message));
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ Tranzaksiya muvaffaqiyatli tahrirlandi:\n- ID: ${updated.id}\n- Summa: ${updated.amount.toLocaleString('uz-UZ')} UZS\n- Tavsif: ${updated.description}\n- Turi: ${updated.type}`
            }
          ]
        };
      }

      if (name === 'delete_transaction') {
        const { id } = (args || {}) as any;
        if (!id) throw new Error("O'chirilishi kerak bo'lgan operatsiya 'id' si kiritilishi shart!");

        const ok = deleteTransaction(id, user.id);
        if (!ok) {
          throw new Error(`ID: ${id} bo'lgan operatsiya topilmadi.`);
        }

        if (isSupabaseActive()) {
          deleteTransactionFromSupabase(id).catch(e => console.warn('MCP Supabase delete warning:', e.message));
        }

        return {
          content: [
            {
              type: 'text',
              text: `🗑️ ID: ${id} bo'lgan operatsiya muvaffaqiyatli o'chirildi va hamyon balansi qaytarildi.`
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
          description: 'Joriy umumiy qoldiq va hisoblar holati'
        },
        {
          uri: 'hisobchi://summary',
          name: 'Oylik Moliyaviy Xulosa',
          mimeType: 'application/json',
          description: 'Ushbu oydagi barcha daromad va xarajatlar agregatsiyasi'
        }
      ]
    };
  });

  // 4. Read Resource Handler
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const uri = request.params.uri;

    if (uri === 'hisobchi://balance') {
      const wallets = getWallets(user.id);
      const totalBalance = wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12850 : w.balance), 0);
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify({ totalBalance, wallets }, null, 2)
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
            text: JSON.stringify(summary, null, 2)
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
  const sessions = new Map<string, { server: Server; transport: SSEServerTransport }>();

  // 1. SSE Connection Handler
  const handleSse = async (req: express.Request, res: express.Response) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', '*');

    // Extract user from query param ?tg_id=... or header
    const tgId = (req.query.tg_id || req.headers['x-telegram-id']) as string;
    let user: any = tgId ? db.prepare('SELECT * FROM users WHERE telegram_id = ?').get(String(tgId)) : null;
    if (!user) user = getOrCreateDefaultUser();

    const endpointPath = req.originalUrl.startsWith('/api') ? '/api/messages' : '/messages';
    const server = createHisobchiMcpServer(user);
    const transport = new SSEServerTransport(endpointPath, res);

    sessions.set(transport.sessionId, { server, transport });
    console.log(`🔌 [MCP SSE] Yangi ulanish (ChatGPT/Claude), Session: ${transport.sessionId}, User: ${user.first_name} (${user.id})`);

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
  const transport = new StdioServerTransport();
  const server = createHisobchiMcpServer();
  server.connect(transport).then(() => {
    console.error('🚀 Hisobchi AI MCP Server stdio orqali ishga tushdi!');
  }).catch((err) => {
    console.error('MCP Serverda fatal xatolik:', err);
    process.exit(1);
  });
}
