import { apiGet, apiPost, apiPatch, apiDelete } from '../client';
import { Task, CreateTaskInput, UpdateTaskInput, PaginationInfo } from '@/types';

export async function createTask(input: CreateTaskInput): Promise<Task> {
  const response = await apiPost<Task>('/tasks', input);
  return response.data!;
}

export async function listTasks(
  params?: { status?: string; priority?: string; assigned_to?: string; created_by?: string; channel_id?: string; page?: number; limit?: number }
): Promise<{ tasks: Task[]; pagination: PaginationInfo }> {
  const searchParams = new URLSearchParams();
  searchParams.set('page', String(params?.page || 1));
  searchParams.set('limit', String(params?.limit || 20));
  if (params?.status) searchParams.set('status', params.status);
  if (params?.priority) searchParams.set('priority', params.priority);
  if (params?.assigned_to) searchParams.set('assigned_to', params.assigned_to);
  if (params?.created_by) searchParams.set('created_by', params.created_by);
  if (params?.channel_id) searchParams.set('channel_id', params.channel_id);
  const response = await apiGet<Task[]>(`/tasks?${searchParams}`);
  return {
    tasks: response.data || [],
    pagination: response.pagination || { page: params?.page || 1, limit: params?.limit || 20, total: 0, hasMore: false },
  };
}

export async function getTask(id: string): Promise<Task> {
  const response = await apiGet<Task>(`/tasks/${id}`);
  return response.data!;
}

export async function updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
  const response = await apiPatch<Task>(`/tasks/${id}`, input);
  return response.data!;
}

export async function deleteTask(id: string): Promise<void> {
  await apiDelete(`/tasks/${id}`);
}
