'use client';

import { useState } from 'react';
import {
  RETransaction,
  RETransactionStatus,
  RETransactionType,
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_STATUS_COLORS,
  TRANSACTION_TYPE_LABELS,
  formatCurrency,
  formatDate,
} from '@/lib/api/endpoints/re';

interface SortConfig {
  key: keyof RETransaction | 'agent';
  direction: 'asc' | 'desc';
}

interface TransactionsTableProps {
  transactions: RETransaction[];
  onSort?: (config: SortConfig) => void;
  sortConfig?: SortConfig;
}

const getStatusLabel = (status: RETransactionStatus): string => {
  return TRANSACTION_STATUS_LABELS[status];
};

const getStatusColor = (status: RETransactionStatus): string => {
  return TRANSACTION_STATUS_COLORS[status];
};

const getTypeLabel = (type: RETransactionType): string => {
  return TRANSACTION_TYPE_LABELS[type];
};

export function TransactionsTable({ transactions, onSort, sortConfig }: TransactionsTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null);

  const handleSort = (key: keyof RETransaction | 'agent') => {
    if (!onSort) return;

    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    onSort({ key, direction });
  };

  const renderSortIcon = (key: keyof RETransaction | 'agent') => {
    if (sortConfig?.key !== key) {
      return (
        <svg className="w-4 h-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 text-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        {sortConfig.direction === 'asc' ? (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        )}
      </svg>
    );
  };

  const SortableHeader = ({ children, key }: { children: React.ReactNode; key: keyof RETransaction | 'agent' }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${
        onSort ? 'cursor-pointer hover:text-foreground transition-colors' : ''
      }`}
      onClick={() => onSort && handleSort(key)}
    >
      <div className="flex items-center gap-1">
        {children}
        {onSort && renderSortIcon(key)}
      </div>
    </th>
  );

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-muted-foreground"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-foreground">No transactions</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No transactions found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted/50">
          <tr>
            <SortableHeader key="property_address">Address</SortableHeader>
            <SortableHeader key="status">Status</SortableHeader>
            <SortableHeader key="type">Type</SortableHeader>
            <SortableHeader key="listing_price">Amount</SortableHeader>
            <SortableHeader key="agent">Agent</SortableHeader>
            <SortableHeader key="created_at">Date</SortableHeader>
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {transactions.map((transaction) => (
            <tr
              key={transaction.id}
              className={`transition-colors ${
                hoveredRow === transaction.id ? 'bg-muted/50' : ''
              }`}
              onMouseEnter={() => setHoveredRow(transaction.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-foreground">
                      {transaction.property_address}
                    </div>
                    {transaction.mls_number && (
                      <div className="text-xs text-muted-foreground">
                        MLS: {transaction.mls_number}
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <span
                  className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                    transaction.status
                  )}`}
                >
                  {getStatusLabel(transaction.status)}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {getTypeLabel(transaction.type)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                {formatCurrency(transaction.sale_price || transaction.listing_price)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {transaction.listing_agent_id || transaction.buyers_agent_id
                  ? transaction.listing_agent_id || transaction.buyers_agent_id
                  : '-'}
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-sm text-muted-foreground">
                {formatDate(transaction.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
