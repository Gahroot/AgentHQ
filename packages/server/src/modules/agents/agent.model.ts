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
  metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export function agentModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async findById(id: string, orgId: string): Promise<Agent | undefined> {
      return knex('agents').where({ id, org_id: orgId }).first();
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
      const update: any = { last_heartbeat: knex.fn.now() };
      if (status) update.status = status;
      await knex('agents').where({ id, org_id: orgId }).update(update);
    },
  };
}
