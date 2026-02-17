/**
 * React hook for WebSocket integration
 * Provides WebSocket connection management and event listening
 */

import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '@/lib/zustand/auth-store';
import {
  WebSocketClient,
  WebSocketClientConfig,
  ConnectionState,
  WebSocketEventListener,
  WebSocketEventType,
} from './client';

// Hook result type
interface UseWebSocketResult {
  state: ConnectionState;
  connect: () => void;
  disconnect: () => void;
  subscribe: (channelId: string) => void;
  unsubscribe: (channelId: string) => void;
  on: <T = unknown>(event: WebSocketEventType, listener: WebSocketEventListener<T>) => () => void;
  isConnected: boolean;
}

// Get WebSocket URL based on current location
function getWebSocketUrl(): string {
  if (typeof window === 'undefined') {
    return 'ws://localhost:3000/ws';
  }

  // Check for env var first
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }

  // Derive from current location
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  return `${protocol}//${host}/ws`;
}

/**
 * useWebSocket hook
 * Manages WebSocket connection with auth token integration
 */
export function useWebSocket(): UseWebSocketResult {
  const clientRef = useRef<WebSocketClient | null>(null);
  const [state, setState] = useState<ConnectionState>('disconnected');
  const token = useAuthStore((s) => s.token);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // Initialize client
  useEffect(() => {
    if (!clientRef.current) {
      const wsUrl = getWebSocketUrl();
      const config: WebSocketClientConfig = {
        url: wsUrl,
        token: () => token,
        reconnect: true,
        pollingFallback: true,
        onConnectionChange: setState,
      };

      clientRef.current = new WebSocketClient(config);
    }

    return () => {
      // Don't destroy on unmount - keep for hot reload
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect/disconnect based on authentication state
  useEffect(() => {
    if (isAuthenticated && state === 'disconnected') {
      clientRef.current?.connect();
    } else if (!isAuthenticated && state !== 'disconnected') {
      clientRef.current?.disconnect();
    }
  }, [isAuthenticated, state]);

  const connect = () => {
    clientRef.current?.connect();
  };

  const disconnect = () => {
    clientRef.current?.disconnect();
  };

  const subscribe = (channelId: string) => {
    clientRef.current?.subscribe(channelId);
  };

  const unsubscribe = (channelId: string) => {
    clientRef.current?.unsubscribe(channelId);
  };

  const on = <T = unknown>(event: WebSocketEventType, listener: WebSocketEventListener<T>) => {
    return clientRef.current?.on(event, listener) || (() => {});
  };

  return {
    state,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    on,
    isConnected: state === 'connected',
  };
}
