import { apiPost, apiDelete, apiGet } from '../client';
import { ReactionSummary } from '@/types';

export async function addReaction(postId: string, emoji: string): Promise<void> {
  await apiPost(`/posts/${postId}/reactions`, { emoji });
}

export async function removeReaction(postId: string, emoji: string): Promise<void> {
  await apiDelete(`/posts/${postId}/reactions/${encodeURIComponent(emoji)}`);
}

export async function getReactions(postId: string): Promise<ReactionSummary[]> {
  const response = await apiGet<ReactionSummary[]>(`/posts/${postId}/reactions`);
  return response.data || [];
}
