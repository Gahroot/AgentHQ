import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface Agent {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  api_key_hash: string;
  api_key_prefix: string;
  owner_user_id: string | null;
  status: string;
  last_heartbeat: Date | null;
  capabilities: string[];
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export function agentModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async findById(id: string, orgId: string): Promise<Agent | undefined> {
      return knex('agents').where({ id, org_id: orgId }).first();
    },

    async findByName(name: string, orgId: string): Promise<Agent | undefined> {
      return knex('agents').where({ name, org_id: orgId }).first();
    },

    async findByOrg(orgId: string, limit: number, offset: number): Promise<Agent[]> {
      return knex('agents')
        .where('org_id', orgId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
    },

    async countByOrg(orgId: string): Promise<number> {
      const result = await knex('agents').where('org_id', orgId).count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async create(agent: Partial<Agent>): Promise<Agent> {
      const [created] = await knex('agents').insert(agent).returning('*');
      if (!created) throw new Error('Failed to create agent: no row returned');
      return created;
    },

    async update(id: string, orgId: string, data: Partial<Agent>): Promise<Agent | undefined> {
      const [updated] = await knex('agents')
        .where({ id, org_id: orgId })
        .update({ ...data, updated_at: knex.fn.now() })
        .returning('*');
      return updated;
    },

    async delete(id: string, orgId: string): Promise<boolean> {
      const count = await knex('agents').where({ id, org_id: orgId }).delete();
      return count > 0;
    },

    async updateHeartbeat(id: string, orgId: string, status?: string): Promise<void> {
      const update: Record<string, unknown> = { last_heartbeat: knex.fn.now() };
      if (status) update.status = status;
      await knex('agents').where({ id, org_id: orgId }).update(update);
    },

    async search(
      orgId: string,
      query: string,
      filters: { capabilities?: string[]; status?: string[] },
      limit: number,
      offset: number,
    ): Promise<Agent[]> {
      const qb = knex('agents').where('org_id', orgId);

      if (query) {
        qb.whereRaw('search_vector @@ plainto_tsquery(?)', [query])
          .orderByRaw('ts_rank(search_vector, plainto_tsquery(?)) DESC', [query]);
      } else {
        qb.orderBy('created_at', 'desc');
      }

      // Filter by capabilities (JSONB contains)
      if (filters.capabilities && filters.capabilities.length > 0) {
        qb.whereRaw('capabilities @> ?', [JSON.stringify(filters.capabilities)]);
      }

      // Filter by status
      if (filters.status && filters.status.length > 0) {
        qb.whereIn('status', filters.status);
      }

      return qb.limit(limit).offset(offset);
    },

    async searchCount(orgId: string, query: string, filters: { capabilities?: string[]; status?: string[] }): Promise<number> {
      const qb = knex('agents').where('org_id', orgId);

      if (query) {
        qb.whereRaw('search_vector @@ plainto_tsquery(?)', [query]);
      }

      // Filter by capabilities (JSONB contains)
      if (filters.capabilities && filters.capabilities.length > 0) {
        qb.whereRaw('capabilities @> ?', [JSON.stringify(filters.capabilities)]);
      }

      // Filter by status
      if (filters.status && filters.status.length > 0) {
        qb.whereIn('status', filters.status);
      }

      const result = await qb.count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },
  };
}
