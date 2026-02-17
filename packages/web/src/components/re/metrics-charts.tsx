'use client';

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { REMetrics, formatCurrency } from '@/lib/api/endpoints/re';

interface MetricsChartsProps {
  metrics: REMetrics[];
}

// Chart colors
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
];

const STATUS_COLORS = {
  closed: 'hsl(var(--chart-1))',
  pending: 'hsl(var(--chart-2))',
  under_contract: 'hsl(var(--chart-3))',
  listed: 'hsl(var(--chart-4))',
  prospecting: 'hsl(var(--chart-5))',
};

/**
 * Volume Over Time Chart
 */
export function VolumeChart({ metrics }: MetricsChartsProps) {
  // Transform metrics data for volume chart
  const volumeData = metrics
    .filter((m) => m.metrics.total_volume !== undefined)
    .map((m) => ({
      period: new Date(m.period_start).toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
      }),
      volume: m.metrics.total_volume || 0,
    }))
    .reverse();

  if (volumeData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No volume data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={volumeData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          dataKey="period"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <YAxis
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
          formatter={(value: number) => [formatCurrency(value), 'Volume']}
        />
        <Legend />
        <Line
          type="monotone"
          dataKey="volume"
          stroke="hsl(var(--primary))"
          strokeWidth={2}
          dot={{ fill: 'hsl(var(--primary))' }}
          activeDot={{ r: 6 }}
          name="Total Volume"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Units by Agent Chart
 */
export function UnitsByAgentChart({ metrics }: MetricsChartsProps) {
  // Aggregate units by agent
  const agentUnits = metrics.reduce((acc, metric) => {
    if (metric.agent_id && metric.metrics.total_units !== undefined) {
      if (!acc[metric.agent_id]) {
        acc[metric.agent_id] = { agent: metric.agent_id, units: 0 };
      }
      acc[metric.agent_id].units += metric.metrics.total_units || 0;
    }
    return acc;
  }, {} as Record<string, { agent: string; units: number }>);

  const unitsData = Object.values(agentUnits)
    .sort((a, b) => b.units - a.units)
    .slice(0, 10); // Top 10 agents

  if (unitsData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No units data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={unitsData} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          type="category"
          dataKey="agent"
          className="text-xs"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
          angle={-45}
          textAnchor="end"
          height={80}
        />
        <YAxis
          type="number"
          tick={{ fill: 'hsl(var(--muted-foreground))' }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
          formatter={(value: number) => [value, 'Units']}
        />
        <Legend />
        <Bar dataKey="units" fill="hsl(var(--chart-2))" name="Units Sold" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Status Distribution Chart
 */
interface StatusDistributionProps {
  statusData: {
    status: string;
    count: number;
  }[];
}

export function StatusDistributionChart({ statusData }: StatusDistributionProps) {
  if (statusData.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        No status data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={statusData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="count"
          nameKey="status"
        >
          {statusData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS] ||
                CHART_COLORS[index % CHART_COLORS.length]
              }
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '0.5rem',
          }}
          formatter={(value: number) => [value, 'Deals']}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Combined Metrics Charts Component
 */
export function MetricsCharts({ metrics }: MetricsChartsProps) {
  return (
    <div className="space-y-6">
      {/* Volume Over Time */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Volume Over Time</h3>
        <VolumeChart metrics={metrics} />
      </div>

      {/* Units by Agent */}
      <div className="bg-card rounded-lg border border-border p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Units by Agent</h3>
        <UnitsByAgentChart metrics={metrics} />
      </div>
    </div>
  );
}
