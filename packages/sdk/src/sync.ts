import { AgentHQClient } from './client';
import { ActivityExtractor } from './extractor';
import { SummaryGenerator } from './summary';
import { SyncConfig, SyncState, ActivityRecord } from './types';

export class SyncManager {
  private client: AgentHQClient;
  private extractor: ActivityExtractor;
  private summaryGenerator: SummaryGenerator;
  private config: Required<SyncConfig>;
  private state: SyncState;
  private activityTimer: ReturnType<typeof setInterval> | null = null;
  private summaryTimer: ReturnType<typeof setInterval> | null = null;
  private onError?: (error: Error, context: string) => void;

  constructor(
    client: AgentHQClient,
    extractor: ActivityExtractor,
    summaryGenerator: SummaryGenerator,
    config: SyncConfig = {},
  ) {
    this.client = client;
    this.extractor = extractor;
    this.summaryGenerator = summaryGenerator;
    this.config = {
      activityInterval: config.activityInterval ?? 300_000,
      summaryInterval: config.summaryInterval ?? 86_400_000,
      summaryTime: config.summaryTime ?? '23:00',
      channelId: config.channelId ?? '',
      retryAttempts: config.retryAttempts ?? 3,
      retryDelay: config.retryDelay ?? 5000,
    };
    this.state = {
      lastActivitySync: null,
      lastSummarySync: null,
      pendingActivities: 0,
      syncErrors: 0,
      isRunning: false,
    };
  }

  setErrorHandler(handler: (error: Error, context: string) => void): void {
    this.onError = handler;
  }

  start(): void {
    if (this.state.isRunning) return;
    this.state.isRunning = true;

    this.activityTimer = setInterval(() => {
      void this.flushActivities();
    }, this.config.activityInterval);

    this.summaryTimer = setInterval(() => {
      void this.flushSummary();
    }, this.config.summaryInterval);
  }

  stop(): void {
    if (this.activityTimer) {
      clearInterval(this.activityTimer);
      this.activityTimer = null;
    }
    if (this.summaryTimer) {
      clearInterval(this.summaryTimer);
      this.summaryTimer = null;
    }
    this.state.isRunning = false;
  }

  async flushActivities(): Promise<void> {
    const activities = this.extractor.flush();
    if (activities.length === 0) return;

    this.state.pendingActivities = activities.length;

    try {
      await this.syncActivitiesToHub(activities);
      this.state.lastActivitySync = new Date().toISOString();
      this.state.pendingActivities = 0;
    } catch (err) {
      this.state.syncErrors++;
      this.handleError(err as Error, 'flushActivities');
      // Re-buffer failed activities
      for (const activity of activities) {
        this.extractor.track(activity.summary, activity.details);
      }
    }
  }

  async flushSummary(): Promise<void> {
    try {
      const summary = this.summaryGenerator.generate();
      if (summary.activitiesCount === 0) return;

      const content = this.summaryGenerator.formatAsPost(summary);

      if (this.config.channelId) {
        await this.withRetry(() =>
          this.client.createPost({
            channel_id: this.config.channelId,
            type: 'insight',
            title: `Daily Summary - ${summary.date}`,
            content,
            metadata: {
              summaryType: 'daily',
              activitiesCount: summary.activitiesCount,
              categories: summary.categories,
              metrics: summary.metrics,
            },
          }),
        );
      }

      this.summaryGenerator.reset();
      this.state.lastSummarySync = new Date().toISOString();
    } catch (err) {
      this.state.syncErrors++;
      this.handleError(err as Error, 'flushSummary');
    }
  }

  private async syncActivitiesToHub(activities: ActivityRecord[]): Promise<void> {
    // Log each activity to the audit trail
    for (const activity of activities) {
      await this.withRetry(() =>
        this.client.logActivity({
          action: `${activity.category}:${activity.summary}`,
          resource_type: activity.metadata.filesChanged?.[0] ? 'file' : undefined,
          resource_id: activity.metadata.filesChanged?.[0],
          details: {
            category: activity.category,
            tools: activity.metadata.toolsUsed,
            files: activity.metadata.filesChanged,
            duration: activity.metadata.duration,
          },
        }),
      );
    }

    // Post a batch summary to the channel if configured
    if (this.config.channelId && activities.length > 0) {
      const batchContent = activities
        .map(a => `- [${a.category}] ${a.summary}`)
        .join('\n');

      await this.withRetry(() =>
        this.client.createPost({
          channel_id: this.config.channelId,
          type: 'update',
          title: `Activity Batch (${activities.length} actions)`,
          content: batchContent,
          metadata: { activityCount: activities.length, batchSync: true },
        }),
      );
    }
  }

  private async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error | undefined;
    for (let attempt = 0; attempt < this.config.retryAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err as Error;
        if (attempt < this.config.retryAttempts - 1) {
          await this.delay(this.config.retryDelay * (attempt + 1));
        }
      }
    }
    throw lastError;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private handleError(error: Error, context: string): void {
    if (this.onError) {
      this.onError(error, context);
    }
  }

  getState(): SyncState {
    return {
      ...this.state,
      pendingActivities: this.extractor.pendingCount,
    };
  }
}
