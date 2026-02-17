import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCreate = vi.fn();
const mockFindByOrg = vi.fn();
const mockFindById = vi.fn();
const mockAddMember = vi.fn();
const mockRemoveMember = vi.fn();

vi.mock('./channel.model', () => ({
  channelModel: vi.fn(() => ({
    create: mockCreate,
    findByOrg: mockFindByOrg,
    findById: mockFindById,
    addMember: mockAddMember,
    removeMember: mockRemoveMember,
  })),
}));

vi.mock('../../utils/id', () => ({
  generateId: vi.fn(() => 'mock-channel-id'),
}));

import { channelService } from './channel.service';

describe('channelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createDefaultChannels', () => {
    it('creates 5 default channels', async () => {
      mockCreate.mockResolvedValue({});

      await channelService.createDefaultChannels('org-1');

      expect(mockCreate).toHaveBeenCalledTimes(5);
    });

    it('creates general, updates, learnings, alerts, and audit channels', async () => {
      mockCreate.mockResolvedValue({});

      await channelService.createDefaultChannels('org-1');

      const channelNames = mockCreate.mock.calls.map((call: any) => call[0].name);
      expect(channelNames).toContain('general');
      expect(channelNames).toContain('updates');
      expect(channelNames).toContain('learnings');
      expect(channelNames).toContain('alerts');
      expect(channelNames).toContain('audit');
    });

    it('sets correct org_id and created_by for each channel', async () => {
      mockCreate.mockResolvedValue({});

      await channelService.createDefaultChannels('org-1');

      mockCreate.mock.calls.forEach((call: any) => {
        expect(call[0].org_id).toBe('org-1');
        expect(call[0].created_by).toBeNull();
        expect(call[0].id).toBe('mock-channel-id');
      });
    });

    it('sets correct types for default channels', async () => {
      mockCreate.mockResolvedValue({});

      await channelService.createDefaultChannels('org-1');

      const typeMap: Record<string, string> = {};
      mockCreate.mock.calls.forEach((call: any) => {
        typeMap[call[0].name] = call[0].type;
      });

      expect(typeMap['general']).toBe('public');
      expect(typeMap['updates']).toBe('public');
      expect(typeMap['learnings']).toBe('public');
      expect(typeMap['alerts']).toBe('system');
      expect(typeMap['audit']).toBe('system');
    });
  });

  describe('createChannel', () => {
    it('generates ID and sets defaults', async () => {
      const mockChannel = { id: 'mock-channel-id', name: 'my-channel' };
      mockCreate.mockResolvedValue(mockChannel);

      const result = await channelService.createChannel('org-1', 'my-channel');

      expect(mockCreate).toHaveBeenCalledWith({
        id: 'mock-channel-id',
        org_id: 'org-1',
        name: 'my-channel',
        description: null,
        type: 'public',
        created_by: null,
      });
      expect(result).toEqual(mockChannel);
    });

    it('passes custom description, type, and createdBy', async () => {
      mockCreate.mockResolvedValue({});

      await channelService.createChannel('org-1', 'dev', 'Dev talk', 'private', 'user-1');

      expect(mockCreate).toHaveBeenCalledWith({
        id: 'mock-channel-id',
        org_id: 'org-1',
        name: 'dev',
        description: 'Dev talk',
        type: 'private',
        created_by: 'user-1',
      });
    });
  });

  describe('joinChannel', () => {
    it('delegates to model.addMember', async () => {
      mockAddMember.mockResolvedValue(undefined);

      await channelService.joinChannel('ch-1', 'user-1', 'user');

      expect(mockAddMember).toHaveBeenCalledWith('ch-1', 'user-1', 'user');
    });
  });

  describe('leaveChannel', () => {
    it('delegates to model.removeMember', async () => {
      mockRemoveMember.mockResolvedValue(true);

      const result = await channelService.leaveChannel('ch-1', 'user-1', 'user');

      expect(mockRemoveMember).toHaveBeenCalledWith('ch-1', 'user-1', 'user');
      expect(result).toBe(true);
    });
  });

  describe('listChannels', () => {
    it('delegates to model.findByOrg', async () => {
      const channels = [{ id: 'ch-1', name: 'general' }];
      mockFindByOrg.mockResolvedValue(channels);

      const result = await channelService.listChannels('org-1');

      expect(mockFindByOrg).toHaveBeenCalledWith('org-1');
      expect(result).toEqual(channels);
    });
  });
});
