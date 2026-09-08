import { User, Wallet, Category, Transaction, Debt, Goal, Voucher, Article, FinancialSummary } from './types';

// Telegram WebApp helper
export const tg = (typeof window !== 'undefined' && (window as any).Telegram?.WebApp) || null;

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning' = 'light') {
  try {
    if (tg?.HapticFeedback) {
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

// Auto-detect and persist ?tg_id=... from URL (when opened from Telegram Desktop into external browser)
try {
  if (typeof window !== 'undefined' && window.location?.search) {
    const params = new URLSearchParams(window.location.search);
    const qTgId = params.get('tg_id');
    if (qTgId) {
      localStorage.setItem('hisobchi_telegram_id', qTgId);
    }
  }
} catch {}

// Centralized request helper with Telegram Auto-Auth & persistence
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const tgUser = tg?.initDataUnsafe?.user;
    let tgId = tgUser?.id ? String(tgUser.id) : null;
    if (tgId) {
      localStorage.setItem('hisobchi_telegram_id', tgId);
      headers['x-telegram-id'] = tgId;
      // Encode as ASCII/URI component to prevent ByteString/non-ASCII Header crash on mobile Telegram WebApp
      headers['x-telegram-user'] = encodeURIComponent(JSON.stringify(tgUser));
    } else {
      const cachedTgId = localStorage.getItem('hisobchi_telegram_id');
      if (cachedTgId) {
        headers['x-telegram-id'] = cachedTgId;
      }
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

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const authHeaders = getAuthHeaders();
  const mergedHeaders: Record<string, string> = {
    ...authHeaders,
    ...((options.headers as Record<string, string>) || {})
  };

  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  // 15-second timeout controller so requests never hang indefinitely on mobile networks
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

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
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  // High-Speed 1-Shot Bootstrap: loads all core data in a single request
  async getBootstrapData(): Promise<{
    user: User;
    wallets: Wallet[];
    categories: Category[];
    transactions: Transaction[];
    debts: Debt[];
    goals: Goal[];
    summary: FinancialSummary;
  }> {
    const res = await request<{ success: boolean; data: any }>('/bootstrap');
    const d = res.data;
    if (d?.user?.id) {
      try {
        localStorage.setItem('hisobchi_user_id', d.user.id);
        localStorage.setItem('hisobchi_user_cache', JSON.stringify(d.user));
      } catch {}
    }
    if (Array.isArray(d?.wallets)) {
      try {
        localStorage.setItem('hisobchi_wallets_cache', JSON.stringify(d.wallets));
      } catch {}
    }
    if (Array.isArray(d?.categories)) {
      try {
        localStorage.setItem('hisobchi_categories_cache', JSON.stringify(d.categories));
      } catch {}
    }
    if (Array.isArray(d?.transactions)) {
      try {
        localStorage.setItem('hisobchi_transactions_cache', JSON.stringify(d.transactions));
      } catch {}
    }
    if (d?.summary) {
      try {
        localStorage.setItem('hisobchi_summary_cache', JSON.stringify(d.summary));
      } catch {}
    }
    return d;
  },

  // Auth & Profile
  async getUser(): Promise<User> {
    const data = await request<{ success: boolean; user: User }>('/user');
    if (data?.user?.id) {
      try {
        localStorage.setItem('hisobchi_user_id', data.user.id);
        localStorage.setItem('hisobchi_user_cache', JSON.stringify(data.user));
      } catch {}
    }
    return data.user;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const data = await request<{ success: boolean; user: User }>('/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (data?.user) {
      try {
        localStorage.setItem('hisobchi_user_cache', JSON.stringify(data.user));
      } catch {}
    }
    return data.user;
  },

  // Wallets / Balances
  async getWallets(): Promise<Wallet[]> {
    const data = await request<{ success: boolean; wallets: Wallet[] }>('/wallets');
    if (Array.isArray(data?.wallets)) {
      try {
        localStorage.setItem('hisobchi_wallets_cache', JSON.stringify(data.wallets));
      } catch {}
    }
    return data.wallets;
  },

  async createWallet(wallet: Partial<Wallet>): Promise<Wallet> {
    const data = await request<{ success: boolean; wallet: Wallet }>('/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wallet)
    });
    return data.wallet;
  },

  async updateWallet(id: string, updates: Partial<Wallet>): Promise<Wallet> {
    const data = await request<{ success: boolean; wallet: Wallet }>(`/wallets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.wallet;
  },

  async deleteWallet(id: string): Promise<boolean> {
    const data = await request<{ success: boolean }>(`/wallets/${id}`, {
      method: 'DELETE'
    });
    return data.success;
  },

  async transfer(params: { from_wallet_id: string; to_wallet_id: string; amount: number; description?: string }) {
    return request('/wallets/transfer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const data = await request<{ success: boolean; categories: Category[] }>('/categories');
    if (Array.isArray(data?.categories)) {
      try {
        localStorage.setItem('hisobchi_categories_cache', JSON.stringify(data.categories));
      } catch {}
    }
    return data.categories;
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    const data = await request<{ success: boolean; category: Category }>('/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
    return data.category;
  },

  async updateCategory(id: string, updates: Partial<Category>): Promise<Category> {
    const data = await request<{ success: boolean; category: Category }>(`/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.category;
  },

  async deleteCategory(id: string): Promise<boolean> {
    const data = await request<{ success: boolean }>(`/categories/${id}`, {
      method: 'DELETE'
    });
    return data.success;
  },

  // Transactions
  async getTransactions(params?: { limit?: number; type?: string; category_id?: string }): Promise<Transaction[]> {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.type) q.set('type', params.type);
    if (params?.category_id) q.set('category_id', params.category_id);

    const qs = q.toString();
    const data = await request<{ success: boolean; transactions: Transaction[] }>(`/transactions${qs ? `?${qs}` : ''}`);
    if (Array.isArray(data?.transactions)) {
      try {
        localStorage.setItem('hisobchi_transactions_cache', JSON.stringify(data.transactions));
      } catch {}
    }
    return data.transactions;
  },

  async createTransaction(tx: {
    balance_id: string;
    category_id?: string;
    amount: number;
    type: 'expense' | 'income' | 'transfer';
    description: string;
    date?: string;
  }): Promise<Transaction> {
    const data = await request<{ success: boolean; transaction: Transaction }>('/transactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
    return data.transaction;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>): Promise<Transaction> {
    const data = await request<{ success: boolean; transaction: Transaction }>(`/transactions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.transaction;
  },

  async deleteTransaction(id: string) {
    return request(`/transactions/${id}`, { method: 'DELETE' });
  },

  async deleteLastTransaction() {
    return request<{ success: boolean; transaction?: Transaction; message?: string }>('/transactions/last', { method: 'DELETE' });
  },

  // Debts
  async getDebts(status?: 'active' | 'closed'): Promise<Debt[]> {
    const data = await request<{ success: boolean; debts: Debt[] }>(`/debts${status ? `?status=${status}` : ''}`);
    return data.debts || [];
  },

  async createDebt(debt: Partial<Debt>): Promise<Debt> {
    const data = await request<{ success: boolean; debt: Debt }>('/debts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(debt)
    });
    return data.debt;
  },

  async updateDebt(id: string, updates: Partial<Debt>): Promise<Debt> {
    const data = await request<{ success: boolean; debt: Debt }>(`/debts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return data.debt;
  },

  async deleteDebt(id: string): Promise<boolean> {
    const data = await request<{ success: boolean }>(`/debts/${id}`, {
      method: 'DELETE'
    });
    return data.success;
  },

  async payDebt(id: string, amount: number) {
    return request(`/debts/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
  },

  // Goals
  async getGoals(): Promise<Goal[]> {
    const data = await request<{ success: boolean; goals: Goal[] }>('/goals');
    return data.goals || [];
  },

  async createGoal(goal: Partial<Goal>): Promise<Goal> {
    const data = await request<{ success: boolean; goal: Goal }>('/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal)
    });
    return data.goal;
  },

  async contributeGoal(id: string, amount: number, wallet_id?: string) {
    return request(`/goals/${id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, wallet_id })
    });
  },

  // Articles
  async getArticles(): Promise<Article[]> {
    const data = await request<{ success: boolean; articles: Article[] }>('/articles');
    return data.articles || [];
  },

  // Statistics
  async getSummary(period: 'week' | 'month' | 'year' = 'month'): Promise<FinancialSummary> {
    const data = await request<{ success: boolean; summary: FinancialSummary }>(`/statistics/summary?period=${period}`);
    if (data?.summary) {
      try {
        localStorage.setItem('hisobchi_summary_cache', JSON.stringify(data.summary));
      } catch {}
    }
    return data.summary;
  },

  async getMonthlyWrap() {
    return request('/statistics/monthly-wrap');
  },

  // AI Chat & Speech-to-Expense
  async getChatHistory() {
    try {
      return await request<{ success: boolean; messages: any[] }>('/ai/chat/history');
    } catch {
      return { success: false, messages: [] };
    }
  },

  async sendAIChat(message: string, history?: any[]) {
    return request('/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
  },

  async resetData() {
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
