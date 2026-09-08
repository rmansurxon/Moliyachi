# 🌐 Hisobchi AI — OpenRouter va Maxsus MCP (Model Context Protocol) Server

Ushbu qo'llanmada saytingizga ulangan **OpenRouter AI** va **Maxsus MCP Server** haqida to'liq tushuncha va ulardan foydalanish ko'rsatilgan.

---

## 🤖 1. OpenRouter AI Integratsiyasi

### Bu nima va nima beradi?
[OpenRouter.ai](https://openrouter.ai/) — barcha kuchli sun'iy intellekt modellarini (Google Gemini 2.0 Flash, Meta Llama 3.3, Claude 3.5, OpenAI GPT-4o) yagona qulay API orqali ulash imkonini beruvchi xizmat.

### Hisobchi AI qanday ishlatadi?
1. **O'zbekcha moliyaviy suhbat:** Foydalanuvchi erkin tilda, shevada yoki qisqartmalarda gapirsa ham AI uni mukammal tushunadi.
2. **Aqlli tranzaksiyalarni aniqlash:** 
   - *"Do'stim bilan kafeda 180 ming sarfladim"* -> `Oziq-ovqat va Kafelar`, `180 000 UZS` xarajat deb darhol ajratib bazaga yozadi.
   - *"Frilansdan 250 dollar tushdi"* -> daromad deb hisoblab, so'mga konvertatsiya qiladi.
3. **Zaxira (Fallback) mexanizmi:** Agar `OPENROUTER_API_KEY` hali kiritilmagan bo'lsa yoki internet/limit tugasa, tizim avtomatik tarzda o'zimizning ichki tezkor O'zbekcha NLP dvigatelimizga o'tadi — ilova hech qachon to'xtab qolmaydi.

### Qanday faollashtiriladi?
1. [openrouter.ai/keys](https://openrouter.ai/keys) saytidan API kalit oling.
2. [`server/.env`](file:///home/mansurxon/Desktop/Hisobchi%20ai%20bot/server/.env) fayliga qo'ying:
```env
OPENROUTER_API_KEY=sk-or-v1-sizning_kalitingiz...
OPENROUTER_MODEL=google/gemini-2.0-flash-001
```

---

## 🔌 2. Maxsus MCP (Model Context Protocol) Server

### MCP nima?
**MCP (Model Context Protocol)** — bu Anthropic tomonidan ishlab chiqilgan xalqaro ochiq protokol (standart).
U orqali istalgan AI yordamchi (Claude Desktop, Cursor IDE, Antigravity, VS Code AI) sizning **Hisobchi AI** bazangizga to'g'ridan-to'g'ri ulanib, siz uchun amaliyotlar bajara oladi!

Masalan, siz Claude Desktop yoki Cursor'da:
> *"Hisobchi AI: Bugungi balansim qancha qoldi va oxirgi 5 ta xarajatimni ko'rsat"*
deb yozsangiz, AI avtomatik tarzda sizning MCP serveringiz orqali real hisoblaringizni tekshirib javob beradi!

---

### 🛠️ MCP Serverimiz taqdim etadigan Tool (Asbob)lar (9 ta):

| Tool Nomi | Vazifasi |
| :--- | :--- |
| `get_balance` | Barcha hamyonlar (Uzcard, Humo, Naqd, Dollar) va umumiy balansni olish |
| `add_transaction` | Yangi xarajat yoki daromadni AI orqali kiritish (balansni yangilash bilan) |
| `update_transaction` | Mavjud amaliyotni tahrirlash va hamyon balansini to'g'ri qayta hisoblash |
| `delete_transaction` | Amaliyotni o'chirish va hamyon balansini dastlabki holatiga qaytarish (revert) |
| `get_transactions` | Oxirgi tranzaksiyalar ro'yxati va filtrlash |
| `get_financial_summary` | Oylik tahlil, xarajatlar nisbati va eng ko'p pul ketgan toifalar |
| `get_debts` | Faol qarzlar daftari (kimdan qancha olish yoki berish kerak) |
| `get_goals` | Jamg'arma maqsadlari va to'plangan foiz |
| `transfer_funds` | Kartalar o'rtasida pul o'tkazish |

---

### ☁️ Supabase bilan Avtomatik Sinxronizatsiya

Agar loyihangizda Supabase sozlangan bo'lsa (`SUPABASE_URL` va `SUPABASE_KEY`), MCP server orqali kiritilgan, o'zgartirilgan yoki o'chirilgan har qanday operatsiya **avtomatik tarzda Supabase bulut bazasi bilan ham parallel sinxronlashtiriladi**.

---

### 🚀 MCP Serverni Ishga Tushirish va Ulanish

Loyiha ildizida tayyor [`mcp-config.json`](file:///home/mansurxon/Desktop/Hisobchi%20ai%20bot/mcp-config.json) fayli mavjud.

#### 1. Sinov uchun ishga tushirish:
Terminalda:
```bash
npm run mcp
```

#### 2. Claude Desktop ilovasiga ulash:
`claude_desktop_config.json` faylingizga quyidagicha qo'shasiz (yoki `mcp-config.json` dan ko'chirib olasiz):
```json
{
  "mcpServers": {
    "hisobchi-ai": {
      "command": "npx",
      "args": ["tsx", "/home/mansurxon/Desktop/Hisobchi ai bot/server/src/mcpServer.ts"]
    }
  }
}
```

#### 3. Cursor yoki Antigravity IDE ga ulash:
IDE sozlamalaridagi **MCP Servers** bo'limiga:
- **Name:** `hisobchi-ai`
- **Command:** `npx tsx /home/mansurxon/Desktop/Hisobchi ai bot/server/src/mcpServer.ts`
deb qo'shsangiz kifoya!
