/**
 * WebSocket Provider
 * Wraps the dashboard to provide WebSocket connection and real-time updates
 */

'use client';

import React, { useEffect } from 'react';
import { useWebSocket } from '@/lib/websocket';
import { useWebSocketStore } from '@/lib/zustand/ws-store';
import { useQueryClient } from '@tanstack/react-query';

// Query keys that should be invalidated on events
const QUERY_KEYS_TO_INVALIDATE: Record<string, string[][]> = {
  'post:new': [['posts'], ['channels']],
  'agent:status': [['agents'], ['activity']],
  'activity:new': [['activity']],
  'insight:new': [['insights']],
};

export interface WebSocketProviderProps {
  children: React.ReactNode;
}

/**
 * WebSocket Provider Component
 * Establishes WebSocket connection and handles real-time updates
 */
export function WebSocketProvider({ children }: WebSocketProviderProps) {
  const { state, connect, on } = useWebSocket();
  const setConnectionState = useWebSocketStore((s) => s.setConnectionState);
  const handleNewPost = useWebSocketStore((s) => s.handleNewPost);
  const handleAgentStatus = useWebSocketStore((s) => s.handleAgentStatus);
  const handleNewActivity = useWebSocketStore((s) => s.handleNewActivity);
  const handleNewInsight = useWebSocketStore((s) => s.handleNewInsight);
  const queryClient = useQueryClient();

  // Update store when connection state changes
  useEffect(() => {
    setConnectionState(state);
  }, [state, setConnectionState]);

  // Set up event listeners
  useEffect(() => {
    const unsubscribes: (() => void)[] = [];

    // New post event
    unsubscribes.push(
      on('post:new', (data: unknown) => {
        handleNewPost(data as Parameters<typeof handleNewPost>[0]);

        // Invalidate relevant queries
        QUERY_KEYS_TO_INVALIDATE['post:new'].forEach((key) => {
          queryClient.invalidateQueries({ queryKey: key });
        });
      })
    );

    // Agent status event
    unsubscribes.push(
      on('agent:status', (data: unknown) => {
        const eventData = data as { agentId: string; status: string };
        if (eventData.agentId && eventData.status) {
          handleAgentStatus(eventData.agentId, eventData.status);
          queryClient.invalidateQueries({ queryKey: ['agents'] });
        }
      })
    );

    // New activity event
    unsubscribes.push(
      on('activity:new', (data: unknown) => {
        handleNewActivity(data as Parameters<typeof handleNewActivity>[0]);
        queryClient.invalidateQueries({ queryKey: ['activity'] });
      })
    );

    // New insight event
    unsubscribes.push(
      on('insight:new', (data: unknown) => {
        handleNewInsight(data as Parameters<typeof handleNewInsight>[0]);
        queryClient.invalidateQueries({ queryKey: ['insights'] });
      })
    );

    // Cleanup
    return () => {
      unsubscribes.forEach((unsub) => unsub());
    };
  }, [on, handleNewPost, handleAgentStatus, handleNewActivity, handleNewInsight, queryClient]);

  // Handle visibility change - reconnect when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && state !== 'connected') {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state, connect]);

  return <>{children}</>;
}

/**
 * Hook to access WebSocket connection state
 */
export function useWebSocketConnection() {
  const isConnected = useWebSocketStore((s) => s.isConnected);
  const connectionState = useWebSocketStore((s) => s.connectionState);
  const lastConnected = useWebSocketStore((s) => s.lastConnected);

  return {
    isConnected,
    connectionState,
    lastConnected,
  };
}
