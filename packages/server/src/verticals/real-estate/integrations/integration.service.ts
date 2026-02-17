import { integrationModel } from './integration.model';
import { Integration, IntegrationType } from './integration.types';
import { FubClient } from './fub/fub.client';
import { DotloopClient } from './dotloop/dotloop.client';
import { QuickBooksClient } from './quickbooks/quickbooks.client';
import { encrypt, decrypt } from '../../../utils/encryption';
import { generateId } from '../../../utils/id';
import { AppError } from '../../../middleware/error-handler';
import { logger } from '../../../middleware/logger';

function stripCredentials(integration: Integration): Omit<Integration, 'credentials_encrypted'> {
  const { credentials_encrypted: _, ...rest } = integration;
  return rest;
}

export const integrationService = {
  async listIntegrations(orgId: string) {
    const integrations = await integrationModel().findByOrg(orgId);
    return integrations.map(stripCredentials);
  },

  async getIntegration(id: string, orgId: string) {
    const integration = await integrationModel().findById(id, orgId);
    if (!integration) {
      throw new AppError(404, 'NOT_FOUND', 'Integration not found');
    }
    return stripCredentials(integration);
  },

  async connectIntegration(
    orgId: string,
    type: IntegrationType,
    credentials: Record<string, any>,
    settings?: Record<string, any>
  ) {
    // Check if integration already exists
    const existing = await integrationModel().findByType(orgId, type);
    const encryptedCreds = encrypt(JSON.stringify(credentials));

    if (existing) {
      const updated = await integrationModel().update(existing.id, orgId, {
        credentials_encrypted: encryptedCreds,
        settings: settings || existing.settings,
        status: 'connected',
        last_error: null,
      });
      return stripCredentials(updated!);
    }

    const integration = await integrationModel().create({
      id: generateId(),
      org_id: orgId,
      type,
      status: 'connected',
      credentials_encrypted: encryptedCreds,
      settings: settings || {},
      last_error: null,
      last_synced_at: null,
    });
    return stripCredentials(integration);
  },

  async disconnectIntegration(id: string, orgId: string) {
    const integration = await integrationModel().findById(id, orgId);
    if (!integration) {
      throw new AppError(404, 'NOT_FOUND', 'Integration not found');
    }
    const updated = await integrationModel().update(id, orgId, {
      status: 'disconnected',
      credentials_encrypted: null,
    });
    return stripCredentials(updated!);
  },

  async deleteIntegration(id: string, orgId: string) {
    const integration = await integrationModel().findById(id, orgId);
    if (!integration) {
      throw new AppError(404, 'NOT_FOUND', 'Integration not found');
    }
    await integrationModel().delete(id, orgId);
  },

  async getClient(orgId: string, type: IntegrationType) {
    const integration = await integrationModel().findByType(orgId, type);
    if (!integration) {
      throw new AppError(404, 'INTEGRATION_NOT_FOUND', `No ${type} integration found`);
    }
    if (integration.status !== 'connected') {
      throw new AppError(400, 'INTEGRATION_NOT_CONNECTED', `${type} integration is not connected`);
    }
    if (!integration.credentials_encrypted) {
      throw new AppError(400, 'INTEGRATION_NO_CREDENTIALS', `${type} integration has no credentials`);
    }

    const credentials = JSON.parse(decrypt(integration.credentials_encrypted));

    switch (type) {
      case 'fub':
        return new FubClient(integration.id, orgId, credentials);
      case 'dotloop':
        return new DotloopClient(integration.id, orgId, credentials);
      case 'quickbooks':
        return new QuickBooksClient(integration.id, orgId, credentials);
      default:
        throw new AppError(400, 'INVALID_INTEGRATION_TYPE', `Unknown integration type: ${type}`);
    }
  },

  async testConnection(orgId: string, type: IntegrationType) {
    const client = await this.getClient(orgId, type);
    const result = await client.testConnection();

    const integration = await integrationModel().findByType(orgId, type);
    if (integration) {
      await integrationModel().update(integration.id, orgId, {
        status: result.success ? 'connected' : 'error',
        last_error: result.success ? null : result.message,
        last_synced_at: result.success ? new Date() : undefined,
      });
    }

    logger.info({ orgId, type, success: result.success }, 'Integration connection test');
    return result;
  },

  async getSyncLogs(integrationId: string, orgId: string, limit: number, offset: number) {
    // Verify the integration belongs to this org
    const integration = await integrationModel().findById(integrationId, orgId);
    if (!integration) {
      throw new AppError(404, 'NOT_FOUND', 'Integration not found');
    }

    const [logs, total] = await Promise.all([
      integrationModel().findSyncLogs(integrationId, orgId, limit, offset),
      integrationModel().countSyncLogs(integrationId, orgId),
    ]);
    return { logs, total };
  },
};
