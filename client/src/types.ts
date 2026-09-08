export type Currency = 'UZS' | 'USD' | 'RUB';
export type Theme = 'dark' | 'light';
export type Language = 'uz' | 'uz_kr' | 'ru' | 'en';
export type Rank = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface User {
  id: string;
  telegram_id?: string;
  first_name: string;
  username?: string;
  currency: Currency;
  theme: Theme;
  language: Language;
  pin_code?: string;
  xp: number;
  diamonds?: number;
  streak: number;
  rank: Rank;
}

export type WalletType = 'cash' | 'uzcard' | 'humo' | 'visa' | 'bank' | 'invest';

export interface Wallet {
  id: string;
  user_id: string;
  name: string;
  type: WalletType;
  balance: number;
  currency?: string;
  color: string;
  card_number_last4?: string;
  is_default: number;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  budget_limit: number;
}

export interface Transaction {
  id: string;
  user_id: string;
  balance_id: string;
  category_id?: string;
  amount: number;
  type: TransactionType;
  to_balance_id?: string;
  description: string;
  category_label?: string;
  time_str?: string;
  date: string;
  receipt_image?: string;
  tags?: string;
  created_at: string;
  category_name?: string;
  category_icon?: string;
  category_color?: string;
  wallet_name?: string;
  wallet_type?: string;
}

export interface Debt {
  id: string;
  user_id: string;
  type: 'lent' | 'borrowed';
  counterparty_name: string;
  phone?: string;
  amount: number;
  paid_amount: number;
  due_date?: string;
  status: 'active' | 'closed';
  notes?: string;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  icon: string;
  color: string;
}

export interface Voucher {
  id: string;
  user_id: string;
  title: string;
  description: string;
  code: string;
  discount: string;
  is_used: number;
  expires_at: string;
}

export interface Article {
  id: string;
  title: string;
  category: string;
  read_time: string;
  summary: string;
  content: string;
  image_url: string;
  date: string;
}

export interface FinancialSummary {
  totalBalance: number;
  totalExpense: number;
  totalIncome: number;
  categoryStats: { id: string; name: string; icon: string; color: string; amount: number; count: number }[];
  dailyPoints: { day: string; expense: number; income: number }[];
  period: string;
}
