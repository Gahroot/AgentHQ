import type { Agent } from '@/types';

export type AgentHealthStatus = 'thriving' | 'healthy' | 'struggling' | 'offline' | 'stale';

export interface AgentHealthResult {
  status: AgentHealthStatus;
  score: number;
  factors: {
    heartbeat: number;
    activity: number;
    consistency: number;
  };
}

const HEARTBEAT_OFFLINE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const ACTIVITY_STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours
const TARGET_WEEKLY_ACTIVITY = 10; // activities in 7 days
const TARGET_ACTIVE_DAYS = 5; // days with activity in 7 day period

/**
 * Calculate agent health based on heartbeat, activity, and consistency
 */
export function calculateAgentHealth(
  agent: Agent,
  recentActivityCount: number,
  activeDays: number = 1
): AgentHealthResult {
  // Check for manual override first
  const manualOverride = agent.metadata?.healthStatus as AgentHealthStatus | undefined;
  if (manualOverride) {
    return {
      status: manualOverride,
      score: getStatusScore(manualOverride),
      factors: { heartbeat: 0, activity: 0, consistency: 0 },
    };
  }

  const now = Date.now();
  const lastHeartbeat = agent.last_heartbeat ? new Date(agent.last_heartbeat).getTime() : 0;
  const timeSinceHeartbeat = now - lastHeartbeat;

  // Check offline status (no heartbeat within 5 minutes)
  if (!lastHeartbeat || timeSinceHeartbeat > HEARTBEAT_OFFLINE_THRESHOLD) {
    return {
      status: 'offline',
      score: 0,
      factors: { heartbeat: 0, activity: 0, consistency: 0 },
    };
  }

  // Check stale status (no activity within 24 hours)
  const lastActivity = agent.updated_at ? new Date(agent.updated_at).getTime() : 0;
  const timeSinceActivity = now - lastActivity;
  if (timeSinceActivity > ACTIVITY_STALE_THRESHOLD) {
    return {
      status: 'stale',
      score: 20,
      factors: { heartbeat: 30, activity: 0, consistency: 0 },
    };
  }

  // Calculate individual scores (0-100)
  let heartbeatScore = 30;
  if (timeSinceHeartbeat < 60000) heartbeatScore = 30;
  else if (timeSinceHeartbeat < 180000) heartbeatScore = 25;
  else if (timeSinceHeartbeat < 300000) heartbeatScore = 20;
  else heartbeatScore = 10;

  const activityScore = Math.min((recentActivityCount / TARGET_WEEKLY_ACTIVITY) * 50, 50);
  const consistencyScore = Math.min((activeDays / TARGET_ACTIVE_DAYS) * 20, 20);

  const totalScore = heartbeatScore + activityScore + consistencyScore;

  let status: AgentHealthStatus;
  if (totalScore >= 80) status = 'thriving';
  else if (totalScore >= 50) status = 'healthy';
  else status = 'struggling';

  return {
    status,
    score: Math.round(totalScore),
    factors: {
      heartbeat: Math.round(heartbeatScore),
      activity: Math.round(activityScore),
      consistency: Math.round(consistencyScore),
    },
  };
}

function getStatusScore(status: AgentHealthStatus): number {
  switch (status) {
    case 'thriving': return 90;
    case 'healthy': return 65;
    case 'struggling': return 35;
    case 'stale': return 20;
    case 'offline': return 0;
  }
}

export function getHealthStatusColor(status: AgentHealthStatus): string {
  switch (status) {
    case 'thriving': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'healthy': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    case 'struggling': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
    case 'stale': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    case 'offline': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
  }
}

export function getHealthStatusLabel(status: AgentHealthStatus): string {
  const labels: Record<AgentHealthStatus, string> = {
    thriving: 'Thriving',
    healthy: 'Healthy',
    struggling: 'Struggling',
    stale: 'Stale',
    offline: 'Offline',
  };
  return labels[status];
}

export function getAgentStatusColor(status: 'online' | 'offline' | 'busy'): string {
  switch (status) {
    case 'online': return 'bg-green-500';
    case 'busy': return 'bg-yellow-500';
    case 'offline': return 'bg-gray-400';
  }
}

/**
 * Get text color class for health status
 */
export function getHealthColorClass(status: AgentHealthStatus): string {
  switch (status) {
    case 'thriving':
      return 'text-green-500';
    case 'healthy':
      return 'text-emerald-500';
    case 'struggling':
      return 'text-amber-500';
    case 'stale':
      return 'text-yellow-600';
    case 'offline':
      return 'text-gray-400';
    default:
      return 'text-gray-400';
  }
}

/**
 * Get background color class for health status badge
 */
export function getHealthBadgeClass(status: AgentHealthStatus): string {
  switch (status) {
    case 'thriving':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'healthy':
      return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'struggling':
      return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'stale':
      return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
    case 'offline':
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

/**
 * Get health status icon name (lucide-react)
 */
export function getHealthIcon(status: AgentHealthStatus): string {
  switch (status) {
    case 'thriving':
      return 'Sparkles';
    case 'healthy':
      return 'Heart';
    case 'struggling':
      return 'AlertTriangle';
    case 'stale':
      return 'Clock';
    case 'offline':
      return 'XCircle';
    default:
      return 'HelpCircle';
  }
}

/**
 * Get health status description
 */
export function getHealthDescription(status: AgentHealthStatus): string {
  switch (status) {
    case 'thriving':
      return 'Agent is performing excellently with high activity and consistency';
    case 'healthy':
      return 'Agent is active and performing well';
    case 'struggling':
      return 'Agent needs attention - low activity or inconsistent behavior';
    case 'stale':
      return 'Agent has not been active in over 24 hours';
    case 'offline':
      return 'Agent is not connected or responding';
    default:
      return 'Unknown status';
  }
}
