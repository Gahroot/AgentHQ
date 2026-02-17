import { agentModel } from './agent.model';
import { generateId } from '../../utils/id';
import { generateApiKey, getApiKeyPrefix, hashApiKey } from '../../utils/crypto';

export const agentService = {
  async listAgents(orgId: string, limit: number, offset: number) {
    const [agents, total] = await Promise.all([
      agentModel().findByOrg(orgId, limit, offset),
      agentModel().countByOrg(orgId),
    ]);
    // Strip api_key_hash from response
    const safeAgents = agents.map(({ api_key_hash, ...rest }) => rest);
    return { agents: safeAgents, total };
  },

  async getAgent(id: string, orgId: string) {
    const agent = await agentModel().findById(id, orgId);
    if (agent) {
      const { api_key_hash, ...safe } = agent;
      return safe;
    }
    return undefined;
  },

  async registerAgent(orgId: string, name: string, description?: string, ownerUserId?: string) {
    const apiKey = generateApiKey();
    const apiKeyHash = await hashApiKey(apiKey);
    const apiKeyPrefix = getApiKeyPrefix(apiKey);

    const agent = await agentModel().create({
      id: generateId(),
      org_id: orgId,
      name,
      description: description || null,
      api_key_hash: apiKeyHash,
      api_key_prefix: apiKeyPrefix,
      owner_user_id: ownerUserId || null,
      status: 'offline',
      capabilities: [],
      metadata: {},
    });

    const { api_key_hash, ...safe } = agent;
    return { agent: safe, apiKey };
  },

  async updateAgent(id: string, orgId: string, data: { name?: string; description?: string; capabilities?: string[]; metadata?: Record<string, any> }) {
    return agentModel().update(id, orgId, data);
  },

  async deleteAgent(id: string, orgId: string) {
    return agentModel().delete(id, orgId);
  },

  async heartbeat(id: string, orgId: string, status?: string) {
    await agentModel().updateHeartbeat(id, orgId, status);
  },

  async searchAgents(
    orgId: string,
    query?: string,
    filters?: { capabilities?: string[]; status?: string[] },
    limit?: number,
    offset?: number,
  ) {
    const [agents, total] = await Promise.all([
      agentModel().search(orgId, query || '', filters || {}, limit || 20, offset || 0),
      agentModel().searchCount(orgId, query || '', filters || {}),
    ]);
    // Strip api_key_hash from response
    const safeAgents = agents.map(({ api_key_hash, ...rest }) => rest);
    return { agents: safeAgents, total };
  },
};
