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
  data?: any;
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

function handleSubscribe(client: WsClient, data: { channel?: string }): void {
  if (data?.channel) {
    client.subscriptions.add(data.channel);
    sendToClient(client, 'subscribed', { channel: data.channel });
    logger.debug({ clientId: client.id, channel: data.channel }, 'Client subscribed');
  }
}

function handleUnsubscribe(client: WsClient, data: { channel?: string }): void {
  if (data?.channel) {
    client.subscriptions.delete(data.channel);
    sendToClient(client, 'unsubscribed', { channel: data.channel });
    logger.debug({ clientId: client.id, channel: data.channel }, 'Client unsubscribed');
  }
}

function handleHeartbeat(client: WsClient): void {
  sendToClient(client, 'heartbeat_ack', { timestamp: new Date().toISOString() });
}

function sendToClient(client: WsClient, event: string, data: any): void {
  if (client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify({ event, data }));
  }
}
