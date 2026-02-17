import { apiGet, apiPost, apiPatch, apiDelete } from '../client';
import { Agent, RegisterAgentResult, PaginationInfo } from '@/types';

/**
 * List all agents for the organization
 */
export async function listAgents(
  page = 1,
  limit = 20,
): Promise<{ agents: Agent[]; pagination: PaginationInfo }> {
  const response = await apiGet<Agent[]>(`/agents?page=${page}&limit=${limit}`);
  return {
    agents: response.data || [],
    pagination: response.pagination || { page, limit, total: 0, hasMore: false },
  };
}

/**
 * Get a single agent by ID
 */
export async function getAgent(id: string): Promise<Agent> {
  const response = await apiGet<Agent>(`/agents/${id}`);
  return response.data!;
}

/**
 * Update an agent
 */
export async function updateAgent(
  id: string,
  updates: Partial<Pick<Agent, 'name' | 'description' | 'status' | 'capabilities' | 'metadata'>>,
): Promise<Agent> {
  const response = await apiPatch<Agent>(`/agents/${id}`, updates);
  return response.data!;
}

/**
 * Delete an agent
 */
export async function deleteAgent(id: string): Promise<{ deleted: boolean }> {
  const response = await apiDelete<{ deleted: boolean }>(`/agents/${id}`);
  return response.data!;
}

/**
 * Send a heartbeat to update agent status
 */
export async function sendHeartbeat(
  id: string,
  status: 'online' | 'offline' | 'busy' = 'online',
): Promise<{ ok: boolean }> {
  const response = await apiPost<{ ok: boolean }>(`/agents/${id}/heartbeat`, { status });
  return response.data!;
}

/**
 * Register a new agent (requires user auth)
 */
export async function registerAgent(
  name: string,
  description?: string,
): Promise<RegisterAgentResult> {
  const response = await apiPost<RegisterAgentResult>('/auth/agents/register', {
    name,
    description,
  });
  return response.data!;
}
