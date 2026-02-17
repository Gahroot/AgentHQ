import { getDb } from '../config/database';
import { compareApiKey } from '../utils/crypto';

export interface ApiKeyIdentity {
  agentId: string;
  orgId: string;
}

export async function validateApiKey(apiKey: string): Promise<ApiKeyIdentity | null> {
  const prefix = apiKey.substring(0, 12);
  const db = getDb();

  const agents = await db('agents')
    .where('api_key_prefix', prefix)
    .select('id', 'org_id', 'api_key_hash');

  for (const agent of agents) {
    const isValid = await compareApiKey(apiKey, agent.api_key_hash);
    if (isValid) {
      return { agentId: agent.id, orgId: agent.org_id };
    }
  }

  return null;
}
