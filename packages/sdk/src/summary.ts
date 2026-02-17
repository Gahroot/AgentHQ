import { ActivityExtractor } from './extractor';
import { ActivityCategory, ActivityRecord, DailySummary } from './types';

export class SummaryGenerator {
  private extractor: ActivityExtractor;
  private agentId: string;
  private agentName: string;
  private allActivities: ActivityRecord[] = [];

  constructor(extractor: ActivityExtractor, agentId: string, agentName: string) {
    this.extractor = extractor;
    this.agentId = agentId;
    this.agentName = agentName;
  }

  /** Move current buffer into the summary accumulator (flushes extractor buffer). */
  accumulate(): void {
    this.allActivities.push(...this.extractor.flush());
  }

  /** Generate a DailySummary from all accumulated + buffered activities. */
  generate(): DailySummary {
    // Include both accumulated and any remaining in the buffer
    const activities = [...this.allActivities, ...this.extractor.peek()];

    const categories = this.countCategories(activities);
    const allTools = new Set<string>();
    const allFiles = new Set<string>();
    let errorCount = 0;

    for (const a of activities) {
      a.metadata.toolsUsed?.forEach(t => allTools.add(t));
      a.metadata.filesChanged?.forEach(f => allFiles.add(f));
      if (a.category === 'error') errorCount++;
    }

    return {
      date: new Date().toISOString().split('T')[0],
      agentId: this.agentId,
      agentName: this.agentName,
      activitiesCount: activities.length,
      categories,
      highlights: this.extractHighlights(activities),
      issues: this.extractIssues(activities),
      learnings: this.extractLearnings(activities),
      metrics: {
        totalActivities: activities.length,
        toolsUsed: [...allTools],
        filesChanged: [...allFiles],
        errorsEncountered: errorCount,
      },
    };
  }

  formatAsPost(summary: DailySummary): string {
    const lines: string[] = [];

    lines.push(`## Daily Summary for ${summary.agentName}`);
    lines.push(`**Date:** ${summary.date}`);
    lines.push(`**Total Activities:** ${summary.activitiesCount}`);
    lines.push('');

    // Category breakdown
    lines.push('### Activity Breakdown');
    for (const [cat, count] of Object.entries(summary.categories)) {
      if (count > 0) {
        lines.push(`- **${cat}:** ${count}`);
      }
    }
    lines.push('');

    // Highlights
    if (summary.highlights.length > 0) {
      lines.push('### Highlights');
      for (const h of summary.highlights) {
        lines.push(`- ${h}`);
      }
      lines.push('');
    }

    // Issues
    if (summary.issues.length > 0) {
      lines.push('### Issues Encountered');
      for (const issue of summary.issues) {
        lines.push(`- ${issue}`);
      }
      lines.push('');
    }

    // Learnings
    if (summary.learnings.length > 0) {
      lines.push('### Learnings');
      for (const l of summary.learnings) {
        lines.push(`- ${l}`);
      }
      lines.push('');
    }

    // Metrics
    lines.push('### Metrics');
    lines.push(`- **Tools Used:** ${summary.metrics.toolsUsed.join(', ') || 'none'}`);
    lines.push(`- **Files Changed:** ${summary.metrics.filesChanged.length}`);
    lines.push(`- **Errors:** ${summary.metrics.errorsEncountered}`);

    return lines.join('\n');
  }

  reset(): void {
    this.allActivities = [];
  }

  private countCategories(activities: ActivityRecord[]): Record<ActivityCategory, number> {
    const counts = {} as Record<ActivityCategory, number>;
    const allCategories: ActivityCategory[] = [
      'code_change', 'communication', 'research', 'deployment',
      'error', 'review', 'testing', 'documentation', 'configuration', 'other',
    ];
    for (const cat of allCategories) {
      counts[cat] = 0;
    }
    for (const a of activities) {
      counts[a.category] = (counts[a.category] || 0) + 1;
    }
    return counts;
  }

  private extractHighlights(activities: ActivityRecord[]): string[] {
    const highlights: string[] = [];
    const nonErrorActivities = activities.filter(a => a.category !== 'error');

    // Group by category and pick top actions
    const categoryGroups = new Map<ActivityCategory, ActivityRecord[]>();
    for (const a of nonErrorActivities) {
      if (!categoryGroups.has(a.category)) {
        categoryGroups.set(a.category, []);
      }
      categoryGroups.get(a.category)!.push(a);
    }

    for (const [category, items] of categoryGroups) {
      if (items.length >= 3) {
        highlights.push(`${items.length} ${category} activities completed`);
      } else {
        for (const item of items) {
          highlights.push(item.summary);
        }
      }
    }

    return highlights.slice(0, 10);
  }

  private extractIssues(activities: ActivityRecord[]): string[] {
    return activities
      .filter(a => a.category === 'error')
      .map(a => a.summary)
      .slice(0, 5);
  }

  private extractLearnings(activities: ActivityRecord[]): string[] {
    const learnings: string[] = [];

    // Extract learnings from activities tagged with 'learning'
    for (const a of activities) {
      if (a.metadata.tags?.includes('learning') && a.details.learning) {
        learnings.push(String(a.details.learning));
      }
    }

    // Auto-detect patterns
    const errorActivities = activities.filter(a => a.category === 'error');
    const fixActivities = activities.filter(a =>
      a.summary.toLowerCase().includes('fix') && a.category === 'code_change',
    );

    if (errorActivities.length > 0 && fixActivities.length > 0) {
      learnings.push(
        `Encountered ${errorActivities.length} error(s) and applied ${fixActivities.length} fix(es)`,
      );
    }

    return learnings.slice(0, 5);
  }
}
