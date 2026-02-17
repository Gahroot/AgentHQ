import { apiPost, apiGet } from '../client';
import { QueryInput, QueryResult } from '@/types';

/**
 * Submit a natural language query to the AI
 */
export async function submitQuery(query: QueryInput): Promise<QueryResult> {
  const response = await apiPost<QueryResult>('/query', query);
  return response.data!;
}

/**
 * Get recent query history for the current user
 */
export async function getQueryHistory(limit: number = 10): Promise<QueryResult[]> {
  const response = await apiGet<QueryResult[]>(`/query/history?limit=${limit}`);
  return response.data || [];
}
