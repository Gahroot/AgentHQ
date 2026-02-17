import { apiGet, apiPost, apiPatch } from '../client';

// Types for Real Estate vertical
export interface RETransaction {
  id: string;
  org_id: string;
  property_address: string;
  mls_number: string | null;
  status: RETransactionStatus;
  type: RETransactionType;
  listing_price: number | null;
  sale_price: number | null;
  commission_rate: number | null;
  commission_amount: number | null;
  listing_agent_id: string | null;
  buyers_agent_id: string | null;
  client_name: string | null;
  key_dates: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type RETransactionStatus =
  | 'prospecting'
  | 'listed'
  | 'under_contract'
  | 'pending'
  | 'closed'
  | 'cancelled';

export type RETransactionType = 'buy' | 'sell' | 'lease';

export interface REMetrics {
  id: string;
  org_id: string;
  agent_id: string | null;
  period: string;
  period_start: string;
  metrics: REMetricsData;
  created_at: string;
}

export interface REMetricsData {
  total_volume?: number;
  total_units?: number;
  closed_deals?: number;
  avg_days_to_close?: number;
  conversion_rate?: number;
}

export interface RELeaderboardEntry {
  id: string;
  name: string;
  metrics: REMetricsData;
}

export interface RETransactionsResponse {
  transactions: RETransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

export interface RETransactionsFilters {
  status?: RETransactionStatus;
  type?: RETransactionType;
  listing_agent_id?: string;
  buyers_agent_id?: string;
}

export interface REMetricsFilters {
  agent_id?: string;
  period?: string;
  from?: string;
  to?: string;
}

/**
 * List all transactions for the organization
 */
export async function listTransactions(
  page = 1,
  limit = 20,
  filters?: RETransactionsFilters
): Promise<RETransactionsResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  if (filters?.status) params.append('status', filters.status);
  if (filters?.type) params.append('type', filters.type);
  if (filters?.listing_agent_id) params.append('listing_agent_id', filters.listing_agent_id);
  if (filters?.buyers_agent_id) params.append('buyers_agent_id', filters.buyers_agent_id);

  const response = await apiGet<RETransaction[]>(`/re/transactions?${params.toString()}`);
  return {
    transactions: response.data || [],
    pagination: response.pagination || { page, limit, total: 0, hasMore: false },
  };
}

/**
 * Get a single transaction by ID
 */
export async function getTransaction(id: string): Promise<RETransaction> {
  const response = await apiGet<RETransaction>(`/re/transactions/${id}`);
  return response.data!;
}

/**
 * Create a new transaction
 */
export async function createTransaction(
  data: {
    property_address: string;
    mls_number?: string;
    type: RETransactionType;
    listing_price?: number;
    listing_agent_id?: string;
    buyers_agent_id?: string;
    client_name?: string;
    key_dates?: Record<string, unknown>;
  }
): Promise<RETransaction> {
  const response = await apiPost<RETransaction>('/re/transactions', data);
  return response.data!;
}

/**
 * Update a transaction
 */
export async function updateTransaction(
  id: string,
  data: {
    status?: RETransactionStatus;
    sale_price?: number;
    commission_rate?: number;
    commission_amount?: number;
    key_dates?: Record<string, unknown>;
  }
): Promise<RETransaction> {
  const response = await apiPatch<RETransaction>(`/re/transactions/${id}`, data);
  return response.data!;
}

/**
 * Get metrics for the organization
 */
export async function getMetrics(filters?: REMetricsFilters): Promise<REMetrics[]> {
  const params = new URLSearchParams();

  if (filters?.agent_id) params.append('agent_id', filters.agent_id);
  if (filters?.period) params.append('period', filters.period);
  if (filters?.from) params.append('from', filters.from);
  if (filters?.to) params.append('to', filters.to);

  const queryString = params.toString();
  const response = await apiGet<REMetrics[]>(
    queryString ? `/re/metrics?${queryString}` : '/re/metrics'
  );
  return response.data || [];
}

/**
 * Get leaderboard for the organization
 */
export async function getLeaderboard(
  period: string,
  periodStart: string
): Promise<RELeaderboardEntry[]> {
  const response = await apiGet<RELeaderboardEntry[]>(
    `/re/metrics/leaderboard?period=${period}&period_start=${periodStart}`
  );
  return response.data || [];
}

// Status helpers
export const TRANSACTION_STATUS_LABELS: Record<RETransactionStatus, string> = {
  prospecting: 'Prospecting',
  listed: 'Listed',
  under_contract: 'Under Contract',
  pending: 'Pending',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

export const TRANSACTION_STATUS_COLORS: Record<RETransactionStatus, string> = {
  prospecting: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  listed: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  under_contract: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  pending: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  closed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const TRANSACTION_TYPE_LABELS: Record<RETransactionType, string> = {
  buy: 'Buy',
  sell: 'Sell',
  lease: 'Lease',
};

// Format currency
export function formatCurrency(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date
export function formatDate(dateString: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
}
