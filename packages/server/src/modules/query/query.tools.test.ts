import { describe, it, expect, beforeEach, vi } from 'vitest';

// vi.mock factories must not reference top-level variables (hoisted).
// Use vi.hoisted() to declare mocks that can be referenced inside factories.
const mocks = vi.hoisted(() => ({
  searchPosts: vi.fn(),
  listPosts: vi.fn(),
  listAgents: vi.fn(),
  getAgent: vi.fn(),
  queryActivity: vi.fn(),
  listInsights: vi.fn(),
  listChannels: vi.fn(),
  listTransactions: vi.fn(),
  getMetrics: vi.fn(),
  getLeaderboard: vi.fn(),
}));

vi.mock('../posts/post.service', () => ({
  postService: {
    searchPosts: mocks.searchPosts,
    listPosts: mocks.listPosts,
  },
}));

vi.mock('../agents/agent.service', () => ({
  agentService: {
    listAgents: mocks.listAgents,
    getAgent: mocks.getAgent,
  },
}));

vi.mock('../activity/activity.service', () => ({
  activityService: {
    queryActivity: mocks.queryActivity,
  },
}));

vi.mock('../insights/insight.service', () => ({
  insightService: {
    listInsights: mocks.listInsights,
  },
}));

vi.mock('../channels/channel.service', () => ({
  channelService: {
    listChannels: mocks.listChannels,
  },
}));

vi.mock('../../verticals/real-estate/re.service', () => ({
  reService: {
    listTransactions: mocks.listTransactions,
    getMetrics: mocks.getMetrics,
    getLeaderboard: mocks.getLeaderboard,
  },
}));

import { executeTool, toolDefinitions } from './query.tools';

const ORG_ID = 'org-test-1';

describe('query.tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('toolDefinitions', () => {
    it('exports 10 tool definitions', () => {
      expect(toolDefinitions).toHaveLength(10);
    });

    it('each tool has name, description, and input_schema', () => {
      for (const tool of toolDefinitions) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(tool.input_schema).toBeDefined();
      }
    });
  });

  describe('search_posts', () => {
    it('calls postService.searchPosts with clamped limit', async () => {
      const posts = [{ id: 'p1', title: 'Test', content: 'Hello world' }];
      mocks.searchPosts.mockResolvedValue({ posts, total: 1 });

      const result = await executeTool(ORG_ID, 'search_posts', { query: 'hello', limit: 5 });

      expect(mocks.searchPosts).toHaveBeenCalledWith(ORG_ID, 'hello', 5, 0);
      expect(result.data).toEqual(posts);
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0]).toEqual({ id: 'p1', type: 'post', title: 'Test', content: 'Hello world' });
    });

    it('clamps limit to 50', async () => {
      mocks.searchPosts.mockResolvedValue({ posts: [], total: 0 });

      await executeTool(ORG_ID, 'search_posts', { query: 'test', limit: 100 });

      expect(mocks.searchPosts).toHaveBeenCalledWith(ORG_ID, 'test', 50, 0);
    });

    it('defaults limit to 20', async () => {
      mocks.searchPosts.mockResolvedValue({ posts: [], total: 0 });

      await executeTool(ORG_ID, 'search_posts', { query: 'test' });

      expect(mocks.searchPosts).toHaveBeenCalledWith(ORG_ID, 'test', 20, 0);
    });
  });

  describe('list_posts', () => {
    it('passes filters through to postService.listPosts', async () => {
      mocks.listPosts.mockResolvedValue({ posts: [], total: 0 });

      await executeTool(ORG_ID, 'list_posts', { channel_id: 'ch-1', type: 'update', author_id: 'a-1', limit: 10 });

      expect(mocks.listPosts).toHaveBeenCalledWith(ORG_ID, { channel_id: 'ch-1', type: 'update', author_id: 'a-1' }, 10, 0);
    });

    it('handles empty filters', async () => {
      mocks.listPosts.mockResolvedValue({ posts: [], total: 0 });

      await executeTool(ORG_ID, 'list_posts', {});

      expect(mocks.listPosts).toHaveBeenCalledWith(ORG_ID, {}, 20, 0);
    });
  });

  describe('list_agents', () => {
    it('calls agentService.listAgents and returns no sources', async () => {
      const agents = [{ id: 'ag-1', name: 'Bot' }];
      mocks.listAgents.mockResolvedValue({ agents, total: 1 });

      const result = await executeTool(ORG_ID, 'list_agents', { limit: 10 });

      expect(mocks.listAgents).toHaveBeenCalledWith(ORG_ID, 10, 0);
      expect(result.data).toEqual(agents);
      expect(result.sources).toEqual([]);
    });
  });

  describe('get_agent', () => {
    it('calls agentService.getAgent', async () => {
      const agent = { id: 'ag-1', name: 'Bot' };
      mocks.getAgent.mockResolvedValue(agent);

      const result = await executeTool(ORG_ID, 'get_agent', { agent_id: 'ag-1' });

      expect(mocks.getAgent).toHaveBeenCalledWith('ag-1', ORG_ID);
      expect(result.data).toEqual(agent);
    });

    it('returns null when agent not found', async () => {
      mocks.getAgent.mockResolvedValue(undefined);

      const result = await executeTool(ORG_ID, 'get_agent', { agent_id: 'missing' });

      expect(result.data).toBeNull();
    });
  });

  describe('query_activity', () => {
    it('passes time range filters', async () => {
      mocks.queryActivity.mockResolvedValue({ entries: [], total: 0 });

      await executeTool(ORG_ID, 'query_activity', {
        actor_id: 'a-1',
        action: 'post.create',
        from: '2026-01-01',
        to: '2026-02-01',
        limit: 30,
      });

      expect(mocks.queryActivity).toHaveBeenCalledWith(
        ORG_ID,
        { actor_id: 'a-1', action: 'post.create', from: '2026-01-01', to: '2026-02-01' },
        30,
        0
      );
    });
  });

  describe('list_insights', () => {
    it('returns insights with sources', async () => {
      const insights = [{ id: 'i-1', title: 'Trend', content: 'Sales are up', type: 'trend' }];
      mocks.listInsights.mockResolvedValue({ insights, total: 1 });

      const result = await executeTool(ORG_ID, 'list_insights', { type: 'trend' });

      expect(mocks.listInsights).toHaveBeenCalledWith(ORG_ID, { type: 'trend' }, 20, 0);
      expect(result.sources).toHaveLength(1);
      expect(result.sources[0]).toEqual({ id: 'i-1', type: 'insight', title: 'Trend', content: 'Sales are up' });
    });
  });

  describe('list_channels', () => {
    it('calls channelService.listChannels', async () => {
      const channels = [{ id: 'ch-1', name: 'general' }];
      mocks.listChannels.mockResolvedValue(channels);

      const result = await executeTool(ORG_ID, 'list_channels', {});

      expect(mocks.listChannels).toHaveBeenCalledWith(ORG_ID);
      expect(result.data).toEqual(channels);
      expect(result.sources).toEqual([]);
    });
  });

  describe('re_list_transactions', () => {
    it('passes filters through', async () => {
      mocks.listTransactions.mockResolvedValue({ transactions: [], total: 0 });

      await executeTool(ORG_ID, 're_list_transactions', { status: 'closed', type: 'listing' });

      expect(mocks.listTransactions).toHaveBeenCalledWith(ORG_ID, { status: 'closed', type: 'listing' }, 20, 0);
    });
  });

  describe('re_get_metrics', () => {
    it('passes filters through', async () => {
      const metrics = { total_volume: 1000000 };
      mocks.getMetrics.mockResolvedValue(metrics);

      const result = await executeTool(ORG_ID, 're_get_metrics', { agent_id: 'ag-1', period: 'monthly' });

      expect(mocks.getMetrics).toHaveBeenCalledWith(ORG_ID, { agent_id: 'ag-1', period: 'monthly' });
      expect(result.data).toEqual(metrics);
    });
  });

  describe('re_get_leaderboard', () => {
    it('defaults period to monthly and period_start to start of current month', async () => {
      const leaderboard = [{ agent_id: 'ag-1', total_volume: 500000 }];
      mocks.getLeaderboard.mockResolvedValue(leaderboard);

      const result = await executeTool(ORG_ID, 're_get_leaderboard', {});

      expect(mocks.getLeaderboard).toHaveBeenCalledWith(
        ORG_ID,
        'monthly',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      );
      expect(result.data).toEqual(leaderboard);
    });

    it('uses provided period and period_start', async () => {
      mocks.getLeaderboard.mockResolvedValue([]);

      await executeTool(ORG_ID, 're_get_leaderboard', { period: 'weekly', period_start: '2026-02-10' });

      expect(mocks.getLeaderboard).toHaveBeenCalledWith(ORG_ID, 'weekly', '2026-02-10');
    });
  });

  describe('unknown tool', () => {
    it('throws for unknown tool name', async () => {
      await expect(executeTool(ORG_ID, 'nonexistent_tool', {})).rejects.toThrow('Unknown tool: nonexistent_tool');
    });
  });
});
