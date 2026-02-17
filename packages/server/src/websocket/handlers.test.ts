import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebSocket } from 'ws';
import { handleWsMessage, WsClient } from './handlers';

function createMockClient(): WsClient {
  return {
    ws: {
      readyState: WebSocket.OPEN,
      send: vi.fn(),
    } as any,
    id: 'client-1',
    type: 'user',
    orgId: 'org-1',
    subscriptions: new Set<string>(),
  };
}

describe('handleWsMessage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('subscribe event', () => {
    it('adds the channel to client subscriptions', () => {
      const client = createMockClient();

      handleWsMessage(client, { event: 'subscribe', data: { channel: 'general' } });

      expect(client.subscriptions.has('general')).toBe(true);
    });

    it('sends a subscribed confirmation', () => {
      const client = createMockClient();

      handleWsMessage(client, { event: 'subscribe', data: { channel: 'general' } });

      expect(client.ws.send).toHaveBeenCalledWith(
        JSON.stringify({ event: 'subscribed', data: { channel: 'general' } })
      );
    });

    it('does not add subscription when channel is missing', () => {
      const client = createMockClient();

      handleWsMessage(client, { event: 'subscribe', data: {} });

      expect(client.subscriptions.size).toBe(0);
      expect(client.ws.send).not.toHaveBeenCalled();
    });
  });

  describe('unsubscribe event', () => {
    it('removes the channel from client subscriptions', () => {
      const client = createMockClient();
      client.subscriptions.add('general');

      handleWsMessage(client, { event: 'unsubscribe', data: { channel: 'general' } });

      expect(client.subscriptions.has('general')).toBe(false);
    });

    it('sends an unsubscribed confirmation', () => {
      const client = createMockClient();
      client.subscriptions.add('general');

      handleWsMessage(client, { event: 'unsubscribe', data: { channel: 'general' } });

      expect(client.ws.send).toHaveBeenCalledWith(
        JSON.stringify({ event: 'unsubscribed', data: { channel: 'general' } })
      );
    });

    it('does not send when channel is missing', () => {
      const client = createMockClient();

      handleWsMessage(client, { event: 'unsubscribe', data: {} });

      expect(client.ws.send).not.toHaveBeenCalled();
    });
  });

  describe('heartbeat event', () => {
    it('sends heartbeat_ack with a timestamp', () => {
      const client = createMockClient();

      handleWsMessage(client, { event: 'heartbeat' });

      expect(client.ws.send).toHaveBeenCalledTimes(1);
      const sent = JSON.parse((client.ws.send as any).mock.calls[0][0]);
      expect(sent.event).toBe('heartbeat_ack');
      expect(sent.data).toHaveProperty('timestamp');
      // Verify timestamp is a valid ISO string
      expect(new Date(sent.data.timestamp).toISOString()).toBe(sent.data.timestamp);
    });
  });

  describe('unknown event', () => {
    it('does not send anything to the client', () => {
      const client = createMockClient();

      handleWsMessage(client, { event: 'unknown_event', data: {} });

      expect(client.ws.send).not.toHaveBeenCalled();
    });

    it('does not throw', () => {
      const client = createMockClient();

      expect(() => handleWsMessage(client, { event: 'foo', data: {} })).not.toThrow();
    });
  });

  describe('ws.readyState is not OPEN', () => {
    it('does not send when connection is closed', () => {
      const client = createMockClient();
      (client.ws as any).readyState = WebSocket.CLOSED;

      handleWsMessage(client, { event: 'heartbeat' });

      expect(client.ws.send).not.toHaveBeenCalled();
    });
  });
});
