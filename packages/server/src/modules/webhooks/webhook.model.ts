import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface Webhook {
  id: string;
  org_id: string;
  url: string;
  events: string[];
  secret: string | null;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export function webhookModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async findById(id: string, orgId: string): Promise<Webhook | undefined> {
      const result = await knex('webhooks').where({ id, org_id: orgId }).first();
      if (!result) return undefined;
      return {
        ...result,
        events: JSON.parse(result.events as string),
      };
    },

    async findByOrg(orgId: string, activeOnly = true): Promise<Webhook[]> {
      const query = knex('webhooks').where('org_id', orgId);
      if (activeOnly) {
        query.where('active', true);
      }
      const results = await query.orderBy('created_at', 'desc');
      return results.map((r) => ({
        ...r,
        events: JSON.parse(r.events as string),
      }));
    },

    async findByEvent(orgId: string, eventType: string): Promise<Webhook[]> {
      const results = await knex('webhooks')
        .where('org_id', orgId)
        .where('active', true)
        .whereRaw("events @> ?", [JSON.stringify([eventType])]);
      return results.map((r) => ({
        ...r,
        events: JSON.parse(r.events as string),
      }));
    },

    async create(webhook: Partial<Webhook>): Promise<Webhook> {
      const data = {
        ...webhook,
        events: JSON.stringify(webhook.events || []),
      };
      const [created] = await knex('webhooks').insert(data).returning('*');
      if (!created) throw new Error('Failed to create webhook: no row returned');
      return {
        ...created,
        events: JSON.parse(created.events as string),
      };
    },

    async update(id: string, orgId: string, data: Partial<Webhook>): Promise<Webhook | undefined> {
      const updateData: Record<string, unknown> = { ...data, updated_at: knex.fn.now() };
      if (data.events) {
        updateData.events = JSON.stringify(data.events);
      }
      const [updated] = await knex('webhooks')
        .where({ id, org_id: orgId })
        .update(updateData)
        .returning('*');
      if (!updated) return undefined;
      return {
        ...updated,
        events: JSON.parse(updated.events as string),
      };
    },

    async delete(id: string, orgId: string): Promise<boolean> {
      const count = await knex('webhooks').where({ id, org_id: orgId }).delete();
      return count > 0;
    },
  };
}
