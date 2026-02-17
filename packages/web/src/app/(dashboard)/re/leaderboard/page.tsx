'use client';

import { useState, useEffect, useCallback } from 'react';
import { getLeaderboard, RELeaderboardEntry, formatCurrency } from '@/lib/api/endpoints/re';

type PeriodPreset = 'monthly' | 'quarterly' | 'yearly';

const PERIOD_PRESETS: Record<PeriodPreset, string> = {
  monthly: 'This Month',
  quarterly: 'This Quarter',
  yearly: 'This Year',
};

function getPeriodStart(period: PeriodPreset): string {
  const now = new Date();
  switch (period) {
    case 'monthly':
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    case 'quarterly':
      const quarter = Math.floor(now.getMonth() / 3);
      return new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
    case 'yearly':
      return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    default:
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
  }
}

interface LeaderboardRow extends RELeaderboardEntry {
  rank: number;
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<PeriodPreset>('monthly');

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const periodStart = getPeriodStart(period);
      const data = await getLeaderboard(period, periodStart);

      // Add rank to each entry
      const rankedData = data
        .filter((entry) => entry.metrics.total_volume !== undefined)
        .map((entry, index) => ({ ...entry, rank: index + 1 }));

      setLeaderboard(rankedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch leaderboard');
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  // Top performers
  const topPerformers = leaderboard.slice(0, 3);

  // Get medal color for rank
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 2:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
      case 3:
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getMedalIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agent Leaderboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track top performing agents in your organization
          </p>
        </div>

        {/* Period Selector */}
        <div className="flex bg-muted rounded-lg p-1">
          {(Object.keys(PERIOD_PRESETS) as PeriodPreset[]).map((preset) => (
            <button
              key={preset}
              onClick={() => setPeriod(preset)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                period === preset
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {PERIOD_PRESETS[preset]}
            </button>
          ))}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <div className="flex">
            <svg
              className="h-5 w-5 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-destructive">Error loading leaderboard</h3>
              <p className="mt-1 text-sm text-destructive/80">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Content */}
      {!loading && leaderboard.length === 0 && (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-foreground">No leaderboard data</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            No performance data available for the selected period.
          </p>
        </div>
      )}

      {!loading && leaderboard.length > 0 && (
        <>
          {/* Top Performers Highlight */}
          {topPerformers.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {topPerformers.map((performer) => (
                <div
                  key={performer.id}
                  className={`bg-gradient-to-br rounded-lg p-6 ${
                    performer.rank === 1
                      ? 'from-yellow-500/10 to-orange-500/10 border border-yellow-500/20'
                      : performer.rank === 2
                      ? 'from-gray-400/10 to-gray-500/10 border border-gray-400/20'
                      : 'from-orange-500/10 to-red-500/10 border border-orange-500/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl">{getMedalIcon(performer.rank)}</span>
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${getMedalColor(
                        performer.rank
                      )}`}
                    >
                      #{performer.rank}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{performer.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {formatCurrency(performer.metrics.total_volume || 0)} volume
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Units: </span>
                      <span className="font-medium text-foreground">{performer.metrics.total_units || 0}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Closed: </span>
                      <span className="font-medium text-foreground">
                        {performer.metrics.closed_deals || 0}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full Leaderboard Table */}
          <div className="bg-card rounded-lg border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Rank
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Agent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Volume
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Units
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Closed Deals
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Avg Days to Close
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-card divide-y divide-border">
                  {leaderboard.map((agent) => (
                    <tr
                      key={agent.id}
                      className={`transition-colors ${
                        agent.rank <= 3 ? 'bg-muted/30' : 'hover:bg-muted/50'
                      }`}
                    >
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getMedalIcon(agent.rank) && (
                            <span className="mr-2 text-lg">{getMedalIcon(agent.rank)}</span>
                          )}
                          <span
                            className={`px-2 py-1 text-xs font-semibold rounded-full ${getMedalColor(
                              agent.rank
                            )}`}
                          >
                            #{agent.rank}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-foreground">{agent.name}</div>
                        <div className="text-xs text-muted-foreground">{agent.id}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                        {formatCurrency(agent.metrics.total_volume || 0)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                        {agent.metrics.total_units || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                        {agent.metrics.closed_deals || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-foreground">
                        {agent.metrics.avg_days_to_close || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
