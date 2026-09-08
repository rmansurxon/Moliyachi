const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ SUPABASE_URL yoki SUPABASE_KEY topilmadi');
  process.exit(1);
}

const client = createClient(supabaseUrl, supabaseKey);

async function verify() {
  console.log('🔍 Supabase tekshirilmoqda:', supabaseUrl);
  const tables = ['users', 'wallets', 'categories', 'transactions', 'app_texts', 'articles', 'debts', 'goals', 'vouchers'];

  let successCount = 0;
  for (const t of tables) {
    const { count, error } = await client.from(t).select('*', { count: 'exact', head: true });
    if (error) {
      console.log(`❌ ${t}: ${error.message}`);
    } else {
      console.log(`✅ ${t}: ${count} ta qator mavjud`);
      successCount++;
    }
  }

  if (successCount === tables.length) {
    console.log('\n🎉 Barcha jadvallar Supabase bazasida muvaffaqiyatli mavjud va ishlamoqda!');
  } else {
    console.log(`\n⚠️ Hozircha ${successCount}/${tables.length} ta jadval tayyor. Iltimos, supabase_schema.sql ni SQL Editorda ishga tushiring.`);
  }
}

verify();
