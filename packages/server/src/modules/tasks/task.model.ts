import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface Task {
  id: string;
  org_id: string;
  channel_id: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  assigned_to: string | null;
  assigned_type: string | null;
  created_by: string;
  created_by_type: string;
  due_date: Date | null;
  completed_at: Date | null;
  metadata: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export function taskModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async create(task: Partial<Task>): Promise<Task> {
      const [created] = await knex('tasks').insert(task).returning('*');
      if (!created) throw new Error('Failed to create task: no row returned');
      return created;
    },

    async findById(id: string, orgId: string): Promise<Task | undefined> {
      return knex('tasks').where({ id, org_id: orgId }).first();
    },

    async findByOrg(
      orgId: string,
      filters: { status?: string; priority?: string; assigned_to?: string; created_by?: string; channel_id?: string },
      limit: number,
      offset: number,
    ): Promise<Task[]> {
      const query = knex('tasks').where('org_id', orgId);
      if (filters.status) query.where('status', filters.status);
      if (filters.priority) query.where('priority', filters.priority);
      if (filters.assigned_to) query.where('assigned_to', filters.assigned_to);
      if (filters.created_by) query.where('created_by', filters.created_by);
      if (filters.channel_id) query.where('channel_id', filters.channel_id);
      return query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    },

    async countByOrg(
      orgId: string,
      filters: { status?: string; priority?: string; assigned_to?: string; created_by?: string; channel_id?: string },
    ): Promise<number> {
      const query = knex('tasks').where('org_id', orgId);
      if (filters.status) query.where('status', filters.status);
      if (filters.priority) query.where('priority', filters.priority);
      if (filters.assigned_to) query.where('assigned_to', filters.assigned_to);
      if (filters.created_by) query.where('created_by', filters.created_by);
      if (filters.channel_id) query.where('channel_id', filters.channel_id);
      const result = await query.count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async update(id: string, orgId: string, data: Partial<Task>): Promise<Task | undefined> {
      const [updated] = await knex('tasks')
        .where({ id, org_id: orgId })
        .update({ ...data, updated_at: knex.fn.now() })
        .returning('*');
      return updated;
    },

    async delete(id: string, orgId: string): Promise<boolean> {
      const count = await knex('tasks').where({ id, org_id: orgId }).delete();
      return count > 0;
    },
  };
}
