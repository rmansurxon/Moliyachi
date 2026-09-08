import React, { useState, useEffect } from 'react';
import { User, Wallet, Category, Transaction, Debt, Goal, Voucher, Article, FinancialSummary } from './types';
import { api, tg } from './api';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
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

export const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [currentTab, setCurrentTab] = useState<TabType>('home');

  // Application Data States
  const [user, setUser] = useState<User | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [summary, setSummary] = useState<FinancialSummary | null>(null);
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
    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleAddTransaction = async (txParams: any) => {
    await api.createTransaction(txParams);
    await loadAllData();
  };

  const handleDeleteTransaction = async (id: string) => {
    await api.deleteTransaction(id);
    await loadAllData();
  };

  const handleUnlock = () => {
    sessionStorage.setItem('unlocked', 'true');
    setIsLocked(false);
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#18222d] flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#12A99D] via-[#29c184] to-[#9DFC38] flex items-center justify-center font-black text-xl text-black shadow-lg shadow-[#29c184]/40 animate-pulse">
          H
        </div>
        <p className="text-xs font-bold text-[#8b9aa8] tracking-wider uppercase">Hisobchi AI yuklanmoqda...</p>
      </div>
    );
  }

  // If locked with PIN
  if (isLocked && user.pin_code) {
    return <LockScreen correctPin={user.pin_code} onUnlock={handleUnlock} />;
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
          onOpenNotifications={() => setShowNotifications(true)}
          onOpenGamification={() => setCurrentTab('gamification')}
          onOpenSettings={() => setCurrentTab('settings')}
        />

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
              onOpenMonthlyWrap={() => setShowMonthlyWrap(true)}
            />
          )}

          {currentTab === 'chat' && (
            <ChatView onTransactionCreated={loadAllData} />
          )}

          {currentTab === 'scan' && (
            <ScanView
              wallets={wallets}
              categories={categories}
              onTransactionCreated={loadAllData}
              onNavigateHome={() => setCurrentTab('home')}
            />
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
            <ReportsView transactions={transactions} />
          )}

          {currentTab === 'gamification' && (
            <GamificationView user={user} vouchers={vouchers} />
          )}

          {currentTab === 'together' && <TogetherView />}

          {currentTab === 'articles' && <ArticlesView articles={articles} />}

          {currentTab === 'settings' && (
            <SettingsView
              user={user}
              theme={theme}
              onToggleTheme={handleToggleTheme}
              onOpenPaywall={() => setShowPaywall(true)}
              onReloadUser={loadAllData}
            />
          )}

          {currentTab === 'more' && (
            <MoreSectionsView onNavigate={(view) => {
              if (view === 'oy-yakuni') setShowMonthlyWrap(true);
              else if (view === 'paywall') setShowPaywall(true);
              else setCurrentTab(view as TabType);
            }} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (only visible on mobile screens) */}
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

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      {/* Monthly Wrap Stories Modal */}
      {showMonthlyWrap && (
        <OyYakuniView onClose={() => setShowMonthlyWrap(false)} />
      )}

      {/* Subscription Paywall Modal */}
      {showPaywall && (
        <SubscriptionView onClose={() => setShowPaywall(false)} />
      )}
    </div>
  );
};

export default App;
