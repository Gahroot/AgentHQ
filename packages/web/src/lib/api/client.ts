import { useAuthStore } from '../zustand/auth-store';
import { ApiResponse, ApiError } from '@/types';

// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Custom error class for API errors
export class ApiRequestError extends Error {
  constructor(
    public statusCode: number,
    public apiError: ApiError,
  ) {
    super(apiError.message);
    this.name = 'ApiRequestError';
  }
}

// Token refresh state to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// Add subscriber to be notified when token is refreshed
function subscribeToTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

// Notify all subscribers that token has been refreshed
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// Refresh the access token
async function refreshAccessToken(): Promise<string> {
  const refreshToken = useAuthStore.getState().refreshToken;

  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    // If refresh fails, logout the user
    useAuthStore.getState().logout();
    throw new Error('Failed to refresh token');
  }

  const data: ApiResponse<{ accessToken: string }> = await response.json();

  if (!data.data?.accessToken) {
    throw new Error('Invalid refresh response');
  }

  const newToken = data.data.accessToken;
  useAuthStore.getState().setToken(newToken);

  return newToken;
}

// Base fetch wrapper with auth and error handling
export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const authState = useAuthStore.getState();

  // Prepare headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  // Add auth token if available
  if (authState.token) {
    headers['Authorization'] = `Bearer ${authState.token}`;
  }

  // Make the request
  let response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - try to refresh token
  if (response.status === 401 && authState.refreshToken) {
    if (!isRefreshing) {
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        isRefreshing = false;
        onTokenRefreshed(newToken);

        // Retry the original request with new token
        headers['Authorization'] = `Bearer ${newToken}`;
        response = await fetch(`${API_BASE_URL}${endpoint}`, {
          ...options,
          headers,
        });
      } catch {
        isRefreshing = false;
        refreshSubscribers = [];
        throw new ApiRequestError(401, {
          code: 'AUTH_FAILED',
          message: 'Authentication failed. Please login again.',
        });
      }
    } else {
      // Wait for the in-progress refresh to complete
      await new Promise<string>((resolve) => {
        subscribeToTokenRefresh((token) => resolve(token));
      });

      // Retry the original request with new token
      const newToken = useAuthStore.getState().token;
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });
    }
  }

  // Parse response
  const data: ApiResponse<T> = await response.json();

  // Handle errors
  if (!response.ok) {
    throw new ApiRequestError(response.status, data.error || {
      code: 'UNKNOWN_ERROR',
      message: response.statusText,
    });
  }

  return data;
}

// Convenience method for GET requests
export async function apiGet<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'GET' });
}

// Convenience method for POST requests
export async function apiPost<T = unknown>(
  endpoint: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: 'POST',
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Convenience method for PATCH requests
export async function apiPatch<T = unknown>(
  endpoint: string,
  body?: unknown,
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: 'PATCH',
    body: body ? JSON.stringify(body) : undefined,
  });
}

// Convenience method for DELETE requests
export async function apiDelete<T = unknown>(endpoint: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: 'DELETE' });
}
