import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCreate = vi.fn();
const mockFindById = vi.fn();
const mockFindByOrg = vi.fn();
const mockCountByOrg = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockUpdateHeartbeat = vi.fn();

vi.mock('./agent.model', () => ({
  agentModel: vi.fn(() => ({
    create: mockCreate,
    findById: mockFindById,
    findByOrg: mockFindByOrg,
    countByOrg: mockCountByOrg,
    update: mockUpdate,
    delete: mockDelete,
    updateHeartbeat: mockUpdateHeartbeat,
  })),
}));

vi.mock('../../utils/id', () => ({
  generateId: vi.fn(() => 'mock-agent-id'),
}));

vi.mock('../../utils/crypto', () => ({
  generateApiKey: vi.fn(() => 'ahq_mock-api-key-value'),
  getApiKeyPrefix: vi.fn(() => 'ahq_mock-api'),
  hashApiKey: vi.fn(async () => 'hashed-api-key'),
}));

import { agentService } from './agent.service';

describe('agentService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('registerAgent', () => {
    it('generates ID, API key, hash and creates agent with status=offline', async () => {
      const createdAgent = {
        id: 'mock-agent-id',
        org_id: 'org-1',
        name: 'TestBot',
        description: null,
        api_key_hash: 'hashed-api-key',
        api_key_prefix: 'ahq_mock-api',
        owner_user_id: null,
        status: 'offline',
        capabilities: [],
        metadata: {},
      };
      mockCreate.mockResolvedValue(createdAgent);

      const result = await agentService.registerAgent('org-1', 'TestBot');

      expect(mockCreate).toHaveBeenCalledWith({
        id: 'mock-agent-id',
        org_id: 'org-1',
        name: 'TestBot',
        description: null,
        api_key_hash: 'hashed-api-key',
        api_key_prefix: 'ahq_mock-api',
        owner_user_id: null,
        status: 'offline',
        capabilities: [],
        metadata: {},
      });

      // Returns agent without api_key_hash but with apiKey
      expect(result.apiKey).toBe('ahq_mock-api-key-value');
      expect(result.agent).not.toHaveProperty('api_key_hash');
      expect(result.agent.id).toBe('mock-agent-id');
      expect(result.agent.name).toBe('TestBot');
    });

    it('passes description and ownerUserId when provided', async () => {
      const createdAgent = {
        id: 'mock-agent-id',
        org_id: 'org-1',
        name: 'Bot',
        description: 'A description',
        api_key_hash: 'hashed-api-key',
        api_key_prefix: 'ahq_mock-api',
        owner_user_id: 'user-1',
        status: 'offline',
        capabilities: [],
        metadata: {},
      };
      mockCreate.mockResolvedValue(createdAgent);

      await agentService.registerAgent('org-1', 'Bot', 'A description', 'user-1');

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'A description',
          owner_user_id: 'user-1',
        })
      );
    });
  });

  describe('listAgents', () => {
    it('strips api_key_hash from results', async () => {
      const agents = [
        { id: 'a1', name: 'Bot1', api_key_hash: 'hash1', status: 'online' },
        { id: 'a2', name: 'Bot2', api_key_hash: 'hash2', status: 'offline' },
      ];
      mockFindByOrg.mockResolvedValue(agents);
      mockCountByOrg.mockResolvedValue(2);

      const result = await agentService.listAgents('org-1', 20, 0);

      expect(result.total).toBe(2);
      expect(result.agents).toHaveLength(2);
      result.agents.forEach((agent: any) => {
        expect(agent).not.toHaveProperty('api_key_hash');
      });
      expect(result.agents[0].name).toBe('Bot1');
    });

    it('delegates to model with correct parameters', async () => {
      mockFindByOrg.mockResolvedValue([]);
      mockCountByOrg.mockResolvedValue(0);

      await agentService.listAgents('org-1', 10, 5);

      expect(mockFindByOrg).toHaveBeenCalledWith('org-1', 10, 5);
      expect(mockCountByOrg).toHaveBeenCalledWith('org-1');
    });
  });

  describe('getAgent', () => {
    it('strips api_key_hash from the result', async () => {
      mockFindById.mockResolvedValue({
        id: 'agent-1',
        name: 'Bot',
        api_key_hash: 'secret-hash',
        status: 'online',
      });

      const result = await agentService.getAgent('agent-1', 'org-1');

      expect(result).not.toHaveProperty('api_key_hash');
      expect(result?.id).toBe('agent-1');
      expect(result?.name).toBe('Bot');
    });

    it('returns undefined when agent not found', async () => {
      mockFindById.mockResolvedValue(undefined);

      const result = await agentService.getAgent('nonexistent', 'org-1');

      expect(result).toBeUndefined();
    });
  });

  describe('heartbeat', () => {
    it('calls model.updateHeartbeat', async () => {
      mockUpdateHeartbeat.mockResolvedValue(undefined);

      await agentService.heartbeat('agent-1', 'org-1', 'online');

      expect(mockUpdateHeartbeat).toHaveBeenCalledWith('agent-1', 'org-1', 'online');
    });

    it('calls model.updateHeartbeat without status', async () => {
      mockUpdateHeartbeat.mockResolvedValue(undefined);

      await agentService.heartbeat('agent-1', 'org-1');

      expect(mockUpdateHeartbeat).toHaveBeenCalledWith('agent-1', 'org-1', undefined);
    });
  });

  describe('deleteAgent', () => {
    it('calls model.delete', async () => {
      mockDelete.mockResolvedValue(true);

      const result = await agentService.deleteAgent('agent-1', 'org-1');

      expect(mockDelete).toHaveBeenCalledWith('agent-1', 'org-1');
      expect(result).toBe(true);
    });
  });
});
