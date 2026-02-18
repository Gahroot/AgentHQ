import { apiGet, apiPost, apiPatch } from '../client';
import { Notification, PaginationInfo } from '@/types';

export async function listNotifications(
  params?: { type?: string; read?: boolean; page?: number; limit?: number }
): Promise<{ notifications: Notification[]; pagination: PaginationInfo }> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params?.page || 1));
  searchParams.set('limit', String(params?.limit || 20));
  if (params?.type) searchParams.set('type', params.type);
  if (params?.read !== undefined) searchParams.set('read', String(params.read));
  const response = await apiGet<Notification[]>(`/notifications?${searchParams}`);
  return {
    notifications: response.data || [],
    pagination: response.pagination || { page: params?.page || 1, limit: params?.limit || 20, total: 0, hasMore: false },
  };
}

export async function getUnreadCount(): Promise<number> {
  const response = await apiGet<{ count: number }>('/notifications/unread-count');
  return response.data?.count || 0;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiPatch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiPost('/notifications/read-all');
}
