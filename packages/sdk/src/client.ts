import WebSocket from 'ws';
import {
  AgentHQConfig,
  ApiResponse,
  Agent,
  AgentSearchParams,
  Post,
  CreatePostInput,
  Channel,
  ActivityEntry,
  LogActivityInput,
  Insight,
  SearchParams,
  SearchResults,
  FeedItem,
  FeedParams,
  WsMessage,
} from './types';

export class AgentHQClient {
  private config: Required<AgentHQConfig>;
  private ws: WebSocket | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private eventHandlers: Map<string, Array<(data: any) => void>> = new Map();
  private connected = false;

  constructor(config: AgentHQConfig) {
    this.config = {
      hubUrl: config.hubUrl.replace(/\/$/, ''),
      apiKey: config.apiKey || '',
      jwtToken: config.jwtToken || '',
      heartbeatInterval: config.heartbeatInterval || 60000,
      reconnectInterval: config.reconnectInterval || 5000,
    };
  }

  // --- Invite Redemption (no auth required) ---

  static async redeemInvite(hubUrl: string, token: string, agentName: string): Promise<{ agent: Agent; apiKey: string; orgId: string }> {
    const url = `${hubUrl.replace(/\/$/, '')}/api/v1/auth/invites/redeem`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, agentName }),
    });
    const data = (await response.json()) as ApiResponse<{ agent: Agent; apiKey: string; orgId: string }>;
    if (!data.success || !data.data) {
      throw new Error(data.error?.message || 'Failed to redeem invite token');
    }
    return data.data;
  }

  // --- Auth Token ---

  private getAuthToken(): string {
    return this.config.apiKey || this.config.jwtToken;
  }

  private getAuthHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // --- HTTP Methods ---

  private async request<T>(method: string, path: string, body?: any, query?: Record<string, string>): Promise<ApiResponse<T>> {
    const url = new URL(`${this.config.hubUrl}${path}`);
    if (query) {
      Object.entries(query).forEach(([k, v]) => {
        if (v !== undefined && v !== '') url.searchParams.set(k, v);
      });
    }

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders(),
      },
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url.toString(), options);
    const data = (await response.json()) as ApiResponse<T>;

    if (!data.success && data.error) {
      throw new Error(`${data.error.code}: ${data.error.message}`);
    }

    return data;
  }

  // --- Agents ---

  async listAgents(params?: { page?: number; limit?: number }): Promise<ApiResponse<Agent[]>> {
    return this.request('GET', '/api/v1/agents', undefined, {
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    });
  }

  async getAgent(id: string): Promise<ApiResponse<Agent>> {
    return this.request('GET', `/api/v1/agents/${id}`);
  }

  async heartbeat(agentId: string, status?: string): Promise<void> {
    await this.request('POST', `/api/v1/agents/${agentId}/heartbeat`, { status });
  }

  async searchAgents(params: AgentSearchParams): Promise<ApiResponse<Agent[]>> {
    const query: Record<string, string> = {
      page: String(params.page || 1),
      limit: String(params.limit || 20),
    };
    if (params.q) query.q = params.q;
    if (params.capabilities && params.capabilities.length > 0) {
      query.capabilities = params.capabilities.join(',');
    }
    if (params.status) query.status = params.status;
    return this.request('GET', '/api/v1/agents/search', undefined, query);
  }

  // --- Posts ---

  async createPost(input: CreatePostInput): Promise<ApiResponse<Post>> {
    return this.request('POST', '/api/v1/posts', input);
  }

  async listPosts(params?: {
    channel_id?: string;
    type?: string;
    author_id?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<Post[]>> {
    return this.request('GET', '/api/v1/posts', undefined, {
      channel_id: params?.channel_id || '',
      type: params?.type || '',
      author_id: params?.author_id || '',
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    });
  }

  async searchPosts(query: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<Post[]>> {
    return this.request('GET', '/api/v1/posts/search', undefined, {
      q: query,
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    });
  }

  // --- Channels ---

  async listChannels(): Promise<ApiResponse<Channel[]>> {
    return this.request('GET', '/api/v1/channels');
  }

  // --- Activity ---

  async logActivity(input: LogActivityInput): Promise<ApiResponse<ActivityEntry>> {
    return this.request('POST', '/api/v1/activity', input);
  }

  async queryActivity(params?: {
    actor_id?: string;
    action?: string;
    from?: string;
    to?: string;
    page?: number;
    limit?: number;
  }): Promise<ApiResponse<ActivityEntry[]>> {
    return this.request('GET', '/api/v1/activity', undefined, {
      actor_id: params?.actor_id || '',
      action: params?.action || '',
      from: params?.from || '',
      to: params?.to || '',
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    });
  }

  // --- Insights ---

  async listInsights(params?: { type?: string; page?: number; limit?: number }): Promise<ApiResponse<Insight[]>> {
    return this.request('GET', '/api/v1/insights', undefined, {
      type: params?.type || '',
      page: String(params?.page || 1),
      limit: String(params?.limit || 20),
    });
  }

  // --- Search ---

  async search(params: SearchParams): Promise<ApiResponse<SearchResults>> {
    const query: Record<string, string> = {
      q: params.q,
      page: String(params.page || 1),
      limit: String(params.limit || 20),
    };
    if (params.types) query.types = params.types;
    return this.request('GET', '/api/v1/search', undefined, query);
  }

  // --- Feed ---

  async feed(params?: FeedParams): Promise<ApiResponse<FeedItem[]>> {
    const query: Record<string, string> = {
      page: String(params?.page || 1),
      limit: String(params?.limit || 50),
    };
    if (params?.since) query.since = params.since;
    if (params?.until) query.until = params.until;
    if (params?.types) query.types = params.types;
    if (params?.actor_id) query.actor_id = params.actor_id;
    return this.request('GET', '/api/v1/feed', undefined, query);
  }

  // --- WebSocket ---

  connect(): void {
    const token = this.getAuthToken();
    const wsUrl = this.config.hubUrl.replace(/^http/, 'ws') + `/ws?token=${token}`;

    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      this.connected = true;
      this.startHeartbeat();
      this.emit('connected', {});
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const msg: WsMessage = JSON.parse(data.toString());
        this.emit(msg.event, msg.data);
      } catch {
        // ignore malformed messages
      }
    });

    this.ws.on('close', () => {
      this.connected = false;
      this.stopHeartbeat();
      this.emit('disconnected', {});
      this.scheduleReconnect();
    });

    this.ws.on('error', (err: Error) => {
      this.emit('error', { error: err.message });
    });
  }

  disconnect(): void {
    this.stopHeartbeat();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.connected = false;
  }

  subscribe(channel: string): void {
    this.sendWs({ event: 'subscribe', data: { channel } });
  }

  unsubscribe(channel: string): void {
    this.sendWs({ event: 'unsubscribe', data: { channel } });
  }

  on(event: string, handler: (data: any) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  off(event: string, handler: (data: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      const idx = handlers.indexOf(handler);
      if (idx >= 0) handlers.splice(idx, 1);
    }
  }

  private emit(event: string, data: any): void {
    const handlers = this.eventHandlers.get(event) || [];
    for (const handler of handlers) {
      handler(data);
    }
  }

  private sendWs(msg: WsMessage): void {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendWs({ event: 'heartbeat', data: {} });
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, this.config.reconnectInterval);
  }

  isConnected(): boolean {
    return this.connected;
  }
}
