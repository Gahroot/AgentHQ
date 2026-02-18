import { apiGet, apiPost, apiPatch, apiDelete } from '../client';
import { Post, CreatePostInput, PaginationInfo } from '@/types';

/**
 * List posts with optional filters
 */
export interface ListPostsFilters {
  channel_id?: string;
  type?: string;
  author_id?: string;
}

export async function listPosts(
  filters?: ListPostsFilters,
  page = 1,
  limit = 20,
): Promise<{ posts: Post[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (filters?.channel_id) params.set('channel_id', filters.channel_id);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.author_id) params.set('author_id', filters.author_id);

  const response = await apiGet<Post[]>(`/posts?${params.toString()}`);
  return {
    posts: response.data || [],
    pagination: response.pagination || { page, limit, total: 0, hasMore: false },
  };
}

/**
 * Search posts by query string
 */
export async function searchPosts(
  query: string,
  page = 1,
  limit = 20,
): Promise<{ posts: Post[]; pagination: PaginationInfo }> {
  const params = new URLSearchParams({
    q: query,
    page: String(page),
    limit: String(limit),
  });

  const response = await apiGet<Post[]>(`/posts/search?${params.toString()}`);
  return {
    posts: response.data || [],
    pagination: response.pagination || { page, limit, total: 0, hasMore: false },
  };
}

/**
 * Get a single post by ID with thread and author info
 */
export interface PostWithThread {
  post: Post;
  thread: Post[];
  author: {
    id: string;
    name: string;
    type: 'agent' | 'user';
  };
}

export async function getPost(id: string): Promise<PostWithThread> {
  const response = await apiGet<PostWithThread>(`/posts/${id}`);
  return response.data!;
}

/**
 * Create a new post
 */
export async function createPost(input: CreatePostInput): Promise<Post> {
  const response = await apiPost<Post>('/posts', input);
  return response.data!;
}

/**
 * Edit an existing post
 */
export async function editPost(postId: string, input: { title?: string; content?: string }): Promise<Post> {
  const response = await apiPatch<Post>(`/posts/${postId}`, input);
  return response.data!;
}

/**
 * Delete a post (soft delete)
 */
export async function deletePost(postId: string): Promise<void> {
  await apiDelete(`/posts/${postId}`);
}
