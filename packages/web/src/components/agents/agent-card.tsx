'use client';

import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Agent } from '@/types';
import { calculateAgentHealth } from '@/lib/utils/agent-health';
import { formatRelativeTime } from '@/lib/utils/date';
import { Activity, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HealthBadge } from './health-badge';

interface AgentCardProps {
  agent: Agent;
  recentActivityCount?: number;
  activeDayCount?: number;
  className?: string;
  variant?: 'grid' | 'list';
}

const statusConfig = {
  online: { label: 'Online', className: 'bg-green-500/10 text-green-500 border-green-500/20' },
  offline: { label: 'Offline', className: 'bg-gray-500/10 text-gray-400 border-gray-500/20' },
  busy: { label: 'Busy', className: 'bg-amber-500/10 text-amber-500 border-amber-500/20' },
};

export function AgentCard({
  agent,
  recentActivityCount = 0,
  activeDayCount = 0,
  className,
  variant = 'grid',
}: AgentCardProps) {
  const health = calculateAgentHealth(agent, recentActivityCount, activeDayCount);
  const status = statusConfig[agent.status];

  if (variant === 'list') {
    return (
      <Link href={`/agents/${agent.id}`}>
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              {/* Status indicator */}
              <div className={cn(
                'w-3 h-3 rounded-full',
                agent.status === 'online' ? 'bg-green-500' :
                agent.status === 'busy' ? 'bg-amber-500' : 'bg-gray-400'
              )} />

              {/* Agent info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold truncate">{agent.name}</h3>
                  <Badge className={status.className} variant="outline">{status.label}</Badge>
                </div>
                {agent.description && (
                  <p className="text-sm text-muted-foreground truncate mt-1">{agent.description}</p>
                )}
              </div>

              {/* Health */}
              <HealthBadge status={health.status} score={health.score} variant="simple" />

              {/* Last activity */}
              <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                <Clock className="w-3 h-3" />
                {agent.last_heartbeat ? formatRelativeTime(agent.last_heartbeat) : 'Never'}
              </div>

              {/* Capabilities */}
              {agent.capabilities.length > 0 && (
                <div className="flex gap-1">
                  {agent.capabilities.slice(0, 2).map((cap) => (
                    <Badge key={cap} variant="secondary" className="text-xs">
                      {cap}
                    </Badge>
                  ))}
                  {agent.capabilities.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{agent.capabilities.length - 2}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </Link>
    );
  }

  return (
    <Link href={`/agents/${agent.id}`}>
      <Card className={cn('hover:shadow-md transition-all cursor-pointer group', className)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                  {agent.name}
                </h3>
                <div className={cn(
                  'w-2 h-2 rounded-full flex-shrink-0',
                  agent.status === 'online' ? 'bg-green-500 animate-pulse' :
                  agent.status === 'busy' ? 'bg-amber-500' : 'bg-gray-400'
                )} />
              </div>
              {agent.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                  {agent.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Status and Health */}
          <div className="flex items-center justify-between">
            <Badge className={status.className} variant="outline">{status.label}</Badge>
            <HealthBadge status={health.status} score={health.score} variant="simple" />
          </div>

          {/* Last Activity */}
          {agent.last_heartbeat && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="w-3 h-3" />
              <span>Last seen {formatRelativeTime(agent.last_heartbeat)}</span>
            </div>
          )}

          {/* Capabilities */}
          {agent.capabilities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {agent.capabilities.slice(0, 3).map((cap) => (
                <Badge key={cap} variant="secondary" className="text-xs">
                  {cap}
                </Badge>
              ))}
              {agent.capabilities.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{agent.capabilities.length - 3}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
