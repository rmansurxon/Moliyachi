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

export const api = {
  // Auth & Profile
  async getUser(): Promise<User> {
    const res = await fetch(`${API_BASE}/user`);
    const data = await res.json();
    return data.user;
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const res = await fetch(`${API_BASE}/user/profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    return data.user;
  },

  // Wallets / Balances
  async getWallets(): Promise<Wallet[]> {
    const res = await fetch(`${API_BASE}/wallets`);
    const data = await res.json();
    return data.wallets;
  },

  async createWallet(wallet: Partial<Wallet>): Promise<Wallet> {
    const res = await fetch(`${API_BASE}/wallets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(wallet)
    });
    const data = await res.json();
    return data.wallet;
  },

  async updateWallet(id: string, updates: Partial<Wallet>): Promise<Wallet> {
    const res = await fetch(`${API_BASE}/wallets/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    return data.wallet;
  },

  async deleteWallet(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/wallets/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    return data.success;
  },

  async transfer(params: { from_wallet_id: string; to_wallet_id: string; amount: number; description?: string }) {
    const res = await fetch(`${API_BASE}/wallets/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    return res.json();
  },

  // Categories
  async getCategories(): Promise<Category[]> {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    return data.categories;
  },

  async createCategory(cat: Partial<Category>): Promise<Category> {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cat)
    });
    const data = await res.json();
    return data.category;
  },

  // Transactions
  async getTransactions(params?: { limit?: number; type?: string; category_id?: string }): Promise<Transaction[]> {
    const q = new URLSearchParams();
    if (params?.limit) q.set('limit', String(params.limit));
    if (params?.type) q.set('type', params.type);
    if (params?.category_id) q.set('category_id', params.category_id);

    const res = await fetch(`${API_BASE}/transactions?${q.toString()}`);
    const data = await res.json();
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
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tx)
    });
    const data = await res.json();
    return data.transaction;
  },

  async deleteTransaction(id: string) {
    const res = await fetch(`${API_BASE}/transactions/${id}`, { method: 'DELETE' });
    return res.json();
  },

  // Debts
  async getDebts(status?: 'active' | 'closed'): Promise<Debt[]> {
    const res = await fetch(`${API_BASE}/debts${status ? `?status=${status}` : ''}`);
    const data = await res.json();
    return data.debts;
  },

  async createDebt(debt: Partial<Debt>): Promise<Debt> {
    const res = await fetch(`${API_BASE}/debts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(debt)
    });
    const data = await res.json();
    return data.debt;
  },

  async payDebt(id: string, amount: number) {
    const res = await fetch(`${API_BASE}/debts/${id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount })
    });
    return res.json();
  },

  // Goals
  async getGoals(): Promise<Goal[]> {
    const res = await fetch(`${API_BASE}/goals`);
    const data = await res.json();
    return data.goals;
  },

  async createGoal(goal: Partial<Goal>): Promise<Goal> {
    const res = await fetch(`${API_BASE}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal)
    });
    const data = await res.json();
    return data.goal;
  },

  async contributeGoal(id: string, amount: number, wallet_id?: string) {
    const res = await fetch(`${API_BASE}/goals/${id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, wallet_id })
    });
    return res.json();
  },

  // Gamification & Vouchers
  async getGamificationStatus() {
    const res = await fetch(`${API_BASE}/gamification/status`);
    return res.json();
  },

  // Articles
  async getArticles(): Promise<Article[]> {
    const res = await fetch(`${API_BASE}/articles`);
    const data = await res.json();
    return data.articles;
  },

  // Statistics
  async getSummary(period: 'week' | 'month' | 'year' = 'month'): Promise<FinancialSummary> {
    const res = await fetch(`${API_BASE}/statistics/summary?period=${period}`);
    const data = await res.json();
    return data.summary;
  },

  async getMonthlyWrap() {
    const res = await fetch(`${API_BASE}/statistics/monthly-wrap`);
    return res.json();
  },

  // AI Chat & Speech-to-Expense
  async getChatHistory() {
    try {
      const res = await fetch(`${API_BASE}/ai/chat/history`);
      return await res.json();
    } catch {
      return { success: false, messages: [] };
    }
  },

  async sendAIChat(message: string, history?: any[]) {
    const res = await fetch(`${API_BASE}/ai/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history })
    });
    return res.json();
  },

  async resetData() {
    const res = await fetch(`${API_BASE}/system/reset-data`, {
      method: 'POST'
    });
    return res.json();
  },

  // Receipt Scanner
  async scanReceipt(fileOrBase64?: File | string) {
    if (fileOrBase64 instanceof File) {
      const formData = new FormData();
      formData.append('receipt', fileOrBase64);
      const res = await fetch(`${API_BASE}/ai/scan-receipt`, {
        method: 'POST',
        body: formData
      });
      return res.json();
    } else if (typeof fileOrBase64 === 'string') {
      const res = await fetch(`${API_BASE}/ai/scan-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image_base64: fileOrBase64 })
      });
      return res.json();
    } else {
      const res = await fetch(`${API_BASE}/ai/scan-receipt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      return res.json();
    }
  }
};

