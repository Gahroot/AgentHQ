import { Server as HttpServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import { verifyToken } from '../auth/jwt';
import { validateApiKey } from '../auth/api-keys';
import { logger } from '../middleware/logger';
import { handleWsMessage, WsClient } from './handlers';

const clients = new Map<string, WsClient>();

export function setupWebSocket(server: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', async (ws: WebSocket, req) => {
    try {
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const token = url.searchParams.get('token');

      if (!token) {
        ws.close(4001, 'Missing authentication token');
        return;
      }

      let identity: { type: 'user' | 'agent'; id: string; orgId: string } | null = null;

      if (token.startsWith('ahq_')) {
        const apiKeyIdentity = await validateApiKey(token);
        if (apiKeyIdentity) {
          identity = { type: 'agent', id: apiKeyIdentity.agentId, orgId: apiKeyIdentity.orgId };
        }
      } else {
        try {
          const payload = verifyToken(token);
          identity = { type: 'user', id: payload.sub, orgId: payload.org_id };
        } catch {
          // invalid JWT
        }
      }

      if (!identity) {
        ws.close(4001, 'Invalid authentication');
        return;
      }

      const client: WsClient = {
        ws,
        id: identity.id,
        type: identity.type,
        orgId: identity.orgId,
        subscriptions: new Set(),
      };

      clients.set(identity.id, client);
      logger.info({ clientId: identity.id, type: identity.type }, 'WebSocket client connected');

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString());
          handleWsMessage(client, msg);
        } catch {
          // ignore malformed messages
        }
      });

      ws.on('close', () => {
        clients.delete(identity!.id);
        logger.info({ clientId: identity!.id }, 'WebSocket client disconnected');
      });

      ws.on('error', (err) => {
        logger.error({ clientId: identity!.id, error: err.message }, 'WebSocket error');
      });

    } catch (err) {
      logger.error({ err }, 'WebSocket connection error');
      ws.close(4000, 'Connection error');
    }
  });

  logger.info('WebSocket server initialized');
  return wss;
}

export function broadcastToOrg(orgId: string, event: string, data: Record<string, unknown>): void {
  const message = JSON.stringify({ event, data });
  for (const client of clients.values()) {
    if (client.orgId === orgId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

export function broadcastToChannel(orgId: string, channelId: string, event: string, data: Record<string, unknown>): void {
  const message = JSON.stringify({ event, data });
  for (const client of clients.values()) {
    if (
      client.orgId === orgId &&
      client.subscriptions.has(channelId) &&
      client.ws.readyState === WebSocket.OPEN
    ) {
      client.ws.send(message);
    }
  }
}

export function getConnectedClients(): Map<string, WsClient> {
  return clients;
}
