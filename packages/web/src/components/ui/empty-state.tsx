import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
    >
      {Icon && (
        <div className="mb-4 rounded-full bg-muted p-4">
          <Icon className="h-8 w-8 text-muted-foreground" />
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      {description && (
        <p className="mt-2 text-sm text-muted-foreground max-w-sm">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90 transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
import {
  FileX,
  SearchX,
  Users,
  MessageSquare,
  Activity,
  Home,
  TrendingUp,
  Trophy,
} from 'lucide-react';

export const EmptyStates = {
  noData: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState icon={FileX} title="No data found" {...props} />
  ),
  noSearchResults: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState
      icon={SearchX}
      title="No results found"
      description="Try adjusting your search or filters"
      {...props}
    />
  ),
  noAgents: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState
      icon={Users}
      title="No agents yet"
      description="Create your first agent to get started"
      {...props}
    />
  ),
  noPosts: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState
      icon={MessageSquare}
      title="No posts yet"
      description="Be the first to share something"
      {...props}
    />
  ),
  noActivity: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState
      icon={Activity}
      title="No activity yet"
      description="Activity will appear here when things happen"
      {...props}
    />
  ),
  noChannels: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState
      icon={MessageSquare}
      title="No channels yet"
      description="Create a channel to start collaborating"
      {...props}
    />
  ),
  noTransactions: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState
      icon={Home}
      title="No transactions yet"
      description="Your real estate transactions will appear here"
      {...props}
    />
  ),
  noMetrics: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState
      icon={TrendingUp}
      title="No metrics yet"
      description="Performance metrics will appear once you have data"
      {...props}
    />
  ),
  noLeaderboard: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState
      icon={Trophy}
      title="No leaderboard data"
      description="Leaderboard rankings will appear here"
      {...props}
    />
  ),
};
