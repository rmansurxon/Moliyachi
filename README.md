# Hisobchi AI (dashboard.hisobchiai.uz) va Telegram Bot Tizimi

Ushbu loyiha **Hisobchi AI** (`https://dashboard.hisobchiai.uz`) platformasining to'liq funksional kloni hamda unga 100% integratsiya qilingan **Telegram Bot** tizimidir.

---

## 🌟 Asosiy Imkoniyatlar

1. **📱 Web Dashboard & Telegram Mini App:**
   - React 19 + Vite + TailwindCSS asosida qurilgan zamonaviy interfeys.
   - Asl saytning premium ranglar palitrasi (Dark `#19232e` va Light `#efefef`).
   - Telegram WebApp SDK to'liq integratsiyasi (haptic vibratsiya, xavfsiz autentifikatsiya, adaptiv o'lcham).

2. **🤖 Hisobchi AI Chat & Ovozli Xabarlar (STT):**
   - O'zbek tilidagi matnli va ovozli xabarlarni tahlil qilish (masalan: *"Tushlikka 45 000 so'm ishlatdim"* yoki *"5 000 000 oylik tushdi"*).
   - Avtomatik ravishda xarajat summasi va toifasini aniqlash hamda hisobdan yechish.
   - Sun'iy intellekt moliyaviy maslahatchisi.

3. **📷 Chek Skaneri (AI OCR):**
   - Do'kon xarid cheklarini rasmga olish yoki yuklash.
   - Do'kon nomi, sana, xaridlar ro'yxati va umumiy summani ajratib olish va 1 bosish bilan xarajatlarga saqlash.

4. **💳 Hamyonlar va Virtual Karta Monitoringi:**
   - Naqd pul, Uzcard, Humo, Visa kartalari.
   - Hamyonlar o'rtasida pul o'tkazish (`/transfer`).
   - **Karta monitoringi:** Bank SMS bildirishnomalarini simulyatsiya qilish orqali kartadan avtomatik xarajat yechilishini sinash imkoniyati.

5. **🤝 Qarzlar Daftari:**
   - "Men bergan qarzlar" va "Men olgan qarzlar".
   - Qarz muddati, qaytarilgan qism summasi va Telegram orqali eslatma jo'natish.

6. **🎯 Moliyaviy Maqsadlar:**
   - Jamg'arma rejalari (noutbuk, sayohat, avtomobil).
   - Foiz progressi va hamyonlardan to'g'ridan-to'g'ri mablag' qo'shish.

7. **📊 Statistika va Oylik Yakun (Stories):**
   - Haftalik, oylik va yillik daromad/xarajat tahlili.
   - Toifalar bo'yicha vizual progress va tejamkorlik ko'rsatkichi.
   - Spotify Wrapped uslubidagi animatsiyali oylik moliya taqdimoti (`/oy-yakuni`).

8. **🏆 Gamifikatsiya va Vaucherlar:**
   - Kundalik kiritish seriyasi (Streak: 1-kun, 5-kun...).
   - Bronza, Kumush, Oltin, Olmos darajalari va XP to'plash.
   - Korzinka, Yandex Go promokod vaucherlari.

9. **⚙️ Xavfsizlik va Moslashuvchanlik:**
   - Valyuta: UZS (so'm), USD ($), RUB (₽).
   - Til: O'zbekcha (Lotin), Ўзбекча (Кирилл), Русский, English.
   - 4 xonali PIN kod himoyasi (LockScreen).

---

## 🚀 Loyihani Ishga Tushirish

### 1. Talablar
- Node.js 18+ (tavsiya etiladi: Node.js 20+)
- npm yoki pnpm

### 2. O'rnatish
Loyiha papkasida:
```bash
npm install
cd server && npm install
cd ../client && npm install
```

### 3. Telegram Botni Ulash (Ixtiyoriy)
1. Telegramda [@BotFather](https://t.me/BotFather) orqali yangi bot oching va API tokenni oling.
2. `server/.env` faylini oching va tokenni yozing:
   ```env
   PORT=5000
   WEBAPP_URL=http://localhost:5173
   TELEGRAM_BOT_TOKEN=YOUR_BOT_TOKEN_HERE
   ```
3. `@BotFather` orqali `/setmenubutton` buyrug'i yordamida botingizga WebApp tugmasini qo'shishingiz mumkin (`http://localhost:5173` yoki ngrok havolangiz).

### 4. Ishga Tushirish
Bitta buyruq orqali ham Server (API), ham Web Client (Vite) birga ishga tushadi:
```bash
npm run dev
```

- **Frontend Dashboard:** [http://localhost:5173](http://localhost:5173)
- **Backend REST API:** [http://localhost:5000](http://localhost:5000)

---

## 📂 Loyiha Strukturasi

```
Hisobchi ai bot/
├── client/                     # React 19 + Vite Frontend
│   ├── src/
│   │   ├── components/         # Header, BottomNav, Modallar, LockScreen
│   │   ├── views/              # Barcha 15+ sahifalar (Home, Chat, Scan, Debts, Goals...)
│   │   ├── api.ts              # Telegram WebApp va Backend API mijozi
│   │   ├── types.ts            # Ma'lumot turlari
│   │   ├── index.css           # Asl dizayn tokenlari (TailwindCSS v4)
│   │   └── App.tsx             # Asosiy routing va boshqaruvchi
├── server/                     # Express + TypeScript Backend
│   ├── src/
│   │   ├── db.ts               # SQLite ma'lumotlar bazasi (WAL rejimi)
│   │   ├── aiService.ts        # O'zbekcha NLP xarajat tahlilchisi va OCR
│   │   ├── bot.ts              # Telegram Bot dvigateli (Telegraf)
│   │   └── index.ts            # REST API yo'llari
│   ├── data/                   # hisobchi.db fayli saqlanadigan papka
│   └── .env                    # Sozlamalar va bot tokeni
└── package.json                # Umumiy skriptlar
```

---

## 💬 Telegram Bot Buyruqlari
- `/start` - Botni ishga tushirish va WebApp tugmasi
- `/balans` - Joriy qoldiqlar va kartalar
- `/statistika` - Oylik daromad va sarf-xarajatlar
- `/qarzlar` - Faol qarzlar ro'yxati
- `/yordam` - Foydalanish bo'yicha yo'riqnoma
- *Har qanday matn (masalan: "Taksi 18000") yoki ovozli xabar avtomatik tahlil qilinadi!*
