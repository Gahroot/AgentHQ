import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { PocketAgent } from './pocket-agent';

// Mock the client module with a class constructor
vi.mock('./client', () => {
  const AgentHQClient = vi.fn(function (this: any) {
    this.heartbeat = vi.fn().mockResolvedValue(undefined);
    this.createPost = vi.fn().mockResolvedValue({ success: true, data: { id: 'post-1', content: 'test' } });
    this.searchPosts = vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'p1',
          author_id: 'agent-2',
          author_type: 'agent',
          type: 'insight',
          title: 'Pattern found',
          content: 'Use caching for repeated queries',
          metadata: { agentName: 'OtherAgent' },
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    });
    this.listInsights = vi.fn().mockResolvedValue({
      success: true,
      data: [
        {
          id: 'i1',
          type: 'recommendation',
          title: 'Optimize queries',
          content: 'Add indexes to frequently queried columns',
          source_agents: ['agent-3'],
          confidence: 0.9,
          created_at: '2024-01-01T00:00:00Z',
        },
      ],
    });
    this.logActivity = vi.fn().mockResolvedValue({ success: true, data: {} });
    this.listAgents = vi.fn().mockResolvedValue({ success: true, data: [] });
    this.query = vi.fn().mockResolvedValue({ success: true, data: {} });
  });
  return { AgentHQClient };
});

describe('PocketAgent', () => {
  let agent: PocketAgent;

  beforeEach(() => {
    vi.useFakeTimers();
    agent = new PocketAgent({
      hubUrl: 'http://localhost:3000',
      apiKey: 'ahq_testkey123',
      agentId: 'agent-001',
      agentName: 'TestAgent',
      channelId: 'ch-general',
      autoStart: false,
    });
  });

  afterEach(() => {
    if (agent.isRunning) {
      agent.sync.stop();
    }
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('lifecycle', () => {
    it('should not be running when autoStart is false', () => {
      expect(agent.isRunning).toBe(false);
    });

    it('should start and send initial heartbeat', () => {
      agent.start();

      expect(agent.isRunning).toBe(true);
      expect(agent.client.heartbeat).toHaveBeenCalledWith('agent-001', 'online');
    });

    it('should stop and send offline heartbeat', async () => {
      agent.start();
      await agent.stop();

      expect(agent.isRunning).toBe(false);
      expect(agent.client.heartbeat).toHaveBeenCalledWith('agent-001', 'offline');
    });

    it('should emit started event', () => {
      const handler = vi.fn();
      agent.on('started', handler);

      agent.start();

      expect(handler).toHaveBeenCalledWith({ agentId: 'agent-001' });
    });

    it('should emit stopped event', async () => {
      const handler = vi.fn();
      agent.on('stopped', handler);

      agent.start();
      await agent.stop();

      expect(handler).toHaveBeenCalledWith({ agentId: 'agent-001' });
    });
  });

  describe('activity tracking', () => {
    it('should track activities via extractor', () => {
      const record = agent.trackActivity('Did something', { key: 'value' });

      expect(record.summary).toBe('Did something');
      expect(agent.extractor.pendingCount).toBe(1);
    });

    it('should track tool calls', () => {
      const record = agent.trackToolCall('hub_post', { content: 'hi' });

      expect(record.summary).toContain('hub_post');
    });

    it('should track file changes', () => {
      const record = agent.trackFileChange('src/app.ts', 'edit');

      expect(record.category).toBe('code_change');
    });

    it('should track errors', () => {
      const record = agent.trackError('Something broke');

      expect(record.category).toBe('error');
    });

    it('should track learnings', () => {
      const record = agent.trackLearning('Retry logic works', 'API integration');

      expect(record.summary).toContain('Learning');
      expect(record.details.tags).toContain('learning');
    });

    it('should emit activity events', () => {
      const handler = vi.fn();
      agent.on('activity', handler);

      agent.trackActivity('test action');

      expect(handler).toHaveBeenCalledWith(expect.objectContaining({ summary: 'test action' }));
    });
  });

  describe('collaboration', () => {
    it('should post updates', async () => {
      const post = await agent.postUpdate('Completed feature X', 'Feature Update');

      expect(agent.client.createPost).toHaveBeenCalledWith(
        expect.objectContaining({
          channel_id: 'ch-general',
          type: 'update',
          content: 'Completed feature X',
          title: 'Feature Update',
        }),
      );
      expect(post).toBeDefined();
    });

    it('should ask questions', async () => {
      await agent.askQuestion('How do I handle rate limits?');

      expect(agent.client.createPost).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'question',
          content: 'How do I handle rate limits?',
        }),
      );
    });

    it('should answer questions with parent_id', async () => {
      await agent.answerQuestion('post-123', 'Use exponential backoff');

      expect(agent.client.createPost).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'answer',
          content: 'Use exponential backoff',
          parent_id: 'post-123',
        }),
      );
    });
  });

  describe('learnFromHub', () => {
    it('should return learnings from posts and insights', async () => {
      const learnings = await agent.learnFromHub('caching');

      expect(learnings).toHaveLength(2);
      expect(learnings[0].learning).toContain('caching');
      expect(learnings[1].learning).toContain('indexes');
    });

    it('should track the learn action', async () => {
      await agent.learnFromHub('patterns');

      expect(agent.extractor.pendingCount).toBeGreaterThan(0);
    });
  });

  describe('generateAndPostSummary', () => {
    it('should generate and post summary', async () => {
      agent.trackActivity('Edit file');
      agent.trackActivity('Run tests');

      const summary = await agent.generateAndPostSummary();

      expect(summary.activitiesCount).toBe(2);
      expect(summary.agentName).toBe('TestAgent');
      expect(agent.client.createPost).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'insight',
          title: expect.stringContaining('Daily Summary'),
        }),
      );
    });

    it('should not post when no activities', async () => {
      const summary = await agent.generateAndPostSummary();

      expect(summary.activitiesCount).toBe(0);
      expect(agent.client.createPost).not.toHaveBeenCalled();
    });
  });

  describe('getTools', () => {
    it('should return base tools plus extra tools', () => {
      const tools = agent.getTools();
      const names = tools.map(t => t.name);

      // Base tools
      expect(names).toContain('hub_post');
      expect(names).toContain('hub_query');
      expect(names).toContain('hub_search');
      expect(names).toContain('hub_activity');
      expect(names).toContain('hub_agents');

      // Extra tools
      expect(names).toContain('hub_learn');
      expect(names).toContain('hub_summarize');
      expect(names).toContain('hub_collaborate');
    });

    it('should have 8 tools total', () => {
      expect(agent.getTools()).toHaveLength(8);
    });

    it('hub_learn should execute successfully', async () => {
      const tools = agent.getTools();
      const learnTool = tools.find(t => t.name === 'hub_learn')!;

      const result = await learnTool.execute({ topic: 'testing' });

      expect(Array.isArray(result)).toBe(true);
    });

    it('hub_summarize should execute successfully', async () => {
      agent.trackActivity('test');
      const tools = agent.getTools();
      const summarizeTool = tools.find(t => t.name === 'hub_summarize')!;

      const result = await summarizeTool.execute({});

      expect(result).toHaveProperty('activitiesCount');
    });

    it('hub_collaborate ask should execute successfully', async () => {
      const tools = agent.getTools();
      const collabTool = tools.find(t => t.name === 'hub_collaborate')!;

      await collabTool.execute({ action: 'ask', content: 'How to test?' });

      expect(agent.client.createPost).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'question' }),
      );
    });

    it('hub_collaborate answer should require parent_id', async () => {
      const tools = agent.getTools();
      const collabTool = tools.find(t => t.name === 'hub_collaborate')!;

      await expect(
        collabTool.execute({ action: 'answer', content: 'response' }),
      ).rejects.toThrow('parent_id required');
    });
  });

  describe('events', () => {
    it('should support on/off for events', () => {
      const handler = vi.fn();
      agent.on('activity', handler);

      agent.trackActivity('test');
      expect(handler).toHaveBeenCalledTimes(1);

      agent.off('activity', handler);
      agent.trackActivity('test2');
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
