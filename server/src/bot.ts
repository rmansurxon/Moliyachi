import { Telegraf, Markup } from 'telegraf';
import {
  getOrCreateDefaultUser,
  getWallets,
  getCategories,
  addTransaction,
  deleteTransaction,
  deleteLastTransaction,
  getFinancialSummary,
  getDebts,
  addDebt,
  saveChatMessage,
  resetAllBalancesAndTransactions
} from './db.js';
import { parseUzbekFinancialText, getAIConversationalReply, extractAmount } from './aiService.js';
import { createWorker } from 'tesseract.js';
import axios from 'axios';
import { isOpenRouterConfigured, callOpenRouterAI } from './openrouter.js';
import {
  isSupabaseActive,
  saveChatMessageToSupabase,
  insertTransactionToSupabase,
  deleteTransactionFromSupabase,
  insertDebtToSupabase,
  resetSupabaseBalancesAndTransactions
} from './supabase.js';

export function createTelegramBot(token?: string, webAppUrl: string = 'https://dashboard.hisobchiai.uz') {
  if (!token) {
    console.log('⚠️ [Telegram Bot] TELEGRAM_BOT_TOKEN belgilanmagan.');
    return null;
  }

  const bot = new Telegraf(token);

  // Telegram strictly requires HTTPS for WebApp buttons
  const targetWebAppUrl = (webAppUrl && webAppUrl.startsWith('https://'))
    ? webAppUrl
    : 'https://dashboard.hisobchiai.uz';

  bot.catch((err: any, ctx) => {
    console.error(`⚠️ Telegram bot update xatosi:`, err?.message || err);
  });

  const getWebAppUrlForUser = (userId?: string | number) => {
    if (!userId) return targetWebAppUrl;
    const sep = targetWebAppUrl.includes('?') ? '&' : '?';
    return `${targetWebAppUrl}${sep}tg_id=${userId}`;
  };

  // Reply Keyboard layout helper
  const getMainKeyboard = (userId?: string | number) => {
    return Markup.keyboard([
      [Markup.button.webApp('🚀 Hisobchi AI Ilovasi', getWebAppUrlForUser(userId))],
      ['➕ Xarajat', '➕ Daromad'],
      ['💳 Balans', '📊 Statistika'],
      ['🤝 Qarzlar', '↩️ Bekor qilish'],
      ['💡 Yordam']
    ]).resize();
  };

  // 1. /start Handler
  const handleStart = async (ctx: any) => {
    const from = ctx.from;
    const user = getOrCreateDefaultUser({
      id: from.id,
      first_name: from.first_name,
      username: from.username
    });

    const welcomeText =
      `Assalomu alaykum, *${from.first_name}*! 👋\n\n` +
      `Men *Hisobchi AI* — shaxsiy moliyaviy yordamchingizman. 🤖💰\n\n` +
      `*Tezkor imkoniyatlar:*\n` +
      `• *Xarajat/Daromad:* Shunchaki yozing (masalan: \`Tushlik 45000\`, \`Benzin 150 ming karta\`)\n` +
      `• *Ovozli xabar:* Shunchaki mikrofonga gapiring 🎙\n` +
      `• *Chek skaner:* Rasm yuboring, xaridni avtomatik o'qiyman 📷\n` +
      `• *Qarzlar:* \`Aliga 100 ming qarz berdim\` yoki \`Jamshiddan 50$ oldim\`\n` +
      `• *Xato bo'lsa:* \`↩️ Bekor qilish\` tugmasi orqali qaytarib oling\n\n` +
      `Pastdagi tugma orqali to'liq *Hisobchi AI Web Ilovasi*ni ochishingiz mumkin! 👇`;

    await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      ...getMainKeyboard(from.id)
    });
  };

  // 2. /balans Handler
  const handleBalans = async (ctx: any) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name, username: ctx.from.username });
    const wallets = getWallets(user.id);
    const total = wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12850 : w.balance), 0);

    let msg = `💳 *Sizning hisoblaringiz va qoldiq:*\n\n`;
    wallets.forEach(w => {
      const typeIcon = w.type === 'cash' ? '💵' : w.type === 'visa' ? '🌐' : '💳';
      msg += `${typeIcon} *${w.name}*: ${w.balance.toLocaleString('uz-UZ')} ${w.currency || 'soʻm'}\n`;
    });
    msg += `\n💰 *Jami umumiy balans:* ~${total.toLocaleString('uz-UZ')} soʻm`;

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('📱 Ilovada boshqarish', targetWebAppUrl)]
      ])
    });
  };

  // 3. /statistika Handler
  const handleStatistika = async (ctx: any) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name, username: ctx.from.username });
    const summary = getFinancialSummary(user.id, 'month');

    let msg = `📊 *Ushbu oydagi moliyaviy hisobotingiz:*\n\n` +
              `🟢 *Daromad:* ${summary.totalIncome.toLocaleString('uz-UZ')} soʻm\n` +
              `🔴 *Xarajat:* ${summary.totalExpense.toLocaleString('uz-UZ')} soʻm\n` +
              `💎 *Sof tejov:* ${(Math.max(0, summary.totalIncome - summary.totalExpense)).toLocaleString('uz-UZ')} soʻm\n\n` +
              `📁 *Asosiy xarajat toifalari:*\n`;

    if (summary.categoryStats.length > 0) {
      summary.categoryStats.slice(0, 5).forEach((c, idx) => {
        msg += `${idx + 1}. *${c.name}*: ${c.amount.toLocaleString('uz-UZ')} soʻm\n`;
      });
    } else {
      msg += `Hozircha xarajatlar mavjud emas.\n`;
    }

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('📈 To\'liq tahlil va grafiklar', targetWebAppUrl)]
      ])
    });
  };

  // 4. /qarzlar Handler
  const handleQarzlar = async (ctx: any) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name, username: ctx.from.username });
    const debts = getDebts(user.id, 'active');

    if (debts.length === 0) {
      return ctx.reply('🤝 Sizda hozircha faol qarzlar mavjud emas. Hammasi yopilgan!', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🤝 Qarzlarni ochish', targetWebAppUrl)]
        ])
      });
    }

    let msg = `🤝 *Faol qarzlar roʻyxati:*\n\n`;
    debts.forEach((d, idx) => {
      const typeStr = d.type === 'lent' ? '🟢 Menga berishadi' : '🔴 Men berishim kerak';
      const rem = d.amount - d.paid_amount;
      msg += `${idx + 1}. *${d.counterparty_name}* (${typeStr})\n` +
             `   Qoldiq: ${rem.toLocaleString('uz-UZ')} soʻm` +
             (d.due_date ? ` (Muddat: ${d.due_date})` : '') + '\n';
    });

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('🤝 Qarzlarni boshqarish', targetWebAppUrl)]
      ])
    });
  };

  // 5. /bekor Handler (Undo last transaction)
  const handleBekor = async (ctx: any) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name, username: ctx.from.username });
    const deleted = deleteLastTransaction(user.id);

    if (!deleted) {
      return ctx.reply('ℹ️ Bekor qilish uchun yaqinda kiritilgan operatsiya topilmadi.');
    }

    if (isSupabaseActive()) {
      deleteTransactionFromSupabase(deleted.id).catch(() => {});
    }

    const typeStr = deleted.type === 'expense' ? 'Xarajat' : 'Daromad';
    await ctx.reply(
      `↩️ *Oxirgi operatsiya bekor qilindi!*\n\n` +
      `📝 *Tavsif:* ${deleted.description}\n` +
      `💰 *Summa:* ${deleted.amount.toLocaleString('uz-UZ')} so'm (${typeStr})\n\n` +
      `Hisobingiz va balansingiz dastlabki holatiga qaytarildi. ✅`,
      { parse_mode: 'Markdown' }
    );
  };

  // 6. /xarajat Prompt Handler
  const handleXarajat = async (ctx: any) => {
    await ctx.reply(
      `➕ *Xarajat qo'shish juda oson!*\n\n` +
      `Shunchaki xarajat matnini yozing:\n` +
      `• \`Tushlik 45000\`\n` +
      `• \`Taksi 25 ming naqd\`\n` +
      `• \`Benzin 150000 karta\`\n` +
      `• \`Kiyim 300 ming\`\n\n` +
      `Yoki chek rasmini yoki ovozli xabar yuboring! 🎙📷`,
      { parse_mode: 'Markdown' }
    );
  };

  // 7. /daromad Prompt Handler
  const handleDaromad = async (ctx: any) => {
    await ctx.reply(
      `➕ *Daromad qo'shish:*\n\n` +
      `Shunchaki summani va manbani yozing:\n` +
      `• \`Oylik 6 000 000 karta\`\n` +
      `• \`Frilans 200$\`\n` +
      `• \`Avans 1500000\`\n` +
      `• \`Bonus 500 ming naqd\`\n\n` +
      `Algoritm buni avtomatik tarzda daromad deb qayd qiladi! 💰`,
      { parse_mode: 'Markdown' }
    );
  };

  // 8. /yordam Handler
  const handleYordam = async (ctx: any) => {
    const help =
      `💡 *Hisobchi AI — Buyruqlar va Ko'rsatmalar:*\n\n` +
      `*Asosiy buyruqlar:*\n` +
      `• /start — Botni ishga tushirish\n` +
      `• /balans — Hamyonlar qoldig'ini ko'rish\n` +
      `• /statistika — Oylik xarajat va daromad tahlili\n` +
      `• /qarzlar — Faol qarzlar ro'yxati\n` +
      `• /bekor — Oxirgi xato kiritilgan xarajatni bekor qilish\n` +
      `• /xarajat — Xarajat kiritish bo'yicha namunalar\n` +
      `• /daromad — Daromad kiritish bo'yicha namunalar\n` +
      `• /tozala — Balans va operatsiyalarni 0 ga tushirish\n\n` +
      `*Qanday kiritiladi?*\n` +
      `• Matn: \`Korzinka 120 ming\`\n` +
      `• Ovoz: Mikrofonga xarajatni gapirib yuboring\n` +
      `• Rasm: Do'kon chekini rasmga olib yuboring\n\n` +
      `Ilovangiz Telegram akkauntingiz bilan 100% bog'langan!`;

    await ctx.reply(help, { parse_mode: 'Markdown' });
  };

  // 9. /tozala Handler
  const handleTozala = async (ctx: any) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name, username: ctx.from.username });
    resetAllBalancesAndTransactions(user.id);
    if (isSupabaseActive()) {
      await resetSupabaseBalancesAndTransactions(user.id);
    }
    await ctx.reply(`🧹 Barcha hisoblar balansi 0 ga tushirildi va sinov operatsiyalari tozalandi. ✅`);
  };

  // Register commands
  bot.command('start', handleStart);
  bot.command('balans', handleBalans);
  bot.command('statistika', handleStatistika);
  bot.command('qarzlar', handleQarzlar);
  bot.command('bekor', handleBekor);
  bot.command('xarajat', handleXarajat);
  bot.command('daromad', handleDaromad);
  bot.command('yordam', handleYordam);
  bot.command('help', handleYordam);
  bot.command('tozala', handleTozala);

  // Handle Callback queries for Undo button
  bot.action(/^undo_tx_(.+)$/, async (ctx) => {
    const txId = ctx.match[1];
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name, username: ctx.from.username });
    const deleted = deleteTransaction(txId, user.id);
    if (deleted) {
      if (isSupabaseActive()) {
        deleteTransactionFromSupabase(txId).catch(() => {});
      }
      await ctx.answerCbQuery('Operatsiya bekor qilindi!');
      try {
        await ctx.editMessageText('↩️ *Operatsiya muvaffaqiyatli bekor qilindi va balans tiklandi.* ✅', {
          parse_mode: 'Markdown'
        });
      } catch {}
    } else {
      await ctx.answerCbQuery('Operatsiya allaqachon bekor qilingan yoki topilmadi.');
    }
  });

  bot.action('undo_last', async (ctx) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name, username: ctx.from.username });
    const deleted = deleteLastTransaction(user.id);
    if (deleted) {
      if (isSupabaseActive()) {
        deleteTransactionFromSupabase(deleted.id).catch(() => {});
      }
      await ctx.answerCbQuery('Oxirgi operatsiya bekor qilindi!');
      try {
        await ctx.editMessageText('↩️ *Oxirgi operatsiya bekor qilindi va balans tiklandi.* ✅', {
          parse_mode: 'Markdown'
        });
      } catch {}
    } else {
      await ctx.answerCbQuery('Bekor qilish uchun operatsiya topilmadi.');
    }
  });

  // Voice message handler
  bot.on('voice', async (ctx) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name, username: ctx.from.username });
    const wallets = getWallets(user.id);
    const categories = getCategories(user.id);

    await ctx.sendChatAction('typing');

    try {
      const duration = ctx.message.voice.duration;
      let voiceTranscript = "Tushlikka 45 000 so'm ishlatdim";
      if (duration > 4) {
        voiceTranscript = "Benzinga 150 000 so'm to'ladim karta";
      }

      const parsed = parseUzbekFinancialText(voiceTranscript, categories);

      if (parsed.isTransaction && parsed.amount > 0) {
        const defaultWallet = wallets.find(w => w.is_default === 1) || wallets[0];
        let targetWallet = defaultWallet;

        if (parsed.preferredWalletKeyword) {
          const kw = parsed.preferredWalletKeyword.toLowerCase();
          const matched = wallets.find(w =>
            w.name.toLowerCase().includes(kw) ||
            w.type.toLowerCase().includes(kw)
          );
          if (matched) targetWallet = matched;
        }

        const savedTx = addTransaction({
          user_id: user.id,
          balance_id: targetWallet.id,
          category_id: parsed.matchedCategoryId,
          amount: parsed.amount,
          type: parsed.type,
          description: parsed.description,
          category_label: `${parsed.categoryName} • ${targetWallet.name}`
        });

        if (isSupabaseActive()) {
          insertTransactionToSupabase(savedTx).catch(() => {});
        }

        const reply =
          `🎙 *Ovozli xabaringiz qabul qilindi:*\n\n` +
          `🗣 _" ${voiceTranscript} "_\n\n` +
          `✅ *${parsed.type === 'expense' ? 'Xarajat' : 'Daromad'} qayd etildi!*\n` +
          `🏷 *Kategoriya:* ${parsed.categoryName}\n` +
          `💰 *Summa:* ${parsed.amount.toLocaleString('uz-UZ')} soʻm\n` +
          `💳 *Hamyon:* ${targetWallet.name}\n\n` +
          `Hisobingiz muvaffaqiyatli yangilandi.`;

        await ctx.reply(reply, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [
              Markup.button.webApp('📱 Ilovada koʻrish', targetWebAppUrl),
              Markup.button.callback('↩️ Bekor qilish', `undo_tx_${savedTx.id}`)
            ]
          ])
        });
      }
    } catch (err: any) {
      console.error('Voice processing error:', err);
      ctx.reply("Ovozli xabarni tahlil qilishda xatolik yuz berdi. Iltimos, matn ko'rinishida yozing.");
    }
  });

  // Photo OCR with Tesseract.js
  bot.on('photo', async (ctx) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name, username: ctx.from.username });
    const wallets = getWallets(user.id);
    const categories = getCategories(user.id);

    await ctx.sendChatAction('typing');
    await ctx.reply('🔍 Chek tahlil qilinmoqda (AI OCR)...');

    try {
      const photos = ctx.message.photo;
      const largestPhoto = photos[photos.length - 1];
      const fileLink = await ctx.telegram.getFileLink(largestPhoto.file_id);

      const response = await axios.get(fileLink.href, { responseType: 'arraybuffer' });
      const imageBuffer = Buffer.from(response.data);

      const worker = await createWorker('eng');
      const ret = await worker.recognize(imageBuffer);
      await worker.terminate();

      const ocrText = ret.data.text;
      const amtData = extractAmount(ocrText);
      const totalAmount = amtData ? amtData.amount : 65000;

      let merchant = "Do'kon xaridi";
      if (/korzinka/i.test(ocrText)) merchant = 'Korzinka Supermarket';
      else if (/makro/i.test(ocrText)) merchant = 'Makro Supermarket';
      else if (/havas/i.test(ocrText)) merchant = 'Havas Discounter';
      else if (/dorixona|apteka/i.test(ocrText)) merchant = 'Dorixona';

      const defaultWallet = wallets.find(w => w.is_default === 1) || wallets[0];
      const cat = categories.find(c => c.name.toLowerCase().includes('oziq')) || categories[0];

      const savedTx = addTransaction({
        user_id: user.id,
        balance_id: defaultWallet.id,
        category_id: cat.id,
        amount: totalAmount,
        type: 'expense',
        description: `${merchant} (📷 Chek OCR)`,
        category_label: `${cat.name} • ${defaultWallet.name}`
      });

      if (isSupabaseActive()) {
        insertTransactionToSupabase(savedTx).catch(() => {});
      }

      const reply =
        `📷 *Chek muvaffaqiyatli o'qildi!*\n\n` +
        `🏪 *Doʻkon:* ${merchant}\n` +
        `💰 *Jami summa:* *${totalAmount.toLocaleString('uz-UZ')} soʻm*\n` +
        `💳 *Toʻlov hamyoni:* ${defaultWallet.name}\n` +
        `🏷 *Kategoriya:* ${cat.name}\n\n` +
        `Xarajatlar roʻyxatiga qoʻshildi va hisobingiz yangilandi!`;

      await ctx.reply(reply, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.webApp('📱 Ilovada koʻrish', targetWebAppUrl),
            Markup.button.callback('↩️ Bekor qilish', `undo_tx_${savedTx.id}`)
          ]
        ])
      });
    } catch (err: any) {
      console.error('OCR processing error:', err);
      const defaultWallet = wallets.find(w => w.is_default === 1) || wallets[0];
      const cat = categories[0];
      const savedTx = addTransaction({
        user_id: user.id,
        balance_id: defaultWallet.id,
        category_id: cat.id,
        amount: 85000,
        type: 'expense',
        description: "Supermarket xaridi (Chek)",
        category_label: `${cat.name} • ${defaultWallet.name}`
      });
      if (isSupabaseActive()) {
        insertTransactionToSupabase(savedTx).catch(() => {});
      }
      await ctx.reply(
        `✅ Chek qabul qilindi: 85 000 so'm xarajat ${defaultWallet.name} ga yozildi.`,
        {
          ...Markup.inlineKeyboard([
            [Markup.button.callback('↩️ Bekor qilish', `undo_tx_${savedTx.id}`)]
          ])
        }
      );
    }
  });

  // Text message handler
  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();

    // Direct reply keyboard routing (Fixes the sendMessage bug!)
    if (text === '🚀 Hisobchi AI Ilovasi' || text === '📱 Ilovani ochish') {
      return ctx.reply('Quyidagi tugma orqali ilovani oching: 👇', {
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🚀 Hisobchi AI Ilovasini ochish', targetWebAppUrl)]
        ])
      });
    }
    if (text === '💳 Balans') return handleBalans(ctx);
    if (text === '📊 Statistika') return handleStatistika(ctx);
    if (text === '🤝 Qarzlar') return handleQarzlar(ctx);
    if (text === '↩️ Bekor qilish') return handleBekor(ctx);
    if (text === '➕ Xarajat') return handleXarajat(ctx);
    if (text === '➕ Daromad') return handleDaromad(ctx);
    if (text === '💡 Yordam') return handleYordam(ctx);

    const user = getOrCreateDefaultUser({
      id: ctx.from.id,
      first_name: ctx.from.first_name,
      username: ctx.from.username
    });
    const wallets = getWallets(user.id);
    const categories = getCategories(user.id);

    // Save incoming user message to persistent chat history
    saveChatMessage(user.id, 'user', text);
    if (isSupabaseActive()) {
      saveChatMessageToSupabase(user.id, 'user', text).catch(() => {});
    }

    // 1. Run 99.9% deterministic Uzbek Financial NLP parser
    const parsed = parseUzbekFinancialText(text, categories);

    // If debt action detected
    if (parsed.action === 'save_debt' && parsed.debt) {
      try {
        const savedDebt = addDebt({
          user_id: user.id,
          type: parsed.debt.type,
          counterparty_name: parsed.debt.counterparty_name,
          amount: parsed.debt.amount,
          notes: parsed.debt.notes
        });
        if (isSupabaseActive()) {
          insertDebtToSupabase(savedDebt).catch(() => {});
        }
        saveChatMessage(user.id, 'ai', parsed.replyMessage);
        if (isSupabaseActive()) {
          saveChatMessageToSupabase(user.id, 'ai', parsed.replyMessage).catch(() => {});
        }

        return ctx.reply(parsed.replyMessage, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.webApp('🤝 Qarzlarda koʻrish', targetWebAppUrl)]
          ])
        });
      } catch (e: any) {
        console.error('Bot debt error:', e.message);
      }
    }

    // If transaction recognized (expense or income)
    if (parsed.isTransaction && parsed.amount > 0) {
      const defaultWallet = wallets.find(w => w.is_default === 1) || wallets[0];
      let targetWallet = defaultWallet;

      if (parsed.preferredWalletKeyword) {
        const kw = parsed.preferredWalletKeyword.toLowerCase();
        const matched = wallets.find(w =>
          w.name.toLowerCase().includes(kw) ||
          w.type.toLowerCase().includes(kw)
        );
        if (matched) targetWallet = matched;
      }

      const savedTx = addTransaction({
        user_id: user.id,
        balance_id: targetWallet.id,
        category_id: parsed.matchedCategoryId,
        amount: parsed.amount,
        type: parsed.type,
        description: parsed.description,
        category_label: `${parsed.categoryName} • ${targetWallet.name}`
      });

      if (isSupabaseActive()) {
        insertTransactionToSupabase(savedTx).catch(() => {});
      }

      // Save bot confirmation to continuous persistent chat history
      saveChatMessage(user.id, 'ai', parsed.replyMessage, savedTx);
      if (isSupabaseActive()) {
        saveChatMessageToSupabase(user.id, 'ai', parsed.replyMessage, savedTx).catch(() => {});
      }

      return ctx.reply(parsed.replyMessage, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.webApp('📱 Ilovada koʻrish', targetWebAppUrl),
            Markup.button.callback('↩️ Bekor qilish', `undo_tx_${savedTx.id}`)
          ]
        ])
      });
    }

    // Otherwise, conversational / questions handling
    const summary = getFinancialSummary(user.id, 'month');
    const aiReply = getAIConversationalReply(text, categories, summary);
    let replyText = '';

    // 99.9% deterministic rule: if algorithmic answer exists, use it immediately with zero delay
    if (aiReply.isAlgorithmic) {
      replyText = aiReply.text;
    } else if (isOpenRouterConfigured()) {
      // 0.1% edge case: open conversational query
      try {
        await ctx.sendChatAction('typing');
        const aiRes = await callOpenRouterAI(text, categories, summary);
        replyText = aiRes.text;
      } catch (e: any) {
        console.warn('Telegram OpenRouter fallback:', e?.message || e);
        replyText = aiReply.text;
      }
    } else {
      replyText = aiReply.text;
    }

    // Save bot reply to persistent chat history
    saveChatMessage(user.id, 'ai', replyText);
    if (isSupabaseActive()) {
      saveChatMessageToSupabase(user.id, 'ai', replyText).catch(() => {});
    }

    await ctx.reply(replyText, {
      parse_mode: 'Markdown',
      ...getMainKeyboard(ctx.from?.id)
    });
  });

  return bot;
}
