import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface REAgentProfile {
  agent_id: string;
  role: string;
  license_number: string | null;
  specializations: string[];
  territories: string[];
  created_at: Date;
  updated_at: Date;
}

export interface RETransaction {
  id: string;
  org_id: string;
  property_address: string;
  mls_number: string | null;
  status: string;
  type: string;
  listing_price: number | null;
  sale_price: number | null;
  commission_rate: number | null;
  commission_amount: number | null;
  listing_agent_id: string | null;
  buyers_agent_id: string | null;
  client_name: string | null;
  key_dates: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface REMetrics {
  id: string;
  org_id: string;
  agent_id: string | null;
  period: string;
  period_start: string;
  metrics: Record<string, any>;
  created_at: Date;
}

export function reModel(db?: Knex) {
  const knex = db || getDb();

  return {
    // Agent Profiles
    async getProfile(agentId: string): Promise<REAgentProfile | undefined> {
      return knex('re_agent_profiles').where('agent_id', agentId).first();
    },

    async upsertProfile(agentId: string, data: Partial<REAgentProfile>): Promise<REAgentProfile> {
      const [result] = await knex('re_agent_profiles')
        .insert({ agent_id: agentId, ...data })
        .onConflict('agent_id')
        .merge({ ...data, updated_at: knex.fn.now() })
        .returning('*');
      if (!result) throw new Error('Upsert returned no rows');
      return result;
    },

    // Transactions
    async findTransactionById(id: string, orgId: string): Promise<RETransaction | undefined> {
      return knex('re_transactions').where({ id, org_id: orgId }).first();
    },

    async findTransactions(
      orgId: string,
      filters: { status?: string; type?: string; listing_agent_id?: string; buyers_agent_id?: string },
      limit: number,
      offset: number
    ): Promise<RETransaction[]> {
      const query = knex('re_transactions').where('org_id', orgId);
      if (filters.status) query.where('status', filters.status);
      if (filters.type) query.where('type', filters.type);
      if (filters.listing_agent_id) query.where('listing_agent_id', filters.listing_agent_id);
      if (filters.buyers_agent_id) query.where('buyers_agent_id', filters.buyers_agent_id);
      return query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    },

    async countTransactions(
      orgId: string,
      filters: { status?: string; type?: string; listing_agent_id?: string; buyers_agent_id?: string }
    ): Promise<number> {
      const query = knex('re_transactions').where('org_id', orgId);
      if (filters.status) query.where('status', filters.status);
      if (filters.type) query.where('type', filters.type);
      if (filters.listing_agent_id) query.where('listing_agent_id', filters.listing_agent_id);
      if (filters.buyers_agent_id) query.where('buyers_agent_id', filters.buyers_agent_id);
      const result = await query.count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async createTransaction(tx: Partial<RETransaction>): Promise<RETransaction> {
      const [created] = await knex('re_transactions').insert(tx).returning('*');
      if (!created) throw new Error('Failed to create transaction: no row returned');
      return created;
    },

    async updateTransaction(id: string, orgId: string, data: Partial<RETransaction>): Promise<RETransaction | undefined> {
      const [updated] = await knex('re_transactions')
        .where({ id, org_id: orgId })
        .update({ ...data, updated_at: knex.fn.now() })
        .returning('*');
      return updated;
    },

    // Metrics
    async getMetrics(
      orgId: string,
      filters: { agent_id?: string; period?: string; from?: string; to?: string }
    ): Promise<REMetrics[]> {
      const query = knex('re_metrics').where('org_id', orgId);
      if (filters.agent_id) query.where('agent_id', filters.agent_id);
      if (filters.period) query.where('period', filters.period);
      if (filters.from) query.where('period_start', '>=', filters.from);
      if (filters.to) query.where('period_start', '<=', filters.to);
      return query.orderBy('period_start', 'desc');
    },

    async upsertMetrics(data: Partial<REMetrics>): Promise<REMetrics> {
      const [created] = await knex('re_metrics').insert(data).returning('*');
      if (!created) throw new Error('Failed to upsert metrics: no row returned');
      return created;
    },

    // Leaderboard
    async getLeaderboard(orgId: string, period: string, periodStart: string): Promise<any[]> {
      return knex('re_metrics')
        .join('agents', 'agents.id', 're_metrics.agent_id')
        .where('re_metrics.org_id', orgId)
        .where('re_metrics.period', period)
        .where('re_metrics.period_start', periodStart)
        .whereNotNull('re_metrics.agent_id')
        .select(
          'agents.id',
          'agents.name',
          're_metrics.metrics'
        )
        .orderByRaw("(re_metrics.metrics->>'total_volume')::numeric DESC NULLS LAST");
    },
  };
}
