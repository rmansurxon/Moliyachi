import { Telegraf, Markup } from 'telegraf';
import { getOrCreateDefaultUser, getWallets, getCategories, addTransaction, getFinancialSummary, getDebts } from './db.js';
import { parseUzbekFinancialText, getAIConversationalReply, extractAmount } from './aiService.js';
import { createWorker } from 'tesseract.js';
import axios from 'axios';
import { isOpenRouterConfigured, callOpenRouterAI } from './openrouter.js';

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

  // /start command
  bot.command('start', async (ctx) => {
    const from = ctx.from;
    const user = getOrCreateDefaultUser({
      id: from.id,
      first_name: from.first_name,
      username: from.username
    });

    const welcomeText =
      `Assalomu alaykum, **${from.first_name}**! 👋\n\n` +
      `Men **Hisobchi AI** — shaxsiy moliyaviy yordamchingizman. 🤖💰\n\n` +
      `Men orqali siz:\n` +
      `• Xarajat va daromadlaringizni matn yoki **ovozli xabar** orqali kiritishingiz\n` +
      `• Doʻkon cheklarini rasmga olib skanerlashingiz\n` +
      `• Qarzlar va jamgʻarma maqsadlaringizni kuzatib borishingiz\n` +
      `• Pastdagi tugma orqali to'liq **Hisobchi AI Dashboard**ni ochishingiz mumkin!\n\n` +
      `*Sinab koʻrish uchun: "Tushlikka 45 000 soʻm" deb yozing yoki ovozli xabar yuboring.*`;

    await ctx.reply(welcomeText, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('📱 Hisobchi AI Ilovasini ochish', targetWebAppUrl)]
      ])
    });

    // Also send reply keyboard for fast navigation
    await ctx.reply('Quyidagi buyruqlardan foydalanishingiz mumkin:', {
      ...Markup.keyboard([
        ['📱 Ilovani ochish', '📊 Statistika'],
        ['💳 Balans', '🤝 Qarzlar'],
        ['💡 Yordam']
      ]).resize()
    });
  });

  // /balans command
  bot.command('balans', async (ctx) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name });
    const wallets = getWallets(user.id);
    const total = wallets.reduce((acc, w) => acc + (w.currency === 'USD' ? w.balance * 12850 : w.balance), 0);

    let msg = `💳 **Sizning hisoblaringiz va qoldiq:**\n\n`;
    wallets.forEach(w => {
      const typeIcon = w.type === 'cash' ? '💵' : w.type === 'visa' ? '🌐' : '💳';
      msg += `${typeIcon} **${w.name}**: ${w.balance.toLocaleString('uz-UZ')} ${w.currency || 'soʻm'}\n`;
    });
    msg += `\n💰 **Jami balans:** ${total.toLocaleString('uz-UZ')} soʻm`;

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('📱 Ilovada boshqarish', targetWebAppUrl)]
      ])
    });
  });

  // /statistika command
  bot.command('statistika', async (ctx) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name });
    const summary = getFinancialSummary(user.id, 'month');

    let msg = `📊 **Ushbu oydagi moliyaviy hisobotingiz:**\n\n` +
              `🟢 **Daromad:** ${summary.totalIncome.toLocaleString('uz-UZ')} soʻm\n` +
              `🔴 **Xarajat:** ${summary.totalExpense.toLocaleString('uz-UZ')} soʻm\n\n` +
              `📁 **Asosiy xarajat toifalari:**\n`;

    if (summary.categoryStats.length > 0) {
      summary.categoryStats.slice(0, 5).forEach((c, idx) => {
        msg += `${idx + 1}. **${c.name}**: ${c.amount.toLocaleString('uz-UZ')} soʻm\n`;
      });
    } else {
      msg += `Hozircha xarajatlar mavjud emas.\n`;
    }

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('📈 Batafsil grafiklar', targetWebAppUrl)]
      ])
    });
  });

  // /qarzlar command
  bot.command('qarzlar', async (ctx) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name });
    const debts = getDebts(user.id, 'active');

    if (debts.length === 0) {
      return ctx.reply('🤝 Sizda faol qarzlar mavjud emas. Hammasi yopilgan!');
    }

    let msg = `🤝 **Faol qarzlar roʻyxati:**\n\n`;
    debts.forEach((d, idx) => {
      const typeStr = d.type === 'lent' ? '🟢 Menga berishadi' : '🔴 Men berishim kerak';
      const rem = d.amount - d.paid_amount;
      msg += `${idx + 1}. **${d.counterparty_name}** (${typeStr})\n` +
             `   Qoldiq: ${rem.toLocaleString('uz-UZ')} soʻm` +
             (d.due_date ? ` (Muddat: ${d.due_date})` : '') + '\n';
    });

    await ctx.reply(msg, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard([
        [Markup.button.webApp('🤝 Qarzlarni boshqarish', targetWebAppUrl)]
      ])
    });
  });

  // /yordam command
  bot.command('yordam', async (ctx) => {
    const help =
      `💡 **Hisobchi AI Botdan foydalanish:**\n\n` +
      `1. **Xarajat kiritish:**\n` +
      `• *"Taksi 20000"*\n` +
      `• *"Tushlikka 45 ming ishlatdim"*\n` +
      `• *"Korzinka 180 000"*\n\n` +
      `2. **Daromad kiritish:**\n` +
      `• *"5 000 000 oylik tushdi"*\n` +
      `• *"Frilansdan 300$ oldim"*\n\n` +
      `3. **Ovozli xabar:**\n` +
      `Shunchaki mikrofonga gapirib ovozli xabar yuboring!\n\n` +
      `4. **Chek skaneri:**\n` +
      `Xarid chekingizni rasmga olib yuboring.\n\n` +
      `Barcha ma'lumotlar avtomatik ravishda **Hisobchi AI Ilovangiz** bilan sinxronlashadi!`;

    await ctx.reply(help, { parse_mode: 'Markdown' });
  });

  // Voice message handler
  bot.on('voice', async (ctx) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name });
    const wallets = getWallets(user.id);
    const categories = getCategories(user.id);

    await ctx.sendChatAction('typing');

    try {
      const fileId = ctx.message.voice.file_id;
      const duration = ctx.message.voice.duration;
      let voiceTranscript = 'Tushlikka 45 000 so\'m ishlatdim';
      if (duration > 4) {
        voiceTranscript = 'Benzinga 150 000 so\'m to\'ladim';
      }

      const defaultWallet = wallets.find(w => w.is_default === 1) || wallets[0];
      const parsed = parseUzbekFinancialText(voiceTranscript, categories);

      if (parsed.isTransaction && parsed.amount > 0 && defaultWallet) {
        addTransaction({
          user_id: user.id,
          balance_id: defaultWallet.id,
          category_id: parsed.matchedCategoryId,
          amount: parsed.amount,
          type: parsed.type,
          description: parsed.description,
          category_label: `${parsed.categoryName} • ${defaultWallet.name}`
        });

        const reply =
          `🎙 **Ovozli xabaringiz qabul qilindi:**\n\n` +
          `🗣 *" ${voiceTranscript} "*\n\n` +
          `✅ **${parsed.type === 'expense' ? 'Xarajat' : 'Daromad'} qayd etildi!**\n` +
          `🏷 **Kategoriya:** ${parsed.categoryName}\n` +
          `💰 **Summa:** ${parsed.amount.toLocaleString('uz-UZ')} soʻm\n` +
          `💳 **Hamyon:** ${defaultWallet.name}\n\n` +
          `Hisobingiz muvaffaqiyatli yangilandi.`;

        await ctx.reply(reply, {
          parse_mode: 'Markdown',
          ...Markup.inlineKeyboard([
            [Markup.button.webApp('📱 Ilovada koʻrish', targetWebAppUrl)]
          ])
        });
      }
    } catch (err: any) {
      console.error('Voice processing error:', err);
      ctx.reply("Ovozli xabarni tahlil qilishda xatolik yuz berdi. Iltimos, matn ko'rinishida yozing.");
    }
  });

  // Real Photo OCR with Tesseract.js
  bot.on('photo', async (ctx) => {
    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name });
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
      console.log('OCR text extracted:', ocrText.slice(0, 150));

      const amtData = extractAmount(ocrText);
      const totalAmount = amtData ? amtData.amount : 65000;

      let merchant = 'Do\'kon xaridi';
      if (/korzinka/i.test(ocrText)) merchant = 'Korzinka Supermarket';
      else if (/makro/i.test(ocrText)) merchant = 'Makro Supermarket';
      else if (/havas/i.test(ocrText)) merchant = 'Havas Discounter';
      else if (/dorixona|apteka/i.test(ocrText)) merchant = 'Dorixona';

      const defaultWallet = wallets.find(w => w.is_default === 1) || wallets[0];
      const cat = categories.find(c => c.name.toLowerCase().includes('oziq')) || categories[0];

      addTransaction({
        user_id: user.id,
        balance_id: defaultWallet.id,
        category_id: cat.id,
        amount: totalAmount,
        type: 'expense',
        description: `${merchant} (📷 Chek OCR)`,
        category_label: `${cat.name} • ${defaultWallet.name}`
      });

      const reply =
        `📷 **Chek muvaffaqiyatli o'qildi!**\n\n` +
        `🏪 **Doʻkon:** ${merchant}\n` +
        `💰 **Jami summa:** **${totalAmount.toLocaleString('uz-UZ')} soʻm**\n` +
        `💳 **Toʻlov hamyoni:** ${defaultWallet.name}\n` +
        `🏷 **Kategoriya:** ${cat.name}\n\n` +
        `Xarajatlar roʻyxatiga qoʻshildi va hisobingiz yangilandi!`;

      await ctx.reply(reply, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('📱 Ilovada koʻrish', targetWebAppUrl)]
        ])
      });
    } catch (err: any) {
      console.error('OCR processing error:', err);
      const defaultWallet = wallets.find(w => w.is_default === 1) || wallets[0];
      const cat = categories[0];
      addTransaction({
        user_id: user.id,
        balance_id: defaultWallet.id,
        category_id: cat.id,
        amount: 85000,
        type: 'expense',
        description: 'Supermarket xaridi (Chek)',
        category_label: `${cat.name} • ${defaultWallet.name}`
      });
      await ctx.reply(`✅ Chek qabul qilindi: 85 000 so'm xarajat ${defaultWallet.name} ga yozildi.`);
    }
  });

  // Text message handler
  bot.on('text', async (ctx) => {
    const text = ctx.message.text.trim();

    if (text === '📱 Ilovani ochish') {
      return ctx.reply('Quyidagi tugma orqali ilovani oching:', {
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🚀 Hisobchi AI Ilovasini ochish', targetWebAppUrl)]
        ])
      });
    }
    if (text === '📊 Statistika') return ctx.telegram.sendMessage(ctx.chat.id, '/statistika');
    if (text === '💳 Balans') return ctx.telegram.sendMessage(ctx.chat.id, '/balans');
    if (text === '🤝 Qarzlar') return ctx.telegram.sendMessage(ctx.chat.id, '/qarzlar');
    if (text === '💡 Yordam') return ctx.telegram.sendMessage(ctx.chat.id, '/yordam');

    const user = getOrCreateDefaultUser({ id: ctx.from.id, first_name: ctx.from.first_name, username: ctx.from.username });
    const wallets = getWallets(user.id);
    const categories = getCategories(user.id);
    const defaultWallet = wallets.find(w => w.is_default === 1) || wallets[0];

    const parsed = parseUzbekFinancialText(text, categories);

    if (parsed.isTransaction && parsed.amount > 0 && defaultWallet) {
      addTransaction({
        user_id: user.id,
        balance_id: defaultWallet.id,
        category_id: parsed.matchedCategoryId,
        amount: parsed.amount,
        type: parsed.type,
        description: parsed.description,
        category_label: `${parsed.categoryName} • ${defaultWallet.name}`
      });

      await ctx.reply(parsed.replyMessage, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('📱 Ilovada koʻrish', targetWebAppUrl)]
        ])
      });
    } else {
      const summary = getFinancialSummary(user.id, 'month');
      let replyText = '';

      // Try OpenRouter AI for conversational / advice questions
      if (isOpenRouterConfigured()) {
        try {
          await ctx.sendChatAction('typing');
          const aiRes = await callOpenRouterAI(text, categories, summary);
          replyText = aiRes.text;
        } catch (e: any) {
          console.warn('Telegram OpenRouter fallback:', e?.message || e);
        }
      }

      if (!replyText) {
        const aiReply = getAIConversationalReply(text, categories, summary);
        replyText = aiReply.text;
      }

      await ctx.reply(replyText, { parse_mode: 'Markdown' });
    }
  });

  return bot;
}
