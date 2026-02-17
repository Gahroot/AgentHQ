import { describe, it, expect, beforeEach, vi } from 'vitest';
import { getDb } from '../config/database';
import { compareApiKey } from '../utils/crypto';

vi.mock('../utils/crypto', () => ({
  compareApiKey: vi.fn(),
}));

import { validateApiKey } from './api-keys';

const mockWhere = vi.fn();
const mockSelect = vi.fn();

const mockDb = vi.fn(() => ({
  where: mockWhere,
}));

vi.mocked(getDb).mockReturnValue(mockDb as any);

describe('validateApiKey', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getDb).mockReturnValue(mockDb as any);
    mockWhere.mockReturnValue({ select: mockSelect });
  });

  it('returns { agentId, orgId } when key is valid', async () => {
    const agents = [
      { id: 'agent-1', org_id: 'org-1', api_key_hash: 'hashed-key' },
    ];
    mockSelect.mockResolvedValue(agents);
    vi.mocked(compareApiKey).mockResolvedValue(true);

    const result = await validateApiKey('ahq_validkey1234');
    expect(result).toEqual({ agentId: 'agent-1', orgId: 'org-1' });
    expect(mockDb).toHaveBeenCalledWith('agents');
    expect(mockWhere).toHaveBeenCalledWith('api_key_prefix', 'ahq_validkey');
    expect(compareApiKey).toHaveBeenCalledWith('ahq_validkey1234', 'hashed-key');
  });

  it('returns null when key does not match any agent hash', async () => {
    const agents = [
      { id: 'agent-1', org_id: 'org-1', api_key_hash: 'hashed-key' },
    ];
    mockSelect.mockResolvedValue(agents);
    vi.mocked(compareApiKey).mockResolvedValue(false);

    const result = await validateApiKey('ahq_wrongkey1234');
    expect(result).toBeNull();
  });

  it('returns null when no agents match the prefix', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await validateApiKey('ahq_unknownkey12');
    expect(result).toBeNull();
  });

  it('returns null for a key without ahq_ prefix (still queries by prefix substring)', async () => {
    mockSelect.mockResolvedValue([]);

    const result = await validateApiKey('not_a_valid_key!');
    expect(result).toBeNull();
  });

  it('checks each agent until a match is found', async () => {
    const agents = [
      { id: 'agent-1', org_id: 'org-1', api_key_hash: 'hash-1' },
      { id: 'agent-2', org_id: 'org-2', api_key_hash: 'hash-2' },
    ];
    mockSelect.mockResolvedValue(agents);
    vi.mocked(compareApiKey)
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);

    const result = await validateApiKey('ahq_somekey12345');
    expect(result).toEqual({ agentId: 'agent-2', orgId: 'org-2' });
    expect(compareApiKey).toHaveBeenCalledTimes(2);
  });
});
