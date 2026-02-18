import { apiPost, apiGet } from '../client';
import type { PaginationInfo } from '@agenthq/sdk';

interface InviteResult {
  invite: {
    id: string;
    org_id: string;
    token: string;
    created_by: string;
    status: string;
    invite_type: string;
    email: string | null;
    role: string | null;
    expires_at: string;
    created_at: string;
    updated_at: string;
  };
  token: string;
}

interface Invite {
  id: string;
  org_id: string;
  token: string;
  created_by: string;
  status: string;
  invite_type: string;
  email: string | null;
  role: string | null;
  redeemed_by_agent_id: string | null;
  redeemed_by_user_id: string | null;
  expires_at: string;
  redeemed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type { Invite };

interface CreateAgentInviteInput {
  email?: string;
  role?: 'viewer' | 'member' | 'admin';
}

interface RedeemUserInviteInput {
  token: string;
  name: string;
  password: string;
}

/**
 * Create a new agent invite token
 */
export async function createAgentInvite(): Promise<InviteResult> {
  const response = await apiPost<InviteResult>('/invites/agent');
  return response.data!;
}

/**
 * Create a new user invite
 */
export async function createUserInvite(input: CreateAgentInviteInput): Promise<InviteResult> {
  const response = await apiPost<InviteResult>('/invites/user', input);
  return response.data!;
}

/**
 * List invites (optionally filter by type)
 */
export async function listInvites(type?: 'agent' | 'user'): Promise<{ data: Invite[]; pagination?: PaginationInfo }> {
  const query = type ? `?type=${type}` : '';
  const response = await apiGet<Invite[]>(`/invites${query}`);
  // The response format for list is different
  return { data: response.data || [], pagination: response.pagination };
}

/**
 * Revoke an invite
 */
export async function revokeInvite(id: string): Promise<{ invite: Invite }> {
  const response = await apiPost<{ invite: Invite }>(`/invites/${id}/revoke`);
  return response.data!;
}

/**
 * Get invite details by token (public)
 */
export async function getInviteByToken(token: string): Promise<{ invite: Invite & { org_name?: string } }> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const response = await fetch(`${API_BASE_URL}/auth/invites/${token}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to get invite');
  }
  return data.data;
}

/**
 * Redeem a user invite (public - creates user account)
 */
export async function redeemUserInvite(input: RedeemUserInviteInput): Promise<{
  user: { id: string; email: string; name: string; role: string; org_id: string };
  org: { id: string; name: string; slug: string };
  accessToken: string;
  refreshToken: string;
}> {
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
  const response = await fetch(`${API_BASE_URL}/auth/invites/redeem-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Failed to redeem invite');
  }
  return data.data;
}
