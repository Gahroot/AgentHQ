import { webhookModel, Webhook } from './webhook.model';
import { generateId } from '../../utils/id';
import { logger } from '../../middleware/logger';
import crypto from 'crypto';

export interface WebhookPayload {
  id: string;
  event: string;
  org_id: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export const webhookService = {
  async createWebhook(orgId: string, data: {
    url: string;
    events: string[];
    secret?: string;
  }) {
    const webhook = await webhookModel().create({
      id: generateId(),
      org_id: orgId,
      url: data.url,
      events: data.events,
      secret: data.secret || null,
      active: true,
      created_at: new Date(),
      updated_at: new Date(),
    });
    return webhook;
  },

  async listWebhooks(orgId: string) {
    return webhookModel().findByOrg(orgId, false); // include inactive
  },

  async deleteWebhook(id: string, orgId: string) {
    return webhookModel().delete(id, orgId);
  },

  async testWebhook(id: string, orgId: string) {
    const webhook = await webhookModel().findById(id, orgId);
    if (!webhook) {
      throw new Error('Webhook not found');
    }

    const payload: WebhookPayload = {
      id: generateId(),
      event: 'test',
      org_id: orgId,
      timestamp: new Date().toISOString(),
      data: {
        message: 'This is a test ping from AgentHQ',
      },
    };

    await this.sendWebhook(webhook, payload);
    return { success: true, message: 'Test ping sent' };
  },

  async dispatch(orgId: string, eventType: string, data: Record<string, unknown>) {
    // Fire-and-forget: fetch matching webhooks and send asynchronously
    const webhooks = await webhookModel().findByEvent(orgId, eventType);

    if (webhooks.length === 0) {
      return;
    }

    const payload: WebhookPayload = {
      id: generateId(),
      event: eventType,
      org_id: orgId,
      timestamp: new Date().toISOString(),
      data,
    };

    // Send to all matching webhooks in parallel, don't wait for completion
    webhooks.forEach((webhook) => {
      setImmediate(() => {
        this.sendWebhook(webhook, payload).catch((err) => {
          logger.warn({ webhook_id: webhook.id, url: webhook.url, error: err.message }, 'Webhook delivery failed');
        });
      });
    });
  },

  async sendWebhook(webhook: Webhook, payload: WebhookPayload) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'AgentHQ-Webhooks/1.0',
        'X-AgentHQ-Event': payload.event,
        'X-AgentHQ-Delivery': payload.id,
        'X-AgentHQ-Timestamp': payload.timestamp,
      };

      // Add signature if secret is configured
      if (webhook.secret) {
        const signature = this.signPayload(webhook.secret, payload);
        headers['X-AgentHQ-Signature'] = signature;
      }

      const response = await fetch(webhook.url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      logger.debug(
        { webhook_id: webhook.id, url: webhook.url, event: payload.event },
        'Webhook delivered successfully'
      );
    } catch (error) {
      const err = error as Error;
      if (err.name === 'AbortError') {
        throw new Error('Webhook delivery timed out after 10 seconds');
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  },

  signPayload(secret: string, payload: WebhookPayload): string {
    const payloadString = JSON.stringify(payload);
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payloadString);
    return `sha256=${hmac.digest('hex')}`;
  },
};
