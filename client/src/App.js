import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api, tg } from './api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AddTransactionModal } from './components/AddTransactionModal';
import { EditTransactionModal } from './components/EditTransactionModal';
import { LockScreen } from './components/LockScreen';
import { HomeView } from './views/HomeView';
import { ChatView } from './views/ChatView';
import { StatisticsView } from './views/StatisticsView';
import { ReportsView } from './views/ReportsView';
import { DebtsView } from './views/DebtsView';
import { GoalsView } from './views/GoalsView';
import { BalancesView } from './views/BalancesView';
import { CategoriesView } from './views/CategoriesView';
import { SettingsView } from './views/SettingsView';
// Fallback initial data for instant zero-latency render (prevents PWA blank screen)
const getInitialUser = () => {
    try {
        const cached = localStorage.getItem('hisobchi_user_cache');
        if (cached)
            return JSON.parse(cached);
    }
    catch { }
    const tgUser = tg?.initDataUnsafe?.user;
    return {
        id: tgUser?.id ? `tg-${tgUser.id}` : 'user-mansurxon',
        first_name: tgUser?.first_name || 'Mansurxon',
        username: tgUser?.username || 'mansurxon_ai',
        currency: 'UZS',
        theme: 'dark',
        language: 'uz',
        xp: 365,
        diamonds: 365,
        streak: 1,
        rank: 'bronze'
    };
};
const getInitialWallets = () => {
    try {
        const cached = localStorage.getItem('hisobchi_wallets_cache');
        if (cached)
            return JSON.parse(cached);
    }
    catch { }
    return [
        { id: 'w-invest', user_id: 'default', name: 'Investitsiya', type: 'invest', balance: 0, currency: 'UZS', color: '#7a5af8', is_default: 0 },
        { id: 'w-card', user_id: 'default', name: 'Asosiy karta', type: 'uzcard', balance: 0, currency: 'UZS', color: '#23a887', card_number_last4: '8600', is_default: 1 },
        { id: 'w-cash', user_id: 'default', name: 'Naqd pul', type: 'cash', balance: 0, currency: 'UZS', color: '#38a169', is_default: 0 },
        { id: 'w-usd', user_id: 'default', name: 'Dollar', type: 'visa', balance: 0, currency: 'USD', color: '#3182ce', card_number_last4: '4100', is_default: 0 }
    ];
};
const getInitialCategories = () => {
    try {
        const cached = localStorage.getItem('hisobchi_categories_cache');
        if (cached)
            return JSON.parse(cached);
    }
    catch { }
    return [];
};
const getInitialTransactions = () => {
    try {
        const cached = localStorage.getItem('hisobchi_transactions_cache');
        if (cached)
            return JSON.parse(cached);
    }
    catch { }
    return [];
};
const getInitialSummary = () => {
    try {
        const cached = localStorage.getItem('hisobchi_summary_cache');
        if (cached)
            return JSON.parse(cached);
    }
    catch { }
    return null;
};
export const App = () => {
    const [theme, setTheme] = useState('dark');
    const [currentTab, setCurrentTab] = useState('home');
    // Application Data States initialized with instant offline cache
    const [user, setUser] = useState(getInitialUser);
    const [wallets, setWallets] = useState(getInitialWallets);
    const [categories, setCategories] = useState(getInitialCategories);
    const [transactions, setTransactions] = useState(getInitialTransactions);
    const [debts, setDebts] = useState([]);
    const [goals, setGoals] = useState([]);
    const [summary, setSummary] = useState(getInitialSummary);
    const [isSyncing, setIsSyncing] = useState(false);
    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [selectedTransactionForEdit, setSelectedTransactionForEdit] = useState(null);
    const [isLocked, setIsLocked] = useState(false);
    // Initialize Telegram WebApp
    useEffect(() => {
        try {
            if (tg) {
                tg.ready();
                tg.expand();
            }
        }
        catch { }
    }, []);
    // Theme effect
    useEffect(() => {
        const root = document.documentElement;
        if (theme === 'dark') {
            root.classList.add('dark');
            root.classList.remove('light');
        }
        else {
            root.classList.add('light');
            root.classList.remove('dark');
        }
    }, [theme]);
    // Load all data from backend on mount
    useEffect(() => {
        loadAllData();
    }, []);
    const loadAllData = async () => {
        setIsSyncing(true);
        try {
            const results = await Promise.allSettled([
                api.getUser(),
                api.getWallets(),
                api.getCategories(),
                api.getTransactions(),
                api.getDebts(),
                api.getGoals(),
                api.getSummary('month')
            ]);
            if (results[0].status === 'fulfilled' && results[0].value) {
                setUser(results[0].value);
                if (results[0].value.pin_code && !isLocked) {
                    setIsLocked(true);
                }
            }
            if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
                setWallets(results[1].value);
            }
            if (results[2].status === 'fulfilled' && Array.isArray(results[2].value)) {
                setCategories(results[2].value);
            }
            if (results[3].status === 'fulfilled' && Array.isArray(results[3].value)) {
                setTransactions(results[3].value);
            }
            if (results[4].status === 'fulfilled' && Array.isArray(results[4].value)) {
                setDebts(results[4].value);
            }
            if (results[5].status === 'fulfilled' && Array.isArray(results[5].value)) {
                setGoals(results[5].value);
            }
            if (results[6].status === 'fulfilled' && results[6].value) {
                setSummary(results[6].value);
            }
        }
        catch (err) {
            console.warn('Background sync warning:', err);
        }
        finally {
            setIsSyncing(false);
        }
    };
    const handleToggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
    };
    const handleAddTransaction = async (txData) => {
        try {
            await api.createTransaction(txData);
            await loadAllData();
            setShowAddModal(false);
        }
        catch (err) {
            console.error(err);
        }
    };
    const handleUpdateTransaction = async (id, updates) => {
        try {
            await api.updateTransaction(id, updates);
            await loadAllData();
        }
        catch (err) {
            console.error('Update transaction error:', err);
        }
    };
    const handleDeleteTransaction = async (id) => {
        try {
            await api.deleteTransaction(id);
            await loadAllData();
        }
        catch (err) {
            console.error(err);
        }
    };
    if (isLocked && user?.pin_code) {
        return (_jsx(LockScreen, { correctPin: user.pin_code, onUnlock: () => setIsLocked(false) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-[#18222d] text-[#fdfdfd] flex", children: [_jsx(Sidebar, { currentTab: currentTab, onChangeTab: (tab) => setCurrentTab(tab), className: "hidden md:flex" }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0 min-h-screen bg-[#18222d]", children: [_jsx(Header, { user: user, onOpenSettings: () => setCurrentTab('settings') }), isSyncing && (_jsx("div", { className: "h-0.5 bg-[#29c184]/40 w-full overflow-hidden", children: _jsx("div", { className: "h-full bg-[#29c184] animate-pulse", style: { width: '100%' } }) })), _jsxs("main", { className: "flex-1 overflow-y-auto pb-20 md:pb-8", children: [currentTab === 'home' && (_jsx(HomeView, { user: user, wallets: wallets, transactions: transactions, summary: summary, onOpenAddModal: () => setShowAddModal(true), onNavigateTab: (tab) => setCurrentTab(tab), onDeleteTransaction: handleDeleteTransaction, onEditTransaction: (tx) => setSelectedTransactionForEdit(tx), onOpenMonthlyWrap: () => { } })), currentTab === 'chat' && (_jsx(ChatView, { onTransactionCreated: loadAllData })), currentTab === 'stats' && (_jsx(StatisticsView, { onOpenMonthlyWrap: () => { } })), currentTab === 'debts' && (_jsx(DebtsView, { debts: debts, onReload: loadAllData })), currentTab === 'goals' && (_jsx(GoalsView, { goals: goals, wallets: wallets, onReload: loadAllData })), currentTab === 'balances' && (_jsx(BalancesView, { wallets: wallets, onReload: loadAllData, onOpenTransferModal: () => setShowAddModal(true) })), currentTab === 'categories' && (_jsx(CategoriesView, { categories: categories, onReload: loadAllData })), currentTab === 'reports' && (_jsx(ReportsView, { transactions: transactions, onEditTransaction: (tx) => setSelectedTransactionForEdit(tx) })), currentTab === 'settings' && (_jsx(SettingsView, { user: user, theme: theme, onToggleTheme: handleToggleTheme, onOpenPaywall: () => { }, onReloadUser: loadAllData }))] })] }), _jsx("div", { className: "md:hidden", children: _jsx(BottomNav, { currentTab: currentTab, onChangeTab: (tab) => setCurrentTab(tab), onOpenAddModal: () => setShowAddModal(true) }) }), _jsx(AddTransactionModal, { isOpen: showAddModal, onClose: () => setShowAddModal(false), wallets: wallets, categories: categories, onSubmit: handleAddTransaction }), _jsx(EditTransactionModal, { isOpen: !!selectedTransactionForEdit, onClose: () => setSelectedTransactionForEdit(null), transaction: selectedTransactionForEdit, wallets: wallets, categories: categories, onUpdate: handleUpdateTransaction, onDelete: handleDeleteTransaction })] }));
};
export default App;
