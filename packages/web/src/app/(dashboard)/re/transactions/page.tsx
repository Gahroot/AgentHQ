'use client';

import { useState, useEffect, useCallback } from 'react';
import { TransactionsTable } from '@/components/re/transactions-table';
import {
  listTransactions,
  RETransaction,
  RETransactionStatus,
  RETransactionType,
  RETransactionsFilters,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
} from '@/lib/api/endpoints/re';

interface SortConfig {
  key: keyof RETransaction | 'agent';
  direction: 'asc' | 'desc';
}

const ALL_STATUS: RETransactionStatus[] = [
  'prospecting',
  'listed',
  'under_contract',
  'pending',
  'closed',
  'cancelled',
];

const ALL_TYPES: RETransactionType[] = ['buy', 'sell', 'lease'];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<RETransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [agentFilter, setAgentFilter] = useState<string>('');

  // Sort
  const [sortConfig, setSortConfig] = useState<SortConfig | undefined>();

  const limit = 20;

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: RETransactionsFilters = {};
      if (statusFilter) filters.status = statusFilter as RETransactionStatus;
      if (typeFilter) filters.type = typeFilter as RETransactionType;
      if (agentFilter) filters.listing_agent_id = agentFilter;

      const response = await listTransactions(page, limit, filters);
      setTransactions(response.transactions);
      setTotal(response.pagination.total);
      setHasMore(response.pagination.hasMore);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch transactions');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, typeFilter, agentFilter, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const handleSort = (config: SortConfig) => {
    setSortConfig(config);

    // Sort locally
    const sorted = [...transactions].sort((a, b) => {
      // Handle special 'agent' key
      if (config.key === 'agent') {
        const aVal = a.listing_agent_id || a.buyers_agent_id || '';
        const bVal = b.listing_agent_id || b.buyers_agent_id || '';
        if (aVal < bVal) return config.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return config.direction === 'asc' ? 1 : -1;
        return 0;
      }

      // Handle known transaction keys
      const aVal = a[config.key];
      const bVal = b[config.key];

      // Handle null/undefined values
      const aNull = aVal === null || aVal === undefined;
      const bNull = bVal === null || bVal === undefined;
      if (aNull && bNull) return 0;
      if (aNull) return 1;
      if (bNull) return -1;

      // Compare values (both are non-null here)
      if (aVal! < bVal!) return config.direction === 'asc' ? -1 : 1;
      if (aVal! > bVal!) return config.direction === 'asc' ? 1 : -1;
      return 0;
    });

    setTransactions(sorted);
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export clicked');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track all real estate transactions
          </p>
        </div>
        <button
          onClick={handleExport}
          className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Status Filter */}
          <div>
            <label htmlFor="status-filter" className="block text-sm font-medium text-foreground mb-1">
              Status
            </label>
            <select
              id="status-filter"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Statuses</option>
              {ALL_STATUS.map((status) => (
                <option key={status} value={status}>
                  {TRANSACTION_STATUS_LABELS[status]}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label htmlFor="type-filter" className="block text-sm font-medium text-foreground mb-1">
              Type
            </label>
            <select
              id="type-filter"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Types</option>
              {ALL_TYPES.map((type) => (
                <option key={type} value={type}>
                  {TRANSACTION_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
          </div>

          {/* Agent Filter */}
          <div>
            <label htmlFor="agent-filter" className="block text-sm font-medium text-foreground mb-1">
              Agent ID
            </label>
            <input
              id="agent-filter"
              type="text"
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setPage(1);
              }}
              placeholder="Enter agent ID..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>

        {/* Active Filters Display */}
        {(statusFilter || typeFilter || agentFilter) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-muted-foreground">Active filters:</span>
            {statusFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                Status: {TRANSACTION_STATUS_LABELS[statusFilter as RETransactionStatus]}
                <button
                  onClick={() => setStatusFilter('')}
                  className="ml-1 hover:text-primary-foreground"
                >
                  ×
                </button>
              </span>
            )}
            {typeFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                Type: {TRANSACTION_TYPE_LABELS[typeFilter as RETransactionType]}
                <button
                  onClick={() => setTypeFilter('')}
                  className="ml-1 hover:text-primary-foreground"
                >
                  ×
                </button>
              </span>
            )}
            {agentFilter && (
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                Agent: {agentFilter}
                <button
                  onClick={() => setAgentFilter('')}
                  className="ml-1 hover:text-primary-foreground"
                >
                  ×
                </button>
              </span>
            )}
            <button
              onClick={() => {
                setStatusFilter('');
                setTypeFilter('');
                setAgentFilter('');
                setPage(1);
              }}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-muted-foreground">
        Showing {transactions.length} of {total} transactions
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">Error loading transactions</h3>
              <p className="mt-1 text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Transactions Table */}
      {!loading && (
        <div className="bg-card rounded-lg border border-border overflow-hidden">
          <TransactionsTable transactions={transactions} onSort={handleSort} sortConfig={sortConfig} />
        </div>
      )}

      {/* Pagination */}
      {!loading && total > limit && (
        <div className="flex items-center justify-between bg-card rounded-lg border border-border px-4 py-3">
          <div className="text-sm text-muted-foreground">
            Page {page} of {Math.ceil(total / limit)}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="px-3 py-1 text-sm border border-border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-muted transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
