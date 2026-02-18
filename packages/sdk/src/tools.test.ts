import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHubTools, MCPToolDefinition } from './tools';

const mockClient = {
  createPost: vi.fn(),
  search: vi.fn(),
  feed: vi.fn(),
  searchPosts: vi.fn(),
  logActivity: vi.fn(),
  listAgents: vi.fn(),
  searchAgents: vi.fn(),
  listChannels: vi.fn(),
  queryActivity: vi.fn(),
  heartbeat: vi.fn(),
  addReaction: vi.fn(),
  listNotifications: vi.fn(),
  createTask: vi.fn(),
  listTasks: vi.fn(),
} as any;

describe('createHubTools', () => {
  let tools: MCPToolDefinition[];

  beforeEach(() => {
    vi.clearAllMocks();
    tools = createHubTools(mockClient);
  });

  // ============================================================
  // Tool definition tests
  // ============================================================

  describe('tool definitions', () => {
    it('returns 13 tools', () => {
      expect(tools).toHaveLength(13);
    });

    it('each tool has name, description, parameters, and execute', () => {
      for (const tool of tools) {
        expect(tool).toHaveProperty('name');
        expect(tool).toHaveProperty('description');
        expect(tool).toHaveProperty('parameters');
        expect(tool).toHaveProperty('execute');
        expect(typeof tool.name).toBe('string');
        expect(typeof tool.description).toBe('string');
        expect(typeof tool.parameters).toBe('object');
        expect(typeof tool.execute).toBe('function');
      }
    });

    it('has correct tool names', () => {
      const names = tools.map((t) => t.name);
      expect(names).toContain('hub_post');
      expect(names).toContain('hub_search');
      expect(names).toContain('hub_feed');
      expect(names).toContain('hub_activity');
      expect(names).toContain('hub_agents');
      expect(names).toContain('hub_find_agents');
      expect(names).toContain('hub_channels');
      expect(names).toContain('hub_activity_query');
      expect(names).toContain('hub_heartbeat');
      expect(names).toContain('hub_react');
      expect(names).toContain('hub_notifications');
      expect(names).toContain('hub_task_create');
      expect(names).toContain('hub_tasks');
    });

    it('tool names are in the expected order', () => {
      expect(tools[0].name).toBe('hub_post');
      expect(tools[1].name).toBe('hub_search');
      expect(tools[2].name).toBe('hub_feed');
      expect(tools[3].name).toBe('hub_activity');
      expect(tools[4].name).toBe('hub_agents');
      expect(tools[5].name).toBe('hub_find_agents');
      expect(tools[6].name).toBe('hub_channels');
      expect(tools[7].name).toBe('hub_activity_query');
      expect(tools[8].name).toBe('hub_heartbeat');
      expect(tools[9].name).toBe('hub_react');
      expect(tools[10].name).toBe('hub_notifications');
      expect(tools[11].name).toBe('hub_task_create');
      expect(tools[12].name).toBe('hub_tasks');
    });

    it('hub_post has required parameters channel_id and content', () => {
      const hubPost = tools.find((t) => t.name === 'hub_post')!;
      expect(hubPost.parameters.required).toContain('channel_id');
      expect(hubPost.parameters.required).toContain('content');
      expect(hubPost.parameters.properties).toHaveProperty('channel_id');
      expect(hubPost.parameters.properties).toHaveProperty('content');
      expect(hubPost.parameters.properties).toHaveProperty('type');
      expect(hubPost.parameters.properties).toHaveProperty('title');
      expect(hubPost.parameters.properties).toHaveProperty('metadata');
    });

    it('hub_search has required parameter q', () => {
      const hubSearch = tools.find((t) => t.name === 'hub_search')!;
      expect(hubSearch.parameters.required).toContain('q');
      expect(hubSearch.parameters.properties).toHaveProperty('q');
      expect(hubSearch.parameters.properties).toHaveProperty('types');
      expect(hubSearch.parameters.properties).toHaveProperty('limit');
    });

    it('hub_feed has optional parameters', () => {
      const hubFeed = tools.find((t) => t.name === 'hub_feed')!;
      expect(hubFeed.parameters.properties).toHaveProperty('since');
      expect(hubFeed.parameters.properties).toHaveProperty('until');
      expect(hubFeed.parameters.properties).toHaveProperty('types');
      expect(hubFeed.parameters.properties).toHaveProperty('actor_id');
      expect(hubFeed.parameters.properties).toHaveProperty('limit');
    });

    it('hub_activity has required parameter action', () => {
      const hubActivity = tools.find((t) => t.name === 'hub_activity')!;
      expect(hubActivity.parameters.required).toContain('action');
      expect(hubActivity.parameters.properties).toHaveProperty('action');
      expect(hubActivity.parameters.properties).toHaveProperty('resource_type');
      expect(hubActivity.parameters.properties).toHaveProperty('resource_id');
      expect(hubActivity.parameters.properties).toHaveProperty('details');
    });

    it('hub_agents has optional limit parameter', () => {
      const hubAgents = tools.find((t) => t.name === 'hub_agents')!;
      expect(hubAgents.parameters.properties).toHaveProperty('limit');
      // No required params
      expect(hubAgents.parameters.required).toBeUndefined();
    });

    it('hub_post type parameter has correct enum values', () => {
      const hubPost = tools.find((t) => t.name === 'hub_post')!;
      const typeParam = hubPost.parameters.properties.type;
      expect(typeParam.enum).toEqual([
        'update',
        'insight',
        'question',
        'answer',
        'alert',
        'metric',
      ]);
    });

    it('all tools have non-empty descriptions', () => {
      for (const tool of tools) {
        expect(tool.description.length).toBeGreaterThan(0);
      }
    });
  });

  // ============================================================
  // Tool execution tests
  // ============================================================

  describe('tool execution', () => {
    describe('hub_post', () => {
      it('calls client.createPost with correct args and returns data', async () => {
        const input = {
          channel_id: 'ch_1',
          content: 'Test post content',
          type: 'update',
          title: 'Test Title',
        };
        const expectedData = { id: 'post_1', ...input };
        mockClient.createPost.mockResolvedValueOnce({
          success: true,
          data: expectedData,
        });

        const tool = tools.find((t) => t.name === 'hub_post')!;
        const result = await tool.execute(input);

        expect(mockClient.createPost).toHaveBeenCalledWith(input);
        expect(result).toEqual(expectedData);
      });

      it('passes metadata through to createPost', async () => {
        const input = {
          channel_id: 'ch_1',
          content: 'With metadata',
          metadata: { priority: 'high' },
        };
        mockClient.createPost.mockResolvedValueOnce({
          success: true,
          data: { id: 'post_2', ...input },
        });

        const tool = tools.find((t) => t.name === 'hub_post')!;
        await tool.execute(input);

        expect(mockClient.createPost).toHaveBeenCalledWith(input);
      });

      it('propagates errors from client.createPost', async () => {
        mockClient.createPost.mockRejectedValueOnce(
          new Error('NOT_FOUND: Channel not found'),
        );

        const tool = tools.find((t) => t.name === 'hub_post')!;
        await expect(
          tool.execute({ channel_id: 'bad', content: 'test' }),
        ).rejects.toThrow('NOT_FOUND: Channel not found');
      });
    });

    describe('hub_search', () => {
      it('calls client.search with correct args and returns data', async () => {
        const expectedData = {
          posts: [{ id: 'post_1', content: 'matching result' }],
          insights: [],
          agents: [],
        };
        mockClient.search.mockResolvedValueOnce({
          success: true,
          data: expectedData,
        });

        const tool = tools.find((t) => t.name === 'hub_search')!;
        const result = await tool.execute({ q: 'market trends' });

        expect(mockClient.search).toHaveBeenCalledWith({
          q: 'market trends',
          types: undefined,
          limit: undefined,
        });
        expect(result).toEqual(expectedData);
      });

      it('passes types and limit parameters', async () => {
        mockClient.search.mockResolvedValueOnce({
          success: true,
          data: { posts: [], insights: [], agents: [] },
        });

        const tool = tools.find((t) => t.name === 'hub_search')!;
        await tool.execute({ q: 'test', types: 'posts,insights', limit: 5 });

        expect(mockClient.search).toHaveBeenCalledWith({
          q: 'test',
          types: 'posts,insights',
          limit: 5,
        });
      });

      it('propagates errors from client.search', async () => {
        mockClient.search.mockRejectedValueOnce(
          new Error('Search failed'),
        );

        const tool = tools.find((t) => t.name === 'hub_search')!;
        await expect(
          tool.execute({ q: 'bad query' }),
        ).rejects.toThrow('Search failed');
      });
    });

    describe('hub_feed', () => {
      it('calls client.feed with correct args and returns data', async () => {
        const expectedData = [
          { resource_type: 'post', resource_id: 'p1', timestamp: '2026-02-17T10:00:00Z', summary: 'New update: test', data: {} },
        ];
        mockClient.feed.mockResolvedValueOnce({
          success: true,
          data: expectedData,
        });

        const tool = tools.find((t) => t.name === 'hub_feed')!;
        const result = await tool.execute({ since: '2026-02-16T00:00:00Z' });

        expect(mockClient.feed).toHaveBeenCalledWith({ since: '2026-02-16T00:00:00Z' });
        expect(result).toEqual(expectedData);
      });

      it('works with no params', async () => {
        mockClient.feed.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const tool = tools.find((t) => t.name === 'hub_feed')!;
        await tool.execute({});

        expect(mockClient.feed).toHaveBeenCalledWith({});
      });

      it('propagates errors from client.feed', async () => {
        mockClient.feed.mockRejectedValueOnce(new Error('Feed failed'));

        const tool = tools.find((t) => t.name === 'hub_feed')!;
        await expect(tool.execute({})).rejects.toThrow('Feed failed');
      });
    });

    describe('hub_activity', () => {
      it('calls client.logActivity with correct args and returns data', async () => {
        const input = {
          action: 'listing.created',
          resource_type: 'listing',
          resource_id: 'lst_001',
          details: { price: 500000 },
        };
        const expectedData = { id: 'act_1', ...input };
        mockClient.logActivity.mockResolvedValueOnce({
          success: true,
          data: expectedData,
        });

        const tool = tools.find((t) => t.name === 'hub_activity')!;
        const result = await tool.execute(input);

        expect(mockClient.logActivity).toHaveBeenCalledWith(input);
        expect(result).toEqual(expectedData);
      });

      it('works with only required action parameter', async () => {
        const input = { action: 'system.check' };
        mockClient.logActivity.mockResolvedValueOnce({
          success: true,
          data: { id: 'act_2', action: 'system.check' },
        });

        const tool = tools.find((t) => t.name === 'hub_activity')!;
        await tool.execute(input);

        expect(mockClient.logActivity).toHaveBeenCalledWith(input);
      });

      it('propagates errors from client.logActivity', async () => {
        mockClient.logActivity.mockRejectedValueOnce(
          new Error('Activity log failed'),
        );

        const tool = tools.find((t) => t.name === 'hub_activity')!;
        await expect(
          tool.execute({ action: 'fail' }),
        ).rejects.toThrow('Activity log failed');
      });
    });

    describe('hub_agents', () => {
      it('calls client.searchAgents with correct args and returns data', async () => {
        const expectedData = [
          { id: 'agent_1', name: 'Agent Alpha', status: 'online' },
          { id: 'agent_2', name: 'Agent Beta', status: 'offline' },
        ];
        mockClient.searchAgents.mockResolvedValueOnce({
          success: true,
          data: expectedData,
        });

        const tool = tools.find((t) => t.name === 'hub_agents')!;
        const result = await tool.execute({});

        expect(mockClient.searchAgents).toHaveBeenCalledWith({
          limit: undefined,
          capabilities: undefined,
          status: undefined,
        });
        expect(result).toEqual(expectedData);
      });

      it('passes limit parameter to searchAgents', async () => {
        mockClient.searchAgents.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const tool = tools.find((t) => t.name === 'hub_agents')!;
        await tool.execute({ limit: 10 });

        expect(mockClient.searchAgents).toHaveBeenCalledWith({
          limit: 10,
          capabilities: undefined,
          status: undefined,
        });
      });

      it('passes capabilities and status to searchAgents', async () => {
        mockClient.searchAgents.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const tool = tools.find((t) => t.name === 'hub_agents')!;
        await tool.execute({
          capabilities: ['web-search', 'code-execution'],
          status: 'online',
        });

        expect(mockClient.searchAgents).toHaveBeenCalledWith({
          limit: undefined,
          capabilities: ['web-search', 'code-execution'],
          status: 'online',
        });
      });

      it('handles undefined params gracefully', async () => {
        mockClient.searchAgents.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const tool = tools.find((t) => t.name === 'hub_agents')!;
        // Simulate calling with undefined (no params)
        await tool.execute(undefined);

        expect(mockClient.searchAgents).toHaveBeenCalledWith({
          limit: undefined,
          capabilities: undefined,
          status: undefined,
        });
      });

      it('propagates errors from client.searchAgents', async () => {
        mockClient.searchAgents.mockRejectedValueOnce(
          new Error('Unauthorized'),
        );

        const tool = tools.find((t) => t.name === 'hub_agents')!;
        await expect(tool.execute({})).rejects.toThrow('Unauthorized');
      });
    });

    describe('hub_find_agents', () => {
      it('calls client.searchAgents with query and returns data', async () => {
        const expectedData = [
          { id: 'agent_1', name: 'Web Search Agent', capabilities: ['web-search'] },
          { id: 'agent_2', name: 'Code Runner', capabilities: ['code-execution'] },
        ];
        mockClient.searchAgents.mockResolvedValueOnce({
          success: true,
          data: expectedData,
        });

        const tool = tools.find((t) => t.name === 'hub_find_agents')!;
        const result = await tool.execute({ query: 'web search' });

        expect(mockClient.searchAgents).toHaveBeenCalledWith({
          q: 'web search',
          capabilities: undefined,
          status: 'online',
          limit: undefined,
        });
        expect(result).toEqual(expectedData);
      });

      it('passes capabilities filter to searchAgents', async () => {
        mockClient.searchAgents.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const tool = tools.find((t) => t.name === 'hub_find_agents')!;
        await tool.execute({
          capabilities: ['web-search', 'file-operations'],
        });

        expect(mockClient.searchAgents).toHaveBeenCalledWith({
          q: undefined,
          capabilities: ['web-search', 'file-operations'],
          status: 'online',
          limit: undefined,
        });
      });

      it('passes status and limit to searchAgents', async () => {
        mockClient.searchAgents.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const tool = tools.find((t) => t.name === 'hub_find_agents')!;
        await tool.execute({
          status: 'busy',
          limit: 5,
        });

        expect(mockClient.searchAgents).toHaveBeenCalledWith({
          q: undefined,
          capabilities: undefined,
          status: 'busy',
          limit: 5,
        });
      });

      it('handles all params together', async () => {
        mockClient.searchAgents.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const tool = tools.find((t) => t.name === 'hub_find_agents')!;
        await tool.execute({
          query: 'data processing',
          capabilities: ['web-search'],
          status: 'offline',
          limit: 10,
        });

        expect(mockClient.searchAgents).toHaveBeenCalledWith({
          q: 'data processing',
          capabilities: ['web-search'],
          status: 'offline',
          limit: 10,
        });
      });

      it('propagates errors from client.searchAgents', async () => {
        mockClient.searchAgents.mockRejectedValueOnce(
          new Error('Search failed'),
        );

        const tool = tools.find((t) => t.name === 'hub_find_agents')!;
        await expect(tool.execute({ query: 'test' })).rejects.toThrow('Search failed');
      });
    });

    describe('hub_channels', () => {
      it('calls client.listChannels and returns data', async () => {
        const expectedData = [
          { id: 'ch_1', name: 'general', type: 'public' },
          { id: 'ch_2', name: 'private', type: 'private' },
        ];
        mockClient.listChannels.mockResolvedValueOnce({
          success: true,
          data: expectedData,
        });

        const tool = tools.find((t) => t.name === 'hub_channels')!;
        const result = await tool.execute({});

        expect(mockClient.listChannels).toHaveBeenCalledWith();
        expect(result).toEqual(expectedData);
      });

      it('propagates errors from client.listChannels', async () => {
        mockClient.listChannels.mockRejectedValueOnce(
          new Error('Failed to fetch channels'),
        );

        const tool = tools.find((t) => t.name === 'hub_channels')!;
        await expect(tool.execute({})).rejects.toThrow('Failed to fetch channels');
      });
    });

    describe('hub_activity_query', () => {
      it('calls client.queryActivity with filters and returns data', async () => {
        const expectedData = [
          { id: 'act_1', action: 'post.created', actor_id: 'agent_1' },
        ];
        mockClient.queryActivity.mockResolvedValueOnce({
          success: true,
          data: expectedData,
        });

        const tool = tools.find((t) => t.name === 'hub_activity_query')!;
        const result = await tool.execute({
          actor_id: 'agent_1',
          action: 'post.created',
          limit: 10,
        });

        expect(mockClient.queryActivity).toHaveBeenCalledWith({
          actor_id: 'agent_1',
          action: 'post.created',
          limit: 10,
        });
        expect(result).toEqual(expectedData);
      });

      it('works with no filters', async () => {
        mockClient.queryActivity.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const tool = tools.find((t) => t.name === 'hub_activity_query')!;
        await tool.execute({});

        expect(mockClient.queryActivity).toHaveBeenCalledWith({
          actor_id: undefined,
          action: undefined,
          from: undefined,
          to: undefined,
          limit: undefined,
        });
      });

      it('propagates errors from client.queryActivity', async () => {
        mockClient.queryActivity.mockRejectedValueOnce(
          new Error('Query failed'),
        );

        const tool = tools.find((t) => t.name === 'hub_activity_query')!;
        await expect(tool.execute({})).rejects.toThrow('Query failed');
      });
    });

    describe('hub_heartbeat', () => {
      it('calls client.heartbeat with agent_id and status', async () => {
        mockClient.heartbeat.mockResolvedValueOnce(undefined);

        const tool = tools.find((t) => t.name === 'hub_heartbeat')!;
        const result = await tool.execute({
          agent_id: 'agent_123',
          status: 'online',
        });

        expect(mockClient.heartbeat).toHaveBeenCalledWith('agent_123', 'online');
        expect(result).toEqual({ success: true, message: 'Heartbeat sent' });
      });

      it('works with default status', async () => {
        mockClient.heartbeat.mockResolvedValueOnce(undefined);

        const tool = tools.find((t) => t.name === 'hub_heartbeat')!;
        await tool.execute({ agent_id: 'agent_123' });

        expect(mockClient.heartbeat).toHaveBeenCalledWith('agent_123', undefined);
      });

      it('propagates errors from client.heartbeat', async () => {
        mockClient.heartbeat.mockRejectedValueOnce(
          new Error('Heartbeat failed'),
        );

        const tool = tools.find((t) => t.name === 'hub_heartbeat')!;
        await expect(
          tool.execute({ agent_id: 'agent_123' }),
        ).rejects.toThrow('Heartbeat failed');
      });
    });
  });
});
