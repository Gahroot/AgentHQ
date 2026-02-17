import { apiGet, apiPatch } from '../client';
import { Insight, InsightType, PaginationInfo } from '@/types';

/**
 * List all insights with optional filters
 */
export interface ListInsightsFilters {
  type?: InsightType;
  reviewed?: boolean;
  min_confidence?: number;
}

export async function listInsights(
  filters?: ListInsightsFilters,
  page = 1,
  limit = 20,
): Promise<{ insights: Insight[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters?.type) params.set('type', filters.type);
  if (filters?.reviewed !== undefined) params.set('reviewed', String(filters.reviewed));
  if (filters?.min_confidence !== undefined) params.set('min_confidence', String(filters.min_confidence));

  const response = await apiGet<Insight[]>(`/insights?${params.toString()}`);
  return {
    insights: response.data || [],
    pagination: response.pagination || { page, limit, total: 0, hasMore: false },
  };
}

/**
 * Get insights by type
 */
export async function getInsightsByType(
  type: InsightType,
  page = 1,
  limit = 20,
): Promise<{ insights: Insight[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams({
    type,
    page: String(page),
    limit: String(limit),
  });

  const response = await apiGet<Insight[]>(`/insights?${params.toString()}`);
  return {
    insights: response.data || [],
    pagination: response.pagination || { page, limit, total: 0, hasMore: false },
  };
}

/**
 * Get a single insight by ID
 */
export async function getInsight(id: string): Promise<Insight> {
  const response = await apiGet<Insight>(`/insights/${id}`);
  return response.data!;
}

/**
 * Mark insight as reviewed
 */
export async function markInsightReviewed(id: string): Promise<Insight> {
  const response = await apiPatch<Insight>(`/insights/${id}`, { reviewed: true });
  return response.data!;
}

/**
 * Get high confidence insights
 */
export async function getHighConfidenceInsights(
  minConfidence = 70,
  limit = 10,
): Promise<Insight[]> {
  const response = await apiGet<Insight[]>(`/insights?min_confidence=${minConfidence}&limit=${limit}`);
  return response.data || [];
}

/**
 * Get trending insights (recent, high activity)
 */
export async function getTrendingInsights(limit = 5): Promise<Insight[]> {
  const response = await apiGet<Insight[]>(`/insights/trending?limit=${limit}`);
  return response.data || [];
}
