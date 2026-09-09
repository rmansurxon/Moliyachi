import { User, Wallet, Category, Transaction, Debt, Goal, Voucher, Article, FinancialSummary } from './types';
import { supabase } from './supabase';

// Telegram WebApp helper
export const tg = (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) || null;

export function isTelegramEnv(): boolean {
  try {
    if (tg && (tg.initDataUnsafe?.user?.id || (typeof tg.initData === 'string' && tg.initData.length > 0))) {
      return true;
    }
  } catch {}
  return false;
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'light') {
  try {
    const isSupported = tg?.isVersionAtLeast ? tg.isVersionAtLeast('6.1') : false;
    if (isSupported && tg?.HapticFeedback) {
      if (type === 'success' || type === 'error' || type === 'warning') {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
    } else if (navigator.vibrate) {
      navigator.vibrate(type === 'heavy' ? 40 : 20);
    }
  } catch { }
}

const API_BASE = (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api');

// Centralized request helper with Telegram Auto-Auth & persistence
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const tgUser = tg?.initDataUnsafe?.user;
    const tgId = tgUser?.id ? String(tgUser.id) : null;
    if (tgId) {
      headers['x-telegram-id'] = tgId;
      headers['x-telegram-user'] = encodeURIComponent(JSON.stringify(tgUser));
    }
  } catch {}

  try {
    const savedUserId = localStorage.getItem('hisobchi_user_id');
    if (savedUserId) {
      headers['x-user-id'] = savedUserId;
    }
  } catch {}

  return headers;
}

export async function getEffectiveUserId(): Promise<string> {
  const currentTgUser = tg?.initDataUnsafe?.user;
  const currentTgId = currentTgUser?.id ? String(currentTgUser.id) : null;

  // 1. If opened inside genuine Telegram WebApp -> Instant Seamless Auto-Login
  if (currentTgId) {
    const prevTgId = localStorage.getItem('hisobchi_current_tg_id');
    if (prevTgId && prevTgId !== currentTgId) {
      // Switched to a different Telegram account! Wipe previous user cache immediately
      localStorage.clear();
    }
    localStorage.setItem('hisobchi_current_tg_id', currentTgId);
    localStorage.setItem('hisobchi_telegram_id', currentTgId);

    // Check if user already exists in Supabase
    try {
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('telegram_id', currentTgId)
        .maybeSingle();

      if (existingUser?.id) {
        localStorage.setItem('hisobchi_user_id', existingUser.id);
        localStorage.setItem('hisobchi_user_cache', JSON.stringify(existingUser));
        return existingUser.id;
      }

      // Special case: if this is Mansurxon's Telegram ID, link to existing user-mansurxon
      if (currentTgId === '8724834222') {
        const { data: mUser } = await supabase.from('users').select('*').eq('id', 'user-mansurxon').maybeSingle();
        if (mUser) {
          await supabase.from('users').update({ telegram_id: currentTgId }).eq('id', 'user-mansurxon');
          localStorage.setItem('hisobchi_user_id', 'user-mansurxon');
          localStorage.setItem('hisobchi_user_cache', JSON.stringify(mUser));
          return 'user-mansurxon';
        }
      }

      // New Telegram User: Auto-create isolated private row in Supabase!
      const newUserId = `user-tg-${currentTgId}`;
      const newUser: User = {
        id: newUserId,
        telegram_id: currentTgId,
        first_name: currentTgUser?.first_name || 'Foydalanuvchi',
        username: currentTgUser?.username || '',
        currency: 'UZS',
        theme: 'dark',
        language: 'uz',
        pin_code: '0000',
        xp: 100,
        diamonds: 0,
        streak: 1,
        rank: 'bronze'
      };

      await supabase.from('users').insert([newUser]);

      // Create separate 0-balance wallets for this new user
      await supabase.from('wallets').insert([
        { id: `w-${currentTgId}-card`, user_id: newUserId, name: 'Asosiy karta', type: 'uzcard', balance: 0, currency: 'UZS', color: '#23a887', is_default: 1 },
        { id: `w-${currentTgId}-cash`, user_id: newUserId, name: 'Naqd pul', type: 'cash', balance: 0, currency: 'UZS', color: '#38a169', is_default: 0 },
        { id: `w-${currentTgId}-invest`, user_id: newUserId, name: 'Jamgʻarma', type: 'invest', balance: 0, currency: 'UZS', color: '#7a5af8', is_default: 0 }
      ]);

      // Create default categories for this new user
      await supabase.from('categories').insert([
        { id: `c-${currentTgId}-1`, user_id: newUserId, name: 'Oziq-ovqat', type: 'expense', icon: 'Utensils', color: '#29c184', budget_limit: 0 },
        { id: `c-${currentTgId}-2`, user_id: newUserId, name: 'Transport & Benzin', type: 'expense', icon: 'Car', color: '#1570ef', budget_limit: 0 },
        { id: `c-${currentTgId}-3`, user_id: newUserId, name: 'Kiyim-kechak', type: 'expense', icon: 'Shirt', color: '#ec4899', budget_limit: 0 },
        { id: `c-${currentTgId}-4`, user_id: newUserId, name: 'Kommunal & Uy', type: 'expense', icon: 'Home', color: '#f0646e', budget_limit: 0 },
        { id: `c-${currentTgId}-5`, user_id: newUserId, name: 'Oylik maosh', type: 'income', icon: 'DollarSign', color: '#10b981', budget_limit: 0 },
        { id: `c-${currentTgId}-6`, user_id: newUserId, name: 'Boshqa daromad', type: 'income', icon: 'TrendingUp', color: '#3182ce', budget_limit: 0 }
      ]);

      localStorage.setItem('hisobchi_user_id', newUserId);
      localStorage.setItem('hisobchi_user_cache', JSON.stringify(newUser));
      return newUserId;
    } catch (err) {
      console.error('Supabase user auto-provision error:', err);
      const fallbackId = `user-tg-${currentTgId}`;
      localStorage.setItem('hisobchi_user_id', fallbackId);
      return fallbackId;
    }
  }

  // 2. Standalone Web Browser (Chrome/Safari): check stored authenticated session
  const savedUserId = localStorage.getItem('hisobchi_user_id');
  if (savedUserId) {
    return savedUserId;
  }

  return '';
}

// Phone Number + PIN-code Authentication for External Browsers (Chrome / Safari / PC)
export async function loginWithPhoneAndPin(
  phoneInput: string,
  pinInput: string
): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const rawDigits = phoneInput.replace(/\D/g, '');
    if (rawDigits.length < 9) {
      return {
        success: false,
        error: "Telefon raqamini to'liq kiriting (masalan: +998 90 123 45 67)"
      };
    }

    let normalized = rawDigits;
    if (rawDigits.length === 9) {
      normalized = '998' + rawDigits;
    }

    const candidateList = [
      '+' + normalized,
      normalized,
      '+' + rawDigits,
      rawDigits,
      phoneInput.trim()
    ];

    const uniqueCandidates = Array.from(new Set(candidateList));
    const orFilter = uniqueCandidates.map((p) => `phone.eq.${p}`).join(',');

    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .or(orFilter)
      .limit(1);

    if (error) {
      console.error('Supabase phone search error:', error);
      return { success: false, error: "Tizimda xatolik yuz berdi. Qaytadan urinib ko'ring." };
    }

    if (!users || users.length === 0) {
      return {
        success: false,
        error: "Ushbu telefon raqamiga ega hisob topilmadi. Avval Telegram botimizda (/start) raqamingizni ulashing."
      };
    }

    const user = users[0] as User;
    const expectedPin = user.pin_code && user.pin_code.trim() ? user.pin_code.trim() : '0000';
    if (pinInput.trim() !== expectedPin) {
      return {
        success: false,
        error: "PIN-kod noto'g'ri! Standart PIN-kod: 0000 (agar o'zgartirmagan bo'lsangiz)."
      };
    }

    // Ensure user has default wallets in Supabase if missing
    try {
      const { data: userWallets } = await supabase.from('wallets').select('id').eq('user_id', user.id);
      if (!userWallets || userWallets.length === 0) {
        await supabase.from('wallets').insert([
          { id: `w-${user.id}-card`, user_id: user.id, name: 'Asosiy karta', type: 'uzcard', balance: 0, currency: 'UZS', color: '#23a887', is_default: 1 },
          { id: `w-${user.id}-cash`, user_id: user.id, name: 'Naqd pul', type: 'cash', balance: 0, currency: 'UZS', color: '#38a169', is_default: 0 },
          { id: `w-${user.id}-invest`, user_id: user.id, name: 'Jamgʻarma', type: 'invest', balance: 0, currency: 'UZS', color: '#7a5af8', is_default: 0 }
        ]);
      }
    } catch {}

    // Save session in localStorage
    localStorage.setItem('hisobchi_user_id', user.id);
    if (user.telegram_id) {
      localStorage.setItem('hisobchi_telegram_id', user.telegram_id);
      localStorage.setItem('hisobchi_current_tg_id', user.telegram_id);
    }
    localStorage.setItem('hisobchi_user_cache', JSON.stringify(user));

    return { success: true, user };
  } catch (err: any) {
    console.error('loginWithPhoneAndPin error:', err);
    return { success: false, error: err?.message || "Kutilmagan xatolik yuz berdi." };
  }
}

export function logoutUser() {
  localStorage.removeItem('hisobchi_user_id');
  localStorage.removeItem('hisobchi_user_cache');
  localStorage.removeItem('hisobchi_wallets_cache');
  localStorage.removeItem('hisobchi_categories_cache');
  localStorage.removeItem('hisobchi_transactions_cache');
  localStorage.removeItem('hisobchi_summary_cache');
  localStorage.removeItem('hisobchi_current_tg_id');
  localStorage.removeItem('hisobchi_telegram_id');
}

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = getAuthHeaders();
  const mergedHeaders: Record<string, string> = {
    ...authHeaders,
    ...((options.headers as Record<string, string>) || {})
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  
  // AI endpoints need longer timeout (45s) because LLMs and Render cold-starts require time
  const timeoutMs = endpoint.includes('/ai/') ? 45000 : 25000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      headers: mergedHeaders,
      signal: options.signal || controller.signal
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`HTTP ${res.status}: ${errText || res.statusText}`);
    }

    return await res.json();
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw new Error("Tarmoq vaqti tugadi (Timeout). Server uyg'onmoqda yoki sun'iy intellekt hisoblamoqda.");
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

// Calculate financial summary from transactions array locally
function computeFinancialSummary(transactions: Transaction[], period: 'week' | 'month' | 'year' = 'month'): FinancialSummary {
  const now = new Date();
  let startDate = new Date();

  if (period === 'week') {
    startDate.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    startDate = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1);
  }

  const periodTxs = transactions.filter(t => new Date(t.date) >= startDate);
  let totalIncome = 0;
  let totalExpense = 0;
  const categoryMap: Record<string, { name: string; amount: number; color: string; icon: string }> = {};

  for (const t of periodTxs) {
    if (t.type === 'income') {
      totalIncome += t.amount;
    } else if (t.type === 'expense') {
      totalExpense += t.amount;
      const catKey = t.category_id || t.category_name || 'Boshqa';
      if (!categoryMap[catKey]) {
        categoryMap[catKey] = {
          name: t.category_name || 'Boshqa xarajatlar',
          amount: 0,
          color: t.category_color || '#29c184',
          icon: t.category_icon || 'Tag'
        };
      }
      categoryMap[catKey].amount += t.amount;
    }
  }

  const categoryBreakdown = Object.values(categoryMap).map(c => ({
    category_id: c.name,
    category_name: c.name,
    amount: c.amount,
    percentage: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
    color: c.color,
    icon: c.icon
  })).sort((a, b) => b.amount - a.amount);

  const categoryStats = categoryBreakdown.map((c, i) => ({
    id: `cat-${i}`,
    name: c.category_name,
    icon: c.icon,
    color: c.color,
    amount: c.amount,
    count: 1
  }));

  return {
    totalBalance: totalIncome - totalExpense,
    totalIncome,
    totalExpense,
    categoryStats,
    dailyPoints: [],
    period,
    netSavings: Math.max(0, totalIncome - totalExpense),
    savingsRate: totalIncome > 0 ? Math.round((Math.max(0, totalIncome - totalExpense) / totalIncome) * 100) : 0,
    categoryBreakdown,
    recentTransactions: transactions.slice(0, 10),
    topExpenseCategory: categoryBreakdown[0] || null
  };
}

export const api = {
  // Ultra-Fast Direct Supabase Bootstrap (Loads entire state in <100ms)
  async getBootstrapData(): Promise<{
    user: User;
    wallets: Wallet[];
    categories: Category[];
    transactions: Transaction[];
    debts: Debt[];
    goals: Goal[];
    summary: FinancialSummary;
    articles: Article[];
  } | null> {
    const userId = await getEffectiveUserId();
    if (!userId) {
      return null;
    }

    try {
      const [userRes, walletsRes, catRes, txRes, debtsRes, goalsRes, articlesRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', userId).maybeSingle(),
        supabase.from('wallets').select('*').eq('user_id', userId).order('is_default', { ascending: false }),
        supabase.from('categories').select('*').eq('user_id', userId).order('type', { ascending: true }),
        supabase.from('transactions').select('*, categories(name, icon, color), wallets:balance_id(name, type)').eq('user_id', userId).order('date', { ascending: false }).limit(50),
        supabase.from('debts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('articles').select('*').order('date', { ascending: false })
      ]);

      const currentTgUser = tg?.initDataUnsafe?.user;
      const user = userRes.data || {
        id: userId,
        first_name: currentTgUser?.first_name || 'Foydalanuvchi',
        username: currentTgUser?.username || '',
        currency: 'UZS',
        theme: 'dark',
        language: 'uz',
        xp: 100,
        diamonds: 0,
        streak: 1,
        rank: 'bronze'
      };

      const wallets: Wallet[] = walletsRes.data || [];
      const categories: Category[] = catRes.data || [];
      const rawTxs = txRes.data || [];
      const transactions: Transaction[] = rawTxs.map((t: any) => ({
        ...t,
        category_name: t.categories?.name,
        category_icon: t.categories?.icon,
        category_color: t.categories?.color,
        wallet_name: t.wallets?.name,
        wallet_type: t.wallets?.type
      }));
      const debts: Debt[] = debtsRes.data || [];
      const goals: Goal[] = goalsRes.data || [];
      const articles: Article[] = articlesRes.data || [];

      const summary = computeFinancialSummary(transactions, 'month');

      // Cache locally for instant offline display
      try {
        localStorage.setItem('hisobchi_user_id', user.id);
        localStorage.setItem('hisobchi_user_cache', JSON.stringify(user));
        localStorage.setItem('hisobchi_wallets_cache', JSON.stringify(wallets));
        localStorage.setItem('hisobchi_categories_cache', JSON.stringify(categories));
        localStorage.setItem('hisobchi_transactions_cache', JSON.stringify(transactions));
        localStorage.setItem('hisobchi_summary_cache', JSON.stringify(summary));
      } catch {}

      return {
        user,
        wallets,
        categories,
        transactions,
        debts,
        goals,
        summary,
        articles
      };
    } catch (err) {
      console.warn('Direct Supabase bootstrap failed, trying Express proxy fallback:', err);
      const res = await request<{ success: boolean; data: any }>('/bootstrap');
      return res.data;
    }
  },

  // Auth & Profile
  loginWithPhoneAndPin,
  logoutUser,
  isTelegramEnv,
  async getUser(): Promise<User> {
    const userId = await getEffectiveUserId();
    try {
      const { data } = await supabase.from('users').select('*').eq('id', userId).single();
      if (data) {
        localStorage.setItem('hisobchi_user_cache', JSON.stringify(data));
        return data;
      }
    } catch {}
    const data = await request<{ success: boolean; user: User }>('/user');
    return data.user;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const userId = await getEffectiveUserId();
    try {
      const { data } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (data) {
        localStorage.setItem('hisobchi_user_cache', JSON.stringify(data));
        return data;
      }
    } catch {}

    const data = await request<{ success: boolean; user: User }>('/user/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.user;
  },

  // Wallets / Balances
  async getWallets(): Promise<Wallet[]> {
    const userId = await getEffectiveUserId();
    try {
      const { data } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false });
      if (data) {
        localStorage.setItem('hisobchi_wallets_cache', JSON.stringify(data));
        return data;
      }
    } catch {}

    const data = await request<{ success: boolean; wallets: Wallet[] }>('/wallets');
    return data.wallets;
  },

  async createWallet(wallet: Partial<Wallet>): Promise<Wallet> {
    const userId = await getEffectiveUserId();
    const newWallet = {
      id: `w-${Date.now()}`,
      user_id: userId,
      name: wallet.name || 'Hamyon',
      type: wallet.type || 'uzcard',
      balance: wallet.balance || 0,
      currency: wallet.currency || 'UZS',
      color: wallet.color || '#23a887',
      card_number_last4: wallet.card_number_last4 || null,
      is_default: wallet.is_default ? 1 : 0
    };

    try {
      const { data, error } = await supabase.from('wallets').insert([newWallet]).select().single();
      if (!error && data) return data;
    } catch {}

    const data = await request<{ success: boolean; wallet: Wallet }>('/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wallet)
    });
    return data.wallet;
  },

  async updateWallet(id: string, updates: Partial<Wallet>): Promise<Wallet> {
    try {
      const { data, error } = await supabase.from('wallets').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
    } catch {}

    const data = await request<{ success: boolean; wallet: Wallet }>(`/wallets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.wallet;
  },

  async deleteWallet(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('wallets').delete().eq('id', id);
      if (!error) return true;
    } catch {}

    const data = await request<{ success: boolean }>(`/wallets/${id}`, { method: 'DELETE' });
    return data.success;
  },

  async transfer(params: { from_wallet_id: string; to_wallet_id: string; amount: number; description?: string }) {
    const userId = await getEffectiveUserId();
    try {
      const [fromRes, toRes] = await Promise.all([
        supabase.from('wallets').select('balance').eq('id', params.from_wallet_id).single(),
        supabase.from('wallets').select('balance').eq('id', params.to_wallet_id).single()
      ]);

      if (fromRes.data && toRes.data) {
        await Promise.all([
          supabase.from('wallets').update({ balance: fromRes.data.balance - params.amount }).eq('id', params.from_wallet_id),
          supabase.from('wallets').update({ balance: toRes.data.balance + params.amount }).eq('id', params.to_wallet_id),
          supabase.from('transactions').insert([{
            id: `tx-${Date.now()}`,
            user_id: userId,
            balance_id: params.from_wallet_id,
            to_balance_id: params.to_wallet_id,
            amount: params.amount,
            type: 'transfer',
            description: params.description || "O'tkazma",
            date: new Date().toISOString()
          }])
        ]);
        return { success: true };
      }
    } catch {}

    return request('/wallets/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const userId = await getEffectiveUserId();
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('type', { ascending: true });
      if (data) {
        localStorage.setItem('hisobchi_categories_cache', JSON.stringify(data));
        return data;
      }
    } catch {}

    const data = await request<{ success: boolean; categories: Category[] }>('/categories');
    return data.categories;
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    const userId = await getEffectiveUserId();
    const newCat = {
      id: `cat-${Date.now()}`,
      user_id: userId,
      name: cat.name || 'Toifa',
      type: cat.type || 'expense',
      icon: cat.icon || 'Tag',
      color: cat.color || '#29c184',
      budget_limit: cat.budget_limit || 0
    };

    try {
      const { data, error } = await supabase.from('categories').insert([newCat]).select().single();
      if (!error && data) return data;
    } catch {}

    const data = await request<{ success: boolean; category: Category }>('/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
    return data.category;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    try {
      const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
    } catch {}

    const data = await request<{ success: boolean; category: Category }>(`/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.category;
  },

  async deleteCategory(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (!error) return true;
    } catch {}

    const data = await request<{ success: boolean }>(`/categories/${id}`, { method: 'DELETE' });
    return data.success;
  },

  // Transactions (Direct Supabase with Real-Time Wallet Balance Adjustment)
  async getTransactions(params?: { limit?: number; type?: string; category_id?: string }): Promise<Transaction[]> {
    const userId = await getEffectiveUserId();
    try {
      let query = supabase
        .from('transactions')
        .select('*, categories(name, icon, color), wallets:balance_id(name, type)')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (params?.limit) query = query.limit(params.limit);
      if (params?.type && params.type !== 'all') query = query.eq('type', params.type);
      if (params?.category_id) query = query.eq('category_id', params.category_id);

      const { data } = await query;
      if (data) {
        return data.map((t: any) => ({
          ...t,
          category_name: t.categories?.name,
          category_icon: t.categories?.icon,
          category_color: t.categories?.color,
          wallet_name: t.wallets?.name,
          wallet_type: t.wallets?.type
        }));
      }
    } catch {}

    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.type) q.set('type', params.type);
    if (params?.category_id) q.set('category_id', params.category_id);
    const qs = q.toString();
    const data = await request<{ success: boolean; transactions: Transaction[] }>(`/transactions${qs ? `?${qs}` : ''}`);
    return data.transactions;
  },

  async createTransaction(tx: {
    balance_id: string;
    category_id?: string;
    amount: number;
    type: 'expense' | 'income' | 'transfer';
    description: string;
    date?: string;
    category_label?: string;
  }): Promise<Transaction> {
    const userId = await getEffectiveUserId();
    const newTxId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const txPayload = {
      id: newTxId,
      user_id: userId,
      balance_id: tx.balance_id,
      category_id: tx.category_id || null,
      amount: tx.amount,
      type: tx.type,
      description: tx.description,
      category_label: tx.category_label || null,
      date: tx.date || new Date().toISOString()
    };

    try {
      // 1. Insert transaction
      const { data: savedTx, error } = await supabase.from('transactions').insert([txPayload]).select('*, categories(name, icon, color), wallets:balance_id(name, type)').single();
      if (!error && savedTx) {
        // 2. Adjust wallet balance
        const { data: w } = await supabase.from('wallets').select('balance').eq('id', tx.balance_id).single();
        if (w) {
          const newBal = tx.type === 'expense' ? w.balance - tx.amount : w.balance + tx.amount;
          await supabase.from('wallets').update({ balance: newBal }).eq('id', tx.balance_id);
        }

        return {
          ...savedTx,
          category_name: savedTx.categories?.name,
          category_icon: savedTx.categories?.icon,
          category_color: savedTx.categories?.color,
          wallet_name: savedTx.wallets?.name,
          wallet_type: savedTx.wallets?.type
        };
      }
    } catch {}

    const data = await request<{ success: boolean; transaction: Transaction }>('/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
    return data.transaction;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    try {
      const { data: oldTx } = await supabase.from('transactions').select('*').eq('id', id).single();
      if (oldTx) {
        // Revert old transaction impact
        const { data: oldW } = await supabase.from('wallets').select('balance').eq('id', oldTx.balance_id).single();
        if (oldW) {
          let revertedBal = oldW.balance;
          if (oldTx.type === 'expense') revertedBal += oldTx.amount;
          else if (oldTx.type === 'income') revertedBal -= oldTx.amount;
          await supabase.from('wallets').update({ balance: revertedBal }).eq('id', oldTx.balance_id);
        }

        // Update transaction row
        const { data: updatedTx } = await supabase
          .from('transactions')
          .update({
            amount: updates.amount !== undefined ? updates.amount : oldTx.amount,
            type: updates.type || oldTx.type,
            description: updates.description || oldTx.description,
            category_id: updates.category_id !== undefined ? updates.category_id : oldTx.category_id,
            balance_id: updates.balance_id || oldTx.balance_id
          })
          .eq('id', id)
          .select('*, categories(name, icon, color), wallets:balance_id(name, type)')
          .single();

        // Apply new transaction impact
        const targetWalletId = updates.balance_id || oldTx.balance_id;
        const targetAmount = updates.amount !== undefined ? updates.amount : oldTx.amount;
        const targetType = updates.type || oldTx.type;

        const { data: newW } = await supabase.from('wallets').select('balance').eq('id', targetWalletId).single();
        if (newW) {
          const finalBal = targetType === 'expense' ? newW.balance - targetAmount : newW.balance + targetAmount;
          await supabase.from('wallets').update({ balance: finalBal }).eq('id', targetWalletId);
        }

        if (updatedTx) {
          return {
            ...updatedTx,
            category_name: updatedTx.categories?.name,
            category_icon: updatedTx.categories?.icon,
            category_color: updatedTx.categories?.color,
            wallet_name: updatedTx.wallets?.name,
            wallet_type: updatedTx.wallets?.type
          };
        }
      }
    } catch {}

    const data = await request<{ success: boolean; transaction: Transaction }>(`/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.transaction;
  },

  async deleteTransaction(id: string) {
    try {
      const { data: tx } = await supabase.from('transactions').select('*').eq('id', id).single();
      if (tx) {
        // Revert wallet balance
        const { data: w } = await supabase.from('wallets').select('balance').eq('id', tx.balance_id).single();
        if (w) {
          const revBal = tx.type === 'expense' ? w.balance + tx.amount : w.balance - tx.amount;
          await supabase.from('wallets').update({ balance: revBal }).eq('id', tx.balance_id);
        }
        await supabase.from('transactions').delete().eq('id', id);
        return { success: true };
      }
    } catch {}

    return request(`/transactions/${id}`, { method: 'DELETE' });
  },

  async deleteLastTransaction() {
    const userId = await getEffectiveUserId();
    try {
      const { data: lastTx } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(1)
        .single();

      if (lastTx) {
        await this.deleteTransaction(lastTx.id);
        return { success: true, transaction: lastTx };
      }
    } catch {}

    return request<{ success: boolean; transaction?: Transaction; message?: string }>('/transactions/last', { method: 'DELETE' });
  },

  // Debts
  async getDebts(status?: 'active' | 'closed'): Promise<Debt[]> {
    const userId = await getEffectiveUserId();
    try {
      let query = supabase.from('debts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data } = await query;
      if (data) return data;
    } catch {}

    const data = await request<{ success: boolean; debts: Debt[] }>(`/debts${status ? `?status=${status}` : ''}`);
    return data.debts || [];
  },

  async createDebt(debt: Partial<Debt>): Promise<Debt> {
    const userId = await getEffectiveUserId();
    const newDebt = {
      id: `debt-${Date.now()}`,
      user_id: userId,
      type: debt.type || 'lent',
      counterparty_name: debt.counterparty_name,
      phone: debt.phone || null,
      amount: debt.amount || 0,
      paid_amount: debt.paid_amount || 0,
      due_date: debt.due_date || null,
      status: debt.status || 'active',
      notes: debt.notes || null,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('debts').insert([newDebt]).select().single();
      if (!error && data) return data;
    } catch {}

    const data = await request<{ success: boolean; debt: Debt }>('/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(debt)
    });
    return data.debt;
  },

  async updateDebt(id: string, updates: Partial<Debt>): Promise<Debt> {
    try {
      const { data, error } = await supabase.from('debts').update(updates).eq('id', id).select().single();
      if (!error && data) return data;
    } catch {}

    const data = await request<{ success: boolean; debt: Debt }>(`/debts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.debt;
  },

  async deleteDebt(id: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('debts').delete().eq('id', id);
      if (!error) return true;
    } catch {}

    const data = await request<{ success: boolean }>(`/debts/${id}`, { method: 'DELETE' });
    return data.success;
  },

  async payDebt(id: string, amount: number) {
    try {
      const { data: d } = await supabase.from('debts').select('*').eq('id', id).single();
      if (d) {
        const newPaid = (d.paid_amount || 0) + amount;
        const newStatus = newPaid >= d.amount ? 'closed' : 'active';
        const { data: updated } = await supabase.from('debts').update({ paid_amount: newPaid, status: newStatus }).eq('id', id).select().single();
        if (updated) return { success: true, debt: updated };
      }
    } catch {}

    return request(`/debts/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
  },

  // Goals
  async getGoals(): Promise<Goal[]> {
    const userId = await getEffectiveUserId();
    try {
      const { data } = await supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
      if (data) return data;
    } catch {}

    const data = await request<{ success: boolean; goals: Goal[] }>('/goals');
    return data.goals || [];
  },

  async createGoal(goal: Partial<Goal>): Promise<Goal> {
    const userId = await getEffectiveUserId();
    const newGoal = {
      id: `goal-${Date.now()}`,
      user_id: userId,
      title: goal.title || (goal as any).name || 'Maqsad',
      target_amount: goal.target_amount || 0,
      current_amount: goal.current_amount || 0,
      deadline: goal.deadline || null,
      icon: goal.icon || 'Target',
      color: goal.color || '#29c184',
      is_completed: 0,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('goals').insert([newGoal]).select().single();
      if (!error && data) return data;
    } catch {}

    const data = await request<{ success: boolean; goal: Goal }>('/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal)
    });
    return data.goal;
  },

  async contributeGoal(id: string, amount: number, wallet_id?: string) {
    try {
      const { data: g } = await supabase.from('goals').select('*').eq('id', id).single();
      if (g) {
        const newCurrent = (g.current_amount || 0) + amount;
        const isCompleted = newCurrent >= g.target_amount ? 1 : 0;
        await supabase.from('goals').update({ current_amount: newCurrent, is_completed: isCompleted }).eq('id', id);

        if (wallet_id) {
          const { data: w } = await supabase.from('wallets').select('balance').eq('id', wallet_id).single();
          if (w) {
            await supabase.from('wallets').update({ balance: w.balance - amount }).eq('id', wallet_id);
          }
        }
        return { success: true };
      }
    } catch {}

    return request(`/goals/${id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, wallet_id })
    });
  },

  // Articles
  async getArticles(): Promise<Article[]> {
    try {
      const { data } = await supabase.from('articles').select('*').order('date', { ascending: false });
      if (data && data.length > 0) return data;
    } catch {}

    const data = await request<{ success: boolean; articles: Article[] }>('/articles');
    return data.articles || [];
  },

  // Statistics
  async getSummary(period: 'week' | 'month' | 'year' = 'month'): Promise<FinancialSummary> {
    const txs = await this.getTransactions();
    const summary = computeFinancialSummary(txs, period);
    localStorage.setItem('hisobchi_summary_cache', JSON.stringify(summary));
    return summary;
  },

  async getMonthlyWrap() {
    const txs = await this.getTransactions();
    const summary = computeFinancialSummary(txs, 'month');
    return {
      success: true,
      wrap: {
        totalExpense: summary.totalExpense,
        totalIncome: summary.totalIncome,
        netSavings: summary.netSavings,
        topCategory: summary.topExpenseCategory?.category_name || 'Xaridlar',
        topCategoryAmount: summary.topExpenseCategory?.amount || 0,
        transactionsCount: txs.length
      }
    };
  },

  // AI Chat & Speech-to-Expense
  async getChatHistory() {
    const userId = await getEffectiveUserId();
    try {
      const { data } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      if (data && data.length > 0) {
        return { success: true, messages: data };
      }
    } catch {}

    try {
      return await request<{ success: boolean; messages: any[] }>('/ai/chat/history');
    } catch {
      return { success: false, messages: [] };
    }
  },

  async fallbackClientChat(message: string): Promise<any> {
    const text = message.trim().toLowerCase();

    // 1. Balans so'rovi
    if (text.includes('balans') || text.includes('hisob') || text.includes('qancha pul')) {
      try {
        const wallets = await this.getWallets();
        const total = wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
        const walletLines = wallets.map(w => `• ${w.name}: ${w.balance.toLocaleString('uz-UZ')} ${w.currency || 'UZS'}`).join('\n');
        return {
          success: true,
          reply: `💰 **Umumiy balansingiz:** ${total.toLocaleString('uz-UZ')} UZS\n\n${walletLines}`,
          transaction: null
        };
      } catch {}
    }

    // 2. Oddiy xarajat yoki daromadni aniqlash (masalan: "Tushlik 45000", "Taksi 20 ming", "Benzin 150000")
    const numMatch = text.match(/(\d+[\d\s.,]*)\s*(ming|mln|so['`ʼ]m|uzs)?/i);
    if (numMatch) {
      let rawNum = numMatch[1].replace(/[\s.,]/g, '');
      let amount = parseInt(rawNum, 10);
      const unit = (numMatch[2] || '').toLowerCase();
      if (unit.includes('ming')) amount *= 1000;
      if (unit.includes('mln')) amount *= 1000000;

      if (amount > 0 && amount < 1000000000) {
        let category = 'Oziq-ovqat';
        if (text.includes('taksi') || text.includes('benzin') || text.includes('yo\'l') || text.includes('yandex') || text.includes('transport')) {
          category = 'Transport & Benzin';
        } else if (text.includes('kiyim') || text.includes('shim') || text.includes('ko\'ylak') || text.includes('poyabzal')) {
          category = 'Kiyim-kechak';
        } else if (text.includes('svet') || text.includes('gaz') || text.includes('uy') || text.includes('ijara') || text.includes('kommunal')) {
          category = 'Kommunal & Uy';
        } else if (text.includes('oylik') || text.includes('maosh')) {
          category = 'Oylik maosh';
        }

        const isIncome = text.includes('oylik') || text.includes('daromad') || text.includes('tushdi');
        const type = isIncome ? 'income' : 'expense';

        try {
          const wallets = await this.getWallets();
          const targetWallet = wallets.find(w => w.is_default === 1) || wallets[0];
          if (targetWallet) {
            const tx = await this.createTransaction({
              balance_id: targetWallet.id,
              amount,
              type,
              description: message,
              category_label: category
            });
            return {
              success: true,
              reply: `✅ **${type === 'income' ? 'Daromad' : 'Xarajat'} qayd etildi!**\n💰 Summa: **${amount.toLocaleString('uz-UZ')} so'm**\n🏷 Toifa: ${category}\n💳 Hamyon: ${targetWallet.name}`,
              transaction: tx
            };
          }
        } catch (e) {
          console.warn('Fallback transaction creation failed:', e);
        }
      }
    }

    return {
      success: true,
      reply: "⏳ Server bilan aloqa o'rnatilmoqda (uyg'onish jarayonida). Iltimos, bir necha soniyadan so'ng qayta yuborib ko'ring yoki /start orqali botni yangilang.",
      transaction: null
    };
  },

  async sendAIChat(message: string, history?: any[]) {
    const userId = await getEffectiveUserId();
    // Save user message to Supabase chat history immediately
    try {
      await supabase.from('chat_messages').insert([{
        user_id: userId,
        sender: 'user',
        text: message,
        created_at: new Date().toISOString()
      }]);
    } catch {}

    let res: any = null;
    try {
      // Route to Render backend for LLM parsing
      res = await request('/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history })
      });
    } catch (err: any) {
      console.warn('Backend AI chat error, switching to resilient client fallback:', err?.message || err);
      res = await this.fallbackClientChat(message);
    }

    if (res?.reply) {
      try {
        await supabase.from('chat_messages').insert([{
          user_id: userId,
          sender: 'ai',
          text: res.reply,
          transaction_data: res.transaction ? JSON.stringify(res.transaction) : null,
          created_at: new Date().toISOString()
        }]);
      } catch {}
    }

    return res;
  },

  async resetData() {
    const userId = await getEffectiveUserId();
    try {
      await Promise.all([
        supabase.from('wallets').update({ balance: 0 }).eq('user_id', userId),
        supabase.from('transactions').delete().eq('user_id', userId),
        supabase.from('chat_messages').delete().eq('user_id', userId)
      ]);
    } catch {}

    return request('/system/reset-data', {
      method: 'POST'
    });
  },

  // Receipt Scanner
  async scanReceipt(fileOrBase64?: File | string) {
    if (fileOrBase64 instanceof File) {
      const formData = new FormData();
      formData.append('receipt', fileOrBase64);
      const authHeaders = getAuthHeaders();
      const res = await fetch(`${API_BASE}/ai/scan-receipt`, {
        method: 'POST',
        headers: authHeaders,
        body: formData
      });
      return res.json();
    } else if (typeof fileOrBase64 === 'string') {
      return request('/ai/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: fileOrBase64 })
      });
    } else {
      return request('/ai/scan-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
