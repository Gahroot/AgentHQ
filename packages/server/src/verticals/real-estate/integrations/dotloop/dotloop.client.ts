import { BaseIntegrationClient } from '../base-client';
import { DotloopCredentials } from '../integration.types';
import { integrationModel } from '../integration.model';
import { encrypt } from '../../../../utils/encryption';
import { config } from '../../../../config';
import { logger } from '../../../../middleware/logger';

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export class DotloopClient extends BaseIntegrationClient {
  private credentials: DotloopCredentials;

  constructor(integrationId: string, orgId: string, credentials: DotloopCredentials) {
    super(integrationId, orgId);
    this.credentials = credentials;
  }

  get baseUrl(): string {
    return 'https://api-gateway.dotloop.com/public/v2/';
  }

  getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.credentials.accessToken}`,
    };
  }

  protected async ensureValidToken(): Promise<void> {
    if (!this.credentials.expiresAt) return;
    if (Date.now() < this.credentials.expiresAt - TOKEN_REFRESH_BUFFER_MS) return;

    logger.info({ integrationId: this.integrationId }, 'Refreshing Dotloop token');

    const response = await fetch('https://auth.dotloop.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: this.credentials.refreshToken,
        client_id: config.integrations.dotloop.clientId,
        client_secret: config.integrations.dotloop.clientSecret,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error({ error }, 'Failed to refresh Dotloop token');
      await integrationModel().update(this.integrationId, this.orgId, {
        status: 'error',
        last_error: 'Token refresh failed',
      });
      throw new Error('Failed to refresh Dotloop token');
    }

    const tokens = await response.json() as {
      access_token: string;
      refresh_token: string;
      expires_in: number;
    };

    this.credentials = {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: Date.now() + tokens.expires_in * 1000,
    };

    await integrationModel().update(this.integrationId, this.orgId, {
      credentials_encrypted: encrypt(JSON.stringify(this.credentials)),
    });
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.request('GET', 'profile');
      return { success: true, message: 'Connected to Dotloop' };
    } catch (err) {
      return { success: false, message: (err as Error).message };
    }
  }

  // Profile
  async getProfile() {
    return this.request<any>('GET', 'profile');
  }

  // Loops
  async listLoops(profileId: number, params?: { batchNumber?: number; batchSize?: number; statusIds?: string; complianceStatusIds?: string }) {
    const syncLog = await this.startSyncLog('dotloop:listLoops');
    try {
      const result = await this.request<any>('GET', `profile/${profileId}/loop`, { query: params as any });
      const count = Array.isArray(result) ? result.length : 0;
      await this.completeSyncLog(syncLog.id, count);
      return result;
    } catch (err) {
      await this.failSyncLog(syncLog.id, (err as Error).message);
      throw err;
    }
  }

  async getLoop(profileId: number, loopId: number) {
    return this.request<any>('GET', `profile/${profileId}/loop/${loopId}`);
  }

  async getLoopDetail(profileId: number, loopId: number) {
    return this.request<any>('GET', `profile/${profileId}/loop/${loopId}/detail`);
  }

  // Participants
  async listParticipants(profileId: number, loopId: number) {
    const syncLog = await this.startSyncLog('dotloop:listParticipants');
    try {
      const result = await this.request<any>('GET', `profile/${profileId}/loop/${loopId}/participant`);
      const count = Array.isArray(result) ? result.length : 0;
      await this.completeSyncLog(syncLog.id, count);
      return result;
    } catch (err) {
      await this.failSyncLog(syncLog.id, (err as Error).message);
      throw err;
    }
  }
}
