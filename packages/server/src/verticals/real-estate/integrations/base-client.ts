import { logger } from '../../../middleware/logger';
import { AppError } from '../../../middleware/error-handler';
import { integrationModel } from './integration.model';

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  headers?: Record<string, string>;
  timeout?: number;
}

const DEFAULT_TIMEOUT = 30000;
const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

export abstract class BaseIntegrationClient {
  protected integrationId: string;
  protected orgId: string;

  constructor(integrationId: string, orgId: string) {
    this.integrationId = integrationId;
    this.orgId = orgId;
  }

  abstract get baseUrl(): string;
  abstract getAuthHeaders(): Record<string, string>;
  abstract testConnection(): Promise<{ success: boolean; message: string }>;

  /** Override in OAuth2 clients to refresh tokens before requests */
  protected async ensureValidToken(): Promise<void> {
    // no-op by default; OAuth2 subclasses override
  }

  protected async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    await this.ensureValidToken();

    const url = new URL(path, this.baseUrl);
    if (options.query) {
      for (const [key, val] of Object.entries(options.query)) {
        if (val !== undefined) url.searchParams.set(key, String(val));
      }
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.getAuthHeaders(),
      ...options.headers,
    };

    const fetchOptions: RequestInit = {
      method,
      headers,
    };

    if (options.body && method !== 'GET') {
      fetchOptions.body = JSON.stringify(options.body);
    }

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const controller = new AbortController();
      const timeout = setTimeout(
        () => controller.abort(),
        options.timeout || DEFAULT_TIMEOUT
      );

      try {
        const response = await fetch(url.toString(), {
          ...fetchOptions,
          signal: controller.signal,
        });

        if (response.status === 429) {
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter
            ? parseInt(retryAfter, 10) * 1000
            : BASE_DELAY * Math.pow(2, attempt);
          logger.warn(
            { url: url.toString(), attempt, delay },
            'Rate limited, retrying'
          );
          await this.sleep(delay);
          continue;
        }

        if (response.status >= 500 && attempt < MAX_RETRIES - 1) {
          const delay = BASE_DELAY * Math.pow(2, attempt);
          logger.warn(
            { url: url.toString(), status: response.status, attempt, delay },
            'Server error, retrying'
          );
          await this.sleep(delay);
          continue;
        }

        if (!response.ok) {
          const errorBody = await response.text();
          throw new AppError(
            response.status,
            'INTEGRATION_ERROR',
            `Integration request failed: ${response.status} ${errorBody.substring(0, 200)}`
          );
        }

        const data = await response.json();
        return data as T;
      } catch (err) {
        if (err instanceof AppError) throw err;
        lastError = err as Error;
        if ((err as Error).name === 'AbortError') {
          throw new AppError(408, 'INTEGRATION_TIMEOUT', 'Integration request timed out');
        }
        if (attempt < MAX_RETRIES - 1) {
          const delay = BASE_DELAY * Math.pow(2, attempt);
          await this.sleep(delay);
          continue;
        }
      } finally {
        clearTimeout(timeout);
      }
    }

    throw new AppError(
      502,
      'INTEGRATION_ERROR',
      `Integration request failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  // Sync log helpers
  protected async startSyncLog(operation: string) {
    return integrationModel().createSyncLog({
      integration_id: this.integrationId,
      org_id: this.orgId,
      operation,
    });
  }

  protected async completeSyncLog(
    logId: string,
    recordsSynced: number,
    metadata?: Record<string, any>
  ) {
    return integrationModel().completeSyncLog(logId, {
      status: 'completed',
      records_synced: recordsSynced,
      metadata,
    });
  }

  protected async failSyncLog(logId: string, error: string) {
    return integrationModel().completeSyncLog(logId, {
      status: 'failed',
      error,
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
