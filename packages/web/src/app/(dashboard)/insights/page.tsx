'use client';

import { useState, useEffect, useCallback } from 'react';
import { Insight, InsightType } from '@/types';
import { listInsights, markInsightReviewed } from '@/lib/api/endpoints/insights';
import { InsightCard } from '@/components/insights/insight-card';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type InsightTypeFilter = 'all' | InsightType;
type SortOption = 'recent' | 'confidence-high' | 'confidence-low';
type ReviewFilter = 'all' | 'reviewed' | 'unreviewed';

const typeFilters: { value: InsightTypeFilter; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'trend', label: 'Trends' },
  { value: 'performance', label: 'Performance' },
  { value: 'recommendation', label: 'Recommendations' },
  { value: 'summary', label: 'Summaries' },
  { value: 'anomaly', label: 'Anomalies' },
];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'recent', label: 'Most Recent' },
  { value: 'confidence-high', label: 'Highest Confidence' },
  { value: 'confidence-low', label: 'Lowest Confidence' },
];

export default function InsightsPage() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [typeFilter, setTypeFilter] = useState<InsightTypeFilter>('all');
  const [reviewFilter, setReviewFilter] = useState<ReviewFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');

  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    hasMore: false,
  });

  const fetchInsights = useCallback(async (pageNum = page, showRefreshing = false) => {
    try {
      if (showRefreshing) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const filters: Parameters<typeof listInsights>[0] = {};

      if (typeFilter !== 'all') {
        filters.type = typeFilter;
      }

      if (reviewFilter === 'reviewed') {
        filters.reviewed = true;
      } else if (reviewFilter === 'unreviewed') {
        filters.reviewed = false;
      }

      const result = await listInsights(filters, pageNum, 20);

      // Apply client-side sorting
      const sortedInsights = [...result.insights];
      if (sortBy === 'confidence-high') {
        sortedInsights.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      } else if (sortBy === 'confidence-low') {
        sortedInsights.sort((a, b) => (a.confidence || 0) - (b.confidence || 0));
      }
      // 'recent' is already the default from API

      setInsights(sortedInsights);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [typeFilter, reviewFilter, sortBy, page]);

  useEffect(() => {
    setPage(1);
    fetchInsights(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeFilter, reviewFilter, sortBy]);

  const handleRefresh = () => {
    fetchInsights(page, true);
  };

  const handleToggleReviewed = async (id: string) => {
    try {
      await markInsightReviewed(id);
      // Update local state
      setInsights(prev =>
        prev.map(insight =>
          insight.id === id ? { ...insight, reviewed: true } : insight
        )
      );
    } catch (err) {
      console.error('Failed to mark insight as reviewed:', err);
    }
  };

  // Calculate stats
  const highConfidenceCount = insights.filter(i => (i.confidence || 0) >= 80).length;
  const unreviewedCount = insights.filter(i => !i.reviewed).length;

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
        <Button onClick={() => fetchInsights()} variant="outline">
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
          <h1 className="text-2xl font-bold text-foreground">Insights</h1>
          <p className="text-muted-foreground mt-1">
            {pagination.total} {pagination.total === 1 ? 'insight' : 'insights'}
            {highConfidenceCount > 0 && ` · ${highConfidenceCount} high confidence`}
            {unreviewedCount > 0 && ` · ${unreviewedCount} unreviewed`}
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
        {/* Type Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Type:</label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as InsightTypeFilter)}
            className="px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {typeFilters.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label}
              </option>
            ))}
          </select>
        </div>

        {/* Review Filter */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Status:</label>
          <select
            value={reviewFilter}
            onChange={(e) => setReviewFilter(e.target.value as ReviewFilter)}
            className="px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="all">All</option>
            <option value="reviewed">Reviewed</option>
            <option value="unreviewed">Unreviewed</option>
          </select>
        </div>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Insights Grid */}
      {insights.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No insights found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {insights.map((insight) => (
            <InsightCard
              key={insight.id}
              insight={insight}
              showReviewedToggle={!insight.reviewed}
              onToggleReviewed={handleToggleReviewed}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {pagination.hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            onClick={() => {
              const newPage = page + 1;
              setPage(newPage);
              fetchInsights(newPage);
            }}
            variant="outline"
            disabled={refreshing}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}
