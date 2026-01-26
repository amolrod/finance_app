// ============================================
// API Types - Match backend DTOs exactly
// ============================================

// Auth
export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    currency: string;
    locale: string;
    createdAt: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface UpdateProfileDto {
  firstName?: string;
  lastName?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

export interface DeleteAccountDto {
  password: string;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  newPassword: string;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
  email?: string;
}

// Accounts
export interface Account {
  id: string;
  name: string;
  type: AccountType;
  currency: string;
  initialBalance: string;
  currentBalance: string; // Decimal as string for precision
  icon?: string | null;
  color?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AccountType = 
  | 'BANK'
  | 'CASH'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'SAVINGS'
  | 'INVESTMENT'
  | 'OTHER';

export interface CreateAccountDto {
  name: string;
  type: AccountType;
  currency?: string;
  initialBalance?: string;
  icon?: string;
  color?: string;
}

export interface UpdateAccountDto {
  name?: string;
  type?: AccountType;
  currency?: string;
  icon?: string;
  color?: string;
  isArchived?: boolean;
}

export interface AccountListResponse {
  data: Account[];
  total: number;
  page: number;
  limit: number;
}

export interface CurrencyBalance {
  currency: string;
  balance: string;
  balanceConverted?: string;
}

export interface AccountSummary {
  totalBalance: string;
  totalBalanceConverted?: string;
  targetCurrency?: string;
  accountCount: number;
  byCurrency: CurrencyBalance[];
}

// Categories
export interface Category {
  id: string;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  parentId?: string;
  parent?: Category;
  children?: Category[];
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CategoryType = 'INCOME' | 'EXPENSE';

export interface CreateCategoryDto {
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  parentId?: string;
}

export interface UpdateCategoryDto {
  name?: string;
  icon?: string;
  color?: string;
  parentId?: string;
}

// Transactions
export interface Transaction {
  id: string;
  type: TransactionType;
  status: TransactionStatus;
  amount: string; // Decimal as string
  currency: string;
  description?: string | null;
  notes?: string | null;
  occurredAt: string; // Transaction date
  accountId?: string;
  categoryId?: string | null;
  account?: TransactionAccount | null;
  category?: TransactionCategory | null;
  transferToAccount?: { id: string; name: string } | null;
  tags?: TransactionTag[];
  createdAt: string;
  updatedAt: string;
}

export interface TransactionAccount {
  id: string;
  name: string;
  currency: string;
}

export interface TransactionCategory {
  id: string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface TransactionTag {
  id: string;
  name: string;
  color?: string | null;
}

export type TransactionType = 'INCOME' | 'EXPENSE' | 'TRANSFER';
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'CANCELLED' | 'REVERSED';

export interface CreateTransactionDto {
  type: TransactionType;
  amount: string;
  accountId: string;
  categoryId?: string;
  transferToAccountId?: string;
  currency?: string;
  description?: string;
  notes?: string;
  occurredAt?: string;
  tagIds?: string[];
}

export interface UpdateTransactionDto {
  description?: string;
  notes?: string;
  occurredAt?: string;
  categoryId?: string;
  tagIds?: string[];
}

export interface TransactionFilters {
  type?: TransactionType;
  status?: TransactionStatus;
  accountId?: string;
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  minAmount?: string;
  maxAmount?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TransactionListResponse {
  data: Transaction[];
  total: number;
  page: number;
  limit: number;
  totalIncome: string;
  totalExpense: string;
  netAmount: string;
}

export interface BatchDeleteTransactionsResponse {
  deletedIds: string[];
  failedIds: string[];
}

// Tags
export interface Tag {
  id: string;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTagDto {
  name: string;
  color?: string;
}

export interface UpdateTagDto {
  name?: string;
  color?: string;
}

// Budgets
export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon?: string | null;
  categoryColor?: string | null;
  periodMonth: string; // YYYY-MM
  limitAmount: string; // Decimal as string
  spentAmount: string; // Decimal as string
  remainingAmount: string;
  percentageUsed: number;
  alertAt80: boolean;
  alertAt100: boolean;
  createdAt: string;
  updatedAt: string;
}

export type BudgetPeriod = 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface CreateBudgetDto {
  categoryId: string;
  periodMonth: string; // YYYY-MM format
  limitAmount: string;
  alertAt80?: boolean;
  alertAt100?: boolean;
}

export interface UpdateBudgetDto {
  limitAmount?: string;
  alertAt80?: boolean;
  alertAt100?: boolean;
}

// API Error Response
export interface ApiError {
  statusCode: number;
  message: string | string[];
  error: string;
}

// Generic list response
export interface ListResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Recurring Transactions
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'YEARLY';

export interface RecurringTransaction {
  id: string;
  accountId: string;
  categoryId?: string | null;
  type: TransactionType;
  amount: string;
  currency: string;
  description: string;
  notes?: string | null;
  frequency: RecurrenceFrequency;
  dayOfMonth?: number | null;
  dayOfWeek?: number | null;
  startDate: string;
  endDate?: string | null;
  nextOccurrence: string;
  lastOccurrence?: string | null;
  isActive: boolean;
  executionCount: number;
  autoConfirm: boolean;
  notifyBeforeDays: number;
  account?: { id: string; name: string };
  category?: { id: string; name: string; color?: string | null; icon?: string | null } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRecurringTransactionDto {
  accountId: string;
  categoryId?: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  currency?: string;
  description: string;
  notes?: string;
  frequency: RecurrenceFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  startDate: string;
  endDate?: string;
  autoConfirm?: boolean;
  notifyBeforeDays?: number;
}

export interface UpdateRecurringTransactionDto {
  accountId?: string;
  categoryId?: string;
  type?: 'INCOME' | 'EXPENSE';
  amount?: number;
  currency?: string;
  description?: string;
  notes?: string;
  frequency?: RecurrenceFrequency;
  dayOfMonth?: number;
  dayOfWeek?: number;
  endDate?: string;
  isActive?: boolean;
  autoConfirm?: boolean;
  notifyBeforeDays?: number;
}

export interface RecurringTransactionFilters {
  isActive?: boolean;
  type?: 'INCOME' | 'EXPENSE';
  frequency?: RecurrenceFrequency;
  accountId?: string;
  categoryId?: string;
}

// Notifications
export type NotificationType = 'BUDGET_WARNING' | 'BUDGET_EXCEEDED' | 'SYSTEM' | 'INFO';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  payload?: Record<string, any> | null;
  readAt?: string | null;
  createdAt: string;
}

// ============================================
// Investments
// ============================================

export type AssetType = 'STOCK' | 'ETF' | 'CRYPTO' | 'BOND' | 'MUTUAL_FUND' | 'OTHER';

export type OperationType = 'BUY' | 'SELL' | 'DIVIDEND' | 'FEE' | 'SPLIT';

export interface Asset {
  id: string;
  symbol: string;
  name: string;
  type: AssetType;
  currency: string;
  exchange?: string | null;
  createdAt: string;
  updatedAt: string;
  prices?: MarketPrice[];
}

export interface AssetSearchResult {
  symbol: string;
  name: string;
  type: AssetType;
  exchange?: string;
  currency?: string;
  source: string;
  assetId?: string;
}

export interface MarketPrice {
  id: string;
  assetId: string;
  price: string;
  currency: string;
  source: string;
  fetchedAt: string;
  createdAt: string;
}

export interface InvestmentOperation {
  id: string;
  userId: string;
  assetId: string;
  type: OperationType;
  quantity: string;
  pricePerUnit: string;
  totalAmount: string;
  fees: string;
  currency: string;
  occurredAt: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  asset?: Asset;
}

export interface CreateAssetDto {
  symbol: string;
  name: string;
  type: AssetType;
  currency?: string;
  exchange?: string;
}

export interface UpdateAssetDto {
  name?: string;
  currency?: string;
  exchange?: string;
}

export interface CreateInvestmentOperationDto {
  assetId: string;
  type: OperationType;
  quantity: number;
  pricePerUnit: number;
  fees?: number;
  currency?: string;
  occurredAt: string;
  notes?: string;
}

export interface UpdateInvestmentOperationDto {
  type?: OperationType;
  quantity?: number;
  pricePerUnit?: number;
  fees?: number;
  occurredAt?: string;
  notes?: string;
}

export interface HoldingSummary {
  assetId: string;
  symbol: string;
  name: string;
  type: string;
  quantity: string;
  averageCost: string;
  totalInvested: string;
  currentPrice: string | null;
  currentValue: string | null;
  unrealizedPnL: string | null;
  unrealizedPnLPercent: string | null;
  realizedPnL: string;
  currency: string;
}

export interface PortfolioSummary {
  totalInvested: string;
  totalCurrentValue: string | null;
  totalUnrealizedPnL: string | null;
  totalRealizedPnL: string;
  holdings: HoldingSummary[];
  byAssetType: Record<string, { invested: string; currentValue: string | null; count: number }>;
}

// Import Types
export interface BankFormat {
  id: string;
  name: string;
  description?: string;
  delimiter: string;
  dateFormat: string;
}

export interface ParsedTransaction {
  originalDate: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  originalDescription?: string;
  reference?: string;
  balance?: number;
  currency?: string;
}

export interface CategorySuggestion {
  categoryId: string;
  categoryName: string;
  confidence: number;
  reason: string;
}

export interface ParsedTransactionWithCategory extends ParsedTransaction {
  suggestedCategory?: CategorySuggestion;
  isDuplicate: boolean;
  duplicateTransactionId?: string;
  hash: string;
}

export interface ImportPreview {
  filename: string;
  detectedFormat: string;
  detectedCurrency: string;
  totalTransactions: number;
  duplicatesFound: number;
  transactions: ParsedTransactionWithCategory[];
  dateRange: {
    from: string;
    to: string;
  };
  summary: {
    totalIncome: number;
    totalExpenses: number;
    netAmount: number;
  };
}

export interface ImportTransaction {
  hash: string;
  categoryId?: string;
  skip?: boolean;
  description?: string;
  date?: string;
  amount?: number;
  type?: 'INCOME' | 'EXPENSE' | 'TRANSFER';
  suggestedCategoryId?: string;
  confidence?: number;
}

export interface ConfirmImportDto {
  accountId: string;
  transactions: ImportTransaction[];
  preview?: ImportPreview;
}

export interface ImportResultDto {
  imported: number;
  skipped: number;
  duplicates: number;
  errors: number;
  transactionIds: string[];
}
