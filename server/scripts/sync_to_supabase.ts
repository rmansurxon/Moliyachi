import { db } from '../src/db.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

async function sync() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing!');
    process.exit(1);
  }

  const client = createClient(supabaseUrl, supabaseKey);

  const user = db.prepare('SELECT * FROM users ORDER BY created_at ASC LIMIT 1').get() as any;
  if (!user) {
    console.error('No local user found!');
    process.exit(1);
  }

  console.log('Syncing user:', user.id, user.first_name);

  // 1. Sync User
  const { error: uErr } = await client.from('users').upsert({
    id: user.id,
    telegram_id: user.telegram_id || '8724834222',
    first_name: user.first_name,
    username: user.username,
    currency: user.currency || 'UZS',
    theme: user.theme || 'dark',
    language: user.language || 'uz',
    xp: user.xp || 365,
    diamonds: user.diamonds || 365,
    streak: user.streak || 1,
    rank: user.rank || 'bronze'
  });
  if (uErr) console.error('User upsert error:', uErr);
  else console.log('✅ User synced to Supabase');

  // 2. Sync Wallets
  const wallets = db.prepare('SELECT * FROM wallets WHERE user_id = ?').all(user.id) as any[];
  for (const w of wallets) {
    const { error: wErr } = await client.from('wallets').upsert({
      id: w.id,
      user_id: user.id,
      name: w.name,
      type: w.type,
      balance: w.balance,
      currency: w.currency,
      color: w.color,
      card_number_last4: w.card_number_last4,
      is_default: w.is_default
    });
    if (wErr) console.error('Wallet error:', w.name, wErr);
    else console.log('✅ Wallet synced:', w.name, `(${w.balance} ${w.currency})`);
  }

  // 3. Sync Categories
  const categories = db.prepare('SELECT * FROM categories WHERE user_id = ?').all(user.id) as any[];
  for (const c of categories) {
    const { error: cErr } = await client.from('categories').upsert({
      id: c.id,
      user_id: user.id,
      name: c.name,
      type: c.type,
      icon: c.icon,
      color: c.color,
      budget_limit: c.budget_limit
    });
    if (cErr) console.error('Category error:', c.name, cErr);
  }
  console.log(`✅ ${categories.length} Categories synced to Supabase`);

  console.log('🎉 All initial data successfully synchronized to Supabase!');
}

sync().catch(console.error);
