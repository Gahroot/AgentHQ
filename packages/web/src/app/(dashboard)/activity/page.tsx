'use client';

import { useState, useEffect, useCallback } from 'react';
import { ActivityEntry } from '@/types';
import { listActivity } from '@/lib/api/endpoints/activity';
import { TimelineItem } from '@/components/activity/timeline-item';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

type ActorTypeFilter = 'all' | 'agent' | 'user' | 'system';
type DateRangeFilter = 'all' | 'today' | 'week' | 'month';

const actorTypeFilters: { value: ActorTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Actors' },
  { value: 'agent', label: 'Agents' },
  { value: 'user', label: 'Users' },
  { value: 'system', label: 'System' },
];

const dateRangeFilters: { value: DateRangeFilter; label: string }[] = [
  { value: 'all', label: 'All Time' },
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
];

export default function ActivityPage() {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filters
  const [actorTypeFilter, setActorTypeFilter] = useState<ActorTypeFilter>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<DateRangeFilter>('all');
  const [actionFilter, setActionFilter] = useState<string>('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 50,
    hasMore: false,
  });

  const getDateRange = useCallback((range: DateRangeFilter) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return today.toISOString();
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return weekAgo.toISOString();
      case 'month':
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return monthAgo.toISOString();
      default:
        return undefined;
    }
  }, []);

  const fetchActivity = useCallback(async (pageNum = page, showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const filters: Parameters<typeof listActivity>[0] = {};

      if (actorTypeFilter !== 'all') {
        filters.actor_type = actorTypeFilter;
      }

      if (actionFilter) {
        filters.action = actionFilter;
      }

      const dateFrom = getDateRange(dateRangeFilter);
      if (dateFrom) {
        filters.date_from = dateFrom;
      }

      const result = await listActivity(filters, pageNum, 50);

      setActivity(result.activity);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load activity');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [actorTypeFilter, dateRangeFilter, actionFilter, getDateRange, page]);

  useEffect(() => {
    setPage(1);
    fetchActivity(1);
  }, [actorTypeFilter, dateRangeFilter, actionFilter, getDateRange, fetchActivity]);

  const handleRefresh = () => {
    fetchActivity(page, true);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchActivity(newPage);
  };

  // Get unique actions from current activity for filter dropdown
  const uniqueActions = Array.from(new Set(activity.map(a => a.action))).sort();

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
        <Button onClick={() => fetchActivity()} variant="outline">
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
          <h1 className="text-2xl font-bold text-foreground">Activity Log</h1>
          <p className="text-muted-foreground mt-1">
            {pagination.total} {pagination.total === 1 ? 'entry' : 'entries'}
          </p>
        </div>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-lg">
        {/* Actor Type Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Actor:</label>
          <select
            value={actorTypeFilter}
            onChange={(e) => setActorTypeFilter(e.target.value as ActorTypeFilter)}
            className="px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {actorTypeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Time:</label>
          <select
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value as DateRangeFilter)}
            className="px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {dateRangeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {/* Action Filter */}
        {uniqueActions.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Action:</label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All Actions</option>
              {uniqueActions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Timeline */}
      {activity.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No activity found.</p>
        </div>
      ) : (
        <div className="p-6 bg-card border border-border rounded-lg">
          {activity.map((entry) => (
            <TimelineItem key={entry.id} entry={entry} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="flex items-center justify-center gap-2">
          <Button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground px-4">
            Page {page} of {Math.ceil(pagination.total / pagination.limit)}
          </span>
          
          <Button
            onClick={() => handlePageChange(page + 1)}
            disabled={!pagination.hasMore}
            variant="outline"
            size="sm"
            className="gap-1"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
