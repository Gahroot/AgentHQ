import { reModel } from './re.model';
import { generateId } from '../../utils/id';

export const reService = {
  // Transactions
  async createTransaction(orgId: string, data: {
    property_address: string;
    mls_number?: string;
    type: string;
    listing_price?: number;
    listing_agent_id?: string;
    buyers_agent_id?: string;
    client_name?: string;
    key_dates?: Record<string, any>;
  }) {
    return reModel().createTransaction({
      id: generateId(),
      org_id: orgId,
      property_address: data.property_address,
      mls_number: data.mls_number || null,
      status: 'prospecting',
      type: data.type,
      listing_price: data.listing_price || null,
      sale_price: null,
      commission_rate: null,
      commission_amount: null,
      listing_agent_id: data.listing_agent_id || null,
      buyers_agent_id: data.buyers_agent_id || null,
      client_name: data.client_name || null,
      key_dates: data.key_dates || {},
    });
  },

  async listTransactions(
    orgId: string,
    filters: { status?: string; type?: string; listing_agent_id?: string; buyers_agent_id?: string },
    limit: number,
    offset: number
  ) {
    const [transactions, total] = await Promise.all([
      reModel().findTransactions(orgId, filters, limit, offset),
      reModel().countTransactions(orgId, filters),
    ]);
    return { transactions, total };
  },

  async getTransaction(id: string, orgId: string) {
    return reModel().findTransactionById(id, orgId);
  },

  async updateTransaction(id: string, orgId: string, data: {
    status?: string;
    sale_price?: number;
    commission_rate?: number;
    commission_amount?: number;
    key_dates?: Record<string, any>;
  }) {
    return reModel().updateTransaction(id, orgId, data);
  },

  // Metrics
  async getMetrics(orgId: string, filters: { agent_id?: string; period?: string; from?: string; to?: string }) {
    return reModel().getMetrics(orgId, filters);
  },

  async getLeaderboard(orgId: string, period: string, periodStart: string) {
    return reModel().getLeaderboard(orgId, period, periodStart);
  },
};
