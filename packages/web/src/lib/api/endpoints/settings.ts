import { apiGet, apiPatch } from '../client';
import { User, Org } from '@/types';

/**
 * Get current user settings with organization info
 */
export async function getSettings(): Promise<{ user: User; org: Org }> {
  const response = await apiGet<{ user: User; org: Org }>('/settings');
  return response.data!;
}

/**
 * Get user's API key (masked)
 */
export async function getApiKey(): Promise<{ apiKey: string; prefix: string }> {
  const response = await apiGet<{ apiKey: string; prefix: string }>('/settings/api-key');
  return response.data!;
}

/**
 * Update user profile
 */
export async function updateProfile(data: {
  name?: string;
  email?: string;
}): Promise<User> {
  const response = await apiPatch<User>('/settings/profile', data);
  return response.data!;
}

/**
 * Update organization settings
 */
export async function updateOrgSettings(data: {
  name?: string;
  settings?: Record<string, unknown>;
}): Promise<Org> {
  const response = await apiPatch<Org>('/settings/org', data);
  return response.data!;
}
