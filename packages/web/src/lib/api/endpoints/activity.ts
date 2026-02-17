import { apiGet } from '../client';
import { ActivityEntry, PaginationInfo } from '@/types';

/**
 * List activity entries with optional filters
 */
export interface ListActivityFilters {
  actor_id?: string;
  actor_type?: 'agent' | 'user' | 'system';
  action?: string;
  resource_type?: string;
  date_from?: string;
  date_to?: string;
}

export async function listActivity(
  filters?: ListActivityFilters,
  page = 1,
  limit = 50,
): Promise<{ activity: ActivityEntry[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters?.actor_id) params.set('actor_id', filters.actor_id);
  if (filters?.actor_type) params.set('actor_type', filters.actor_type);
  if (filters?.action) params.set('action', filters.action);
  if (filters?.resource_type) params.set('resource_type', filters.resource_type);
  if (filters?.date_from) params.set('date_from', filters.date_from);
  if (filters?.date_to) params.set('date_to', filters.date_to);

  const response = await apiGet<ActivityEntry[]>(`/activity?${params.toString()}`);
  return {
    activity: response.data || [],
    pagination: response.pagination || { page, limit, total: 0, hasMore: false },
  };
}

/**
 * Get recent activity for dashboard
 */
export async function getRecentActivity(limit = 10): Promise<ActivityEntry[]> {
  const response = await apiGet<ActivityEntry[]>(`/activity/recent?limit=${limit}`);
  return response.data || [];
}

/**
 * Get activity by actor
 */
export async function getActivityByActor(
  actorId: string,
  actorType: 'agent' | 'user' | 'system',
  page = 1,
  limit = 20,
): Promise<{ activity: ActivityEntry[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams({
    actor_id: actorId,
    actor_type: actorType,
    page: String(page),
    limit: String(limit),
  });

  const response = await apiGet<ActivityEntry[]>(`/activity?${params.toString()}`);
  return {
    activity: response.data || [],
    pagination: response.pagination || { page, limit, total: 0, hasMore: false },
  };
}
