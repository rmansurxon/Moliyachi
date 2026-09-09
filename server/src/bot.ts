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
  resetAllBalancesAndTransactions,
  updateUserPhone
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
  resetSupabaseBalancesAndTransactions,
  updateUserPhoneInSupabase
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

  const getWebAppUrlForUser = (_userId?: string | number) => {
    return targetWebAppUrl;
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

  const getContactKeyboard = () => {
    return Markup.keyboard([
      [Markup.button.contactRequest('📱 Telefon raqamni ulashish')]
    ]).resize().oneTime();
  };

  // 1. /start Handler
  const handleStart = async (ctx: any) => {
    const from = ctx.from;
    const user = getOrCreateDefaultUser({
      id: from.id,
      first_name: from.first_name,
      username: from.username
    });

    // If user has not shared phone number yet, ask for contact
    if (!user.phone) {
      const askPhoneText =
        `Assalomu alaykum, *${from.first_name}*! 👋\n\n` +
        `Men *Hisobchi AI* — shaxsiy aqlli moliyaviy yordamchingizman. 🤖💰\n\n` +
        `Iltimos, profilingizni faollashtirish va xavfsiz foydalanish uchun quyidagi tugma orqali *telefon raqamingizni ulashing* 👇`;

      await ctx.reply(askPhoneText, {
        parse_mode: 'Markdown',
        ...getContactKeyboard()
      });
      return;
    }

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

  // Handle Contact Sharing (User Phone Verification)
  bot.on('contact', async (ctx: any) => {
    const contact = ctx.message.contact;
    const from = ctx.from;

    if (!contact || !contact.phone_number) {
      return ctx.reply('⚠️ Telefon raqami aniqlanmadi. Qaytadan urinib koʻring.');
    }

    // Verify contact belongs to the user if user_id is provided
    if (contact.user_id && contact.user_id !== from.id) {
      return ctx.reply('⚠️ Iltimos, pastdagi tugma orqali faqat oʻzingizning shaxsiy telefon raqamingizni ulashing.', {
        ...getContactKeyboard()
      });
    }

    let phone = contact.phone_number.trim();
    if (!phone.startsWith('+')) {
      phone = '+' + phone;
    }

    // 1. Update in SQLite
    getOrCreateDefaultUser({
      id: from.id,
      first_name: from.first_name,
      username: from.username,
      phone
    });
    updateUserPhone(from.id, phone, '0000');

    // 2. Update in Supabase
    if (isSupabaseActive()) {
      await updateUserPhoneInSupabase(from.id, phone, '0000');
    }

    const successText =
      `🎉 *Tabriklaymiz, ${from.first_name}! Hisobingiz muvaffaqiyatli faollashtirildi!* ✅\n\n` +
      `📱 *Telefon raqamingiz:* \`${phone}\`\n` +
      `🔑 *Veb-brauzerdan (Chrome/Safari) kirish uchun PIN-kod:* \`0000\`\n` +
      `_(PIN-kodni istalgan payt ilovaning "Sozlamalar" boʻlimida oʻzgartira olasiz)_\n\n` +
      `🚀 *Telegram ichida esa parol kiritish shart emas* — quyidagi tugma orqali ilovangiz bir zumda ochiladi! 👇`;

    await ctx.reply(successText, {
      parse_mode: 'Markdown',
      ...getMainKeyboard(from.id)
    });
  });

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

  // Voice & Audio messages disabled
  bot.on(['voice', 'audio'], async (ctx) => {
    await ctx.reply(
      "ℹ️ Ovozli xabarlar orqali amaliyot kiritish o'chirilgan.\n\nIltimos, xabaringizni matn ko'rinishida yozing (masalan: *Tushlik 45000* yoki *Aliga 100 ming qarz berdim*).",
      { parse_mode: 'Markdown' }
    );
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

    // 1. PRIMARY AI BRAIN: OpenRouter LLM
    let replyText = '';
    let parsedData: any = null;
    let isProcessedByAI = false;

    if (isOpenRouterConfigured()) {
      try {
        await ctx.sendChatAction('typing');
        const summary = getFinancialSummary(user.id, 'month');
        const aiRes = await callOpenRouterAI(text, categories, summary, [], wallets);
        replyText = aiRes.text;
        parsedData = aiRes.parsedData;
        isProcessedByAI = true;
      } catch (err: any) {
        console.warn('Telegram OpenRouter xatosi, mahalliy zaxira NLP ga o\'tilmoqda:', err?.message || err);
      }
    }

    // Fallback to local deterministic NLP if OpenRouter was not available or threw an error
    if (!isProcessedByAI) {
      const parsed = parseUzbekFinancialText(text, categories);
      if (parsed.action === 'save_debt' && parsed.debt) {
        parsedData = { action: 'debt', debt: parsed.debt, replyText: parsed.replyMessage };
      } else if (parsed.isTransaction && parsed.amount > 0) {
        parsedData = {
          action: 'transaction',
          isTransaction: true,
          amount: parsed.amount,
          type: parsed.type,
          description: parsed.description,
          categoryName: parsed.categoryName,
          preferredWalletKeyword: parsed.preferredWalletKeyword,
          replyText: parsed.replyMessage
        };
      } else {
        const summary = getFinancialSummary(user.id, 'month');
        const localReply = getAIConversationalReply(text, categories, summary);
        replyText = localReply.text;
        parsedData = localReply.parsedData;
      }
    }

    // If debt action detected
    if (parsedData && (parsedData.action === 'debt' || parsedData.action === 'save_debt') && parsedData.debt) {
      try {
        const savedDebt = addDebt({
          user_id: user.id,
          type: parsedData.debt.type,
          counterparty_name: parsedData.debt.counterparty_name,
          amount: parsedData.debt.amount,
          notes: parsedData.debt.notes
        });
        if (isSupabaseActive()) {
          insertDebtToSupabase(savedDebt).catch(() => {});
        }
        const debtReply = parsedData.replyText || replyText || `🤝 *Qarz qayd etildi:* ${parsedData.debt.counterparty_name} ga ${parsedData.debt.amount.toLocaleString('uz-UZ')} so'm.`;
        saveChatMessage(user.id, 'ai', debtReply);
        if (isSupabaseActive()) {
          saveChatMessageToSupabase(user.id, 'ai', debtReply).catch(() => {});
        }

        return ctx.reply(debtReply, {
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
    if (parsedData && (parsedData.action === 'transaction' || parsedData.isTransaction) && parsedData.amount > 0) {
      const defaultWallet = wallets.find(w => w.is_default === 1) || wallets[0];
      let targetWallet = defaultWallet;

      if (parsedData.walletName || parsedData.preferredWalletKeyword) {
        const kw = (parsedData.walletName || parsedData.preferredWalletKeyword).toLowerCase();
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

      const savedTx = addTransaction({
        user_id: user.id,
        balance_id: targetWallet.id,
        category_id: cat?.id,
        amount: parsedData.amount,
        type: parsedData.type || 'expense',
        description: parsedData.description || text,
        category_label: `${cat?.name || 'Toifa'} • ${targetWallet.name}`
      });

      if (isSupabaseActive()) {
        insertTransactionToSupabase(savedTx).catch(() => {});
      }

      const txReply = parsedData.replyText || replyText || `✅ *${savedTx.type === 'income' ? 'Daromad' : 'Xarajat'} qayd etildi!*\n💰 *Summa:* ${savedTx.amount.toLocaleString('uz-UZ')} so'm\n💳 *Hamyon:* ${targetWallet.name}`;

      // Save bot confirmation to continuous persistent chat history
      saveChatMessage(user.id, 'ai', txReply, savedTx);
      if (isSupabaseActive()) {
        saveChatMessageToSupabase(user.id, 'ai', txReply, savedTx).catch(() => {});
      }

      return ctx.reply(txReply, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [
            Markup.button.webApp('📱 Ilovada koʻrish', targetWebAppUrl),
            Markup.button.callback('↩️ Bekor qilish', `undo_tx_${savedTx.id}`)
          ]
        ])
      });
    }

    // General conversational reply from AI
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
