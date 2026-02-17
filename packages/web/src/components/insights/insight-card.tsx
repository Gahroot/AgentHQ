'use client';

import { Insight, InsightType } from '@/types';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/utils/date';
import { TrendingUp, Zap, AlertTriangle, FileText, BarChart3, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InsightCardProps {
  insight: Insight;
  sourcePostTitles?: Record<string, string>;
  sourceAgentNames?: Record<string, string>;
  showReviewedToggle?: boolean;
  onToggleReviewed?: (id: string) => void;
}

const insightTypeConfig: Record<InsightType, {
  icon: typeof TrendingUp;
  label: string;
  bgClass: string;
  textClass: string;
}> = {
  trend: {
    icon: TrendingUp,
    label: 'Trend',
    bgClass: 'bg-blue-100 dark:bg-blue-900/30',
    textClass: 'text-blue-700 dark:text-blue-300',
  },
  performance: {
    icon: BarChart3,
    label: 'Performance',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
    textClass: 'text-green-700 dark:text-green-300',
  },
  recommendation: {
    icon: Zap,
    label: 'Recommendation',
    bgClass: 'bg-amber-100 dark:bg-amber-900/30',
    textClass: 'text-amber-700 dark:text-amber-300',
  },
  summary: {
    icon: FileText,
    label: 'Summary',
    bgClass: 'bg-purple-100 dark:bg-purple-900/30',
    textClass: 'text-purple-700 dark:text-purple-300',
  },
  anomaly: {
    icon: AlertTriangle,
    label: 'Anomaly',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
    textClass: 'text-red-700 dark:text-red-300',
  },
};

function getConfidenceColor(confidence: number | null): string {
  if (confidence === null) return 'bg-gray-200 dark:bg-gray-700';
  if (confidence >= 80) return 'bg-green-500';
  if (confidence >= 60) return 'bg-amber-500';
  return 'bg-red-500';
}

function getConfidenceLabel(confidence: number | null): string {
  if (confidence === null) return 'Unknown';
  if (confidence >= 80) return 'High';
  if (confidence >= 60) return 'Medium';
  return 'Low';
}

export function InsightCard({
  insight,
  sourcePostTitles = {},
  sourceAgentNames = {},
  showReviewedToggle = false,
  onToggleReviewed,
}: InsightCardProps) {
  const config = insightTypeConfig[insight.type];
  const Icon = config.icon;
  const confidenceColor = getConfidenceColor(insight.confidence);
  const confidenceLabel = getConfidenceLabel(insight.confidence);

  return (
    <div className="bg-card rounded-lg border border-border hover:border-primary/50 hover:shadow-md transition-all duration-200 p-5">
      {/* Header: Type badge, reviewed status, and confidence */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={cn('p-1.5 rounded-md', config.bgClass)}>
            <Icon className={cn('w-4 h-4', config.textClass)} />
          </div>
          <span className={cn('text-xs font-medium capitalize', config.textClass)}>
            {config.label}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Confidence indicator */}
          {insight.confidence !== null && (
            <div className="flex items-center gap-2">
              <div className="w-16 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={cn('h-full transition-all duration-300', confidenceColor)}
                  style={{ width: `${insight.confidence}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {insight.confidence}% {confidenceLabel}
              </span>
            </div>
          )}

          {/* Reviewed status */}
          {insight.reviewed && (
            <div className="flex items-center gap-1 text-green-600 dark:text-green-400" title="Reviewed">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>
      </div>

      {/* Title and content */}
      <Link href={`/insights/${insight.id}`} className="block group">
        <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
          {insight.title}
        </h3>
      </Link>

      <p className="text-muted-foreground text-sm mb-4 line-clamp-3">
        {insight.content}
      </p>

      {/* Sources */}
      {(insight.source_posts.length > 0 || insight.source_agents.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-4">
          {insight.source_agents.slice(0, 3).map((agentId) => (
            <span
              key={agentId}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary"
            >
              {sourceAgentNames[agentId] || agentId.slice(0, 8)}
            </span>
          ))}
          {insight.source_posts.slice(0, 2).map((postId) => (
            <Link
              key={postId}
              href={`/posts/${postId}`}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
            >
              <LinkIcon className="w-3 h-3" />
              {sourcePostTitles[postId] || 'Post'}
            </Link>
          ))}
          {(insight.source_agents.length > 3 || insight.source_posts.length > 2) && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted text-muted-foreground">
              +
              {(insight.source_agents.length > 3 ? insight.source_agents.length - 3 : 0) +
               (insight.source_posts.length > 2 ? insight.source_posts.length - 2 : 0)}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border">
        <span className="text-xs text-muted-foreground">
          {formatRelativeTime(insight.created_at)}
        </span>

        {showReviewedToggle && onToggleReviewed && (
          <button
            onClick={() => onToggleReviewed(insight.id)}
            className={cn(
              'text-xs px-3 py-1 rounded-full transition-colors',
              insight.reviewed
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            {insight.reviewed ? 'Reviewed' : 'Mark Reviewed'}
          </button>
        )}
      </div>
    </div>
  );
}
