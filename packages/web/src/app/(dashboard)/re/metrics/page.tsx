'use client';

import { useState, useEffect, useCallback } from 'react';
import { MetricsCharts } from '@/components/re/metrics-charts';
import { StatusDistributionChart } from '@/components/re/metrics-charts';
import { getMetrics, REMetrics, REMetricsFilters } from '@/lib/api/endpoints/re';

type DateRangePreset = '30d' | '90d' | '6m' | '1y' | 'ytd' | 'all';

const DATE_RANGE_PRESETS: Record<DateRangePreset, string> = {
  '30d': 'Last 30 Days',
  '90d': 'Last 90 Days',
  '6m': 'Last 6 Months',
  '1y': 'Last Year',
  'ytd': 'Year to Date',
  'all': 'All Time',
};

function getPeriodStart(range: DateRangePreset): string {
  const now = new Date();
  switch (range) {
    case '30d':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case '90d':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    case '6m':
      return new Date(now.getFullYear(), now.getMonth() - 6, 1).toISOString().split('T')[0];
    case '1y':
      return new Date(now.getFullYear() - 1, now.getMonth(), 1).toISOString().split('T')[0];
    case 'ytd':
      return new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    case 'all':
    default:
      return '2020-01-01';
  }
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<REMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRangePreset>('90d');
  const [agentFilter, setAgentFilter] = useState<string>('');

  // Mock status distribution data (in real app, this would come from an API)
  const statusDistribution = [
    { status: 'closed', count: 45 },
    { status: 'pending', count: 12 },
    { status: 'under_contract', count: 8 },
    { status: 'listed', count: 23 },
    { status: 'prospecting', count: 31 },
  ];

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const filters: REMetricsFilters = {
        from: getPeriodStart(dateRange),
      };
      if (agentFilter) filters.agent_id = agentFilter;

      const data = await getMetrics(filters);
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  }, [dateRange, agentFilter]);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  // Calculate summary metrics
  const summaryMetrics = metrics.reduce(
    (acc, metric) => {
      return {
        totalVolume: acc.totalVolume + (metric.metrics.total_volume || 0),
        totalUnits: acc.totalUnits + (metric.metrics.total_units || 0),
        closedDeals: acc.closedDeals + (metric.metrics.closed_deals || 0),
      };
    },
    { totalVolume: 0, totalUnits: 0, closedDeals: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Performance Metrics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Track your real estate team&apos;s performance over time
        </p>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Date Range Selector */}
          <div>
            <label htmlFor="date-range" className="block text-sm font-medium text-foreground mb-1">
              Date Range
            </label>
            <div className="flex flex-wrap gap-2">
              {(Object.keys(DATE_RANGE_PRESETS) as DateRangePreset[]).map((preset) => (
                <button
                  key={preset}
                  onClick={() => setDateRange(preset)}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    dateRange === preset
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  {DATE_RANGE_PRESETS[preset]}
                </button>
              ))}
            </div>
          </div>

          {/* Agent Filter */}
          <div>
            <label htmlFor="agent-filter" className="block text-sm font-medium text-foreground mb-1">
              Filter by Agent
            </label>
            <input
              id="agent-filter"
              type="text"
              value={agentFilter}
              onChange={(e) => setAgentFilter(e.target.value)}
              placeholder="Enter agent ID..."
              className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Volume */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(summaryMetrics.totalVolume)}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-full">
              <svg className="w-6 h-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Units */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Units</p>
              <p className="text-2xl font-bold text-foreground mt-1">{summaryMetrics.totalUnits}</p>
            </div>
            <div className="p-3 bg-chart-2/10 rounded-full">
              <svg className="w-6 h-6 text-chart-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        {/* Closed Deals */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Closed Deals</p>
              <p className="text-2xl font-bold text-foreground mt-1">{summaryMetrics.closedDeals}</p>
            </div>
            <div className="p-3 bg-chart-1/10 rounded-full">
              <svg className="w-6 h-6 text-chart-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
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
              <h3 className="text-sm font-medium text-destructive">Error loading metrics</h3>
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

      {/* Charts */}
      {!loading && (
        <>
          <MetricsCharts metrics={metrics} />

          {/* Status Distribution */}
          <div className="bg-card rounded-lg border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Status Distribution</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StatusDistributionChart statusData={statusDistribution} />
              <div className="flex flex-col justify-center space-y-3">
                <h4 className="text-sm font-medium text-muted-foreground">Deal Pipeline</h4>
                {statusDistribution.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <span className="text-sm text-foreground capitalize">{item.status.replace('_', ' ')}</span>
                    <span className="text-sm font-medium text-foreground">{item.count} deals</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
