import { create } from 'zustand';
import { User, Org } from '@/types';

// Extended user type with optional org data
export interface AuthUser extends User {
  org?: Org;
}

// Auth state interface
interface AuthState {
  // State
  token: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  org: Org | null;
  isAuthenticated: boolean;
  isInitialized: boolean;

  // Actions
  login: (token: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  setToken: (token: string) => void;
  setRefreshToken: (refreshToken: string) => void;
  setUser: (user: AuthUser | null) => void;
  initialize: () => void;
}

const TOKEN_KEY = 'ahq_access_token';
const REFRESH_TOKEN_KEY = 'ahq_refresh_token';
const USER_KEY = 'ahq_user';
const ORG_KEY = 'ahq_org';
const AUTH_COOKIE = 'ahq_auth'; // Non-sensitive flag for middleware check

// Helper functions for sessionStorage (more secure than localStorage for tokens)
// We use localStorage for user/org data (non-sensitive, allows persistence)
const storage = {
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(TOKEN_KEY);
  },
  getRefreshToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  },
  getUser: (): AuthUser | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },
  getOrg: (): Org | null => {
    if (typeof window === 'undefined') return null;
    const orgStr = localStorage.getItem(ORG_KEY);
    return orgStr ? JSON.parse(orgStr) : null;
  },
  setToken: (token: string) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(TOKEN_KEY, token);
    // Also set a cookie for middleware access (non-sensitive flag only)
    document.cookie = `${AUTH_COOKIE}=1; path=/; max-age=86400; SameSite=lax`;
  },
  setRefreshToken: (refreshToken: string) => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },
  setUser: (user: AuthUser | null) => {
    if (typeof window === 'undefined') return;
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  },
  setOrg: (org: Org | null) => {
    if (typeof window === 'undefined') return;
    if (org) {
      localStorage.setItem(ORG_KEY, JSON.stringify(org));
    } else {
      localStorage.removeItem(ORG_KEY);
    }
  },
  clear: () => {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(ORG_KEY);
    // Clear the auth cookie
    document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0`;
  },
};

// Create the auth store
export const useAuthStore = create<AuthState>((set) => ({
  // Initial state
  token: null,
  refreshToken: null,
  user: null,
  org: null,
  isAuthenticated: false,
  isInitialized: false,

  // Initialize auth state from storage
  initialize: () => {
    const token = storage.getToken();
    const refreshToken = storage.getRefreshToken();
    const user = storage.getUser();
    const org = storage.getOrg();

    set({
      token,
      refreshToken,
      user,
      org,
      isAuthenticated: !!token && !!user,
      isInitialized: true,
    });
  },

  // Login action
  login: (token: string, refreshTokenValue: string, authUser: AuthUser) => {
    const { org, ...user } = authUser;

    storage.setToken(token);
    storage.setRefreshToken(refreshTokenValue);
    storage.setUser(user);
    if (org) {
      storage.setOrg(org);
    }

    set({
      token,
      refreshToken: refreshTokenValue,
      user,
      org: org || null,
      isAuthenticated: true,
    });
  },

  // Logout action
  logout: () => {
    storage.clear();

    set({
      token: null,
      refreshToken: null,
      user: null,
      org: null,
      isAuthenticated: false,
    });
  },

  // Set token (used for refresh)
  setToken: (token: string) => {
    storage.setToken(token);
    set({ token });
  },

  // Set refresh token
  setRefreshToken: (refreshToken: string) => {
    storage.setRefreshToken(refreshToken);
    set({ refreshToken });
  },

  // Set user
  setUser: (user: AuthUser | null) => {
    storage.setUser(user);
    set({ user, isAuthenticated: !!user });
  },
}));
