import { promisify } from 'util';
import OAuthClient from 'intuit-oauth';
import QuickBooks from 'node-quickbooks';
import { BaseIntegrationClient } from '../base-client';
import { QuickBooksCredentials } from '../integration.types';
import { integrationModel } from '../integration.model';
import { encrypt } from '../../../../utils/encryption';
import { config } from '../../../../config';
import { logger } from '../../../../middleware/logger';

const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // 5 minutes

export class QuickBooksClient extends BaseIntegrationClient {
  private credentials: QuickBooksCredentials;
  private oauthClient: OAuthClient;
  private qbo: QuickBooks | null = null;

  constructor(integrationId: string, orgId: string, credentials: QuickBooksCredentials) {
    super(integrationId, orgId);
    this.credentials = credentials;
    this.oauthClient = new OAuthClient({
      clientId: config.integrations.quickbooks.clientId,
      clientSecret: config.integrations.quickbooks.clientSecret,
      environment: config.integrations.quickbooks.environment,
    });
  }

  get baseUrl(): string {
    const base = config.integrations.quickbooks.environment === 'sandbox'
      ? 'https://sandbox-quickbooks.api.intuit.com'
      : 'https://quickbooks.api.intuit.com';
    return `${base}/v3/company/${this.credentials.realmId}/`;
  }

  getAuthHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.credentials.accessToken}`,
      Accept: 'application/json',
    };
  }

  protected async ensureValidToken(): Promise<void> {
    if (!this.credentials.expiresAt) return;
    if (Date.now() < this.credentials.expiresAt - TOKEN_REFRESH_BUFFER_MS) return;

    logger.info({ integrationId: this.integrationId }, 'Refreshing QuickBooks token');

    try {
      const response = await this.oauthClient.refreshUsingToken(this.credentials.refreshToken);
      const token = response.getJson();

      this.credentials = {
        ...this.credentials,
        accessToken: token.access_token,
        refreshToken: token.refresh_token,
        expiresAt: Date.now() + token.expires_in * 1000,
      };

      // Reset QBO instance so it's rebuilt with new token
      this.qbo = null;

      await integrationModel().update(this.integrationId, this.orgId, {
        credentials_encrypted: encrypt(JSON.stringify(this.credentials)),
      });
    } catch (err) {
      logger.error({ err }, 'Failed to refresh QuickBooks token');
      await integrationModel().update(this.integrationId, this.orgId, {
        status: 'error',
        last_error: 'Token refresh failed',
      });
      throw new Error('Failed to refresh QuickBooks token');
    }
  }

  private getQBO(): QuickBooks {
    if (!this.qbo) {
      const useSandbox = config.integrations.quickbooks.environment === 'sandbox';
      this.qbo = new QuickBooks(
        config.integrations.quickbooks.clientId,
        config.integrations.quickbooks.clientSecret,
        this.credentials.accessToken,
        false, // no token secret (OAuth2)
        this.credentials.realmId,
        useSandbox,
        false, // debug
        null, // minor version
        '2.0', // OAuth version
        this.credentials.refreshToken
      );
    }
    return this.qbo;
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    await this.ensureValidToken();
    const qbo = this.getQBO();
    const getCompanyInfo = promisify(qbo.getCompanyInfo.bind(qbo));
    try {
      await getCompanyInfo(this.credentials.realmId);
      return { success: true, message: 'Connected to QuickBooks' };
    } catch (err) {
      return { success: false, message: (err as Error).message || 'Connection failed' };
    }
  }

  // Accounts
  async queryAccounts(query?: string) {
    await this.ensureValidToken();
    const qbo = this.getQBO();
    const findAccounts = promisify(qbo.findAccounts.bind(qbo));
    const syncLog = await this.startSyncLog('quickbooks:queryAccounts');
    try {
      const criteria = query ? { fetchAll: true } : {};
      const result = await findAccounts(criteria);
      const items = result?.QueryResponse?.Account || [];
      await this.completeSyncLog(syncLog.id, items.length);
      return result;
    } catch (err) {
      await this.failSyncLog(syncLog.id, (err as Error).message);
      throw err;
    }
  }

  async getAccount(id: string) {
    await this.ensureValidToken();
    const qbo = this.getQBO();
    const getAccount = promisify(qbo.getAccount.bind(qbo));
    return getAccount(id);
  }

  // Invoices
  async queryInvoices(query?: string) {
    await this.ensureValidToken();
    const qbo = this.getQBO();
    const findInvoices = promisify(qbo.findInvoices.bind(qbo));
    const syncLog = await this.startSyncLog('quickbooks:queryInvoices');
    try {
      const criteria = query ? { fetchAll: true } : {};
      const result = await findInvoices(criteria);
      const items = result?.QueryResponse?.Invoice || [];
      await this.completeSyncLog(syncLog.id, items.length);
      return result;
    } catch (err) {
      await this.failSyncLog(syncLog.id, (err as Error).message);
      throw err;
    }
  }

  async getInvoice(id: string) {
    await this.ensureValidToken();
    const qbo = this.getQBO();
    const getInvoice = promisify(qbo.getInvoice.bind(qbo));
    return getInvoice(id);
  }

  // Payments
  async queryPayments(query?: string) {
    await this.ensureValidToken();
    const qbo = this.getQBO();
    const findPayments = promisify(qbo.findPayments.bind(qbo));
    const syncLog = await this.startSyncLog('quickbooks:queryPayments');
    try {
      const criteria = query ? { fetchAll: true } : {};
      const result = await findPayments(criteria);
      const items = result?.QueryResponse?.Payment || [];
      await this.completeSyncLog(syncLog.id, items.length);
      return result;
    } catch (err) {
      await this.failSyncLog(syncLog.id, (err as Error).message);
      throw err;
    }
  }

  async getPayment(id: string) {
    await this.ensureValidToken();
    const qbo = this.getQBO();
    const getPayment = promisify(qbo.getPayment.bind(qbo));
    return getPayment(id);
  }

  // Bills
  async queryBills(query?: string) {
    await this.ensureValidToken();
    const qbo = this.getQBO();
    const findBills = promisify(qbo.findBills.bind(qbo));
    const syncLog = await this.startSyncLog('quickbooks:queryBills');
    try {
      const criteria = query ? { fetchAll: true } : {};
      const result = await findBills(criteria);
      const items = result?.QueryResponse?.Bill || [];
      await this.completeSyncLog(syncLog.id, items.length);
      return result;
    } catch (err) {
      await this.failSyncLog(syncLog.id, (err as Error).message);
      throw err;
    }
  }

  async getBill(id: string) {
    await this.ensureValidToken();
    const qbo = this.getQBO();
    const getBill = promisify(qbo.getBill.bind(qbo));
    return getBill(id);
  }
}
