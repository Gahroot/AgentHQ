import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockWsInstance: any;

vi.mock('ws', () => {
  const MockWebSocket = vi.fn().mockImplementation(function (this: any) {
    this.on = vi.fn();
    this.send = vi.fn();
    this.close = vi.fn();
    this.readyState = 1;
    mockWsInstance = this;
  });
  (MockWebSocket as any).OPEN = 1;
  return { default: MockWebSocket };
});

const mockFetch = vi.fn();
global.fetch = mockFetch;

import { AgentHQClient } from './client';
import WebSocket from 'ws';

function createSuccessResponse(data: any) {
  return {
    ok: true,
    json: () => Promise.resolve({ success: true, data }),
  };
}

function createErrorResponse(code: string, message: string) {
  return {
    ok: false,
    json: () =>
      Promise.resolve({ success: false, error: { code, message } }),
  };
}

function getWsCallback(event: string) {
  const call = mockWsInstance.on.mock.calls.find(
    (c: any[]) => c[0] === event,
  );
  return call ? call[1] : undefined;
}

describe('AgentHQClient', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    mockWsInstance = null;
  });

  // ============================================================
  // Constructor tests
  // ============================================================

  describe('constructor', () => {
    it('creates client with apiKey config', () => {
      const client = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
        apiKey: 'ahq_test123',
      });
      expect(client).toBeInstanceOf(AgentHQClient);
    });

    it('creates client with jwtToken config', () => {
      const client = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
        jwtToken: 'jwt_test_token',
      });
      expect(client).toBeInstanceOf(AgentHQClient);
    });

    it('normalizes baseUrl by removing trailing slash', () => {
      const client = new AgentHQClient({
        hubUrl: 'https://hub.example.com/',
        apiKey: 'ahq_test123',
      });

      mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

      // Trigger a request so we can inspect the URL passed to fetch
      client.listAgents();

      const calledUrl = mockFetch.mock.calls[0][0];
      expect(calledUrl).toMatch(/^https:\/\/hub\.example\.com\/api\//);
      expect(calledUrl).not.toMatch(/\.com\/\/api/);
    });

    it('sets default heartbeat and reconnect intervals', () => {
      const client = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
        apiKey: 'ahq_key',
      });
      expect(client).toBeInstanceOf(AgentHQClient);
    });

    it('uses custom heartbeat and reconnect intervals when provided', () => {
      const client = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
        apiKey: 'ahq_key',
        heartbeatInterval: 30000,
        reconnectInterval: 10000,
      });
      expect(client).toBeInstanceOf(AgentHQClient);
    });
  });

  // ============================================================
  // Auth tests
  // ============================================================

  describe('auth', () => {
    it('uses apiKey when both apiKey and jwtToken are provided', async () => {
      const client = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
        apiKey: 'ahq_primary',
        jwtToken: 'jwt_fallback',
      });

      mockFetch.mockResolvedValueOnce(createSuccessResponse([]));
      await client.listAgents();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer ahq_primary');
    });

    it('falls back to jwtToken when no apiKey is provided', async () => {
      const client = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
        jwtToken: 'jwt_fallback',
      });

      mockFetch.mockResolvedValueOnce(createSuccessResponse([]));
      await client.listAgents();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer jwt_fallback');
    });

    it('includes Bearer token in request headers', async () => {
      const client = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
        apiKey: 'ahq_bearer_test',
      });

      mockFetch.mockResolvedValueOnce(createSuccessResponse([]));
      await client.listAgents();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBe('Bearer ahq_bearer_test');
      expect(headers['Content-Type']).toBe('application/json');
    });

    it('sends no Authorization header when neither apiKey nor jwtToken provided', async () => {
      const client = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
      });

      mockFetch.mockResolvedValueOnce(createSuccessResponse([]));
      await client.listAgents();

      const headers = mockFetch.mock.calls[0][1].headers;
      expect(headers.Authorization).toBeUndefined();
    });
  });

  // ============================================================
  // HTTP request tests
  // ============================================================

  describe('HTTP requests', () => {
    let client: AgentHQClient;

    beforeEach(() => {
      client = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
        apiKey: 'ahq_testkey',
      });
    });

    // --- listAgents ---

    describe('listAgents', () => {
      it('calls GET /api/v1/agents with correct headers', async () => {
        const expectedData = [{ id: 'agent1', name: 'Agent One' }];
        mockFetch.mockResolvedValueOnce(createSuccessResponse(expectedData));

        const result = await client.listAgents();

        expect(mockFetch).toHaveBeenCalledTimes(1);
        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/api/v1/agents');
        expect(options.method).toBe('GET');
        expect(options.headers.Authorization).toBe('Bearer ahq_testkey');
        expect(result.data).toEqual(expectedData);
      });

      it('includes query params when page and limit are provided', async () => {
        const expectedData = [{ id: 'agent2' }];
        mockFetch.mockResolvedValueOnce(createSuccessResponse(expectedData));

        await client.listAgents({ page: 2, limit: 10 });

        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('page=2');
        expect(url).toContain('limit=10');
      });

      it('uses default page=1 and limit=20 when no params given', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.listAgents();

        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('page=1');
        expect(url).toContain('limit=20');
      });
    });

    // --- getAgent ---

    describe('getAgent', () => {
      it('calls GET /api/v1/agents/{id}', async () => {
        const expectedData = { id: 'agent123', name: 'Test Agent' };
        mockFetch.mockResolvedValueOnce(createSuccessResponse(expectedData));

        const result = await client.getAgent('agent123');

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/api/v1/agents/agent123');
        expect(options.method).toBe('GET');
        expect(result.data).toEqual(expectedData);
      });
    });

    // --- createPost ---

    describe('createPost', () => {
      it('calls POST /api/v1/posts with JSON body', async () => {
        const input = {
          channel_id: 'ch_123',
          content: 'Hello hub',
          type: 'update' as const,
          title: 'Test Post',
        };
        const expectedData = { id: 'post_1', ...input };
        mockFetch.mockResolvedValueOnce(createSuccessResponse(expectedData));

        const result = await client.createPost(input);

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/api/v1/posts');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body)).toEqual(input);
        expect(result.data).toEqual(expectedData);
      });
    });

    // --- listPosts ---

    describe('listPosts', () => {
      it('includes filter params when channel_id and type are provided', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.listPosts({ channel_id: 'ch_1', type: 'alert' });

        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('channel_id=ch_1');
        expect(url).toContain('type=alert');
      });

      it('includes author_id filter param', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.listPosts({ author_id: 'user_42' });

        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('author_id=user_42');
      });

      it('includes pagination params', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.listPosts({ page: 3, limit: 5 });

        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('page=3');
        expect(url).toContain('limit=5');
      });

      it('omits empty filter values from URL params', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.listPosts();

        const url = mockFetch.mock.calls[0][0];
        expect(url).not.toContain('channel_id=');
        expect(url).not.toContain('type=');
        expect(url).not.toContain('author_id=');
      });
    });

    // --- searchPosts ---

    describe('searchPosts', () => {
      it('calls GET /api/v1/posts/search with q param', async () => {
        const expectedData = [{ id: 'post_1', content: 'match' }];
        mockFetch.mockResolvedValueOnce(createSuccessResponse(expectedData));

        const result = await client.searchPosts('market trends');

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/api/v1/posts/search');
        expect(url).toContain('q=market+trends');
        expect(options.method).toBe('GET');
        expect(result.data).toEqual(expectedData);
      });

      it('includes pagination params', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.searchPosts('test', { page: 2, limit: 5 });

        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('page=2');
        expect(url).toContain('limit=5');
      });
    });

    // --- listChannels ---

    describe('listChannels', () => {
      it('calls GET /api/v1/channels', async () => {
        const expectedData = [{ id: 'ch_1', name: 'general' }];
        mockFetch.mockResolvedValueOnce(createSuccessResponse(expectedData));

        const result = await client.listChannels();

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/api/v1/channels');
        expect(options.method).toBe('GET');
        expect(result.data).toEqual(expectedData);
      });
    });

    // --- logActivity ---

    describe('logActivity', () => {
      it('calls POST /api/v1/activity with JSON body', async () => {
        const input = {
          action: 'listing.created',
          resource_type: 'listing',
          resource_id: 'lst_001',
          details: { price: 500000 },
        };
        const expectedData = { id: 'act_1', ...input };
        mockFetch.mockResolvedValueOnce(createSuccessResponse(expectedData));

        const result = await client.logActivity(input);

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/api/v1/activity');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body)).toEqual(input);
        expect(result.data).toEqual(expectedData);
      });
    });

    // --- queryActivity ---

    describe('queryActivity', () => {
      it('includes filter params for actor_id and action', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.queryActivity({
          actor_id: 'agent_1',
          action: 'listing.created',
        });

        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('actor_id=agent_1');
        expect(url).toContain('action=listing.created');
      });

      it('includes date range params', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.queryActivity({
          from: '2026-01-01',
          to: '2026-02-01',
        });

        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('from=2026-01-01');
        expect(url).toContain('to=2026-02-01');
      });

      it('includes pagination params', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.queryActivity({ page: 2, limit: 50 });

        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('page=2');
        expect(url).toContain('limit=50');
      });

      it('omits empty filter values from URL params', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.queryActivity();

        const url = mockFetch.mock.calls[0][0];
        expect(url).not.toContain('actor_id=');
        expect(url).not.toContain('action=');
        expect(url).not.toContain('from=');
        expect(url).not.toContain('to=');
      });
    });

    // --- listInsights ---

    describe('listInsights', () => {
      it('includes type filter param', async () => {
        const expectedData = [{ id: 'ins_1', type: 'trend' }];
        mockFetch.mockResolvedValueOnce(createSuccessResponse(expectedData));

        const result = await client.listInsights({ type: 'trend' });

        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('/api/v1/insights');
        expect(url).toContain('type=trend');
        expect(result.data).toEqual(expectedData);
      });

      it('includes pagination params', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.listInsights({ page: 3, limit: 15 });

        const url = mockFetch.mock.calls[0][0];
        expect(url).toContain('page=3');
        expect(url).toContain('limit=15');
      });

      it('omits empty type filter from URL params', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse([]));

        await client.listInsights();

        const url = mockFetch.mock.calls[0][0];
        expect(url).not.toContain('type=');
      });
    });


    // --- heartbeat ---

    describe('heartbeat', () => {
      it('calls POST /api/v1/agents/{id}/heartbeat with status', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse(null));

        await client.heartbeat('agent_42', 'online');

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/api/v1/agents/agent_42/heartbeat');
        expect(options.method).toBe('POST');
        expect(JSON.parse(options.body)).toEqual({ status: 'online' });
      });

      it('calls heartbeat without status', async () => {
        mockFetch.mockResolvedValueOnce(createSuccessResponse(null));

        await client.heartbeat('agent_42');

        const [url, options] = mockFetch.mock.calls[0];
        expect(url).toContain('/api/v1/agents/agent_42/heartbeat');
        expect(JSON.parse(options.body)).toEqual({ status: undefined });
      });
    });

    // --- Error handling ---

    describe('error handling', () => {
      it('throws on API error response', async () => {
        mockFetch.mockResolvedValueOnce(
          createErrorResponse('NOT_FOUND', 'Agent not found'),
        );

        await expect(client.getAgent('nonexistent')).rejects.toThrow(
          'NOT_FOUND: Agent not found',
        );
      });

      it('throws with correct error code and message format', async () => {
        mockFetch.mockResolvedValueOnce(
          createErrorResponse('UNAUTHORIZED', 'Invalid API key'),
        );

        await expect(client.listAgents()).rejects.toThrow(
          'UNAUTHORIZED: Invalid API key',
        );
      });

      it('propagates fetch errors', async () => {
        mockFetch.mockRejectedValueOnce(new Error('Network error'));

        await expect(client.listAgents()).rejects.toThrow('Network error');
      });
    });
  });

  // ============================================================
  // Event system tests
  // ============================================================

  describe('event system', () => {
    let client: AgentHQClient;

    beforeEach(() => {
      client = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
        apiKey: 'ahq_testkey',
      });
    });

    it('on(event, handler) registers handler and receives events', () => {
      // Register a handler for 'connected' event (emitted on ws open)
      const connectedHandler = vi.fn();
      client.on('connected', connectedHandler);

      client.connect();

      // Fire the open event
      getWsCallback('open')();

      expect(connectedHandler).toHaveBeenCalledWith({});

      client.disconnect();
    });

    it('off(event, handler) removes handler', () => {
      const connectedHandler = vi.fn();
      client.on('connected', connectedHandler);
      client.off('connected', connectedHandler);

      client.connect();
      getWsCallback('open')();

      expect(connectedHandler).not.toHaveBeenCalled();

      client.disconnect();
    });

    it('off does nothing if handler was never registered', () => {
      const handler = vi.fn();
      expect(() => client.off('nonexistent', handler)).not.toThrow();
    });

    it('off does nothing if the handler is not in the array', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      client.on('myevent', handler1);
      expect(() => client.off('myevent', handler2)).not.toThrow();
    });

    it('supports multiple handlers for the same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      client.on('connected', handler1);
      client.on('connected', handler2);

      client.connect();
      getWsCallback('open')();

      expect(handler1).toHaveBeenCalledWith({});
      expect(handler2).toHaveBeenCalledWith({});

      client.disconnect();
    });

    it('emits message events with parsed data', () => {
      const handler = vi.fn();
      client.on('post:new', handler);

      client.connect();

      const msgData = { event: 'post:new', data: { id: 'post_1' } };
      getWsCallback('message')(JSON.stringify(msgData));

      expect(handler).toHaveBeenCalledWith({ id: 'post_1' });

      client.disconnect();
    });

    it('ignores malformed WebSocket messages', () => {
      const handler = vi.fn();
      client.on('post:new', handler);

      client.connect();

      expect(() => getWsCallback('message')('not-valid-json{')).not.toThrow();
      expect(handler).not.toHaveBeenCalled();

      client.disconnect();
    });

    it('emits disconnected event on close', () => {
      vi.useFakeTimers();

      const disconnectedHandler = vi.fn();
      client.on('disconnected', disconnectedHandler);

      client.connect();
      getWsCallback('open')();
      getWsCallback('close')();

      expect(disconnectedHandler).toHaveBeenCalledWith({});
      expect(client.isConnected()).toBe(false);

      client.disconnect();
      vi.useRealTimers();
    });

    it('emits error event on WebSocket error', () => {
      const errorHandler = vi.fn();
      client.on('error', errorHandler);

      client.connect();
      getWsCallback('error')(new Error('Connection refused'));

      expect(errorHandler).toHaveBeenCalledWith({
        error: 'Connection refused',
      });

      client.disconnect();
    });
  });

  // ============================================================
  // WebSocket tests
  // ============================================================

  describe('WebSocket', () => {
    let client: AgentHQClient;
    const MockWs = WebSocket as unknown as ReturnType<typeof vi.fn>;

    beforeEach(() => {
      client = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
        apiKey: 'ahq_wskey',
      });
    });

    it('connect() creates WebSocket with correct URL and auth token', () => {
      client.connect();

      expect(MockWs).toHaveBeenCalled();
      const wsUrl = MockWs.mock.calls[MockWs.mock.calls.length - 1][0];
      expect(wsUrl).toBe('wss://hub.example.com/ws?token=ahq_wskey');
    });

    it('connect() replaces http with ws in URL', () => {
      const httpClient = new AgentHQClient({
        hubUrl: 'http://localhost:3000',
        apiKey: 'ahq_local',
      });

      httpClient.connect();

      const wsUrl = MockWs.mock.calls[MockWs.mock.calls.length - 1][0];
      expect(wsUrl).toBe('ws://localhost:3000/ws?token=ahq_local');

      httpClient.disconnect();
    });

    it('connect() uses jwtToken in WebSocket URL when no apiKey', () => {
      const jwtClient = new AgentHQClient({
        hubUrl: 'https://hub.example.com',
        jwtToken: 'jwt_ws_token',
      });

      jwtClient.connect();

      const wsUrl = MockWs.mock.calls[MockWs.mock.calls.length - 1][0];
      expect(wsUrl).toContain('token=jwt_ws_token');

      jwtClient.disconnect();
    });

    it('disconnect() closes WebSocket', () => {
      client.connect();
      const wsRef = mockWsInstance;

      client.disconnect();

      expect(wsRef.close).toHaveBeenCalled();
    });

    it('disconnect() sets connected to false', () => {
      client.connect();
      getWsCallback('open')();
      expect(client.isConnected()).toBe(true);

      client.disconnect();
      expect(client.isConnected()).toBe(false);
    });

    it('disconnect() clears reconnect timer', () => {
      vi.useFakeTimers();

      const callCountBefore = MockWs.mock.calls.length;

      client.connect();
      getWsCallback('close')();

      // Now disconnect -- should clear the reconnect timer
      client.disconnect();

      // Advance time past reconnect interval; no new WS should be created
      vi.advanceTimersByTime(10000);

      // Only the one connect call from this test, no reconnect
      expect(MockWs.mock.calls.length).toBe(callCountBefore + 1);

      vi.useRealTimers();
    });

    it('disconnect() is safe to call when not connected', () => {
      expect(() => client.disconnect()).not.toThrow();
    });

    it('isConnected() returns false initially', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('isConnected() returns true after open event', () => {
      client.connect();
      getWsCallback('open')();

      expect(client.isConnected()).toBe(true);

      client.disconnect();
    });

    it('subscribe(channel) sends subscribe message', () => {
      client.connect();
      getWsCallback('open')();

      client.subscribe('general');

      expect(mockWsInstance.send).toHaveBeenCalledWith(
        JSON.stringify({ event: 'subscribe', data: { channel: 'general' } }),
      );

      client.disconnect();
    });

    it('unsubscribe(channel) sends unsubscribe message', () => {
      client.connect();
      getWsCallback('open')();

      client.unsubscribe('general');

      expect(mockWsInstance.send).toHaveBeenCalledWith(
        JSON.stringify({
          event: 'unsubscribe',
          data: { channel: 'general' },
        }),
      );

      client.disconnect();
    });

    it('subscribe does not send if not connected', () => {
      client.connect();

      // Do NOT trigger open -- still disconnected
      client.subscribe('general');

      expect(mockWsInstance.send).not.toHaveBeenCalled();

      client.disconnect();
    });

    it('unsubscribe does not send if not connected', () => {
      client.connect();

      client.unsubscribe('general');

      expect(mockWsInstance.send).not.toHaveBeenCalled();

      client.disconnect();
    });

    it('starts heartbeat on connect and stops on disconnect', () => {
      vi.useFakeTimers();

      client.connect();
      getWsCallback('open')();

      // Advance time to trigger heartbeat (default 60000ms)
      vi.advanceTimersByTime(60000);

      // Should have sent a heartbeat message
      const sentMessages = mockWsInstance.send.mock.calls.map((c: any[]) =>
        JSON.parse(c[0]),
      );
      expect(sentMessages).toContainEqual({
        event: 'heartbeat',
        data: {},
      });

      // Disconnect should stop heartbeat
      const wsRef = mockWsInstance;
      client.disconnect();

      wsRef.send.mockClear();
      vi.advanceTimersByTime(120000);

      // No more heartbeats should be sent after disconnect
      expect(wsRef.send).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it('schedules reconnect on close with default interval', () => {
      vi.useFakeTimers();

      const callCountBefore = MockWs.mock.calls.length;

      client.connect();
      getWsCallback('close')();

      // Before the interval, no reconnect
      expect(MockWs.mock.calls.length).toBe(callCountBefore + 1);

      // Advance past the default 5000ms reconnect interval
      vi.advanceTimersByTime(5000);

      // A second WebSocket should have been created
      expect(MockWs.mock.calls.length).toBe(callCountBefore + 2);

      client.disconnect();
      vi.useRealTimers();
    });
  });
});
