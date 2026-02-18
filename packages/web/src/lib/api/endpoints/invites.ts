import { apiPost } from '../client';

interface InviteResult {
  invite: {
    id: string;
    org_id: string;
    token: string;
    created_by: string;
    status: string;
    expires_at: string;
    created_at: string;
    updated_at: string;
  };
  token: string;
}

/**
 * Create a new invite token
 */
export async function createInvite(): Promise<InviteResult> {
  const response = await apiPost<InviteResult>('/invites');
  return response.data!;
}
