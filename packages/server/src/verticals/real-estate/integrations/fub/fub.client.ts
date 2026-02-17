import { BaseIntegrationClient } from '../base-client';
import { FubCredentials } from '../integration.types';
import { config } from '../../../../config';

export class FubClient extends BaseIntegrationClient {
  private credentials: FubCredentials;

  constructor(integrationId: string, orgId: string, credentials: FubCredentials) {
    super(integrationId, orgId);
    this.credentials = credentials;
  }

  get baseUrl(): string {
    return 'https://api.followupboss.com/v1/';
  }

  getAuthHeaders(): Record<string, string> {
    const encoded = Buffer.from(`${this.credentials.apiKey}:`).toString('base64');
    const headers: Record<string, string> = {
      Authorization: `Basic ${encoded}`,
    };
    if (config.integrations.fub.systemName) {
      headers['X-System'] = config.integrations.fub.systemName;
    }
    if (config.integrations.fub.systemKey) {
      headers['X-System-Key'] = config.integrations.fub.systemKey;
    }
    return headers;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('GET', 'users', { query: { limit: 1 } });
      return { success: true, message: 'Connected to Follow Up Boss' };
    } catch (err) {
      return { success: false, message: (err as Error).message };
    }
  }

  // People (Leads)
  async listPeople(params?: {
    sort?: string;
    limit?: number;
    offset?: number;
    includeTrash?: boolean;
    includeUnclaimed?: boolean;
  }) {
    const syncLog = await this.startSyncLog('fub:listPeople');
    try {
      const result = await this.request<any>('GET', 'people', { query: params as any });
      await this.completeSyncLog(syncLog.id, result.people?.length || 0);
      return result;
    } catch (err) {
      await this.failSyncLog(syncLog.id, (err as Error).message);
      throw err;
    }
  }

  async getPerson(id: number) {
    return this.request<any>('GET', `people/${id}`);
  }

  // Deals (Pipeline)
  async listDeals(params?: { sort?: string; limit?: number; offset?: number }) {
    const syncLog = await this.startSyncLog('fub:listDeals');
    try {
      const result = await this.request<any>('GET', 'deals', { query: params as any });
      await this.completeSyncLog(syncLog.id, result.deals?.length || 0);
      return result;
    } catch (err) {
      await this.failSyncLog(syncLog.id, (err as Error).message);
      throw err;
    }
  }

  async getDeal(id: number) {
    return this.request<any>('GET', `deals/${id}`);
  }

  // Events
  async listEvents(params?: { sort?: string; limit?: number; offset?: number }) {
    const syncLog = await this.startSyncLog('fub:listEvents');
    try {
      const result = await this.request<any>('GET', 'events', { query: params as any });
      await this.completeSyncLog(syncLog.id, result.events?.length || 0);
      return result;
    } catch (err) {
      await this.failSyncLog(syncLog.id, (err as Error).message);
      throw err;
    }
  }

  async createEvent(data: { type: string; person: number; description?: string; metadata?: Record<string, any> }) {
    return this.request<any>('POST', 'events', { body: data });
  }

  // Users (Agents)
  async listUsers(params?: { limit?: number; offset?: number }) {
    const syncLog = await this.startSyncLog('fub:listUsers');
    try {
      const result = await this.request<any>('GET', 'users', { query: params as any });
      await this.completeSyncLog(syncLog.id, result.users?.length || 0);
      return result;
    } catch (err) {
      await this.failSyncLog(syncLog.id, (err as Error).message);
      throw err;
    }
  }
}
