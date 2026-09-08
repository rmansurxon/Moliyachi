-- ==============================================================================
-- HISOBCHI AI - SUPABASE DATABASE INITIAL SCHEMA & SEED DATA
-- Ushbu SQL skriptni Supabase boshqaruv panelidagi SQL Editor ga nusxalab Run qiling
-- ==============================================================================

-- 1. USERS JADVALI
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    telegram_id TEXT UNIQUE,
    first_name TEXT NOT NULL DEFAULT 'Foydalanuvchi',
    username TEXT,
    currency TEXT NOT NULL DEFAULT 'UZS',
    theme TEXT NOT NULL DEFAULT 'dark',
    language TEXT NOT NULL DEFAULT 'uz',
    pin_code TEXT,
    xp INTEGER NOT NULL DEFAULT 365,
    diamonds INTEGER NOT NULL DEFAULT 365,
    streak INTEGER NOT NULL DEFAULT 1,
    rank TEXT NOT NULL DEFAULT 'bronze',
    last_active_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. WALLETS (HAMYONLAR VA KARTALAR)
CREATE TABLE IF NOT EXISTS wallets (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'uzcard',
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'UZS',
    color TEXT NOT NULL DEFAULT '#23a887',
    card_number_last4 TEXT,
    is_default INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CATEGORIES (XARAJAT VA DAROMAD TOIFALARI)
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense',
    icon TEXT NOT NULL DEFAULT 'Tag',
    color TEXT NOT NULL DEFAULT '#29c184',
    budget_limit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. TRANSACTIONS (BARCHA OPERATSIYALAR)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    balance_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    amount NUMERIC(15, 2) NOT NULL,
    type TEXT NOT NULL DEFAULT 'expense',
    to_balance_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    category_label TEXT,
    time_str TEXT,
    date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    receipt_image TEXT,
    tags TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. DEBTS (QARZLAR DAFTARI)
CREATE TABLE IF NOT EXISTS debts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type TEXT NOT NULL DEFAULT 'lent',
    counterparty_name TEXT NOT NULL,
    phone TEXT,
    amount NUMERIC(15, 2) NOT NULL,
    paid_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    due_date DATE,
    status TEXT NOT NULL DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. GOALS (JAMG'ARMA MAQSADLARI)
CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_amount NUMERIC(15, 2) NOT NULL,
    current_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    deadline DATE,
    icon TEXT NOT NULL DEFAULT 'Target',
    color TEXT NOT NULL DEFAULT '#29c184',
    category TEXT NOT NULL DEFAULT 'personal',
    is_completed INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. VOUCHERS (GAMIFIKATSIYA SOVRIINLARI)
CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    partner_name TEXT NOT NULL,
    discount_text TEXT NOT NULL,
    cost_diamonds INTEGER NOT NULL DEFAULT 100,
    promo_code TEXT NOT NULL,
    expires_at DATE,
    is_used INTEGER NOT NULL DEFAULT 0,
    category TEXT NOT NULL DEFAULT 'discount',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. ARTICLES (MOLIYAVIY BILIMLAR VA MAQOLALAR)
CREATE TABLE IF NOT EXISTS articles (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    read_time TEXT NOT NULL DEFAULT '3 daqiqa',
    summary TEXT,
    content TEXT,
    image_url TEXT,
    date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. APP_TEXTS (MATNLI MA'LUMOTLAR VA ILMIY/MASLAHAT MATNLARI)
CREATE TABLE IF NOT EXISTS app_texts (
    id TEXT PRIMARY KEY,
    key TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    locale TEXT NOT NULL DEFAULT 'uz',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Barcha jadvallarda RLS cheklovini o'chirish (anon kalit to'liq ishlashi uchun)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE wallets DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE debts DISABLE ROW LEVEL SECURITY;
ALTER TABLE goals DISABLE ROW LEVEL SECURITY;
ALTER TABLE vouchers DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE app_texts DISABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- BOSHLANG'ICH REAL MA'LUMOTLAR (SEED DATA)
-- ==============================================================================


-- Mansurxon foydalanuvchisini yaratish
INSERT INTO users (id, telegram_id, first_name, username, currency, theme, language, xp, streak, rank, diamonds)
VALUES ('user-mansurxon', NULL, 'Mansurxon', 'mansurxon_ai', 'UZS', 'dark', 'uz', 365, 1, 'bronze', 365)
ON CONFLICT (id) DO NOTHING;

-- Hamyonlar (Investitsiya, Asosiy karta, Naqd pul, Dollar)
INSERT INTO wallets (id, user_id, name, type, balance, currency, color, card_number_last4, is_default)
VALUES 
    ('w-1', 'user-mansurxon', 'Investitsiya', 'invest', 13677.62, 'UZS', '#7a5af8', NULL, 0),
    ('w-2', 'user-mansurxon', 'Asosiy karta', 'uzcard', 0, 'UZS', '#23a887', '8600', 1),
    ('w-3', 'user-mansurxon', 'Naqd pul', 'cash', 21000, 'UZS', '#38a169', NULL, 0),
    ('w-4', 'user-mansurxon', 'Dollar', 'visa', 0, 'USD', '#3182ce', '4100', 0)
ON CONFLICT (id) DO NOTHING;

-- Toifalar
INSERT INTO categories (id, user_id, name, type, icon, color, budget_limit)
VALUES 
    ('c-1', 'user-mansurxon', 'Balansni o''zgartirish', 'expense', 'RefreshCw', '#7a5af8', 0),
    ('c-2', 'user-mansurxon', 'Jamg''arma va investitsiyalar', 'expense', 'PiggyBank', '#23a887', 0),
    ('c-3', 'user-mansurxon', 'Kredit va Nasiya savdo', 'expense', 'CreditCard', '#ff8d28', 0),
    ('c-4', 'user-mansurxon', 'Aniqlanmagan', 'income', 'HelpCircle', '#3182ce', 0),
    ('c-5', 'user-mansurxon', 'Kiyim-kechak', 'expense', 'Shirt', '#ec4899', 2000000),
    ('c-6', 'user-mansurxon', 'Qarzlar', 'expense', 'HandCoins', '#29c184', 0),
    ('c-7', 'user-mansurxon', 'Boshqa daromadlar', 'income', 'DollarSign', '#10b981', 0),
    ('c-8', 'user-mansurxon', 'Oziq-ovqat', 'expense', 'Utensils', '#29c184', 2500000),
    ('c-9', 'user-mansurxon', 'Transport & Benzin', 'expense', 'Car', '#1570ef', 800000)
ON CONFLICT (id) DO NOTHING;

-- Operatsiyalar
INSERT INTO transactions (id, user_id, balance_id, category_id, amount, type, description, category_label, time_str, date)
VALUES 
    ('tx-1', 'user-mansurxon', 'w-1', 'c-1', 166779, 'expense', 'Balans to''g''rilandi', 'Balansni o''zgartirish • Investitsiya', '11:17', NOW()),
    ('tx-2', 'user-mansurxon', 'w-2', 'c-2', 13212, 'expense', 'IYB MOBILE PURSE', 'Jamg''arma va investitsiyalar • Asosiy karta', '11:15', NOW()),
    ('tx-3', 'user-mansurxon', 'w-2', 'c-3', 166788, 'expense', 'OOO KARONA', 'Kredit va Nasiya savdo • Asosiy karta', '11:13', NOW()),
    ('tx-4', 'user-mansurxon', 'w-2', 'c-4', 180000, 'income', 'AITI PAK YULI BANKI CHILONZOR F', 'Aniqlanmagan • Asosiy karta', '11:13', NOW()),
    ('tx-5', 'user-mansurxon', 'w-3', 'c-5', 10000, 'expense', 'qisqasi o''ttiz ming so''m qarzimni to''ladim do''kondan unga anava sotib olganim naushnik sotib olgani...', 'Kiyim-kechak • Naqd pul', '11:03', NOW()),
    ('tx-6', 'user-mansurxon', 'w-3', 'c-6', 30000, 'expense', 'qisqasi o''ttiz ming so''m qarzimni to''ladim...', 'Qarzlar • Naqd pul', '11:03', NOW()),
    ('tx-7', 'user-mansurxon', 'w-3', 'c-7', 61000, 'income', '61 000 so''m naqd pul balansga qo''sh', 'Boshqa daromadlar • Naqd pul', '08:54', NOW()),
    ('tx-8', 'user-mansurxon', 'w-1', 'c-1', 20456.62, 'income', 'Balans to''g''rilandi', 'Balansni o''zgartirish • Investitsiya', '08:26', NOW())
ON CONFLICT (id) DO NOTHING;

-- Matnli ma'lumotlar (App Texts)
INSERT INTO app_texts (id, key, title, content, category, locale)
VALUES
    ('txt-1', 'welcome_guide', 'Xush kelibsiz!', 'Hisobchi AI orqali daromad va xarajatlaringizni to''liq nazorat qiling.', 'onboarding', 'uz'),
    ('txt-2', 'ai_assistant_intro', 'AI Moliyachi Yordamchi', 'O''zbek tilida erkin xarajatlaringizni yozing yoki mikrofonga gapiring.', 'ai', 'uz'),
    ('txt-3', 'diamonds_info', 'Olmoslar nima uchun kerak?', 'Har kuni tizimga kirganingizda va xarajatlarni qayd etganingizda olmoslar olasiz. Ularni Korzinka yoki Yandex Go vaucherlariga almashtirishingiz mumkin!', 'gamification', 'uz'),
    ('txt-4', 'budget_advice_1', 'Tejamkorlik qoidasi', 'Daromadingizning 50% asosiy ehtiyojlarga, 30% xohishlarga, 20% jamg''armaga ajrating.', 'tips', 'uz')
ON CONFLICT (id) DO NOTHING;

-- Maqolalar
INSERT INTO articles (id, title, category, read_time, summary, content, image_url, date)
VALUES 
    ('art-1', '50/30/20 Qoidasi: Maoshingizni qanday to''g''ri taqsimlash kerak?', 'Moliya Savodxonligi', '4 daqiqa', 'Daromadingizni 50% zaruriy xarajatlarga, 30% orzularga va 20% jamg''armaga ajratish uslubi.', 'Moliya savodxonligining eng mashhur va samarali qoidalaridan biri...', 'https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&w=600&q=80', CURRENT_DATE),
    ('art-2', 'Kundalik xarajatlarni hisobga olib borish nega muhim?', 'Tejamkorlik', '3 daqiqa', 'Kichik mayda xarajatlar oy oxirida katta summaga aylanishi mumkin.', 'Har bir xarajatni qayd etib borish pul ustidan 100% nazorat o''rnatishga yordam beradi...', 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80', CURRENT_DATE)
ON CONFLICT (id) DO NOTHING;
