import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { api, tg } from './api';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { AddTransactionModal } from './components/AddTransactionModal';
import { NotificationsModal } from './components/NotificationsModal';
import { LockScreen } from './components/LockScreen';
import { HomeView } from './views/HomeView';
import { ChatView } from './views/ChatView';
import { ScanView } from './views/ScanView';
import { StatisticsView } from './views/StatisticsView';
import { ReportsView } from './views/ReportsView';
import { OyYakuniView } from './views/OyYakuniView';
import { DebtsView } from './views/DebtsView';
import { GoalsView } from './views/GoalsView';
import { BalancesView } from './views/BalancesView';
import { CategoriesView } from './views/CategoriesView';
import { GamificationView } from './views/GamificationView';
import { TogetherView } from './views/TogetherView';
import { ArticlesView } from './views/ArticlesView';
import { SettingsView } from './views/SettingsView';
import { SubscriptionView } from './views/SubscriptionView';
import { MoreSectionsView } from './views/MoreSectionsView';
export const App = () => {
    const [theme, setTheme] = useState('dark');
    const [currentTab, setCurrentTab] = useState('home');
    // Application Data States
    const [user, setUser] = useState(null);
    const [wallets, setWallets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [debts, setDebts] = useState([]);
    const [goals, setGoals] = useState([]);
    const [vouchers, setVouchers] = useState([]);
    const [articles, setArticles] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    // Modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [showMonthlyWrap, setShowMonthlyWrap] = useState(false);
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
    // Load all data on mount
    useEffect(() => {
        loadAllData();
    }, []);
    const loadAllData = async () => {
        setLoading(true);
        try {
            const [u, w, c, t, d, g, gam, art, s] = await Promise.all([
                api.getUser(),
                api.getWallets(),
                api.getCategories(),
                api.getTransactions(),
                api.getDebts(),
                api.getGoals(),
                api.getGamificationStatus(),
                api.getArticles(),
                api.getSummary('month')
            ]);
            setUser(u);
            setWallets(w);
            setCategories(c);
            setTransactions(t);
            setDebts(d);
            setGoals(g);
            setVouchers(gam.vouchers || []);
            setArticles(art);
            setSummary(s);
            // Check PIN lock
            if (u.pin_code && !sessionStorage.getItem('unlocked')) {
                setIsLocked(true);
            }
        }
        catch (err) {
            console.error('Error loading data:', err);
        }
        finally {
            setLoading(false);
        }
    };
    const handleToggleTheme = () => {
        setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    };
    const handleAddTransaction = async (txParams) => {
        await api.createTransaction(txParams);
        await loadAllData();
    };
    const handleDeleteTransaction = async (id) => {
        await api.deleteTransaction(id);
        await loadAllData();
    };
    const handleUnlock = () => {
        sessionStorage.setItem('unlocked', 'true');
        setIsLocked(false);
    };
    if (loading || !user) {
        return (_jsxs("div", { className: "min-h-screen bg-[#18222d] flex flex-col items-center justify-center text-white space-y-4", children: [_jsx("div", { className: "w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#12A99D] via-[#29c184] to-[#9DFC38] flex items-center justify-center font-black text-xl text-black shadow-lg shadow-[#29c184]/40 animate-pulse", children: "H" }), _jsx("p", { className: "text-xs font-bold text-[#8b9aa8] tracking-wider uppercase", children: "Hisobchi AI yuklanmoqda..." })] }));
    }
    // If locked with PIN
    if (isLocked && user.pin_code) {
        return _jsx(LockScreen, { correctPin: user.pin_code, onUnlock: handleUnlock });
    }
    return (_jsxs("div", { className: "min-h-screen bg-[#18222d] text-[#fdfdfd] flex", children: [_jsx(Sidebar, { currentTab: currentTab, onChangeTab: (tab) => setCurrentTab(tab), className: "hidden md:flex" }), _jsxs("div", { className: "flex-1 flex flex-col min-w-0 min-h-screen bg-[#18222d]", children: [_jsx(Header, { user: user, onOpenNotifications: () => setShowNotifications(true), onOpenGamification: () => setCurrentTab('gamification'), onOpenSettings: () => setCurrentTab('settings') }), _jsxs("main", { className: "flex-1 overflow-y-auto pb-20 md:pb-8", children: [currentTab === 'home' && (_jsx(HomeView, { user: user, wallets: wallets, transactions: transactions, summary: summary, onOpenAddModal: () => setShowAddModal(true), onNavigateTab: (tab) => setCurrentTab(tab), onDeleteTransaction: handleDeleteTransaction, onOpenMonthlyWrap: () => setShowMonthlyWrap(true) })), currentTab === 'chat' && (_jsx(ChatView, { onTransactionCreated: loadAllData })), currentTab === 'scan' && (_jsx(ScanView, { wallets: wallets, categories: categories, onTransactionCreated: loadAllData, onNavigateHome: () => setCurrentTab('home') })), currentTab === 'stats' && (_jsx(StatisticsView, { onOpenMonthlyWrap: () => setShowMonthlyWrap(true) })), currentTab === 'debts' && (_jsx(DebtsView, { debts: debts, onReload: loadAllData })), currentTab === 'goals' && (_jsx(GoalsView, { goals: goals, wallets: wallets, onReload: loadAllData })), currentTab === 'balances' && (_jsx(BalancesView, { wallets: wallets, onReload: loadAllData, onOpenTransferModal: () => setShowAddModal(true) })), currentTab === 'categories' && (_jsx(CategoriesView, { categories: categories, onReload: loadAllData })), currentTab === 'reports' && (_jsx(ReportsView, { transactions: transactions })), currentTab === 'gamification' && (_jsx(GamificationView, { user: user, vouchers: vouchers })), currentTab === 'together' && _jsx(TogetherView, {}), currentTab === 'articles' && _jsx(ArticlesView, { articles: articles }), currentTab === 'settings' && (_jsx(SettingsView, { user: user, theme: theme, onToggleTheme: handleToggleTheme, onOpenPaywall: () => setShowPaywall(true), onReloadUser: loadAllData })), currentTab === 'more' && (_jsx(MoreSectionsView, { onNavigate: (view) => {
                                    if (view === 'oy-yakuni')
                                        setShowMonthlyWrap(true);
                                    else if (view === 'paywall')
                                        setShowPaywall(true);
                                    else
                                        setCurrentTab(view);
                                } }))] })] }), _jsx("div", { className: "md:hidden", children: _jsx(BottomNav, { currentTab: currentTab, onChangeTab: (tab) => setCurrentTab(tab), onOpenAddModal: () => setShowAddModal(true) }) }), _jsx(AddTransactionModal, { isOpen: showAddModal, onClose: () => setShowAddModal(false), wallets: wallets, categories: categories, onSubmit: handleAddTransaction }), _jsx(NotificationsModal, { isOpen: showNotifications, onClose: () => setShowNotifications(false) }), showMonthlyWrap && (_jsx(OyYakuniView, { onClose: () => setShowMonthlyWrap(false) })), showPaywall && (_jsx(SubscriptionView, { onClose: () => setShowPaywall(false) }))] }));
};
export default App;
