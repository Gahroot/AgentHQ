import { apiGet, apiPatch } from '../client';

// ============================================================
// Admin Types
// ============================================================

export interface BusinessStats {
  totalAgents: number;
  activeAgents: number;
  totalPosts: number;
  totalChannels: number;
  activeUsers: number;
  period: {
    start: string;
    end: string;
  };
  trends?: {
    agentsChange: number;
    postsChange: number;
    usersChange: number;
  };
}

export interface UsageMetrics {
  apiCalls: {
    current: number;
    limit: number;
    period: string;
  };
  storage: {
    current: number;
    limit: number;
    unit: string;
  };
  agentHours: {
    current: number;
    period: string;
  };
  timeline: {
    date: string;
    apiCalls: number;
    activeAgents: number;
  }[];
}

export interface BillingInfo {
  plan: {
    name: string;
    tier: 'free' | 'pro' | 'enterprise';
    status: 'active' | 'past_due' | 'canceled';
    currentPeriodStart: string;
    currentPeriodEnd: string;
  };
  usage: {
    apiCalls: { used: number; limit: number };
    storage: { used: number; limit: number; unit: string };
    agents: { used: number; limit: number };
  };
  costs?: {
    base: number;
    usage: number;
    total: number;
    currency: string;
  };
  nextInvoice?: {
    date: string;
    amount: number;
    currency: string;
  };
}

export interface OrgSettings {
  id: string;
  name: string;
  slug: string;
  plan: 'free' | 'pro' | 'enterprise';
  memberCount: number;
  createdAt: string;
  settings: Record<string, unknown>;
}

export interface AgentApiKey {
  id: string;
  prefix: string;
  agentId: string;
  agentName: string;
  createdAt: string;
  lastUsed?: string;
}

// ============================================================
// Admin API Functions
// ============================================================

/**
 * Get business statistics for the organization
 * NOTE: Placeholder - backend endpoint to be implemented
 */
export async function getBusinessStats(): Promise<BusinessStats> {
  try {
    const response = await apiGet<BusinessStats>('/admin/stats');
    return response.data!;
  } catch {
    // Return placeholder data until backend is implemented
    return {
      totalAgents: 12,
      activeAgents: 8,
      totalPosts: 245,
      totalChannels: 6,
      activeUsers: 5,
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        end: new Date().toISOString(),
      },
      trends: {
        agentsChange: 20,
        postsChange: 15,
        usersChange: 0,
      },
    };
  }
}

/**
 * Get usage metrics for the organization
 * NOTE: Placeholder - backend endpoint to be implemented
 */
export async function getUsageMetrics(): Promise<UsageMetrics> {
  try {
    const response = await apiGet<UsageMetrics>('/admin/usage');
    return response.data!;
  } catch {
    // Return placeholder data until backend is implemented
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (29 - i));
      return {
        date: date.toISOString().split('T')[0],
        apiCalls: Math.floor(Math.random() * 5000) + 1000,
        activeAgents: Math.floor(Math.random() * 5) + 3,
      };
    });

    return {
      apiCalls: {
        current: 125000,
        limit: 500000,
        period: 'monthly',
      },
      storage: {
        current: 2.4,
        limit: 10,
        unit: 'GB',
      },
      agentHours: {
        current: 340,
        period: 'monthly',
      },
      timeline: days,
    };
  }
}

/**
 * Get billing information for the organization
 * NOTE: Placeholder - backend endpoint to be implemented
 */
export async function getBillingInfo(): Promise<BillingInfo> {
  try {
    const response = await apiGet<BillingInfo>('/admin/billing');
    return response.data!;
  } catch {
    // Return placeholder data until backend is implemented
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      plan: {
        name: 'Pro Plan',
        tier: 'pro',
        status: 'active',
        currentPeriodStart: periodStart.toISOString(),
        currentPeriodEnd: periodEnd.toISOString(),
      },
      usage: {
        apiCalls: { used: 125000, limit: 500000 },
        storage: { used: 2.4, limit: 10, unit: 'GB' },
        agents: { used: 12, limit: 50 },
      },
      costs: {
        base: 49,
        usage: 12,
        total: 61,
        currency: 'USD',
      },
      nextInvoice: {
        date: periodEnd.toISOString(),
        amount: 61,
        currency: 'USD',
      },
    };
  }
}

/**
 * Get organization settings
 * NOTE: Placeholder - backend endpoint to be implemented
 */
export async function getOrgSettings(): Promise<OrgSettings> {
  try {
    const response = await apiGet<OrgSettings>('/admin/org');
    return response.data!;
  } catch {
    // Return placeholder data until backend is implemented
    return {
      id: 'org_123',
      name: 'Acme Corporation',
      slug: 'acme-corp',
      plan: 'pro',
      memberCount: 5,
      createdAt: '2024-01-15T10:00:00Z',
      settings: {},
    };
  }
}

/**
 * Update organization settings
 * NOTE: Placeholder - backend endpoint to be implemented
 */
export async function updateOrgSettings(
  updates: Partial<Pick<OrgSettings, 'name' | 'slug' | 'settings'>>,
): Promise<OrgSettings> {
  const response = await apiPatch<OrgSettings>('/admin/org', updates);
  return response.data!;
}

/**
 * Get all agent API keys for the organization
 * NOTE: Placeholder - backend endpoint to be implemented
 */
export async function getAgentApiKeys(): Promise<AgentApiKey[]> {
  try {
    const response = await apiGet<AgentApiKey[]>('/admin/api-keys');
    return response.data || [];
  } catch {
    // Return placeholder data until backend is implemented
    return [
      {
        id: 'key_1',
        prefix: 'ahq_abc123...',
        agentId: 'agent_1',
        agentName: 'Research Agent',
        createdAt: '2024-01-15T10:00:00Z',
        lastUsed: '2024-02-10T14:30:00Z',
      },
      {
        id: 'key_2',
        prefix: 'ahq_def456...',
        agentId: 'agent_2',
        agentName: 'Data Processor',
        createdAt: '2024-01-20T10:00:00Z',
        lastUsed: '2024-02-15T09:15:00Z',
      },
    ];
  }
}

/**
 * Revoke an agent API key
 * NOTE: Placeholder - backend endpoint to be implemented
 */
export async function revokeAgentApiKey(keyId: string): Promise<{ revoked: boolean }> {
  try {
    const response = await apiGet<{ revoked: boolean }>(`/admin/api-keys/${keyId}/revoke`);
    return response.data!;
  } catch {
    return { revoked: true };
  }
}
