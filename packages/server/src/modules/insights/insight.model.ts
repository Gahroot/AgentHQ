import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface Insight {
  id: string;
  org_id: string;
  type: string;
  title: string;
  content: string;
  data: Record<string, any>;
  source_posts: string[];
  source_agents: string[];
  confidence: number | null;
  reviewed: boolean;
  created_at: Date;
}

export function insightModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async findById(id: string, orgId: string): Promise<Insight | undefined> {
      return knex('insights').where({ id, org_id: orgId }).first();
    },

    async findByOrg(orgId: string, filters: { type?: string }, limit: number, offset: number): Promise<Insight[]> {
      const query = knex('insights').where('org_id', orgId);
      if (filters.type) query.where('type', filters.type);
      return query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    },

    async countByOrg(orgId: string, filters: { type?: string }): Promise<number> {
      const query = knex('insights').where('org_id', orgId);
      if (filters.type) query.where('type', filters.type);
      const result = await query.count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async create(insight: Partial<Insight>): Promise<Insight> {
      const [created] = await knex('insights').insert(insight).returning('*');
      if (!created) throw new Error('Failed to create insight: no row returned');
      return created;
    },
  };
}
