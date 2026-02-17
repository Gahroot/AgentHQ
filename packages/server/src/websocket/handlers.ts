import { WebSocket } from 'ws';
import { logger } from '../middleware/logger';

export interface WsClient {
  ws: WebSocket;
  id: string;
  type: 'user' | 'agent';
  orgId: string;
  subscriptions: Set<string>;
}

export interface WsIncomingMessage {
  event: string;
  data?: Record<string, unknown>;
}

export function handleWsMessage(client: WsClient, msg: WsIncomingMessage): void {
  switch (msg.event) {
    case 'subscribe':
      handleSubscribe(client, msg.data);
      break;
    case 'unsubscribe':
      handleUnsubscribe(client, msg.data);
      break;
    case 'heartbeat':
      handleHeartbeat(client);
      break;
    default:
      logger.warn({ event: msg.event, clientId: client.id }, 'Unknown WebSocket event');
  }
}

function handleSubscribe(client: WsClient, data: Record<string, unknown> | undefined): void {
  const channel = data?.channel;
  if (typeof channel === 'string') {
    client.subscriptions.add(channel);
    sendToClient(client, 'subscribed', { channel });
    logger.debug({ clientId: client.id, channel }, 'Client subscribed');
  }
}

function handleUnsubscribe(client: WsClient, data: Record<string, unknown> | undefined): void {
  const channel = data?.channel;
  if (typeof channel === 'string') {
    client.subscriptions.delete(channel);
    sendToClient(client, 'unsubscribed', { channel });
    logger.debug({ clientId: client.id, channel }, 'Client unsubscribed');
  }
}

function handleHeartbeat(client: WsClient): void {
  sendToClient(client, 'heartbeat_ack', { timestamp: new Date().toISOString() });
}

function sendToClient(client: WsClient, event: string, data: Record<string, unknown>): void {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({ event, data }));
  }
}
