import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { SyncManager } from './sync';
import { ActivityExtractor } from './extractor';
import { SummaryGenerator } from './summary';

function createMockClient() {
  return {
    logActivity: vi.fn().mockResolvedValue({ success: true, data: {} }),
    createPost: vi.fn().mockResolvedValue({ success: true, data: {} }),
    searchPosts: vi.fn().mockResolvedValue({ success: true, data: [] }),
    listInsights: vi.fn().mockResolvedValue({ success: true, data: [] }),
  };
}

describe('SyncManager', () => {
  let client: any;
  let extractor: ActivityExtractor;
  let summaryGen: SummaryGenerator;
  let sync: SyncManager;

  beforeEach(() => {
    client = createMockClient();
    extractor = new ActivityExtractor();
    summaryGen = new SummaryGenerator(extractor, 'agent-1', 'TestAgent');
    sync = new SyncManager(client, extractor, summaryGen, {
      activityInterval: 1000,
      summaryInterval: 5000,
      channelId: 'ch-1',
      retryAttempts: 1, // No retries in tests to avoid timer issues
      retryDelay: 0,
    });
  });

  afterEach(() => {
    sync.stop();
    vi.restoreAllMocks();
  });

  describe('start/stop', () => {
    it('should set isRunning to true on start', () => {
      sync.start();
      expect(sync.getState().isRunning).toBe(true);
    });

    it('should set isRunning to false on stop', () => {
      sync.start();
      sync.stop();
      expect(sync.getState().isRunning).toBe(false);
    });

    it('should not double-start', () => {
      sync.start();
      sync.start(); // no-op
      expect(sync.getState().isRunning).toBe(true);
    });
  });

  describe('flushActivities', () => {
    it('should do nothing when buffer is empty', async () => {
      await sync.flushActivities();
      expect(client.logActivity).not.toHaveBeenCalled();
    });

    it('should log activities and post batch update', async () => {
      extractor.track('Edit file');
      extractor.track('Run tests');

      await sync.flushActivities();

      expect(client.logActivity).toHaveBeenCalledTimes(2);
      expect(client.createPost).toHaveBeenCalledTimes(1);
      expect(extractor.pendingCount).toBe(0);
    });

    it('should update lastActivitySync after success', async () => {
      extractor.track('action');
      await sync.flushActivities();

      const state = sync.getState();
      expect(state.lastActivitySync).toBeTruthy();
    });

    it('should re-buffer activities on error', async () => {
      client.logActivity.mockRejectedValue(new Error('Network error'));

      extractor.track('action');
      await sync.flushActivities();

      // Activities should be re-buffered (track was called again)
      expect(extractor.pendingCount).toBeGreaterThan(0);
    });
  });

  describe('flushSummary', () => {
    it('should not post when no activities', async () => {
      await sync.flushSummary();
      expect(client.createPost).not.toHaveBeenCalled();
    });

    it('should post summary when activities exist', async () => {
      extractor.track('Did something');

      await sync.flushSummary();

      expect(client.createPost).toHaveBeenCalledWith(
        expect.objectContaining({
          channel_id: 'ch-1',
          type: 'insight',
          title: expect.stringContaining('Daily Summary'),
        }),
      );
    });
  });

  describe('getState', () => {
    it('should return current sync state', () => {
      const state = sync.getState();

      expect(state).toEqual({
        lastActivitySync: null,
        lastSummarySync: null,
        pendingActivities: 0,
        syncErrors: 0,
        isRunning: false,
      });
    });

    it('should reflect pending activities from extractor', () => {
      extractor.track('a1');
      extractor.track('a2');

      expect(sync.getState().pendingActivities).toBe(2);
    });
  });

  describe('error handling', () => {
    it('should call error handler on sync failure', async () => {
      const errorHandler = vi.fn();
      sync.setErrorHandler(errorHandler);
      client.logActivity.mockRejectedValue(new Error('fail'));

      extractor.track('action');
      await sync.flushActivities();

      expect(errorHandler).toHaveBeenCalledWith(expect.any(Error), 'flushActivities');
    });

    it('should increment syncErrors on failure', async () => {
      client.logActivity.mockRejectedValue(new Error('fail'));

      extractor.track('action');
      await sync.flushActivities();

      expect(sync.getState().syncErrors).toBe(1);
    });
  });
});
