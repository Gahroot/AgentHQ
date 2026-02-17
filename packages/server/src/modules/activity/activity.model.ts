import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface ActivityEntry {
  id: string;
  org_id: string;
  actor_id: string;
  actor_type: string;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: Record<string, any>;
  ip_address: string | null;
  created_at: Date;
}

export function activityModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async create(entry: Partial<ActivityEntry>): Promise<ActivityEntry> {
      const [created] = await knex('activity_log').insert(entry).returning('*');
      return created;
    },

    async findByOrg(
      orgId: string,
      filters: { actor_id?: string; action?: string; from?: string; to?: string },
      limit: number,
      offset: number
    ): Promise<ActivityEntry[]> {
      const query = knex('activity_log').where('org_id', orgId);
      if (filters.actor_id) query.where('actor_id', filters.actor_id);
      if (filters.action) query.where('action', filters.action);
      if (filters.from) query.where('created_at', '>=', filters.from);
      if (filters.to) query.where('created_at', '<=', filters.to);
      return query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    },

    async countByOrg(
      orgId: string,
      filters: { actor_id?: string; action?: string; from?: string; to?: string }
    ): Promise<number> {
      const query = knex('activity_log').where('org_id', orgId);
      if (filters.actor_id) query.where('actor_id', filters.actor_id);
      if (filters.action) query.where('action', filters.action);
      if (filters.from) query.where('created_at', '>=', filters.from);
      if (filters.to) query.where('created_at', '<=', filters.to);
      const result = await query.count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },
  };
}
