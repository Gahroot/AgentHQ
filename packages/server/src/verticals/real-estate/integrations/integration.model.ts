import { Knex } from 'knex';
import { getDb } from '../../../config/database';
import { generateId } from '../../../utils/id';
import { Integration, IntegrationSyncLog, IntegrationType } from './integration.types';

export function integrationModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async findById(id: string, orgId: string): Promise<Integration | undefined> {
      return knex('integrations').where({ id, org_id: orgId }).first();
    },

    async findByType(orgId: string, type: IntegrationType): Promise<Integration | undefined> {
      return knex('integrations').where({ org_id: orgId, type }).first();
    },

    async findByOrg(orgId: string): Promise<Integration[]> {
      return knex('integrations').where('org_id', orgId).orderBy('created_at', 'desc');
    },

    async create(data: Omit<Integration, 'created_at' | 'updated_at'>): Promise<Integration> {
      const [created] = await knex('integrations')
        .insert({ ...data, id: data.id || generateId() })
        .returning('*');
      return created;
    },

    async update(id: string, orgId: string, data: Partial<Integration>): Promise<Integration | undefined> {
      const [updated] = await knex('integrations')
        .where({ id, org_id: orgId })
        .update({ ...data, updated_at: knex.fn.now() })
        .returning('*');
      return updated;
    },

    async delete(id: string, orgId: string): Promise<boolean> {
      const count = await knex('integrations').where({ id, org_id: orgId }).delete();
      return count > 0;
    },

    // Sync log methods
    async createSyncLog(data: {
      integration_id: string;
      org_id: string;
      operation: string;
    }): Promise<IntegrationSyncLog> {
      const [created] = await knex('integration_sync_log')
        .insert({
          id: generateId(),
          integration_id: data.integration_id,
          org_id: data.org_id,
          operation: data.operation,
          status: 'started',
        })
        .returning('*');
      return created;
    },

    async completeSyncLog(
      id: string,
      data: { status: 'completed' | 'failed'; records_synced?: number; error?: string; metadata?: Record<string, any> }
    ): Promise<IntegrationSyncLog | undefined> {
      const [updated] = await knex('integration_sync_log')
        .where('id', id)
        .update({
          status: data.status,
          records_synced: data.records_synced || 0,
          error: data.error || null,
          metadata: data.metadata ? JSON.stringify(data.metadata) : '{}',
          completed_at: knex.fn.now(),
        })
        .returning('*');
      return updated;
    },

    async findSyncLogs(
      integrationId: string,
      orgId: string,
      limit: number,
      offset: number
    ): Promise<IntegrationSyncLog[]> {
      return knex('integration_sync_log')
        .where({ integration_id: integrationId, org_id: orgId })
        .orderBy('started_at', 'desc')
        .limit(limit)
        .offset(offset);
    },

    async countSyncLogs(integrationId: string, orgId: string): Promise<number> {
      const result = await knex('integration_sync_log')
        .where({ integration_id: integrationId, org_id: orgId })
        .count('id as count')
        .first();
      return parseInt(result?.count as string, 10) || 0;
    },
  };
}
