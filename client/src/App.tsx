import React, { useState, useEffect } from 'react';
import { User, Wallet, Category, Transaction, Debt, Goal, Article, FinancialSummary } from './types';
import { api, tg } from './api';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { AddTransactionModal } from './components/AddTransactionModal';
import { EditTransactionModal } from './components/EditTransactionModal';
import { LockScreen } from './components/LockScreen';
import { LoginModal } from './components/LoginModal';

import { HomeView } from './views/HomeView';
import { ChatView } from './views/ChatView';
import { StatisticsView } from './views/StatisticsView';
import { ReportsView } from './views/ReportsView';
import { DebtsView } from './views/DebtsView';
import { GoalsView } from './views/GoalsView';
import { BalancesView } from './views/BalancesView';
import { CategoriesView } from './views/CategoriesView';
import { SettingsView } from './views/SettingsView';
import { ArticlesView } from './views/ArticlesView';
import { GamificationView } from './views/GamificationView';
import { ScanView } from './views/ScanView';
import { TogetherView } from './views/TogetherView';
import { MoreSectionsView } from './views/MoreSectionsView';
import { OyYakuniView } from './views/OyYakuniView';
import { SubscriptionView } from './views/SubscriptionView';

// Fallback initial data for instant zero-latency render (prevents PWA blank screen)
const getInitialUser = (): User => {
  const isTg = api.isTelegramEnv();
  const tgUser = isTg ? tg?.initDataUnsafe?.user : null;
  const currentTgId = tgUser?.id ? String(tgUser.id) : null;

  try {
    const cached = localStorage.getItem('hisobchi_user_cache');
    const savedUserId = localStorage.getItem('hisobchi_user_id');
    if (cached && savedUserId) {
      const parsed = JSON.parse(cached);
      // Validate that cached user belongs to current Telegram account if in Telegram
      if (!isTg || parsed.telegram_id === currentTgId || parsed.id === `user-tg-${currentTgId}`) {
        return parsed;
      }
    }
  } catch {}

  return {
    id: currentTgId ? `user-tg-${currentTgId}` : 'guest',
    first_name: tgUser?.first_name || 'Foydalanuvchi',
    username: tgUser?.username || '',
    currency: 'UZS',
    theme: 'dark',
    language: 'uz',
    xp: 100,
    diamonds: 0,
    streak: 1,
    rank: 'bronze'
  };
};

const getInitialWallets = (): Wallet[] => {
  const isTg = api.isTelegramEnv();
  const tgUser = isTg ? tg?.initDataUnsafe?.user : null;
  const currentTgId = tgUser?.id ? String(tgUser.id) : null;
  try {
    const cached = localStorage.getItem('hisobchi_wallets_cache');
    const cachedUserId = localStorage.getItem('hisobchi_user_id');
    if (cached && cachedUserId && (!isTg || cachedUserId.includes(currentTgId || ''))) {
      return JSON.parse(cached);
    }
  } catch {}
  return [];
};

const getInitialCategories = (): Category[] => {
  try {
    if (localStorage.getItem('hisobchi_user_id')) {
      const cached = localStorage.getItem('hisobchi_categories_cache');
      if (cached) return JSON.parse(cached);
    }
  } catch {}
  return [];
};

const getInitialTransactions = (): Transaction[] => {
  try {
    if (localStorage.getItem('hisobchi_user_id')) {
      const cached = localStorage.getItem('hisobchi_transactions_cache');
      if (cached) return JSON.parse(cached);
    }
  } catch {}
  return [];
};

const getInitialSummary = (): FinancialSummary | null => {
  try {
    if (localStorage.getItem('hisobchi_user_id')) {
      const cached = localStorage.getItem('hisobchi_summary_cache');
      if (cached) return JSON.parse(cached);
    }
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
  const [articles, setArticles] = useState<Article[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(getInitialSummary);
  const [isSyncing, setIsSyncing] = useState(false);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Inside Telegram WebApp, auto-authenticated
    if (api.isTelegramEnv()) return true;
    // In external browser, check if active session exists
    return Boolean(localStorage.getItem('hisobchi_user_id'));
  });

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTransactionForEdit, setSelectedTransactionForEdit] = useState<Transaction | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [showMonthlyWrap, setShowMonthlyWrap] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

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

  // Load all data from Supabase on mount or when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    setIsSyncing(true);
    try {
      // High-speed direct Supabase bootstrap (single fast call)
      const data = await api.getBootstrapData();
      if (data) {
        if (data.user) {
          setUser(data.user);
        }
        if (Array.isArray(data.wallets)) setWallets(data.wallets);
        if (Array.isArray(data.categories)) setCategories(data.categories);
        if (Array.isArray(data.transactions)) setTransactions(data.transactions);
        if (Array.isArray(data.debts)) setDebts(data.debts);
        if (Array.isArray(data.goals)) setGoals(data.goals);
        if (Array.isArray(data.articles)) setArticles(data.articles);
        if (data.summary) setSummary(data.summary);
      }
    } catch (err) {
      console.warn('Sync warning:', err);
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

  // If in external browser and not authenticated, require Phone + PIN Login
  if (!isAuthenticated) {
    return (
      <LoginModal
        onSuccess={(loggedInUser) => {
          setUser(loggedInUser);
          setIsAuthenticated(true);
          loadAllData();
        }}
      />
    );
  }

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
              onOpenMonthlyWrap={() => setShowMonthlyWrap(true)}
            />
          )}

          {currentTab === 'chat' && (
            <ChatView onTransactionCreated={loadAllData} />
          )}

          {currentTab === 'stats' && (
            <StatisticsView onOpenMonthlyWrap={() => setShowMonthlyWrap(true)} />
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

          {currentTab === 'articles' && (
            <ArticlesView articles={articles} />
          )}

          {currentTab === 'gamification' && (
            <GamificationView user={user} vouchers={[]} />
          )}

          {currentTab === 'scan' && (
            <ScanView
              wallets={wallets}
              categories={categories}
              onTransactionCreated={loadAllData}
              onNavigateHome={() => setCurrentTab('home')}
            />
          )}

          {currentTab === 'together' && (
            <TogetherView />
          )}

          {currentTab === 'more' && (
            <MoreSectionsView
              onNavigate={(tab) => {
                if (tab === 'oy-yakuni') setShowMonthlyWrap(true);
                else if (tab === 'paywall') setShowPaywall(true);
                else setCurrentTab(tab as TabType);
              }}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenPaywall={() => setShowPaywall(true)}
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

      {/* Monthly Wrap (Stories) Modal */}
      {showMonthlyWrap && (
        <OyYakuniView onClose={() => setShowMonthlyWrap(false)} />
      )}

      {/* Pro Subscription Paywall Modal */}
      {showPaywall && (
        <SubscriptionView onClose={() => setShowPaywall(false)} />
      )}
    </div>
  );
};

export default App;
