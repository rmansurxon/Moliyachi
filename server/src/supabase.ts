import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || '';

export let supabase: SupabaseClient | null = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });
    console.log('⚡ Supabase Database muvaffaqiyatli ulandi:', supabaseUrl);
  } catch (err: any) {
    console.error('Supabase ulanish xatosi:', err.message);
  }
} else {
  console.log('ℹ️ SUPABASE_URL yoki SUPABASE_KEY belgilanmagan. Local SQLite bazasidan foydalanilmoqda.');
}

export function isSupabaseActive(): boolean {
  return !!supabase;
}

// 1. Matnli ma'lumotlar (App Texts)
export async function getAppTextsFromSupabase(category?: string) {
  if (!supabase) return [];
  try {
    let query = supabase.from('app_texts').select('*');
    if (category) query = query.eq('category', category);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (err: any) {
    console.error('Supabase app_texts error:', err.message);
    return [];
  }
}

// 2. Maqolalar va moliyaviy bilimlar (Articles)
export async function getArticlesFromSupabase() {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Supabase articles error:', err.message);
    return null;
  }
}

// 3. Foydalanuvchi ma'lumotlari
export async function getUserFromSupabase(userId: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (err: any) {
    console.error('Supabase getUser error:', err.message);
    return null;
  }
}

// 4. Hamyonlar (Wallets)
export async function getWalletsFromSupabase(userId: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Supabase getWallets error:', err.message);
    return null;
  }
}

// 5. Toifalar (Categories)
export async function getCategoriesFromSupabase(userId: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('type', { ascending: true });
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Supabase getCategories error:', err.message);
    return null;
  }
}

// 6. Operatsiyalar (Transactions)
export async function getTransactionsFromSupabase(userId: string, limit = 50) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        categories(name, icon, color),
        wallets:balance_id(name, type)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((t: any) => ({
      ...t,
      category_name: t.categories?.name,
      category_icon: t.categories?.icon,
      category_color: t.categories?.color,
      wallet_name: t.wallets?.name,
      wallet_type: t.wallets?.type
    }));
  } catch (err: any) {
    console.error('Supabase getTransactions error:', err.message);
    return null;
  }
}

// 7. Qarzlar (Debts)
export async function getDebtsFromSupabase(userId: string, status?: string) {
  if (!supabase) return null;
  try {
    let query = supabase.from('debts').select('*').eq('user_id', userId);
    if (status) query = query.eq('status', status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Supabase getDebts error:', err.message);
    return null;
  }
}

// 8. Maqsadlar (Goals)
export async function getGoalsFromSupabase(userId: string) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Supabase getGoals error:', err.message);
    return null;
  }
}

// 9. Operatsiya qo'shish (Insert Transaction to Supabase)
export async function insertTransactionToSupabase(tx: any) {
  if (!supabase) return null;
  try {
    const cleanPayload = {
      id: tx.id,
      user_id: tx.user_id,
      balance_id: tx.balance_id,
      category_id: tx.category_id || null,
      amount: tx.amount,
      type: tx.type || 'expense',
      to_balance_id: tx.to_balance_id || null,
      description: tx.description,
      category_label: tx.category_label || null,
      time_str: tx.time_str || null,
      date: tx.date || new Date().toISOString(),
      receipt_image: tx.receipt_image || null,
      tags: tx.tags || null
    };

    const { data, error } = await supabase
      .from('transactions')
      .insert([cleanPayload])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Supabase insertTransaction error:', err.message);
    return null;
  }
}

