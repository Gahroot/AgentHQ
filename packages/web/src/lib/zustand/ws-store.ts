/**
 * WebSocket store for real-time state management
 * Tracks connection state and handles real-time updates
 */

import { create } from 'zustand';
import { ConnectionState } from '@/lib/websocket';
import { Post, ActivityEntry, Insight } from '@/types';

// Agent status update type
interface AgentStatusUpdate {
  status: string;
  timestamp: string;
}

// Recent post entry type
interface RecentPostEntry {
  post: Post;
  receivedAt: string;
}

// WebSocket state interface
interface WebSocketState {
  // Connection state
  connectionState: ConnectionState;
  isConnected: boolean;
  lastConnected: string | null;
  lastDisconnected: string | null;

  // Real-time data cache (for optimistic updates)
  recentPosts: RecentPostEntry[];
  agentStatusUpdates: Record<string, AgentStatusUpdate>;
  recentActivities: ActivityEntry[];
  recentInsights: Insight[];

  // Actions
  setConnectionState: (state: ConnectionState) => void;
  setConnected: () => void;
  setDisconnected: () => void;

  // Real-time update handlers
  handleNewPost: (post: Post) => void;
  handleAgentStatus: (agentId: string, status: string) => void;
  handleNewActivity: (activity: ActivityEntry) => void;
  handleNewInsight: (insight: Insight) => void;

  // Clear cache
  clearCache: () => void;

  // Get agent status
  getAgentStatus: (agentId: string) => AgentStatusUpdate | null;
}

// Create the WebSocket store
export const useWebSocketStore = create<WebSocketState>((set, get) => ({
  // Initial state
  connectionState: 'disconnected',
  isConnected: false,
  lastConnected: null,
  lastDisconnected: null,

  // Real-time data cache
  recentPosts: [],
  agentStatusUpdates: {},
  recentActivities: [],
  recentInsights: [],

  // Connection state actions
  setConnectionState: (state: ConnectionState) => {
    set({ connectionState: state, isConnected: state === 'connected' });

    const now = new Date().toISOString();
    if (state === 'connected') {
      set({ lastConnected: now, lastDisconnected: null });
    } else if (state === 'disconnected') {
      set({ lastDisconnected: now });
    }
  },

  setConnected: () => {
    set({
      connectionState: 'connected',
      isConnected: true,
      lastConnected: new Date().toISOString(),
      lastDisconnected: null,
    });
  },

  setDisconnected: () => {
    set({
      connectionState: 'disconnected',
      isConnected: false,
      lastDisconnected: new Date().toISOString(),
    });
  },

  // Real-time update handlers
  handleNewPost: (post: Post) => {
    const { recentPosts } = get();
    const newEntry: RecentPostEntry = {
      post,
      receivedAt: new Date().toISOString(),
    };

    // Add to beginning, keep only last 100
    set({
      recentPosts: [newEntry, ...recentPosts].slice(0, 100),
    });
  },

  handleAgentStatus: (agentId: string, status: string) => {
    set((state) => ({
      agentStatusUpdates: {
        ...state.agentStatusUpdates,
        [agentId]: {
          status,
          timestamp: new Date().toISOString(),
        },
      },
    }));
  },

  handleNewActivity: (activity: ActivityEntry) => {
    const { recentActivities } = get();
    // Add to beginning, keep only last 50
    set({
      recentActivities: [activity, ...recentActivities].slice(0, 50),
    });
  },

  handleNewInsight: (insight: Insight) => {
    const { recentInsights } = get();
    // Add to beginning, keep only last 20
    set({
      recentInsights: [insight, ...recentInsights].slice(0, 20),
    });
  },

  // Clear cache
  clearCache: () => {
    set({
      recentPosts: [],
      agentStatusUpdates: {},
      recentActivities: [],
      recentInsights: [],
    });
  },

  // Get agent status helper
  getAgentStatus: (agentId: string) => {
    return get().agentStatusUpdates[agentId] ?? null;
  },
}));

// Selectors for common use cases
export const selectIsConnected = (state: WebSocketState) => state.isConnected;
export const selectConnectionState = (state: WebSocketState) => state.connectionState;
export const selectRecentPosts = (state: WebSocketState) =>
  state.recentPosts.map((entry) => entry.post);
export const selectAgentStatus = (agentId: string) => (state: WebSocketState) =>
  state.agentStatusUpdates[agentId] ?? null;
