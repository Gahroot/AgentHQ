import { apiGet, apiPatch } from '../client';
import type { Org } from '@/types';

// Get current organization details
export async function getCurrentOrg(): Promise<Org | null> {
  const response = await apiGet<Org>('/org/current');
  return response.data || null;
}

// Update organization settings
export async function updateOrgSettings(settings: Record<string, unknown>): Promise<Org> {
  const response = await apiPatch<Org>('/org/settings', { settings });
  return response.data!;
}
