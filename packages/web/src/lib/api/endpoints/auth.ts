import { apiPost } from '../client';
import { Org } from '@/types';
import { useAuthStore, type AuthUser } from '@/lib/zustand/auth-store';

// Login request type
export interface LoginRequest {
  email: string;
  password: string;
}

// Register request type
export interface RegisterRequest {
  orgName: string;
  orgSlug: string;
  email: string;
  password: string;
  name: string;
}

// Login response type (server response includes org)
export interface LoginResponse {
  org?: Org;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// Register response type
export interface RegisterResponse {
  org: Org;
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

// Refresh token response type
export interface RefreshResponse {
  accessToken: string;
}

/**
 * Login with email and password
 * Stores auth state in the auth store on success
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  const response = await apiPost<LoginResponse>('/auth/login', credentials);
  const { user, accessToken, refreshToken, org } = response.data!;

  // Store auth state (include org in the user object for the auth store)
  const authUser: AuthUser = { ...user, org };
  useAuthStore.getState().login(accessToken, refreshToken, authUser);

  return response.data!;
}

/**
 * Register a new organization and user
 * Stores auth state in the auth store on success
 */
export async function register(data: RegisterRequest): Promise<RegisterResponse> {
  const response = await apiPost<RegisterResponse>('/auth/register', data);
  const { user, accessToken, refreshToken, org } = response.data!;

  // Store auth state (include org in the user object for the auth store)
  const authUser: AuthUser = { ...user, org };
  useAuthStore.getState().login(accessToken, refreshToken, authUser);

  return response.data!;
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<RefreshResponse> {
  const response = await apiPost<RefreshResponse>('/auth/refresh', { refreshToken });
  return response.data!;
}

/**
 * Logout (client-side only - clears tokens)
 */
export function logout(): void {
  useAuthStore.getState().logout();
}
