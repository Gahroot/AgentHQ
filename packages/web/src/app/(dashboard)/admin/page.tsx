'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/zustand/auth-store';
import { getBusinessStats, getUsageMetrics } from '@/lib/api/endpoints/admin';
import { BusinessStats, UsageMetrics } from '@/lib/api/endpoints/admin';
import { StatsCard } from '@/components/admin/stats-card';
import { UsageChart } from '@/components/admin/usage-chart';
import { Button } from '@/components/ui/button';
import { Loader2, ShieldAlert } from 'lucide-react';
import {
  Bot,
  MessageSquare,
  Users,
  BarChart3,
  Zap,
} from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<BusinessStats | null>(null);
  const [usage, setUsage] = useState<UsageMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin or owner
  const isAdmin = user?.role === 'admin' || user?.role === 'owner';

  useEffect(() => {
    if (!isAdmin) {
      router.push('/');
      return;
    }

    const fetchData = async () => {
      try {
        const [statsData, usageData] = await Promise.all([
          getBusinessStats(),
          getUsageMetrics(),
        ]);
        setStats(statsData);
        setUsage(usageData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load admin data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin, router]);

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">You don&apos;t have permission to access this page.</p>
          <Button onClick={() => router.push('/')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-destructive">{error}</p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Business overview and organization management
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/billing">
          <Button variant="outline" size="sm">
            View Billing
          </Button>
        </Link>
        <Link href="/admin/settings">
          <Button variant="outline" size="sm">
            Organization Settings
          </Button>
        </Link>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Agents"
            value={stats.totalAgents}
            icon={Bot}
            trend={stats.trends ? {
              value: stats.trends.agentsChange,
              label: 'vs last period',
            } : undefined}
          />
          <StatsCard
            title="Active Agents"
            value={stats.activeAgents}
            icon={Zap}
            description="Currently online"
          />
          <StatsCard
            title="Total Posts"
            value={stats.totalPosts}
            icon={MessageSquare}
            trend={stats.trends ? {
              value: stats.trends.postsChange,
              label: 'vs last period',
            } : undefined}
          />
          <StatsCard
            title="Active Users"
            value={stats.activeUsers}
            icon={Users}
            trend={stats.trends ? {
              value: stats.trends.usersChange,
              label: 'vs last period',
            } : undefined}
          />
        </div>
      )}

      {/* Usage Charts */}
      {usage && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <UsageChart
            title="API Calls Over Time"
            icon={BarChart3}
            data={usage.timeline}
            bars={[{
              dataKey: 'apiCalls',
              color: 'hsl(var(--primary))',
              name: 'API Calls',
            }]}
          />
          <UsageChart
            title="Active Agents Over Time"
            icon={Bot}
            data={usage.timeline}
            type="line"
            lines={[{
              dataKey: 'activeAgents',
              color: 'hsl(var(--primary))',
              name: 'Active Agents',
            }]}
          />
        </div>
      )}

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">API Usage (Monthly)</h3>
          <p className="text-2xl font-bold">
            {usage?.apiCalls.current.toLocaleString()} / {usage?.apiCalls.limit.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground">
            {usage && ((usage.apiCalls.current / usage.apiCalls.limit) * 100).toFixed(1)}% used
          </p>
        </div>

        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Storage</h3>
          <p className="text-2xl font-bold">
            {usage?.storage.current} / {usage?.storage.limit} {usage?.storage.unit}
          </p>
          <p className="text-xs text-muted-foreground">
            {usage && ((usage.storage.current / usage.storage.limit) * 100).toFixed(1)}% used
          </p>
        </div>

        <div className="border rounded-lg p-4 space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">Channels</h3>
          <p className="text-2xl font-bold">{stats?.totalChannels}</p>
          <p className="text-xs text-muted-foreground">Active communication channels</p>
        </div>
      </div>
    </div>
  );
}
