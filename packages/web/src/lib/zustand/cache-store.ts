/**
 * Cache store for API responses
 * Used by WebSocket handlers to optimistically update data
 */

import { create } from 'zustand';
import type { Post, Agent, ActivityEntry, Insight, Channel } from '@/types';

// Cache entry with timestamp
interface CacheEntry<T> {
  data: T;
  timestamp: string;
}

// Cache state interface
interface CacheState {
  // Individual cache entries
  posts: Map<string, CacheEntry<Post>>;
  agents: Map<string, CacheEntry<Agent>>;
  activities: Map<string, CacheEntry<ActivityEntry>>;
  insights: Map<string, CacheEntry<Insight>>;
  channels: Map<string, CacheEntry<Channel>>;

  // Lists (for query results)
  postsList: CacheEntry<Post[]> | null;
  agentsList: CacheEntry<Agent[]> | null;
  activitiesList: CacheEntry<ActivityEntry[]> | null;
  insightsList: CacheEntry<Insight[]> | null;
  channelsList: CacheEntry<Channel[]> | null;

  // Actions
  set: <T>(key: string, data: T, category: 'posts' | 'agents' | 'activities' | 'insights' | 'channels') => void;
  get: <T>(key: string, category: 'posts' | 'agents' | 'activities' | 'insights' | 'channels') => T | null;
  setList: (category: 'posts' | 'agents' | 'activities' | 'insights' | 'channels', data: unknown[]) => void;
  getList: (category: 'posts' | 'agents' | 'activities' | 'insights' | 'channels') => unknown[] | null;
  invalidate: (category?: 'posts' | 'agents' | 'activities' | 'insights' | 'channels') => void;
  prependToList: (category: 'posts' | 'agents' | 'activities' | 'insights' | 'channels', item: unknown) => void;
  updateInList: (category: 'posts' | 'agents' | 'activities' | 'insights' | 'channels', id: string, updates: Record<string, unknown>) => void;
}

// Create the cache store
export const useCacheStore = create<CacheState>((set, get) => ({
  // Initial state
  posts: new Map(),
  agents: new Map(),
  activities: new Map(),
  insights: new Map(),
  channels: new Map(),
  postsList: null,
  agentsList: null,
  activitiesList: null,
  insightsList: null,
  channelsList: null,

  // Set a single cache entry
  set: <T>(key: string, data: T, category: 'posts' | 'agents' | 'activities' | 'insights' | 'channels') => {
    const state = get();
    const map = state[category] as Map<string, CacheEntry<T>>;
    const newMap = new Map(map);
    newMap.set(key, {
      data,
      timestamp: new Date().toISOString(),
    } as CacheEntry<T>);
    set({ [category]: newMap as unknown });
  },

  // Get a single cache entry
  get: <T>(key: string, category: 'posts' | 'agents' | 'activities' | 'insights' | 'channels') => {
    const state = get();
    const map = state[category] as Map<string, CacheEntry<T>>;
    const entry = map.get(key);
    return (entry?.data ?? null) as T | null;
  },

  // Set a list cache entry
  setList: (category, data) => {
    set({
      [`${category}List`]: {
        data,
        timestamp: new Date().toISOString(),
      } as CacheEntry<unknown[]>,
    });
  },

  // Get a list cache entry
  getList: (category) => {
    const state = get();
    const listKey = `${category}List` as keyof CacheState;
    const entry = state[listKey] as CacheEntry<unknown[]> | null;
    return entry?.data ?? null;
  },

  // Invalidate cache (category specific or all)
  invalidate: (category) => {
    if (category) {
      // Invalidate specific category
      set({
        [category]: new Map(),
        [`${category}List`]: null,
      });
    } else {
      // Invalidate all
      set({
        posts: new Map(),
        agents: new Map(),
        activities: new Map(),
        insights: new Map(),
        channels: new Map(),
        postsList: null,
        agentsList: null,
        activitiesList: null,
        insightsList: null,
        channelsList: null,
      });
    }
  },

  // Prepend an item to a list (for real-time updates)
  prependToList: (category, item) => {
    const state = get();
    const listKey = `${category}List` as keyof CacheState;
    const currentList = (state[listKey] as CacheEntry<unknown[]> | null)?.data ?? [];

    set({
      [listKey]: {
        data: [item, ...currentList],
        timestamp: new Date().toISOString(),
      } as CacheEntry<unknown[]>,
    });
  },

  // Update an item in a list (for status updates)
  updateInList: (category, id, updates) => {
    const state = get();
    const listKey = `${category}List` as keyof CacheState;
    const currentList = (state[listKey] as CacheEntry<unknown[]> | null)?.data ?? [];

    const newList = currentList.map((item) => {
      const record = item as Record<string, unknown> & { id?: string };
      if (record.id === id) {
        return { ...record, ...updates };
      }
      return item;
    });

    set({
      [listKey]: {
        data: newList,
        timestamp: new Date().toISOString(),
      } as CacheEntry<unknown[]>,
    });
  },
}));
