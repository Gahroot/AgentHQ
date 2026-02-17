import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHubTools, MCPToolDefinition } from './tools';

const mockClient = {
  createPost: vi.fn(),
  query: vi.fn(),
  searchPosts: vi.fn(),
  logActivity: vi.fn(),
  listAgents: vi.fn(),
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
    it('returns 5 tools', () => {
      expect(tools).toHaveLength(5);
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
      expect(names).toContain('hub_query');
      expect(names).toContain('hub_search');
      expect(names).toContain('hub_activity');
      expect(names).toContain('hub_agents');
    });

    it('tool names are in the expected order', () => {
      expect(tools[0].name).toBe('hub_post');
      expect(tools[1].name).toBe('hub_query');
      expect(tools[2].name).toBe('hub_search');
      expect(tools[3].name).toBe('hub_activity');
      expect(tools[4].name).toBe('hub_agents');
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

    it('hub_query has required parameter question', () => {
      const hubQuery = tools.find((t) => t.name === 'hub_query')!;
      expect(hubQuery.parameters.required).toContain('question');
      expect(hubQuery.parameters.properties).toHaveProperty('question');
      expect(hubQuery.parameters.properties).toHaveProperty('context');
    });

    it('hub_search has required parameter query', () => {
      const hubSearch = tools.find((t) => t.name === 'hub_search')!;
      expect(hubSearch.parameters.required).toContain('query');
      expect(hubSearch.parameters.properties).toHaveProperty('query');
      expect(hubSearch.parameters.properties).toHaveProperty('limit');
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

    describe('hub_query', () => {
      it('calls client.query with correct args and returns data', async () => {
        const input = {
          question: 'What is the status?',
          context: { scope: 'all' },
        };
        const expectedData = {
          question: input.question,
          answer: 'Everything is fine',
          sources: [],
        };
        mockClient.query.mockResolvedValueOnce({
          success: true,
          data: expectedData,
        });

        const tool = tools.find((t) => t.name === 'hub_query')!;
        const result = await tool.execute(input);

        expect(mockClient.query).toHaveBeenCalledWith(input);
        expect(result).toEqual(expectedData);
      });

      it('works without optional context', async () => {
        const input = { question: 'Simple question' };
        mockClient.query.mockResolvedValueOnce({
          success: true,
          data: { question: input.question, answer: 'Answer', sources: [] },
        });

        const tool = tools.find((t) => t.name === 'hub_query')!;
        await tool.execute(input);

        expect(mockClient.query).toHaveBeenCalledWith(input);
      });

      it('propagates errors from client.query', async () => {
        mockClient.query.mockRejectedValueOnce(new Error('Query failed'));

        const tool = tools.find((t) => t.name === 'hub_query')!;
        await expect(
          tool.execute({ question: 'test' }),
        ).rejects.toThrow('Query failed');
      });
    });

    describe('hub_search', () => {
      it('calls client.searchPosts with correct args and returns data', async () => {
        const expectedData = [
          { id: 'post_1', content: 'matching result' },
        ];
        mockClient.searchPosts.mockResolvedValueOnce({
          success: true,
          data: expectedData,
        });

        const tool = tools.find((t) => t.name === 'hub_search')!;
        const result = await tool.execute({ query: 'market trends' });

        expect(mockClient.searchPosts).toHaveBeenCalledWith('market trends', {
          limit: undefined,
        });
        expect(result).toEqual(expectedData);
      });

      it('passes limit parameter to searchPosts', async () => {
        mockClient.searchPosts.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const tool = tools.find((t) => t.name === 'hub_search')!;
        await tool.execute({ query: 'test', limit: 5 });

        expect(mockClient.searchPosts).toHaveBeenCalledWith('test', {
          limit: 5,
        });
      });

      it('propagates errors from client.searchPosts', async () => {
        mockClient.searchPosts.mockRejectedValueOnce(
          new Error('Search failed'),
        );

        const tool = tools.find((t) => t.name === 'hub_search')!;
        await expect(
          tool.execute({ query: 'bad query' }),
        ).rejects.toThrow('Search failed');
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
      it('calls client.listAgents with correct args and returns data', async () => {
        const expectedData = [
          { id: 'agent_1', name: 'Agent Alpha', status: 'online' },
          { id: 'agent_2', name: 'Agent Beta', status: 'offline' },
        ];
        mockClient.listAgents.mockResolvedValueOnce({
          success: true,
          data: expectedData,
        });

        const tool = tools.find((t) => t.name === 'hub_agents')!;
        const result = await tool.execute({});

        expect(mockClient.listAgents).toHaveBeenCalledWith({
          limit: undefined,
        });
        expect(result).toEqual(expectedData);
      });

      it('passes limit parameter to listAgents', async () => {
        mockClient.listAgents.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const tool = tools.find((t) => t.name === 'hub_agents')!;
        await tool.execute({ limit: 10 });

        expect(mockClient.listAgents).toHaveBeenCalledWith({ limit: 10 });
      });

      it('handles undefined params gracefully', async () => {
        mockClient.listAgents.mockResolvedValueOnce({
          success: true,
          data: [],
        });

        const tool = tools.find((t) => t.name === 'hub_agents')!;
        // Simulate calling with undefined (no params)
        await tool.execute(undefined);

        expect(mockClient.listAgents).toHaveBeenCalledWith({
          limit: undefined,
        });
      });

      it('propagates errors from client.listAgents', async () => {
        mockClient.listAgents.mockRejectedValueOnce(
          new Error('Unauthorized'),
        );

        const tool = tools.find((t) => t.name === 'hub_agents')!;
        await expect(tool.execute({})).rejects.toThrow('Unauthorized');
      });
    });
  });
});
