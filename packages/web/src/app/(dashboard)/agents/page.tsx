'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Agent } from '@/types';
import { listAgents } from '@/lib/api/endpoints/agents';
import { getActivityByActor } from '@/lib/api/endpoints/activity';
import { AgentCard } from '@/components/agents/agent-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Grid3X3, List, Search, Filter, Plus } from 'lucide-react';

type ViewMode = 'grid' | 'list';
type StatusFilter = 'all' | 'online' | 'offline' | 'busy';
type HealthFilter = 'all' | 'thriving' | 'healthy' | 'struggling' | 'stale' | 'offline';

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [healthFilter, setHealthFilter] = useState<HealthFilter>('all');

  // Store activity counts for health calculation
  const [activityCounts, setActivityCounts] = useState<Record<string, { count: number; days: number }>>({});

  useEffect(() => {
    loadAgents();
  }, []);

  async function loadAgents() {
    try {
      setLoading(true);
      setError(null);
      const { agents: data } = await listAgents(1, 100);
      setAgents(data);

      // Load activity counts for each agent for health calculation
      const counts: Record<string, { count: number; days: number }> = {};
      await Promise.all(
        data.map(async (agent) => {
          try {
            const { activity } = await getActivityByActor(agent.id, 'agent', 1, 100);
            // Count activities in last 7 days
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const recentActivity = activity.filter(a => new Date(a.created_at) >= sevenDaysAgo);

            // Count unique days with activity
            const uniqueDays = new Set(
              recentActivity.map(a => new Date(a.created_at).toDateString())
            ).size;

            counts[agent.id] = {
              count: recentActivity.length,
              days: uniqueDays,
            };
          } catch {
            counts[agent.id] = { count: 0, days: 0 };
          }
        })
      );
      setActivityCounts(counts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load agents');
    } finally {
      setLoading(false);
    }
  }

  // Filter agents based on search and filters
  const filteredAgents = agents.filter((agent) => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !agent.name.toLowerCase().includes(query) &&
        !(agent.description?.toLowerCase().includes(query)) &&
        !agent.capabilities.some((cap) => cap.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    // Status filter
    if (statusFilter !== 'all' && agent.status !== statusFilter) {
      return false;
    }

    // Health filter (calculated from activity)
    if (healthFilter !== 'all') {
      const { count } = activityCounts[agent.id] || { count: 0, days: 0 };
      // Simple health check based on status and activity
      if (healthFilter === 'offline' && agent.status !== 'offline') return false;
      if (healthFilter === 'thriving' && count < 10) return false;
      if (healthFilter === 'healthy' && count < 5) return false;
      if (healthFilter === 'struggling' && count >= 5) return false;
      if (healthFilter === 'stale' && count >= 3) return false;
    }

    return true;
  });

  const stats = {
    total: agents.length,
    online: agents.filter((a) => a.status === 'online').length,
    offline: agents.filter((a) => a.status === 'offline').length,
    busy: agents.filter((a) => a.status === 'busy').length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Agents</h1>
            <p className="text-muted-foreground">Manage your AI agents</p>
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-20 mb-1" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-full" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={loadAgents}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Agents</h1>
          <p className="text-muted-foreground">Manage and monitor your AI agents</p>
        </div>
        <Link href="/agents/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Agent
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Agents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-500">{stats.online}</div>
            <div className="text-sm text-muted-foreground">Online</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-500">{stats.busy}</div>
            <div className="text-sm text-muted-foreground">Busy</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-400">{stats.offline}</div>
            <div className="text-sm text-muted-foreground">Offline</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents by name, description, or capabilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Status filter */}
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="online">Online</SelectItem>
            <SelectItem value="busy">Busy</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>

        {/* Health filter */}
        <Select value={healthFilter} onValueChange={(v) => setHealthFilter(v as HealthFilter)}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by health" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Health</SelectItem>
            <SelectItem value="thriving">Thriving</SelectItem>
            <SelectItem value="healthy">Healthy</SelectItem>
            <SelectItem value="struggling">Struggling</SelectItem>
            <SelectItem value="stale">Stale</SelectItem>
            <SelectItem value="offline">Offline</SelectItem>
          </SelectContent>
        </Select>

        {/* View toggle */}
        <div className="flex items-center border rounded-md">
          <Button
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-r-none"
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'secondary' : 'ghost'}
            size="sm"
            className="rounded-l-none"
            onClick={() => setViewMode('list')}
          >
            <List className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Active filters */}
      {(statusFilter !== 'all' || healthFilter !== 'all' || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter('all')}>
              Status: {statusFilter} ✕
            </Badge>
          )}
          {healthFilter !== 'all' && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setHealthFilter('all')}>
              Health: {healthFilter} ✕
            </Badge>
          )}
          {searchQuery && (
            <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery('')}>
              Search: {searchQuery.slice(0, 20)}... ✕
            </Badge>
          )}
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => {
              setStatusFilter('all');
              setHealthFilter('all');
              setSearchQuery('');
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {filteredAgents.length} of {agents.length} agents
      </div>

      {/* Agents grid/list */}
      {filteredAgents.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Filter className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents found</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery || statusFilter !== 'all' || healthFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Get started by creating your first agent'}
            </p>
            {agents.length === 0 && (
              <Link href="/agents/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Agent
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              recentActivityCount={activityCounts[agent.id]?.count ?? 0}
              activeDayCount={activityCounts[agent.id]?.days ?? 0}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filteredAgents.map((agent) => (
            <AgentCard
              key={agent.id}
              agent={agent}
              variant="list"
              recentActivityCount={activityCounts[agent.id]?.count ?? 0}
              activeDayCount={activityCounts[agent.id]?.days ?? 0}
            />
          ))}
        </div>
      )}
    </div>
  );
}
