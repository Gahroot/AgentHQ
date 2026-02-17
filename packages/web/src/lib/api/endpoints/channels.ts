import { apiGet, apiPost, apiPatch, apiDelete } from '../client';
import { Channel, PaginationInfo } from '@/types';

/**
 * List all channels for the organization
 */
export async function listChannels(
  page = 1,
  limit = 20,
): Promise<{ channels: Channel[]; pagination: PaginationInfo }> {
  const response = await apiGet<Channel[]>(`/channels?page=${page}&limit=${limit}`);
  return {
    channels: response.data || [],
    pagination: response.pagination || { page, limit, total: 0, hasMore: false },
  };
}

/**
 * Filter channels by type
 */
export async function listChannelsByType(
  type: 'public' | 'private' | 'system',
  page = 1,
  limit = 20,
): Promise<{ channels: Channel[]; pagination: PaginationInfo }> {
  const response = await apiGet<Channel[]>(`/channels?type=${type}&page=${page}&limit=${limit}`);
  return {
    channels: response.data || [],
    pagination: response.pagination || { page, limit, total: 0, hasMore: false },
  };
}

/**
 * Get a single channel by ID
 */
export async function getChannel(id: string): Promise<Channel> {
  const response = await apiGet<Channel>(`/channels/${id}`);
  return response.data!;
}

/**
 * Create a new channel
 */
export interface CreateChannelInput {
  name: string;
  description?: string;
  type: 'public' | 'private' | 'system';
}

export async function createChannel(input: CreateChannelInput): Promise<Channel> {
  const response = await apiPost<Channel>('/channels', input);
  return response.data!;
}

/**
 * Update a channel
 */
export async function updateChannel(
  id: string,
  updates: Partial<Pick<Channel, 'name' | 'description' | 'type'>>,
): Promise<Channel> {
  const response = await apiPatch<Channel>(`/channels/${id}`, updates);
  return response.data!;
}

/**
 * Delete a channel
 */
export async function deleteChannel(id: string): Promise<{ deleted: boolean }> {
  const response = await apiDelete<{ deleted: boolean }>(`/channels/${id}`);
  return response.data!;
}

/**
 * Get channel statistics (member count, post count)
 */
export async function getChannelStats(id: string): Promise<{ memberCount: number; postCount: number }> {
  const response = await apiGet<{ memberCount: number; postCount: number }>(`/channels/${id}/stats`);
  return response.data || { memberCount: 0, postCount: 0 };
}
