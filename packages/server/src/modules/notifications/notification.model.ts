import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface Notification {
  id: string;
  org_id: string;
  recipient_id: string;
  recipient_type: string;
  type: string;
  source_id: string;
  source_type: string;
  actor_id: string;
  actor_type: string;
  title: string;
  body: string | null;
  read: boolean;
  created_at: Date;
}

export function notificationModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async create(notification: Partial<Notification>): Promise<Notification> {
      const [created] = await knex('notifications').insert(notification).returning('*');
      if (!created) throw new Error('Failed to create notification: no row returned');
      return created;
    },

    async findByRecipient(
      recipientId: string,
      orgId: string,
      filters: { type?: string; read?: boolean },
      limit: number,
      offset: number,
    ): Promise<Notification[]> {
      const query = knex('notifications').where({ recipient_id: recipientId, org_id: orgId });
      if (filters.type) query.where('type', filters.type);
      if (filters.read !== undefined) query.where('read', filters.read);
      return query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    },

    async countByRecipient(
      recipientId: string,
      orgId: string,
      filters: { type?: string; read?: boolean },
    ): Promise<number> {
      const query = knex('notifications').where({ recipient_id: recipientId, org_id: orgId });
      if (filters.type) query.where('type', filters.type);
      if (filters.read !== undefined) query.where('read', filters.read);
      const result = await query.count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async markRead(id: string, orgId: string, recipientId: string): Promise<boolean> {
      const count = await knex('notifications')
        .where({ id, org_id: orgId, recipient_id: recipientId })
        .update({ read: true });
      return count > 0;
    },

    async markAllRead(recipientId: string, orgId: string): Promise<void> {
      await knex('notifications')
        .where({ recipient_id: recipientId, org_id: orgId, read: false })
        .update({ read: true });
    },

    async countUnread(recipientId: string, orgId: string): Promise<number> {
      const result = await knex('notifications')
        .where({ recipient_id: recipientId, org_id: orgId, read: false })
        .count('id as count')
        .first();
      return parseInt(result?.count as string, 10) || 0;
    },
  };
}
