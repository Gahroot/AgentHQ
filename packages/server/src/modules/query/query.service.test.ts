import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock config
vi.mock('../../config', () => ({
  config: {
    anthropic: {
      apiKey: 'test-key',
      model: 'claude-sonnet-4-20250514',
      maxTokens: 4096,
      maxToolRoundtrips: 10,
      timeoutMs: 60000,
    },
  },
}));

// Mock logger
vi.mock('../../middleware/logger', () => ({
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
  },
}));

// Mock tools
const mockExecuteTool = vi.fn();
vi.mock('./query.tools', () => ({
  toolDefinitions: [
    { name: 'list_agents', description: 'List agents', input_schema: { type: 'object', properties: {}, required: [] } },
  ],
  executeTool: (...args: unknown[]) => mockExecuteTool(...args),
}));

// Mock Anthropic SDK
const mockCreate = vi.fn();

vi.mock('@anthropic-ai/sdk', () => {
  class AuthenticationError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  }
  class RateLimitError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'RateLimitError';
    }
  }
  class APIError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'APIError';
    }
  }

  class Anthropic {
    messages = { create: mockCreate };
    static AuthenticationError = AuthenticationError;
    static RateLimitError = RateLimitError;
    static APIError = APIError;
  }

  return { default: Anthropic };
});

import { queryService } from './query.service';
import { config } from '../../config';

describe('queryService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('answerQuestion', () => {
    it('returns direct answer when no tool calls', async () => {
      mockCreate.mockResolvedValue({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'There are 5 agents online.' }],
      });

      const result = await queryService.answerQuestion('org-1', 'How many agents are online?');

      expect(result.question).toBe('How many agents are online?');
      expect(result.answer).toBe('There are 5 agents online.');
      expect(result.sources).toEqual([]);
      expect(mockCreate).toHaveBeenCalledTimes(1);
    });

    it('handles single tool_use roundtrip then answer', async () => {
      // First call: Claude wants to use a tool
      mockCreate.mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'text', text: 'Let me look that up.' },
          { type: 'tool_use', id: 'call-1', name: 'list_agents', input: { limit: 10 } },
        ],
      });

      // Tool executor returns data
      mockExecuteTool.mockResolvedValueOnce({
        data: [{ id: 'ag-1', name: 'Bot', status: 'online' }],
        sources: [],
      });

      // Second call: Claude synthesizes answer
      mockCreate.mockResolvedValueOnce({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'You have 1 agent online: Bot.' }],
      });

      const result = await queryService.answerQuestion('org-1', 'How many agents are online?');

      expect(result.answer).toBe('You have 1 agent online: Bot.');
      expect(mockCreate).toHaveBeenCalledTimes(2);
      expect(mockExecuteTool).toHaveBeenCalledWith('org-1', 'list_agents', { limit: 10 });
    });

    it('collects sources from tool results', async () => {
      mockCreate.mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 'call-1', name: 'search_posts', input: { query: 'test' } },
        ],
      });

      mockExecuteTool.mockResolvedValueOnce({
        data: [{ id: 'p1', title: 'Test Post' }],
        sources: [{ id: 'p1', type: 'post', title: 'Test Post', content: 'Some content' }],
      });

      mockCreate.mockResolvedValueOnce({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Found 1 post.' }],
      });

      const result = await queryService.answerQuestion('org-1', 'search for test');

      expect(result.sources).toHaveLength(1);
      expect(result.sources[0].id).toBe('p1');
    });

    it('deduplicates sources by id', async () => {
      // Two rounds of tool use returning the same source
      mockCreate.mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 'call-1', name: 'search_posts', input: { query: 'test' } },
        ],
      });

      mockExecuteTool.mockResolvedValueOnce({
        data: [{ id: 'p1' }],
        sources: [{ id: 'p1', type: 'post', title: 'Post' }],
      });

      mockCreate.mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 'call-2', name: 'search_posts', input: { query: 'test again' } },
        ],
      });

      mockExecuteTool.mockResolvedValueOnce({
        data: [{ id: 'p1' }],
        sources: [{ id: 'p1', type: 'post', title: 'Post' }],
      });

      mockCreate.mockResolvedValueOnce({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Done.' }],
      });

      const result = await queryService.answerQuestion('org-1', 'test');

      expect(result.sources).toHaveLength(1);
    });

    it('propagates tool errors as is_error tool_result', async () => {
      mockCreate.mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 'call-1', name: 'list_agents', input: {} },
        ],
      });

      mockExecuteTool.mockRejectedValueOnce(new Error('DB connection lost'));

      mockCreate.mockResolvedValueOnce({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'I encountered an error fetching agents.' }],
      });

      const result = await queryService.answerQuestion('org-1', 'list agents');

      expect(result.answer).toBe('I encountered an error fetching agents.');
      // Verify the second create call included an is_error tool_result
      const secondCall = mockCreate.mock.calls[1];
      const messages = secondCall[0].messages;
      const lastMessage = messages[messages.length - 1];
      expect(lastMessage.content[0].is_error).toBe(true);
      expect(lastMessage.content[0].content).toContain('DB connection lost');
    });

    it('includes context in user message when provided', async () => {
      mockCreate.mockResolvedValue({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Answer' }],
      });

      await queryService.answerQuestion('org-1', 'question', { key: 'value' });

      const firstCall = mockCreate.mock.calls[0];
      const userMessage = firstCall[0].messages[0].content;
      expect(userMessage).toContain('Context:');
      expect(userMessage).toContain('"key":"value"');
    });

    it('handles parallel tool calls', async () => {
      mockCreate.mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 'call-1', name: 'list_agents', input: {} },
          { type: 'tool_use', id: 'call-2', name: 'list_agents', input: { limit: 5 } },
        ],
      });

      mockExecuteTool.mockResolvedValue({ data: [], sources: [] });

      mockCreate.mockResolvedValueOnce({
        stop_reason: 'end_turn',
        content: [{ type: 'text', text: 'Done.' }],
      });

      await queryService.answerQuestion('org-1', 'test');

      expect(mockExecuteTool).toHaveBeenCalledTimes(2);
    });
  });

  describe('error handling', () => {
    it('throws QUERY_UNAVAILABLE when API key is not set', async () => {
      const original = config.anthropic.apiKey;
      (config.anthropic as any).apiKey = '';

      await expect(queryService.answerQuestion('org-1', 'test')).rejects.toMatchObject({
        statusCode: 503,
        code: 'QUERY_UNAVAILABLE',
      });

      (config.anthropic as any).apiKey = original;
    });

    it('throws QUERY_TIMEOUT when max roundtrips exceeded', async () => {
      const original = config.anthropic.maxToolRoundtrips;
      (config.anthropic as any).maxToolRoundtrips = 1;

      // First roundtrip: tool_use
      mockCreate.mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 'call-1', name: 'list_agents', input: {} },
        ],
      });

      mockExecuteTool.mockResolvedValueOnce({ data: [], sources: [] });

      // Second roundtrip: still tool_use (exceeds max)
      mockCreate.mockResolvedValueOnce({
        stop_reason: 'tool_use',
        content: [
          { type: 'tool_use', id: 'call-2', name: 'list_agents', input: {} },
        ],
      });

      mockExecuteTool.mockResolvedValueOnce({ data: [], sources: [] });

      await expect(queryService.answerQuestion('org-1', 'test')).rejects.toMatchObject({
        statusCode: 500,
        code: 'QUERY_TIMEOUT',
      });

      (config.anthropic as any).maxToolRoundtrips = original;
    });

    it('throws QUERY_AUTH_ERROR on AuthenticationError', async () => {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const ErrorClass = Anthropic.AuthenticationError as unknown as new (message: string) => Error;
      mockCreate.mockRejectedValueOnce(new ErrorClass('Invalid key'));

      await expect(queryService.answerQuestion('org-1', 'test')).rejects.toMatchObject({
        statusCode: 503,
        code: 'QUERY_AUTH_ERROR',
      });
    });

    it('throws QUERY_RATE_LIMITED on RateLimitError', async () => {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const ErrorClass = Anthropic.RateLimitError as unknown as new (message: string) => Error;
      mockCreate.mockRejectedValueOnce(new ErrorClass('Rate limited'));

      await expect(queryService.answerQuestion('org-1', 'test')).rejects.toMatchObject({
        statusCode: 429,
        code: 'QUERY_RATE_LIMITED',
      });
    });

    it('throws QUERY_API_ERROR on generic APIError', async () => {
      const Anthropic = (await import('@anthropic-ai/sdk')).default;
      const ErrorClass = Anthropic.APIError as unknown as new (message: string) => Error;
      mockCreate.mockRejectedValueOnce(new ErrorClass('Server error'));

      await expect(queryService.answerQuestion('org-1', 'test')).rejects.toMatchObject({
        statusCode: 502,
        code: 'QUERY_API_ERROR',
      });
    });
  });
});
