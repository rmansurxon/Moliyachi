import { supabase } from './supabase';
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
export async function getEffectiveUserId() {
    const cached = localStorage.getItem('hisobchi_user_id');
    if (cached)
        return cached;
    const tgId = tg?.initDataUnsafe?.user?.id || localStorage.getItem('hisobchi_telegram_id');
    if (tgId) {
        try {
            const { data } = await supabase
                .from('users')
                .select('id')
                .eq('telegram_id', String(tgId))
                .maybeSingle();
            if (data?.id) {
                localStorage.setItem('hisobchi_user_id', data.id);
                return data.id;
            }
        }
        catch { }
    }
    const defaultId = 'user-mansurxon';
    localStorage.setItem('hisobchi_user_id', defaultId);
    return defaultId;
}
async function request(endpoint, options = {}) {
    const authHeaders = getAuthHeaders();
    const mergedHeaders = {
        ...authHeaders,
        ...(options.headers || {})
    };
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
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
// Calculate financial summary from transactions array locally
function computeFinancialSummary(transactions, period = 'month') {
    const now = new Date();
    let startDate = new Date();
    if (period === 'week') {
        startDate.setDate(now.getDate() - 7);
    }
    else if (period === 'month') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }
    else if (period === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
    }
    const periodTxs = transactions.filter(t => new Date(t.date) >= startDate);
    let totalIncome = 0;
    let totalExpense = 0;
    const categoryMap = {};
    for (const t of periodTxs) {
        if (t.type === 'income') {
            totalIncome += t.amount;
        }
        else if (t.type === 'expense') {
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
    async getBootstrapData() {
        const userId = await getEffectiveUserId();
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
            const user = userRes.data || {
                id: userId,
                first_name: 'Mansurxon',
                username: 'mansurxon_ai',
                currency: 'UZS',
                theme: 'dark',
                language: 'uz',
                xp: 365,
                diamonds: 365,
                streak: 1,
                rank: 'bronze'
            };
            const wallets = walletsRes.data || [];
            const categories = catRes.data || [];
            const rawTxs = txRes.data || [];
            const transactions = rawTxs.map((t) => ({
                ...t,
                category_name: t.categories?.name,
                category_icon: t.categories?.icon,
                category_color: t.categories?.color,
                wallet_name: t.wallets?.name,
                wallet_type: t.wallets?.type
            }));
            const debts = debtsRes.data || [];
            const goals = goalsRes.data || [];
            const articles = articlesRes.data || [];
            const summary = computeFinancialSummary(transactions, 'month');
            // Cache locally for instant offline display
            try {
                localStorage.setItem('hisobchi_user_id', user.id);
                localStorage.setItem('hisobchi_user_cache', JSON.stringify(user));
                localStorage.setItem('hisobchi_wallets_cache', JSON.stringify(wallets));
                localStorage.setItem('hisobchi_categories_cache', JSON.stringify(categories));
                localStorage.setItem('hisobchi_transactions_cache', JSON.stringify(transactions));
                localStorage.setItem('hisobchi_summary_cache', JSON.stringify(summary));
            }
            catch { }
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
        }
        catch (err) {
            console.warn('Direct Supabase bootstrap failed, trying Express proxy fallback:', err);
            const res = await request('/bootstrap');
            return res.data;
        }
    },
    // Auth & Profile
    async getUser() {
        const userId = await getEffectiveUserId();
        try {
            const { data } = await supabase.from('users').select('*').eq('id', userId).single();
            if (data) {
                localStorage.setItem('hisobchi_user_cache', JSON.stringify(data));
                return data;
            }
        }
        catch { }
        const data = await request('/user');
        return data.user;
    },
    async updateProfile(updates) {
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
        }
        catch { }
        const data = await request('/user/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return data.user;
    },
    // Wallets / Balances
    async getWallets() {
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
        }
        catch { }
        const data = await request('/wallets');
        return data.wallets;
    },
    async createWallet(wallet) {
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
            if (!error && data)
                return data;
        }
        catch { }
        const data = await request('/wallets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(wallet)
        });
        return data.wallet;
    },
    async updateWallet(id, updates) {
        try {
            const { data, error } = await supabase.from('wallets').update(updates).eq('id', id).select().single();
            if (!error && data)
                return data;
        }
        catch { }
        const data = await request(`/wallets/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return data.wallet;
    },
    async deleteWallet(id) {
        try {
            const { error } = await supabase.from('wallets').delete().eq('id', id);
            if (!error)
                return true;
        }
        catch { }
        const data = await request(`/wallets/${id}`, { method: 'DELETE' });
        return data.success;
    },
    async transfer(params) {
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
        }
        catch { }
        return request('/wallets/transfer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
    },
    // Categories
    async getCategories() {
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
        }
        catch { }
        const data = await request('/categories');
        return data.categories;
    },
    async createCategory(cat) {
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
            if (!error && data)
                return data;
        }
        catch { }
        const data = await request('/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cat)
        });
        return data.category;
    },
    async updateCategory(id, updates) {
        try {
            const { data, error } = await supabase.from('categories').update(updates).eq('id', id).select().single();
            if (!error && data)
                return data;
        }
        catch { }
        const data = await request(`/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return data.category;
    },
    async deleteCategory(id) {
        try {
            const { error } = await supabase.from('categories').delete().eq('id', id);
            if (!error)
                return true;
        }
        catch { }
        const data = await request(`/categories/${id}`, { method: 'DELETE' });
        return data.success;
    },
    // Transactions (Direct Supabase with Real-Time Wallet Balance Adjustment)
    async getTransactions(params) {
        const userId = await getEffectiveUserId();
        try {
            let query = supabase
                .from('transactions')
                .select('*, categories(name, icon, color), wallets:balance_id(name, type)')
                .eq('user_id', userId)
                .order('date', { ascending: false });
            if (params?.limit)
                query = query.limit(params.limit);
            if (params?.type && params.type !== 'all')
                query = query.eq('type', params.type);
            if (params?.category_id)
                query = query.eq('category_id', params.category_id);
            const { data } = await query;
            if (data) {
                return data.map((t) => ({
                    ...t,
                    category_name: t.categories?.name,
                    category_icon: t.categories?.icon,
                    category_color: t.categories?.color,
                    wallet_name: t.wallets?.name,
                    wallet_type: t.wallets?.type
                }));
            }
        }
        catch { }
        const q = new URLSearchParams();
        if (params?.limit)
            q.set('limit', String(params.limit));
        if (params?.type)
            q.set('type', params.type);
        if (params?.category_id)
            q.set('category_id', params.category_id);
        const qs = q.toString();
        const data = await request(`/transactions${qs ? `?${qs}` : ''}`);
        return data.transactions;
    },
    async createTransaction(tx) {
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
        }
        catch { }
        const data = await request('/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(tx)
        });
        return data.transaction;
    },
    async updateTransaction(id, updates) {
        try {
            const { data: oldTx } = await supabase.from('transactions').select('*').eq('id', id).single();
            if (oldTx) {
                // Revert old transaction impact
                const { data: oldW } = await supabase.from('wallets').select('balance').eq('id', oldTx.balance_id).single();
                if (oldW) {
                    let revertedBal = oldW.balance;
                    if (oldTx.type === 'expense')
                        revertedBal += oldTx.amount;
                    else if (oldTx.type === 'income')
                        revertedBal -= oldTx.amount;
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
        }
        catch { }
        const data = await request(`/transactions/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return data.transaction;
    },
    async deleteTransaction(id) {
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
        }
        catch { }
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
        }
        catch { }
        return request('/transactions/last', { method: 'DELETE' });
    },
    // Debts
    async getDebts(status) {
        const userId = await getEffectiveUserId();
        try {
            let query = supabase.from('debts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            if (status)
                query = query.eq('status', status);
            const { data } = await query;
            if (data)
                return data;
        }
        catch { }
        const data = await request(`/debts${status ? `?status=${status}` : ''}`);
        return data.debts || [];
    },
    async createDebt(debt) {
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
            if (!error && data)
                return data;
        }
        catch { }
        const data = await request('/debts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(debt)
        });
        return data.debt;
    },
    async updateDebt(id, updates) {
        try {
            const { data, error } = await supabase.from('debts').update(updates).eq('id', id).select().single();
            if (!error && data)
                return data;
        }
        catch { }
        const data = await request(`/debts/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        });
        return data.debt;
    },
    async deleteDebt(id) {
        try {
            const { error } = await supabase.from('debts').delete().eq('id', id);
            if (!error)
                return true;
        }
        catch { }
        const data = await request(`/debts/${id}`, { method: 'DELETE' });
        return data.success;
    },
    async payDebt(id, amount) {
        try {
            const { data: d } = await supabase.from('debts').select('*').eq('id', id).single();
            if (d) {
                const newPaid = (d.paid_amount || 0) + amount;
                const newStatus = newPaid >= d.amount ? 'closed' : 'active';
                const { data: updated } = await supabase.from('debts').update({ paid_amount: newPaid, status: newStatus }).eq('id', id).select().single();
                if (updated)
                    return { success: true, debt: updated };
            }
        }
        catch { }
        return request(`/debts/${id}/pay`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount })
        });
    },
    // Goals
    async getGoals() {
        const userId = await getEffectiveUserId();
        try {
            const { data } = await supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: false });
            if (data)
                return data;
        }
        catch { }
        const data = await request('/goals');
        return data.goals || [];
    },
    async createGoal(goal) {
        const userId = await getEffectiveUserId();
        const newGoal = {
            id: `goal-${Date.now()}`,
            user_id: userId,
            title: goal.title || goal.name || 'Maqsad',
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
            if (!error && data)
                return data;
        }
        catch { }
        const data = await request('/goals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(goal)
        });
        return data.goal;
    },
    async contributeGoal(id, amount, wallet_id) {
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
        }
        catch { }
        return request(`/goals/${id}/contribute`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount, wallet_id })
        });
    },
    // Articles
    async getArticles() {
        try {
            const { data } = await supabase.from('articles').select('*').order('date', { ascending: false });
            if (data && data.length > 0)
                return data;
        }
        catch { }
        const data = await request('/articles');
        return data.articles || [];
    },
    // Statistics
    async getSummary(period = 'month') {
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
        }
        catch { }
        try {
            return await request('/ai/chat/history');
        }
        catch {
            return { success: false, messages: [] };
        }
    },
    async sendAIChat(message, history) {
        const userId = await getEffectiveUserId();
        // Save user message to Supabase chat history immediately
        try {
            await supabase.from('chat_messages').insert([{
                    user_id: userId,
                    sender: 'user',
                    text: message,
                    created_at: new Date().toISOString()
                }]);
        }
        catch { }
        // Route to Render backend for LLM parsing
        const res = await request('/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message, history })
        });
        if (res?.reply) {
            try {
                await supabase.from('chat_messages').insert([{
                        user_id: userId,
                        sender: 'ai',
                        text: res.reply,
                        transaction_data: res.transaction ? JSON.stringify(res.transaction) : null,
                        created_at: new Date().toISOString()
                    }]);
            }
            catch { }
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
        }
        catch { }
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
