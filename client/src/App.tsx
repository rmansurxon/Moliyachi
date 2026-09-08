import React, { useState, useEffect } from 'react';
import { User, Wallet, Category, Transaction, Debt, Goal, FinancialSummary } from './types';
import { api, tg } from './api';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
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
const getInitialUser = (): User => {
  try {
    const cached = localStorage.getItem('hisobchi_user_cache');
    if (cached) return JSON.parse(cached);
  } catch {}

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

const getInitialWallets = (): Wallet[] => {
  try {
    const cached = localStorage.getItem('hisobchi_wallets_cache');
    if (cached) return JSON.parse(cached);
  } catch {}

  return [
    { id: 'w-invest', user_id: 'default', name: 'Investitsiya', type: 'invest', balance: 0, currency: 'UZS', color: '#7a5af8', is_default: 0 },
    { id: 'w-card', user_id: 'default', name: 'Asosiy karta', type: 'uzcard', balance: 0, currency: 'UZS', color: '#23a887', card_number_last4: '8600', is_default: 1 },
    { id: 'w-cash', user_id: 'default', name: 'Naqd pul', type: 'cash', balance: 0, currency: 'UZS', color: '#38a169', is_default: 0 },
    { id: 'w-usd', user_id: 'default', name: 'Dollar', type: 'visa', balance: 0, currency: 'USD', color: '#3182ce', card_number_last4: '4100', is_default: 0 }
  ];
};

const getInitialCategories = (): Category[] => {
  try {
    const cached = localStorage.getItem('hisobchi_categories_cache');
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
};

const getInitialTransactions = (): Transaction[] => {
  try {
    const cached = localStorage.getItem('hisobchi_transactions_cache');
    if (cached) return JSON.parse(cached);
  } catch {}
  return [];
};

const getInitialSummary = (): FinancialSummary | null => {
  try {
    const cached = localStorage.getItem('hisobchi_summary_cache');
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
};

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Application Data States initialized with instant offline cache
  const [user, setUser] = useState<User>(getInitialUser);
  const [wallets, setWallets] = useState<Wallet[]>(getInitialWallets);
  const [categories, setCategories] = useState<Category[]>(getInitialCategories);
  const [transactions, setTransactions] = useState<Transaction[]>(getInitialTransactions);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(getInitialSummary);
  const [isSyncing, setIsSyncing] = useState(false);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTransactionForEdit, setSelectedTransactionForEdit] = useState<Transaction | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  // Initialize Telegram WebApp
  useEffect(() => {
    try {
      if (tg) {
        tg.ready();
        tg.expand();
      }
    } catch {}
  }, []);

  // Theme effect
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
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
      // 1. High-speed single-roundtrip bootstrap (instant 10x speedup)
      const data = await api.getBootstrapData();
      if (data) {
        if (data.user) {
          setUser(data.user);
          if (data.user.pin_code && !isLocked) {
            setIsLocked(true);
          }
        }
        if (Array.isArray(data.wallets)) setWallets(data.wallets);
        if (Array.isArray(data.categories)) setCategories(data.categories);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (Array.isArray(data.debts)) setDebts(data.debts);
        if (Array.isArray(data.goals)) setGoals(data.goals);
        if (data.summary) setSummary(data.summary);
        return;
      }
    } catch (err) {
      console.warn('Bootstrap sync failed, falling back to individual queries:', err);
    }

    // Fallback: individual queries if bootstrap is not supported
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
    } catch (err) {
      console.warn('Background sync warning:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleToggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const handleAddTransaction = async (txData: any) => {
    try {
      await api.createTransaction(txData);
      await loadAllData();
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateTransaction = async (id: string, updates: any) => {
    try {
      await api.updateTransaction(id, updates);
      await loadAllData();
    } catch (err) {
      console.error('Update transaction error:', err);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.deleteTransaction(id);
      await loadAllData();
    } catch (err) {
      console.error(err);
    }
  };

  if (isLocked && user?.pin_code) {
    return (
      <LockScreen
        correctPin={user.pin_code}
        onUnlock={() => setIsLocked(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#18222d] text-[#fdfdfd] flex">
      {/* Desktop Sidebar (visible on md screens and above) */}
      <Sidebar
        currentTab={currentTab}
        onChangeTab={(tab) => setCurrentTab(tab)}
        className="hidden md:flex"
      />

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen bg-[#18222d]">
        {/* Top Header */}
        <Header
          user={user}
          onOpenSettings={() => setCurrentTab('settings')}
        />

        {/* Syncing status bar (subtle) */}
        {isSyncing && (
          <div className="h-0.5 bg-[#29c184]/40 w-full overflow-hidden">
            <div className="h-full bg-[#29c184] animate-pulse" style={{ width: '100%' }}></div>
          </div>
        )}

        {/* View Routing */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8">
          {currentTab === 'home' && (
            <HomeView
              user={user}
              wallets={wallets}
              transactions={transactions}
              summary={summary}
              onOpenAddModal={() => setShowAddModal(true)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
              onDeleteTransaction={handleDeleteTransaction}
              onEditTransaction={(tx) => setSelectedTransactionForEdit(tx)}
              onOpenMonthlyWrap={() => {}}
            />
          )}

          {currentTab === 'chat' && (
            <ChatView onTransactionCreated={loadAllData} />
          )}

          {currentTab === 'stats' && (
            <StatisticsView onOpenMonthlyWrap={() => {}} />
          )}

          {currentTab === 'debts' && (
            <DebtsView debts={debts} onReload={loadAllData} />
          )}

          {currentTab === 'goals' && (
            <GoalsView goals={goals} wallets={wallets} onReload={loadAllData} />
          )}

          {currentTab === 'balances' && (
            <BalancesView
              wallets={wallets}
              onReload={loadAllData}
              onOpenTransferModal={() => setShowAddModal(true)}
            />
          )}

          {currentTab === 'categories' && (
            <CategoriesView categories={categories} onReload={loadAllData} />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              transactions={transactions}
              onEditTransaction={(tx) => setSelectedTransactionForEdit(tx)}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenPaywall={() => {}}
              onReloadUser={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <BottomNav
          currentTab={currentTab}
          onChangeTab={(tab) => setCurrentTab(tab)}
          onOpenAddModal={() => setShowAddModal(true)}
        />
      </div>

      {/* Add Transaction Modal */}
      <AddTransactionModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        wallets={wallets}
        categories={categories}
        onSubmit={handleAddTransaction}
      />

      {/* Edit / Delete Transaction Modal */}
      <EditTransactionModal
        isOpen={!!selectedTransactionForEdit}
        onClose={() => setSelectedTransactionForEdit(null)}
        transaction={selectedTransactionForEdit}
        wallets={wallets}
        categories={categories}
        onUpdate={handleUpdateTransaction}
        onDelete={handleDeleteTransaction}
      />
    </div>
  );
};

export default App;
