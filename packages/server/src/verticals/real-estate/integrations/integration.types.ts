export type IntegrationType = 'fub' | 'dotloop' | 'quickbooks';

export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

export interface Integration {
  id: string;
  org_id: string;
  type: IntegrationType;
  status: IntegrationStatus;
  credentials_encrypted: string | null;
  settings: Record<string, any>;
  last_error: string | null;
  last_synced_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface IntegrationSyncLog {
  id: string;
  integration_id: string;
  org_id: string;
  operation: string;
  status: 'started' | 'completed' | 'failed';
  records_synced: number;
  error: string | null;
  metadata: Record<string, any>;
  started_at: Date;
  completed_at: Date | null;
}

export interface FubCredentials {
  apiKey: string;
}

export interface DotloopCredentials {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix timestamp ms
}

export interface QuickBooksCredentials {
  accessToken: string;
  refreshToken: string;
  realmId: string;
  expiresAt: number; // Unix timestamp ms
}

export interface IntegrationResponse<T> {
  success: boolean;
  data?: T;
  error?: { code: string; message: string };
}
