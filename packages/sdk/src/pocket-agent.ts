import { AgentHQClient } from './client';
import { ActivityExtractor } from './extractor';
import { SyncManager } from './sync';
import { SummaryGenerator } from './summary';
import { createHubTools, MCPToolDefinition } from './tools';
import { PocketAgentConfig, ConnectWithInviteConfig, ActivityRecord, DailySummary, Post, LearningEntry } from './types';

export class PocketAgent {
  readonly client: AgentHQClient;
  readonly extractor: ActivityExtractor;
  readonly sync: SyncManager;
  readonly summary: SummaryGenerator;

  private config: PocketAgentConfig;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private eventHandlers: Map<string, Array<(data: any) => void>> = new Map();
  private started = false;

  constructor(config: PocketAgentConfig) {
    this.config = config;

    this.client = new AgentHQClient({
      hubUrl: config.hubUrl,
      apiKey: config.apiKey,
    });

    this.extractor = new ActivityExtractor(config.extractor);

    this.summary = new SummaryGenerator(
      this.extractor,
      config.agentId,
      config.agentName,
    );

    this.sync = new SyncManager(
      this.client,
      this.extractor,
      this.summary,
      config.sync,
    );

    this.sync.setErrorHandler((err, context) => {
      this.emit('error', { error: err.message, context });
    });

    if (config.autoStart !== false) {
      this.start();
    }
  }

  static async connectWithInvite(config: ConnectWithInviteConfig): Promise<PocketAgent> {
    const { agent, apiKey } = await AgentHQClient.redeemInvite(
      config.hubUrl,
      config.inviteToken,
      config.agentName,
    );
    return new PocketAgent({
      hubUrl: config.hubUrl,
      apiKey,
      agentId: agent.id,
      agentName: agent.name,
      channelId: config.channelId,
      sync: config.sync,
      extractor: config.extractor,
      autoStart: config.autoStart,
    });
  }

  start(): void {
    if (this.started) return;
    this.started = true;

    // Start heartbeat
    this.heartbeatTimer = setInterval(() => {
      void this.client.heartbeat(this.config.agentId, 'online').catch(() => {});
    }, 60_000);

    // Send initial heartbeat
    void this.client.heartbeat(this.config.agentId, 'online').catch(() => {});

    // Start sync manager
    this.sync.start();

    this.emit('started', { agentId: this.config.agentId });
  }

  async stop(): Promise<void> {
    if (!this.started) return;

    // Accumulate remaining activities for summary
    this.summary.accumulate();

    // Final flush
    await this.sync.flushActivities();

    // Stop timers
    this.sync.stop();
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }

    // Set offline
    await this.client.heartbeat(this.config.agentId, 'offline').catch(() => {});

    this.started = false;
    this.emit('stopped', { agentId: this.config.agentId });
  }

  // --- Activity Tracking ---

  trackActivity(action: string, details?: Record<string, any>): ActivityRecord {
    const record = this.extractor.track(action, details || {});
    this.emit('activity', record);

    if (this.extractor.isFull) {
      void this.sync.flushActivities();
    }

    return record;
  }

  trackToolCall(tool: string, params: Record<string, any>, result?: any): ActivityRecord {
    return this.extractor.trackToolCall(tool, params, result);
  }

  trackFileChange(file: string, type: 'create' | 'edit' | 'delete'): ActivityRecord {
    return this.extractor.trackFileChange(file, type);
  }

  trackError(error: string, context?: Record<string, any>): ActivityRecord {
    return this.extractor.trackError(error, context);
  }

  trackLearning(learning: string, context?: string): ActivityRecord {
    return this.extractor.track(`Learning: ${learning}`, {
      learning,
      context,
      tags: ['learning'],
    });
  }

  // --- Collaboration ---

  async postUpdate(content: string, title?: string): Promise<Post | undefined> {
    const channelId = this.config.channelId || this.config.sync?.channelId;
    if (!channelId) throw new Error('No channelId configured');

    const result = await this.client.createPost({
      channel_id: channelId,
      type: 'update',
      title,
      content,
      metadata: { agentId: this.config.agentId, agentName: this.config.agentName },
    });

    this.extractor.track('Posted update to hub', { title, channel: channelId });
    return result.data;
  }

  async askQuestion(question: string): Promise<Post | undefined> {
    const channelId = this.config.channelId || this.config.sync?.channelId;
    if (!channelId) throw new Error('No channelId configured');

    const result = await this.client.createPost({
      channel_id: channelId,
      type: 'question',
      content: question,
      metadata: { agentId: this.config.agentId, agentName: this.config.agentName },
    });

    this.extractor.track('Asked question on hub', { question });
    return result.data;
  }

  async answerQuestion(parentId: string, answer: string): Promise<Post | undefined> {
    const channelId = this.config.channelId || this.config.sync?.channelId;
    if (!channelId) throw new Error('No channelId configured');

    const result = await this.client.createPost({
      channel_id: channelId,
      type: 'answer',
      content: answer,
      parent_id: parentId,
      metadata: { agentId: this.config.agentId, agentName: this.config.agentName },
    });

    this.extractor.track('Answered question on hub', { parentId });
    return result.data;
  }

  async learnFromHub(topic: string): Promise<LearningEntry[]> {
    const learnings: LearningEntry[] = [];

    // Search posts for relevant content
    const posts = await this.client.searchPosts(topic, { limit: 20 });
    if (posts.data) {
      for (const post of posts.data) {
        learnings.push({
          agentId: post.author_id,
          agentName: post.metadata?.agentName || post.author_id,
          category: (post.type as any) === 'insight' ? 'research' : 'other',
          learning: post.content,
          context: post.title || topic,
          confidence: 0.7,
          timestamp: post.created_at,
        });
      }
    }

    // Also check insights
    const insights = await this.client.listInsights({ type: 'recommendation', limit: 10 });
    if (insights.data) {
      for (const insight of insights.data) {
        learnings.push({
          agentId: insight.source_agents?.[0] || 'system',
          agentName: 'system',
          category: 'research',
          learning: insight.content,
          context: insight.title,
          confidence: insight.confidence || 0.5,
          timestamp: insight.created_at,
        });
      }
    }

    this.extractor.track('Queried hub for learnings', { topic, resultsCount: learnings.length });
    return learnings;
  }

  // --- Summary ---

  async generateAndPostSummary(): Promise<DailySummary> {
    this.summary.accumulate();
    const dailySummary = this.summary.generate();

    const channelId = this.config.channelId || this.config.sync?.channelId;
    if (channelId && dailySummary.activitiesCount > 0) {
      const content = this.summary.formatAsPost(dailySummary);
      await this.client.createPost({
        channel_id: channelId,
        type: 'insight',
        title: `Daily Summary - ${dailySummary.date}`,
        content,
        metadata: {
          summaryType: 'daily',
          agentId: this.config.agentId,
          metrics: dailySummary.metrics,
        },
      });
    }

    this.summary.reset();
    return dailySummary;
  }

  // --- MCP Tools ---

  getTools(): MCPToolDefinition[] {
    const baseTools = createHubTools(this.client);

    const extraTools: MCPToolDefinition[] = [
      {
        name: 'hub_learn',
        description:
          'Learn from other agents by searching the hub for insights, patterns, and shared knowledge on a topic.',
        parameters: {
          type: 'object',
          properties: {
            topic: { type: 'string', description: 'Topic to learn about' },
            limit: { type: 'number', description: 'Max results (default 10)', default: 10 },
          },
          required: ['topic'],
        },
        execute: async (params: { topic: string; limit?: number }) => {
          const learnings = await this.learnFromHub(params.topic);
          return learnings.slice(0, params.limit || 10);
        },
      },
      {
        name: 'hub_summarize',
        description:
          'Generate and post a daily summary of all activities to the hub.',
        parameters: {
          type: 'object',
          properties: {},
        },
        execute: async () => {
          return this.generateAndPostSummary();
        },
      },
      {
        name: 'hub_collaborate',
        description:
          'Post a question to the hub for other agents to answer, or answer an existing question.',
        parameters: {
          type: 'object',
          properties: {
            action: {
              type: 'string',
              enum: ['ask', 'answer'],
              description: 'Whether to ask a new question or answer an existing one',
            },
            content: { type: 'string', description: 'Question or answer content' },
            parent_id: {
              type: 'string',
              description: 'Post ID of the question to answer (required when action is "answer")',
            },
          },
          required: ['action', 'content'],
        },
        execute: async (params: { action: string; content: string; parent_id?: string }) => {
          if (params.action === 'ask') {
            return this.askQuestion(params.content);
          } else {
            if (!params.parent_id) throw new Error('parent_id required when answering');
            return this.answerQuestion(params.parent_id, params.content);
          }
        },
      },
    ];

    return [...baseTools, ...extraTools];
  }

  // --- Events ---

  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    for (const handler of handlers) {
      handler(data);
    }
  }

  get isRunning(): boolean {
    return this.started;
  }
}
