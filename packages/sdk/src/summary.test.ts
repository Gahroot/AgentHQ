import { describe, it, expect, beforeEach } from 'vitest';
import { ActivityExtractor } from './extractor';
import { SummaryGenerator } from './summary';

describe('SummaryGenerator', () => {
  let extractor: ActivityExtractor;
  let generator: SummaryGenerator;

  beforeEach(() => {
    extractor = new ActivityExtractor();
    generator = new SummaryGenerator(extractor, 'agent-001', 'TestAgent');
  });

  describe('generate', () => {
    it('should generate a summary with zero activities', () => {
      const summary = generator.generate();

      expect(summary.agentId).toBe('agent-001');
      expect(summary.agentName).toBe('TestAgent');
      expect(summary.activitiesCount).toBe(0);
      expect(summary.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should count activities by category', () => {
      extractor.track('Edit file app.ts');
      extractor.track('Write file util.ts');
      extractor.track('Error: connection failed');
      extractor.track('Search for docs');

      const summary = generator.generate();

      expect(summary.activitiesCount).toBe(4);
      expect(summary.categories.code_change).toBe(2);
      expect(summary.categories.error).toBe(1);
      expect(summary.categories.research).toBe(1);
    });

    it('should collect tools used across activities', () => {
      extractor.track('Used tool', { toolsUsed: ['hub_post'] });
      extractor.track('Used another tool', { toolsUsed: ['hub_query'] });
      extractor.track('Used same tool', { toolsUsed: ['hub_post'] });

      const summary = generator.generate();

      expect(summary.metrics.toolsUsed).toContain('hub_post');
      expect(summary.metrics.toolsUsed).toContain('hub_query');
      expect(summary.metrics.toolsUsed).toHaveLength(2); // deduped
    });

    it('should collect files changed', () => {
      extractor.trackFileChange('a.ts', 'edit');
      extractor.trackFileChange('b.ts', 'create');
      extractor.trackFileChange('a.ts', 'edit'); // duplicate

      const summary = generator.generate();

      expect(summary.metrics.filesChanged).toContain('a.ts');
      expect(summary.metrics.filesChanged).toContain('b.ts');
      expect(summary.metrics.filesChanged).toHaveLength(2); // deduped
    });

    it('should count errors', () => {
      extractor.trackError('fail 1');
      extractor.trackError('fail 2');

      const summary = generator.generate();

      expect(summary.metrics.errorsEncountered).toBe(2);
    });

    it('should extract issues from error activities', () => {
      extractor.trackError('Connection timeout');
      extractor.trackError('Invalid response');

      const summary = generator.generate();

      expect(summary.issues).toHaveLength(2);
      expect(summary.issues[0]).toContain('Connection timeout');
    });

    it('should extract learnings from tagged activities', () => {
      extractor.track('Discovered pattern', {
        learning: 'Use retry logic for flaky APIs',
        tags: ['learning'],
      });

      const summary = generator.generate();

      expect(summary.learnings).toContain('Use retry logic for flaky APIs');
    });
  });

  describe('accumulate', () => {
    it('should preserve activities across buffer flushes', () => {
      extractor.track('action 1');
      extractor.track('action 2');
      generator.accumulate();
      extractor.flush(); // clears buffer

      extractor.track('action 3');

      const summary = generator.generate();
      // 2 accumulated + 1 in current buffer
      expect(summary.activitiesCount).toBe(3);
    });
  });

  describe('formatAsPost', () => {
    it('should produce markdown content', () => {
      extractor.track('Edit file app.ts');
      extractor.trackError('Build failed');
      extractor.track('Learned something', {
        learning: 'Always run tests first',
        tags: ['learning'],
      });

      const summary = generator.generate();
      const post = generator.formatAsPost(summary);

      expect(post).toContain('## Daily Summary for TestAgent');
      expect(post).toContain('### Activity Breakdown');
      expect(post).toContain('### Issues Encountered');
      expect(post).toContain('### Learnings');
      expect(post).toContain('### Metrics');
    });

    it('should omit empty sections', () => {
      extractor.track('Edit file app.ts');

      const summary = generator.generate();
      const post = generator.formatAsPost(summary);

      expect(post).not.toContain('### Issues Encountered');
    });
  });

  describe('reset', () => {
    it('should clear accumulated activities', () => {
      extractor.track('action 1');
      generator.accumulate(); // flushes buffer into allActivities
      generator.reset();      // clears allActivities

      // Buffer is empty (flushed by accumulate), allActivities cleared by reset
      const summary = generator.generate();
      expect(summary.activitiesCount).toBe(0);
    });
  });
});
