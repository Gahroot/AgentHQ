'use client';

import { useState, useEffect, useCallback } from 'react';
import { Agent, ActivityEntry } from '@/types';
import { getAgent } from '@/lib/api/endpoints/agents';
import { getActivityByActor } from '@/lib/api/endpoints/activity';
import { calculateAgentHealth, AgentHealthResult } from '@/lib/utils/agent-health';

export interface AgentHealthData {
  agent: Agent | null;
  health: AgentHealthResult | null;
  activities: ActivityEntry[];
  recentActivityCount: number;
  activeDayCount: number;
  lastActivityTime: Date | null;
}

export interface UseAgentHealthOptions {
  enabled?: boolean;
  pollInterval?: number;
  activityDays?: number;
  activityLimit?: number;
}

export interface UseAgentHealthResult extends AgentHealthData {
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAgentHealth(
  agentId: string,
  options: UseAgentHealthOptions = {}
): UseAgentHealthResult {
  const {
    enabled = true,
    pollInterval = 0,
    activityDays = 7,
    activityLimit = 100,
  } = options;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [health, setHealth] = useState<AgentHealthResult | null>(null);
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled || !agentId) return;

    try {
      setLoading(true);
      setError(null);

      const [agentData, activityData] = await Promise.all([
        getAgent(agentId),
        getActivityByActor(agentId, 'agent', 1, activityLimit).catch(() => ({ activity: [] })),
      ]);

      setAgent(agentData);
      setActivities(activityData.activity);

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - activityDays);

      const recentActivity = activityData.activity.filter(
        (a) => new Date(a.created_at) >= cutoffDate
      );

      const recentActivityCount = recentActivity.length;
      const activeDayCount = new Set(
        recentActivity.map((a) => new Date(a.created_at).toDateString())
      ).size;

      const healthResult = calculateAgentHealth(
        agentData,
        recentActivityCount,
        activeDayCount
      );

      setHealth(healthResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agent health');
    } finally {
      setLoading(false);
    }
  }, [enabled, agentId, activityDays, activityLimit]);

  useEffect(() => {
    fetchData();

    if (pollInterval > 0) {
      const interval = setInterval(fetchData, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, pollInterval]);

  const lastActivityTime =
    activities.length > 0
      ? new Date(activities[0].created_at)
      : null;

  return {
    agent,
    health,
    activities,
    recentActivityCount: health ? Math.round((health.factors.activity / 50) * 10) : 0,
    activeDayCount: health ? Math.round((health.factors.consistency / 20) * 5) : 0,
    lastActivityTime,
    loading,
    error,
    refetch: fetchData,
  };
}
