import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCreate = vi.fn();
const mockFindByOrg = vi.fn();
const mockCountByOrg = vi.fn();

vi.mock('./activity.model', () => ({
  activityModel: vi.fn(() => ({
    create: mockCreate,
    findByOrg: mockFindByOrg,
    countByOrg: mockCountByOrg,
  })),
}));

vi.mock('../../utils/id', () => ({
  generateId: vi.fn(() => 'mock-activity-id'),
}));

import { activityService } from './activity.service';

describe('activityService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('logActivity', () => {
    it('generates ID and sets defaults', async () => {
      const mockEntry = { id: 'mock-activity-id', action: 'login' };
      mockCreate.mockResolvedValue(mockEntry);

      const result = await activityService.logActivity('org-1', {
        actor_id: 'user-1',
        actor_type: 'user',
        action: 'login',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        id: 'mock-activity-id',
        org_id: 'org-1',
        actor_id: 'user-1',
        actor_type: 'user',
        action: 'login',
        resource_type: null,
        resource_id: null,
        details: {},
        ip_address: null,
      });
      expect(result).toEqual(mockEntry);
    });

    it('passes optional fields when provided', async () => {
      mockCreate.mockResolvedValue({});

      await activityService.logActivity('org-1', {
        actor_id: 'agent-1',
        actor_type: 'agent',
        action: 'post.create',
        resource_type: 'post',
        resource_id: 'post-1',
        details: { channel: 'general' },
        ip_address: '192.168.1.1',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          resource_type: 'post',
          resource_id: 'post-1',
          details: { channel: 'general' },
          ip_address: '192.168.1.1',
        })
      );
    });
  });

  describe('queryActivity', () => {
    it('delegates with filters', async () => {
      const entries = [{ id: 'a1', action: 'login' }];
      mockFindByOrg.mockResolvedValue(entries);
      mockCountByOrg.mockResolvedValue(1);

      const filters = { actor_id: 'user-1', action: 'login' };
      const result = await activityService.queryActivity('org-1', filters, 20, 0);

      expect(mockFindByOrg).toHaveBeenCalledWith('org-1', filters, 20, 0);
      expect(mockCountByOrg).toHaveBeenCalledWith('org-1', filters);
      expect(result).toEqual({ entries, total: 1 });
    });

    it('handles empty results', async () => {
      mockFindByOrg.mockResolvedValue([]);
      mockCountByOrg.mockResolvedValue(0);

      const result = await activityService.queryActivity('org-1', {}, 10, 0);

      expect(result).toEqual({ entries: [], total: 0 });
    });

    it('passes date range filters', async () => {
      mockFindByOrg.mockResolvedValue([]);
      mockCountByOrg.mockResolvedValue(0);

      const filters = { from: '2026-01-01', to: '2026-02-01' };
      await activityService.queryActivity('org-1', filters, 10, 0);

      expect(mockFindByOrg).toHaveBeenCalledWith('org-1', filters, 10, 0);
      expect(mockCountByOrg).toHaveBeenCalledWith('org-1', filters);
    });
  });
});
