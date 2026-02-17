import { ActivityRecord, ActivityCategory, ActivityExtractorConfig } from './types';

let idCounter = 0;

function generateActivityId(): string {
  const timestamp = Date.now().toString(36);
  const counter = (idCounter++).toString(36).padStart(4, '0');
  return `act_${timestamp}_${counter}`;
}

// Ordered by priority — higher-priority categories first
const CATEGORY_PRIORITY: ActivityCategory[] = [
  'error',
  'testing',
  'code_change',
  'review',
  'deployment',
  'communication',
  'research',
  'documentation',
  'configuration',
  'other',
];

const CATEGORY_PATTERNS: Record<ActivityCategory, RegExp[]> = {
  error: [/error|fail|crash|exception|bug|fix|debug/i],
  testing: [/test|assert|expect|spec|coverage|validate/i],
  code_change: [/edit|write|create|delete|refactor|modify|update.*file/i],
  review: [/review|approve|reject|merge|\bpr\b|pull.?request/i],
  deployment: [/deploy|release|publish|build|push|ship/i],
  communication: [/post|message|send|reply|comment|notify|broadcast/i],
  research: [/search|query|read|fetch|explore|investigate|analyze/i],
  documentation: [/doc|readme|comment|annotate|describe/i],
  configuration: [/config|setup|install|env|setting|migrate/i],
  other: [/.*/],
};

export class ActivityExtractor {
  private buffer: ActivityRecord[] = [];
  private config: Required<ActivityExtractorConfig>;

  constructor(config: ActivityExtractorConfig = {}) {
    this.config = {
      maxBufferSize: config.maxBufferSize ?? 100,
      categories: config.categories ?? (Object.keys(CATEGORY_PATTERNS) as ActivityCategory[]),
    };
  }

  track(action: string, details: Record<string, any> = {}): ActivityRecord {
    const category = this.categorize(action, details);
    const record: ActivityRecord = {
      id: generateActivityId(),
      timestamp: new Date().toISOString(),
      category,
      summary: action,
      details,
      metadata: {
        toolsUsed: details.toolsUsed || (details.tool ? [details.tool] : []),
        filesChanged: details.filesChanged || (details.file ? [details.file] : []),
        duration: details.duration,
        tags: details.tags || [],
      },
    };

    this.buffer.push(record);
    return record;
  }

  trackToolCall(toolName: string, params: Record<string, any>, result?: any): ActivityRecord {
    return this.track(`Tool call: ${toolName}`, {
      tool: toolName,
      params,
      result: result ? { success: true } : undefined,
      toolsUsed: [toolName],
    });
  }

  trackFileChange(filePath: string, changeType: 'create' | 'edit' | 'delete'): ActivityRecord {
    return this.track(`File ${changeType}: ${filePath}`, {
      file: filePath,
      changeType,
      filesChanged: [filePath],
    });
  }

  trackError(error: string, context?: Record<string, any>): ActivityRecord {
    return this.track(`Error: ${error}`, {
      error,
      ...context,
      tags: ['error'],
    });
  }

  private categorize(action: string, details: Record<string, any>): ActivityCategory {
    const text = `${action} ${JSON.stringify(details)}`;

    // Use priority order for matching, filtered to configured categories
    const orderedCategories = CATEGORY_PRIORITY.filter(c => this.config.categories.includes(c));
    for (const category of orderedCategories) {
      if (category === 'other') continue;
      const patterns = CATEGORY_PATTERNS[category];
      if (patterns?.some(p => p.test(text))) {
        return category;
      }
    }

    return 'other';
  }

  flush(): ActivityRecord[] {
    const activities = [...this.buffer];
    this.buffer = [];
    return activities;
  }

  peek(): ActivityRecord[] {
    return [...this.buffer];
  }

  get pendingCount(): number {
    return this.buffer.length;
  }

  get isFull(): boolean {
    return this.buffer.length >= this.config.maxBufferSize;
  }

  getByCategory(category: ActivityCategory): ActivityRecord[] {
    return this.buffer.filter(a => a.category === category);
  }

  getCategoryCounts(): Record<ActivityCategory, number> {
    const counts = {} as Record<ActivityCategory, number>;
    for (const activity of this.buffer) {
      counts[activity.category] = (counts[activity.category] || 0) + 1;
    }
    return counts;
  }
}
