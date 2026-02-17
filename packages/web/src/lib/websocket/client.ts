/**
 * WebSocket client for AgentHQ real-time updates
 * Handles connection, reconnection, and event dispatching
 */

import { WsServerEvent } from '@/types';

// Configuration
const WS_RECONNECT_BASE_DELAY = 1000; // 1 second
const WS_RECONNECT_MAX_DELAY = 30000; // 30 seconds
const WS_POLLING_INTERVAL = 30000; // 30 seconds
const WS_HEARTBEAT_INTERVAL = 30000; // 30 seconds

// Event type that matches server events
export type WebSocketEventType = WsServerEvent;

// Event listener type
export type WebSocketEventListener<T = unknown> = (data: T) => void;

// Internal listener type (using unknown for all listeners)
type InternalEventListener = WebSocketEventListener<unknown>;

// Connection state
export type ConnectionState = 'connecting' | 'connected' | 'disconnected' | 'error';

// WebSocket client configuration
export interface WebSocketClientConfig {
  url: string;
  token: () => string | null;
  apiKey?: () => string | null;
  reconnect?: boolean;
  reconnectDelay?: number;
  pollingFallback?: boolean;
  onConnectionChange?: (state: ConnectionState) => void;
}

// Message from server
interface ServerMessage {
  event: string;
  data: unknown;
}

/**
 * WebSocket client class
 * Manages WebSocket connection with auto-reconnect and polling fallback
 */
export class WebSocketClient {
  private ws: WebSocket | null = null;
  private config: Required<WebSocketClientConfig>;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private pollingInterval: ReturnType<typeof setInterval> | null = null;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private listeners: Map<string, Set<InternalEventListener>> = new Map();
  private state: ConnectionState = 'disconnected';
  private reconnectAttempts = 0;

  constructor(config: WebSocketClientConfig) {
    this.config = {
      url: config.url,
      token: config.token,
      apiKey: config.apiKey ?? (() => null),
      reconnect: config.reconnect ?? true,
      reconnectDelay: config.reconnectDelay ?? WS_RECONNECT_BASE_DELAY,
      pollingFallback: config.pollingFallback ?? true,
      onConnectionChange: config.onConnectionChange ?? (() => {}),
    };
  }

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    const token = this.config.token();
    const apiKey = this.config.apiKey();

    if (!token && !apiKey) {
      this.setState('error');
      return;
    }

    this.setState('connecting');

    try {
      const url = new URL(this.config.url);

      // Use token if available, otherwise use API key
      if (token) {
        url.searchParams.set('token', token);
      } else if (apiKey) {
        url.searchParams.set('apiKey', apiKey);
      }

      this.ws = new WebSocket(url.toString());

      this.ws.onopen = () => {
        this.setState('connected');
        this.reconnectAttempts = 0;
        this.stopPolling();
        this.startHeartbeat();
      };

      this.ws.onclose = (event) => {
        this.setState('disconnected');
        this.ws = null;
        this.stopHeartbeat();

        if (this.config.reconnect && event.code !== 1000) {
          this.scheduleReconnect();
        } else if (this.config.pollingFallback) {
          this.startPolling();
        }
      };

      this.ws.onerror = () => {
        this.setState('error');
      };

      this.ws.onmessage = (event) => {
        try {
          const message: ServerMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch {
          // Ignore malformed messages
        }
      };
    } catch {
      this.setState('error');
      if (this.config.pollingFallback) {
        this.startPolling();
      }
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    this.config.reconnect = false; // Disable reconnect on manual disconnect
    this.clearReconnectTimeout();
    this.stopPolling();
    this.stopHeartbeat();

    if (this.ws) {
      this.ws.close(1000);
      this.ws = null;
    }

    this.setState('disconnected');
  }

  /**
   * Subscribe to a channel
   */
  subscribe(channelId: string): void {
    this.send({ event: 'subscribe', data: { channelId } });
  }

  /**
   * Unsubscribe from a channel
   */
  unsubscribe(channelId: string): void {
    this.send({ event: 'unsubscribe', data: { channelId } });
  }

  /**
   * Add event listener
   */
  on<T = unknown>(event: WebSocketEventType, listener: WebSocketEventListener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    // Store the listener with its original reference
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.add(listener as InternalEventListener);
    }

    // Return unsubscribe function
    return () => {
      const eventListeners = this.listeners.get(event);
      if (eventListeners) {
        eventListeners.delete(listener as InternalEventListener);
      }
    };
  }

  /**
   * Send a message to the server
   */
  private send(message: { event: string; data: unknown }): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  /**
   * Handle incoming message
   */
  private handleMessage(message: ServerMessage): void {
    const listeners = this.listeners.get(message.event as WebSocketEventType);
    if (listeners) {
      listeners.forEach((listener) => listener(message.data));
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.clearReconnectTimeout();

    const delay = Math.min(
      this.config.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      WS_RECONNECT_MAX_DELAY
    );

    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  /**
   * Clear reconnect timeout
   */
  private clearReconnectTimeout(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    this.heartbeatInterval = setInterval(() => {
      this.send({ event: 'heartbeat', data: { timestamp: Date.now() } });
    }, WS_HEARTBEAT_INTERVAL);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Start polling fallback
   */
  private startPolling(): void {
    if (this.pollingInterval) return;

    this.pollingInterval = setInterval(() => {
      // Poll for updates - this will trigger query invalidations
      // The actual polling is done by React Query's refetchOnWindowFocus
      this.setState('disconnected');
    }, WS_POLLING_INTERVAL);
  }

  /**
   * Stop polling fallback
   */
  private stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  /**
   * Update connection state
   */
  private setState(state: ConnectionState): void {
    if (this.state !== state) {
      this.state = state;
      this.config.onConnectionChange(state);
    }
  }

  /**
   * Get current connection state
   */
  getState(): ConnectionState {
    return this.state;
  }
}

/**
 * Create a singleton WebSocket client instance
 */
let wsClient: WebSocketClient | null = null;

export function getWebSocketClient(config?: WebSocketClientConfig): WebSocketClient {
  if (!wsClient && config) {
    wsClient = new WebSocketClient(config);
  }
  return wsClient!;
}
