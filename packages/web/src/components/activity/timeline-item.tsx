'use client';

import { useState } from 'react';
import { ActivityEntry } from '@/types';
import { formatRelativeTime } from '@/lib/utils/date';
import { Bot, User, Settings, ChevronDown, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelineItemProps {
  entry: ActivityEntry;
  actorName?: string;
  resourceName?: string;
  resourceHref?: string;
}

const actorIcons = {
  agent: Bot,
  user: User,
  system: Settings,
};

const actionLabels: Record<string, string> = {
  created: 'created',
  updated: 'updated',
  deleted: 'deleted',
  logged_in: 'logged in',
  logged_out: 'logged out',
  registered: 'registered',
  posted: 'posted',
  commented: 'commented on',
  liked: 'liked',
  joined: 'joined',
  left: 'left',
};

export function TimelineItem({
  entry,
  actorName,
  resourceName,
  resourceHref,
}: TimelineItemProps) {
  const [expanded, setExpanded] = useState(false);
  const ActorIcon = actorIcons[entry.actor_type] || Settings;

  const actionText = actionLabels[entry.action] || entry.action;
  const hasDetails = Object.keys(entry.details || {}).length > 0;

  return (
    <div className="relative pl-8 pb-6 border-l-2 border-border last:pb-0">
      {/* Timeline dot */}
      <div className={cn(
        'absolute left-[-5px] top-0 w-2.5 h-2.5 rounded-full border-2 border-background',
        entry.actor_type === 'agent' && 'bg-primary',
        entry.actor_type === 'user' && 'bg-secondary',
        entry.actor_type === 'system' && 'bg-muted-foreground'
      )} />

      <div className="space-y-2">
        {/* Actor and action */}
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            entry.actor_type === 'agent' && 'bg-primary/10 text-primary',
            entry.actor_type === 'user' && 'bg-secondary/50 text-secondary-foreground',
            entry.actor_type === 'system' && 'bg-muted text-muted-foreground'
          )}>
            <ActorIcon className="w-4 h-4" />
          </div>

          <div className="flex-1 min-w-0">
            {/* Action description */}
            <p className="text-sm text-foreground">
              <span className="font-medium">{actorName || entry.actor_id}</span>
              {' '}
              <span className="text-muted-foreground">{actionText}</span>
              {resourceName && (
                <>
                  {' '}
                  {resourceHref ? (
                    <a
                      href={resourceHref}
                      className="font-medium text-primary hover:underline"
                    >
                      {resourceName}
                    </a>
                  ) : (
                    <span className="font-medium text-foreground">{resourceName}</span>
                  )}
                </>
              )}
            </p>

            {/* Resource type */}
            {entry.resource_type && !resourceName && (
              <p className="text-xs text-muted-foreground capitalize">
                {entry.resource_type} {entry.resource_id && `(${entry.resource_id.slice(0, 8)}...)`}
              </p>
            )}

            {/* Timestamp */}
            <p className="text-xs text-muted-foreground mt-1">
              {formatRelativeTime(entry.created_at)}
            </p>
          </div>
        </div>

        {/* Expandable details */}
        {hasDetails && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors ml-11"
          >
            {expanded ? (
              <ChevronDown className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            {expanded ? 'Hide' : 'Show'} details
          </button>
        )}

        {expanded && hasDetails && (
          <div className="ml-11 mt-2 p-3 bg-muted/50 rounded-md">
            <pre className="text-xs text-muted-foreground overflow-x-auto">
              {JSON.stringify(entry.details, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
