'use client';

import { useState, useEffect, useCallback } from 'react';
import { Agent } from '@/types';
import { listAgents } from '@/lib/api/endpoints/agents';
import { getActivityByActor } from '@/lib/api/endpoints/activity';

export interface AgentWithActivityStats extends Agent {
  recentActivityCount: number;
  activeDayCount: number;
}

export interface UseAgentsOptions {
  enabled?: boolean;
  pollInterval?: number;
  includeActivityStats?: boolean;
  activityDays?: number;
}

export interface UseAgentsResult {
  agents: AgentWithActivityStats[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAgents(options: UseAgentsOptions = {}): UseAgentsResult {
  const {
    enabled = true,
    pollInterval = 0,
    includeActivityStats = true,
    activityDays = 7,
  } = options;

  const [agents, setAgents] = useState<AgentWithActivityStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAgents = useCallback(async () => {
    if (!enabled) return;

    try {
      setLoading(true);
      setError(null);

      const { agents: data } = await listAgents(1, 100);

      let agentsWithStats: AgentWithActivityStats[] = data.map((agent) => ({
        ...agent,
        recentActivityCount: 0,
        activeDayCount: 0,
      }));

      if (includeActivityStats) {
        const activityStats = await Promise.all(
          data.map(async (agent) => {
            try {
              const { activity } = await getActivityByActor(agent.id, 'agent', 1, 100);
              const cutoffDate = new Date();
              cutoffDate.setDate(cutoffDate.getDate() - activityDays);

              const recentActivity = activity.filter(
                (a) => new Date(a.created_at) >= cutoffDate
              );

              const uniqueDays = new Set(
                recentActivity.map((a) => new Date(a.created_at).toDateString())
              ).size;

              return {
                agentId: agent.id,
                count: recentActivity.length,
                days: uniqueDays,
              };
            } catch {
              return { agentId: agent.id, count: 0, days: 0 };
            }
          })
        );

        const statsMap = new Map(activityStats.map((s) => [s.agentId, s]));

        agentsWithStats = data.map((agent) => {
          const stats = statsMap.get(agent.id);
          return {
            ...agent,
            recentActivityCount: stats?.count ?? 0,
            activeDayCount: stats?.days ?? 0,
          };
        });
      }

      setAgents(agentsWithStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }, [enabled, includeActivityStats, activityDays]);

  useEffect(() => {
    fetchAgents();

    if (pollInterval > 0) {
      const interval = setInterval(fetchAgents, pollInterval);
      return () => clearInterval(interval);
    }
  }, [fetchAgents, pollInterval]);

  return {
    agents,
    loading,
    error,
    refetch: fetchAgents,
  };
}
