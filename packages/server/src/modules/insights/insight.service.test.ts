import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockCreate = vi.fn();
const mockFindByOrg = vi.fn();
const mockCountByOrg = vi.fn();

vi.mock('./insight.model', () => ({
  insightModel: vi.fn(() => ({
    create: mockCreate,
    findByOrg: mockFindByOrg,
    countByOrg: mockCountByOrg,
  })),
}));

vi.mock('../../utils/id', () => ({
  generateId: vi.fn(() => 'mock-insight-id'),
}));

import { insightService } from './insight.service';

describe('insightService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createInsight', () => {
    it('generates ID and sets defaults (data={}, source_posts=[], confidence=null, reviewed=false)', async () => {
      const mockInsight = { id: 'mock-insight-id', title: 'Insight 1' };
      mockCreate.mockResolvedValue(mockInsight);

      const result = await insightService.createInsight('org-1', {
        type: 'trend',
        title: 'Insight 1',
        content: 'Insight content',
      });

      expect(mockCreate).toHaveBeenCalledWith({
        id: 'mock-insight-id',
        org_id: 'org-1',
        type: 'trend',
        title: 'Insight 1',
        content: 'Insight content',
        data: {},
        source_posts: [],
        source_agents: [],
        confidence: null,
        reviewed: false,
      });
      expect(result).toEqual(mockInsight);
    });

    it('uses provided optional fields', async () => {
      mockCreate.mockResolvedValue({});

      await insightService.createInsight('org-1', {
        type: 'anomaly',
        title: 'Anomaly Detected',
        content: 'Something unusual happened',
        data: { severity: 'high' },
        source_posts: ['post-1', 'post-2'],
        source_agents: ['agent-1'],
        confidence: 0.95,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { severity: 'high' },
          source_posts: ['post-1', 'post-2'],
          source_agents: ['agent-1'],
          confidence: 0.95,
          reviewed: false,
        })
      );
    });

    it('handles confidence of 0 correctly (does not use null)', async () => {
      mockCreate.mockResolvedValue({});

      await insightService.createInsight('org-1', {
        type: 'trend',
        title: 'Test',
        content: 'Content',
        confidence: 0,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          confidence: 0,
        })
      );
    });
  });

  describe('listInsights', () => {
    it('delegates with type filter', async () => {
      const insights = [{ id: 'i1', type: 'trend' }];
      mockFindByOrg.mockResolvedValue(insights);
      mockCountByOrg.mockResolvedValue(1);

      const filters = { type: 'trend' };
      const result = await insightService.listInsights('org-1', filters, 20, 0);

      expect(mockFindByOrg).toHaveBeenCalledWith('org-1', filters, 20, 0);
      expect(mockCountByOrg).toHaveBeenCalledWith('org-1', filters);
      expect(result).toEqual({ insights, total: 1 });
    });

    it('handles empty filters', async () => {
      mockFindByOrg.mockResolvedValue([]);
      mockCountByOrg.mockResolvedValue(0);

      const result = await insightService.listInsights('org-1', {}, 10, 0);

      expect(mockFindByOrg).toHaveBeenCalledWith('org-1', {}, 10, 0);
      expect(result).toEqual({ insights: [], total: 0 });
    });
  });
});
