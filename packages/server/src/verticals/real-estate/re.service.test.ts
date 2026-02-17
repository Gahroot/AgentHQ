import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCreateTransaction = vi.fn();
const mockFindTransactions = vi.fn();
const mockCountTransactions = vi.fn();
const mockFindTransactionById = vi.fn();
const mockUpdateTransaction = vi.fn();
const mockGetMetrics = vi.fn();
const mockGetLeaderboard = vi.fn();

vi.mock('./re.model', () => ({
  reModel: vi.fn(() => ({
    createTransaction: mockCreateTransaction,
    findTransactions: mockFindTransactions,
    countTransactions: mockCountTransactions,
    findTransactionById: mockFindTransactionById,
    updateTransaction: mockUpdateTransaction,
    getMetrics: mockGetMetrics,
    getLeaderboard: mockGetLeaderboard,
  })),
}));

vi.mock('../../utils/id', () => ({
  generateId: vi.fn(() => 'mock-tx-id'),
}));

import { reService } from './re.service';

describe('reService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createTransaction', () => {
    it('generates ID and sets defaults (status=prospecting, key_dates={})', async () => {
      const mockTx = { id: 'mock-tx-id', property_address: '123 Main St' };
      mockCreateTransaction.mockResolvedValue(mockTx);

      const result = await reService.createTransaction('org-1', {
        property_address: '123 Main St',
        type: 'buy',
      });

      expect(mockCreateTransaction).toHaveBeenCalledWith({
        id: 'mock-tx-id',
        org_id: 'org-1',
        property_address: '123 Main St',
        mls_number: null,
        status: 'prospecting',
        type: 'buy',
        listing_price: null,
        sale_price: null,
        commission_rate: null,
        commission_amount: null,
        listing_agent_id: null,
        buyers_agent_id: null,
        client_name: null,
        key_dates: {},
      });
      expect(result).toEqual(mockTx);
    });

    it('passes optional fields when provided', async () => {
      mockCreateTransaction.mockResolvedValue({});

      await reService.createTransaction('org-1', {
        property_address: '456 Oak Ave',
        mls_number: 'MLS-12345',
        type: 'sell',
        listing_price: 500000,
        listing_agent_id: 'agent-1',
        buyers_agent_id: 'agent-2',
        client_name: 'John Doe',
        key_dates: { listed: '2026-01-15' },
      });

      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          mls_number: 'MLS-12345',
          listing_price: 500000,
          listing_agent_id: 'agent-1',
          buyers_agent_id: 'agent-2',
          client_name: 'John Doe',
          key_dates: { listed: '2026-01-15' },
        })
      );
    });
  });

  describe('listTransactions', () => {
    it('delegates with filters, limit, and offset', async () => {
      const transactions = [{ id: 'tx-1' }];
      mockFindTransactions.mockResolvedValue(transactions);
      mockCountTransactions.mockResolvedValue(1);

      const filters = { status: 'active', type: 'buy' };
      const result = await reService.listTransactions('org-1', filters, 10, 0);

      expect(mockFindTransactions).toHaveBeenCalledWith('org-1', filters, 10, 0);
      expect(mockCountTransactions).toHaveBeenCalledWith('org-1', filters);
      expect(result).toEqual({ transactions, total: 1 });
    });

    it('handles empty results', async () => {
      mockFindTransactions.mockResolvedValue([]);
      mockCountTransactions.mockResolvedValue(0);

      const result = await reService.listTransactions('org-1', {}, 20, 0);

      expect(result).toEqual({ transactions: [], total: 0 });
    });

    it('passes agent-specific filters', async () => {
      mockFindTransactions.mockResolvedValue([]);
      mockCountTransactions.mockResolvedValue(0);

      const filters = { listing_agent_id: 'agent-1', buyers_agent_id: 'agent-2' };
      await reService.listTransactions('org-1', filters, 10, 0);

      expect(mockFindTransactions).toHaveBeenCalledWith('org-1', filters, 10, 0);
    });
  });

  describe('updateTransaction', () => {
    it('delegates to model.updateTransaction', async () => {
      const updated = { id: 'tx-1', status: 'under_contract' };
      mockUpdateTransaction.mockResolvedValue(updated);

      const data = { status: 'under_contract', sale_price: 480000 };
      const result = await reService.updateTransaction('tx-1', 'org-1', data);

      expect(mockUpdateTransaction).toHaveBeenCalledWith('tx-1', 'org-1', data);
      expect(result).toEqual(updated);
    });
  });

  describe('getMetrics', () => {
    it('delegates with filters', async () => {
      const metrics = [{ id: 'm1', metrics: { total_volume: 1000000 } }];
      mockGetMetrics.mockResolvedValue(metrics);

      const filters = { agent_id: 'agent-1', period: 'monthly' };
      const result = await reService.getMetrics('org-1', filters);

      expect(mockGetMetrics).toHaveBeenCalledWith('org-1', filters);
      expect(result).toEqual(metrics);
    });

    it('passes date range filters', async () => {
      mockGetMetrics.mockResolvedValue([]);

      const filters = { from: '2026-01-01', to: '2026-02-01' };
      await reService.getMetrics('org-1', filters);

      expect(mockGetMetrics).toHaveBeenCalledWith('org-1', filters);
    });
  });

  describe('getLeaderboard', () => {
    it('delegates with period and periodStart', async () => {
      const leaderboard = [
        { id: 'agent-1', name: 'Top Agent', metrics: { total_volume: 2000000 } },
      ];
      mockGetLeaderboard.mockResolvedValue(leaderboard);

      const result = await reService.getLeaderboard('org-1', 'monthly', '2026-01-01');

      expect(mockGetLeaderboard).toHaveBeenCalledWith('org-1', 'monthly', '2026-01-01');
      expect(result).toEqual(leaderboard);
    });
  });
});
