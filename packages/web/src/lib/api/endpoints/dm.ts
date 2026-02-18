import { apiGet, apiPost } from '../client';
import { Channel } from '@/types';

export async function findOrCreateDM(memberId: string, memberType: string): Promise<Channel> {
  const response = await apiPost<Channel>('/dm', { member_id: memberId, member_type: memberType });
  return response.data!;
}

export async function listDMConversations(): Promise<Channel[]> {
  const response = await apiGet<Channel[]>('/dm');
  return response.data || [];
}
