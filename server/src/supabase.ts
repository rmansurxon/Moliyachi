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

    // Update wallet balance in Supabase
    try {
      const { data: w } = await supabase.from('wallets').select('balance').eq('id', tx.balance_id).single();
      if (w) {
        let newBal = w.balance;
        if (tx.type === 'expense') newBal -= tx.amount;
        else if (tx.type === 'income') newBal += tx.amount;
        else if (tx.type === 'transfer' && tx.to_balance_id) {
          newBal -= tx.amount;
          const { data: toW } = await supabase.from('wallets').select('balance').eq('id', tx.to_balance_id).single();
          if (toW) {
            await supabase.from('wallets').update({ balance: toW.balance + tx.amount }).eq('id', tx.to_balance_id);
          }
        }
        await supabase.from('wallets').update({ balance: newBal }).eq('id', tx.balance_id);
      }
    } catch (e: any) {
      console.warn('Supabase wallet balance update warning:', e.message);
    }

    return data;
  } catch (err: any) {
    console.error('Supabase insertTransaction error:', err.message);
    return null;
  }
}

// 10. Operatsiyani o'chirish / bekor qilish (Delete Transaction from Supabase)
export async function deleteTransactionFromSupabase(txId: string) {
  if (!supabase) return false;
  try {
    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', txId)
      .single();

    if (tx) {
      // Revert wallet balance
      const { data: w } = await supabase.from('wallets').select('balance').eq('id', tx.balance_id).single();
      if (w) {
        let revBal = w.balance;
        if (tx.type === 'expense') revBal += tx.amount;
        else if (tx.type === 'income') revBal -= tx.amount;
        else if (tx.type === 'transfer' && tx.to_balance_id) {
          revBal += tx.amount;
          const { data: toW } = await supabase.from('wallets').select('balance').eq('id', tx.to_balance_id).single();
          if (toW) {
            await supabase.from('wallets').update({ balance: toW.balance - tx.amount }).eq('id', tx.to_balance_id);
          }
        }
        await supabase.from('wallets').update({ balance: revBal }).eq('id', tx.balance_id);
      }
    }

    const { error } = await supabase.from('transactions').delete().eq('id', txId);
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('Supabase deleteTransaction error:', err.message);
    return false;
  }
}

// 11. Qarz qo'shish (Insert Debt to Supabase)
export async function insertDebtToSupabase(debt: any) {
  if (!supabase) return null;
  try {
    const payload = {
      id: debt.id,
      user_id: debt.user_id,
      type: debt.type || 'lent',
      counterparty_name: debt.counterparty_name,
      phone: debt.phone || null,
      amount: debt.amount,
      paid_amount: debt.paid_amount || 0,
      due_date: debt.due_date || null,
      status: debt.status || 'active',
      notes: debt.notes || null,
      created_at: debt.created_at || new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('debts')
      .insert([payload])
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Supabase insertDebt error:', err.message);
    return null;
  }
}

export async function updateDebtInSupabase(id: string, updates: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('debts')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Supabase updateDebt error:', err.message);
    return null;
  }
}

export async function deleteDebtFromSupabase(id: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('Supabase deleteDebt error:', err.message);
    return false;
  }
}

export async function updateCategoryInSupabase(id: string, updates: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Supabase updateCategory error:', err.message);
    return null;
  }
}

export async function deleteCategoryFromSupabase(id: string) {
  if (!supabase) return false;
  try {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err: any) {
    console.error('Supabase deleteCategory error:', err.message);
    return false;
  }
}

export async function updateTransactionInSupabase(id: string, updates: any) {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase
      .from('transactions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err: any) {
    console.error('Supabase updateTransaction error:', err.message);
    return null;
  }
}

// 12. AI Chat Messages History
export async function getChatMessagesFromSupabase(userId: string) {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      return [];
    }
    return data || [];
  } catch (err: any) {
    console.warn('Supabase chat_messages fetch warning:', err.message);
    return [];
  }
}

export async function saveChatMessageToSupabase(userId: string, sender: 'user' | 'ai', text: string, txData?: any) {
  if (!supabase) return null;
  try {
    const payload = {
      user_id: userId,
      sender,
      text,
      transaction_data: txData ? JSON.stringify(txData) : null,
      created_at: new Date().toISOString()
    };
    const { data, error } = await supabase
      .from('chat_messages')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Supabase saveChatMessage table error:', error.message);
      return null;
    }
    return data;
  } catch (err: any) {
    console.warn('Supabase saveChatMessage warning:', err.message);
    return null;
  }
}

export async function resetSupabaseBalancesAndTransactions(userId?: string) {
  if (!supabase) return false;
  try {
    // 1. Reset balances to 0
    let walletQuery = supabase.from('wallets').update({ balance: 0 });
    if (userId) walletQuery = walletQuery.eq('user_id', userId);
    else walletQuery = walletQuery.neq('id', 'placeholder');
    await walletQuery;

    // 2. Delete test transactions
    let txQuery = supabase.from('transactions').delete();
    if (userId) txQuery = txQuery.eq('user_id', userId);
    else txQuery = txQuery.neq('id', 'placeholder');
    await txQuery;

    return true;
  } catch (err: any) {
    console.error('Supabase reset error:', err.message);
    return false;
  }
}

