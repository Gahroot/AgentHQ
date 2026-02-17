import { describe, it, expect, beforeEach } from 'vitest';
import { ActivityExtractor } from './extractor';

describe('ActivityExtractor', () => {
  let extractor: ActivityExtractor;

  beforeEach(() => {
    extractor = new ActivityExtractor();
  });

  describe('track', () => {
    it('should create an activity record with correct fields', () => {
      const record = extractor.track('Edited file', { file: 'src/index.ts' });

      expect(record.id).toMatch(/^act_/);
      expect(record.timestamp).toBeTruthy();
      expect(record.summary).toBe('Edited file');
      expect(record.details).toEqual({ file: 'src/index.ts' });
    });

    it('should add record to buffer', () => {
      extractor.track('action 1');
      extractor.track('action 2');

      expect(extractor.pendingCount).toBe(2);
    });

    it('should categorize code changes', () => {
      const record = extractor.track('Edit file src/app.ts');
      expect(record.category).toBe('code_change');
    });

    it('should categorize communication', () => {
      const record = extractor.track('Post message to channel');
      expect(record.category).toBe('communication');
    });

    it('should categorize research', () => {
      const record = extractor.track('Search for API documentation');
      expect(record.category).toBe('research');
    });

    it('should categorize errors', () => {
      const record = extractor.track('Error: connection refused');
      expect(record.category).toBe('error');
    });

    it('should categorize deployment', () => {
      const record = extractor.track('Deploy to production');
      expect(record.category).toBe('deployment');
    });

    it('should categorize testing', () => {
      const record = extractor.track('Run test suite');
      expect(record.category).toBe('testing');
    });

    it('should extract metadata from details', () => {
      const record = extractor.track('Edited', {
        toolsUsed: ['vim'],
        filesChanged: ['a.ts', 'b.ts'],
        duration: 5000,
        tags: ['important'],
      });

      expect(record.metadata.toolsUsed).toEqual(['vim']);
      expect(record.metadata.filesChanged).toEqual(['a.ts', 'b.ts']);
      expect(record.metadata.duration).toBe(5000);
      expect(record.metadata.tags).toEqual(['important']);
    });
  });

  describe('trackToolCall', () => {
    it('should track a tool call with tool name', () => {
      const record = extractor.trackToolCall('hub_post', { content: 'hello' });

      expect(record.summary).toBe('Tool call: hub_post');
      expect(record.metadata.toolsUsed).toContain('hub_post');
    });
  });

  describe('trackFileChange', () => {
    it('should track file creation', () => {
      const record = extractor.trackFileChange('src/new.ts', 'create');

      expect(record.summary).toBe('File create: src/new.ts');
      expect(record.metadata.filesChanged).toContain('src/new.ts');
      expect(record.category).toBe('code_change');
    });
  });

  describe('trackError', () => {
    it('should track errors with error category', () => {
      const record = extractor.trackError('Connection timeout', { host: 'api.example.com' });

      expect(record.category).toBe('error');
      expect(record.metadata.tags).toContain('error');
    });
  });

  describe('flush', () => {
    it('should return all buffered activities and clear buffer', () => {
      extractor.track('action 1');
      extractor.track('action 2');

      const flushed = extractor.flush();

      expect(flushed).toHaveLength(2);
      expect(extractor.pendingCount).toBe(0);
    });

    it('should return empty array when buffer is empty', () => {
      expect(extractor.flush()).toEqual([]);
    });
  });

  describe('peek', () => {
    it('should return activities without clearing buffer', () => {
      extractor.track('action 1');

      const peeked = extractor.peek();

      expect(peeked).toHaveLength(1);
      expect(extractor.pendingCount).toBe(1);
    });
  });

  describe('isFull', () => {
    it('should return true when buffer reaches maxBufferSize', () => {
      const small = new ActivityExtractor({ maxBufferSize: 3 });
      small.track('a1');
      small.track('a2');
      expect(small.isFull).toBe(false);
      small.track('a3');
      expect(small.isFull).toBe(true);
    });
  });

  describe('getCategoryCounts', () => {
    it('should return counts per category', () => {
      extractor.track('Edit file');
      extractor.track('Write file');
      extractor.track('Error: fail');

      const counts = extractor.getCategoryCounts();
      expect(counts.code_change).toBe(2);
      expect(counts.error).toBe(1);
    });
  });

  describe('getByCategory', () => {
    it('should filter activities by category', () => {
      extractor.track('Edit file');
      extractor.track('Error: fail');
      extractor.track('Modify file');

      const codeChanges = extractor.getByCategory('code_change');
      expect(codeChanges).toHaveLength(2);
    });
  });
});
