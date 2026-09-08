// Telegram WebApp helper
export const tg = (typeof window !== 'undefined' && window.Telegram?.WebApp) || null;
export function triggerHaptic(type = 'light') {
    try {
        if (tg?.HapticFeedback) {
            if (type === 'success' || type === 'error' || type === 'warning') {
                tg.HapticFeedback.notificationOccurred(type);
            }
            else {
                tg.HapticFeedback.impactOccurred(type);
            }
        }
        else if (navigator.vibrate) {
            navigator.vibrate(type === 'heavy' ? 40 : 20);
        }
    }
    catch { }
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
}
catch { }
// Centralized request helper with Telegram Auto-Auth & persistence
export function getAuthHeaders() {
    const headers = {};
    try {
        const tgUser = tg?.initDataUnsafe?.user;
        let tgId = tgUser?.id ? String(tgUser.id) : null;
        if (tgId) {
            localStorage.setItem('hisobchi_telegram_id', tgId);
            headers['x-telegram-id'] = tgId;
            // Encode as ASCII/URI component to prevent ByteString/non-ASCII Header crash on mobile Telegram WebApp
            headers['x-telegram-user'] = encodeURIComponent(JSON.stringify(tgUser));
        }
        else {
            const cachedTgId = localStorage.getItem('hisobchi_telegram_id');
            if (cachedTgId) {
                headers['x-telegram-id'] = cachedTgId;
            }
        }
    }
    catch { }
    try {
        const savedUserId = localStorage.getItem('hisobchi_user_id');
        if (savedUserId) {
            headers['x-user-id'] = savedUserId;
        }
    }
    catch { }
    return headers;
}
async function request(endpoint, options = {}) {
    const authHeaders = getAuthHeaders();
    const mergedHeaders = {
        ...authHeaders,
        ...(options.headers || {})
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
    }
    finally {
        clearTimeout(timeoutId);
    }
}
export const api = {
    // Auth & Profile
    async getUser() {
        const data = await request('/user');
        if (data?.user?.id) {
            try {
                localStorage.setItem('hisobchi_user_id', data.user.id);
                localStorage.setItem('hisobchi_user_cache', JSON.stringify(data.user));
            }
            catch { }
        }
        return data.user;
    },
    async updateProfile(updates) {
        const data = await request('/user/profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        if (data?.user) {
            try {
                localStorage.setItem('hisobchi_user_cache', JSON.stringify(data.user));
            }
            catch { }
        }
        return data.user;
    },
    // Wallets / Balances
    async getWallets() {
        const data = await request('/wallets');
        if (Array.isArray(data?.wallets)) {
            try {
                localStorage.setItem('hisobchi_wallets_cache', JSON.stringify(data.wallets));
            }
            catch { }
        }
        return data.wallets;
    },
    async createWallet(wallet) {
        const data = await request('/wallets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wallet)
        });
        return data.wallet;
    },
    async updateWallet(id, updates) {
        const data = await request(`/wallets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return data.wallet;
    },
    async deleteWallet(id) {
        const data = await request(`/wallets/${id}`, {
            method: 'DELETE'
        });
        return data.success;
    },
    async transfer(params) {
        return request('/wallets/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
    },
    // Categories
    async getCategories() {
        const data = await request('/categories');
        if (Array.isArray(data?.categories)) {
            try {
                localStorage.setItem('hisobchi_categories_cache', JSON.stringify(data.categories));
            }
            catch { }
        }
        return data.categories;
    },
    async createCategory(cat) {
        const data = await request('/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cat)
        });
        return data.category;
    },
    async updateCategory(id, updates) {
        const data = await request(`/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return data.category;
    },
    async deleteCategory(id) {
        const data = await request(`/categories/${id}`, {
            method: 'DELETE'
        });
        return data.success;
    },
    // Transactions
    async getTransactions(params) {
        const q = new URLSearchParams();
        if (params?.limit)
            q.set('limit', String(params.limit));
        if (params?.type)
            q.set('type', params.type);
        if (params?.category_id)
            q.set('category_id', params.category_id);
        const qs = q.toString();
        const data = await request(`/transactions${qs ? `?${qs}` : ''}`);
        if (Array.isArray(data?.transactions)) {
            try {
                localStorage.setItem('hisobchi_transactions_cache', JSON.stringify(data.transactions));
            }
            catch { }
        }
        return data.transactions;
    },
    async createTransaction(tx) {
        const data = await request('/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tx)
        });
        return data.transaction;
    },
    async updateTransaction(id, updates) {
        const data = await request(`/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return data.transaction;
    },
    async deleteTransaction(id) {
        return request(`/transactions/${id}`, { method: 'DELETE' });
    },
    async deleteLastTransaction() {
        return request('/transactions/last', { method: 'DELETE' });
    },
    // Debts
    async getDebts(status) {
        const data = await request(`/debts${status ? `?status=${status}` : ''}`);
        return data.debts || [];
    },
    async createDebt(debt) {
        const data = await request('/debts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(debt)
        });
        return data.debt;
    },
    async updateDebt(id, updates) {
        const data = await request(`/debts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return data.debt;
    },
    async deleteDebt(id) {
        const data = await request(`/debts/${id}`, {
            method: 'DELETE'
        });
        return data.success;
    },
    async payDebt(id, amount) {
        return request(`/debts/${id}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
    },
    // Goals
    async getGoals() {
        const data = await request('/goals');
        return data.goals || [];
    },
    async createGoal(goal) {
        const data = await request('/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goal)
        });
        return data.goal;
    },
    async contributeGoal(id, amount, wallet_id) {
        return request(`/goals/${id}/contribute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, wallet_id })
        });
    },
    // Articles
    async getArticles() {
        const data = await request('/articles');
        return data.articles || [];
    },
    // Statistics
    async getSummary(period = 'month') {
        const data = await request(`/statistics/summary?period=${period}`);
        if (data?.summary) {
            try {
                localStorage.setItem('hisobchi_summary_cache', JSON.stringify(data.summary));
            }
            catch { }
        }
        return data.summary;
    },
    async getMonthlyWrap() {
        return request('/statistics/monthly-wrap');
    },
    // AI Chat & Speech-to-Expense
    async getChatHistory() {
        try {
            return await request('/ai/chat/history');
        }
        catch {
            return { success: false, messages: [] };
        }
    },
    async sendAIChat(message, history) {
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
    async scanReceipt(fileOrBase64) {
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
        }
        else if (typeof fileOrBase64 === 'string') {
            return request('/ai/scan-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image_base64: fileOrBase64 })
            });
        }
        else {
            return request('/ai/scan-receipt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
};
