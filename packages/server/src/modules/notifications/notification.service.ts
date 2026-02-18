import { notificationModel } from './notification.model';
import { generateId } from '../../utils/id';
import { broadcastToOrg } from '../../websocket/index';
import { postModel } from '../posts/post.model';
import { webhookService } from '../webhooks/webhook.service';

export const notificationService = {
  async createNotification(orgId: string, data: {
    recipient_id: string;
    recipient_type: string;
    type: string;
    source_id: string;
    source_type: string;
    actor_id: string;
    actor_type: string;
    title: string;
    body?: string;
  }) {
    if (data.recipient_id === data.actor_id) return null;

    const notification = await notificationModel().create({
      id: generateId(),
      org_id: orgId,
      recipient_id: data.recipient_id,
      recipient_type: data.recipient_type,
      type: data.type,
      source_id: data.source_id,
      source_type: data.source_type,
      actor_id: data.actor_id,
      actor_type: data.actor_type,
      title: data.title,
      body: data.body || null,
      read: false,
    });

    broadcastToOrg(orgId, 'notification:new', {
      recipientId: data.recipient_id,
      notification: notification as unknown as Record<string, unknown>,
    });

    // Fire-and-forget webhook dispatch
    setImmediate(() => {
      webhookService.dispatch(orgId, 'notification:new', {
        notification_id: notification.id,
        recipient_id: data.recipient_id,
        recipient_type: data.recipient_type,
        type: data.type,
        title: data.title,
        body: data.body,
        actor_id: data.actor_id,
        actor_type: data.actor_type,
        source_id: data.source_id,
        source_type: data.source_type,
      }).catch((err) => {
        // Log but don't fail - webhooks are best-effort
        console.warn('Webhook dispatch failed:', err);
      });
    });

    return notification;
  },

  async listNotifications(recipientId: string, orgId: string, filters: { type?: string; read?: boolean }, limit: number, offset: number) {
    const [notifications, total] = await Promise.all([
      notificationModel().findByRecipient(recipientId, orgId, filters, limit, offset),
      notificationModel().countByRecipient(recipientId, orgId, filters),
    ]);
    return { notifications, total };
  },

  async markRead(id: string, orgId: string, recipientId: string) {
    return notificationModel().markRead(id, orgId, recipientId);
  },

  async markAllRead(recipientId: string, orgId: string) {
    return notificationModel().markAllRead(recipientId, orgId);
  },

  async getUnreadCount(recipientId: string, orgId: string) {
    return notificationModel().countUnread(recipientId, orgId);
  },

  async notifyMention(orgId: string, mentionedId: string, mentionedType: string, actorId: string, actorType: string, postId: string) {
    // Fetch post content for richer notification
    const postData = await postModel().getNotificationData(postId, orgId);
    let title = 'You were mentioned in a post';
    let body: string | undefined;

    if (postData) {
      title = `${postData.author_name} mentioned you in #${postData.channel_name}`;
      body = postData.content;
    }

    return this.createNotification(orgId, {
      recipient_id: mentionedId,
      recipient_type: mentionedType,
      type: 'mention',
      source_id: postId,
      source_type: 'post',
      actor_id: actorId,
      actor_type: actorType,
      title,
      body,
    });
  },

  async notifyReply(orgId: string, parentAuthorId: string, parentAuthorType: string, actorId: string, actorType: string, postId: string) {
    // Fetch post content for richer notification
    const postData = await postModel().getNotificationData(postId, orgId);
    let title = 'Someone replied to your post';
    let body: string | undefined;

    if (postData) {
      title = `${postData.author_name} replied in #${postData.channel_name}`;
      body = postData.content;
    }

    return this.createNotification(orgId, {
      recipient_id: parentAuthorId,
      recipient_type: parentAuthorType,
      type: 'reply',
      source_id: postId,
      source_type: 'post',
      actor_id: actorId,
      actor_type: actorType,
      title,
      body,
    });
  },

  async notifyReaction(orgId: string, postAuthorId: string, postAuthorType: string, actorId: string, actorType: string, postId: string, emoji: string) {
    // Fetch post content for richer notification
    const postData = await postModel().getNotificationData(postId, orgId);
    let title = `Someone reacted ${emoji} to your post`;
    let body: string | undefined;

    if (postData) {
      title = `${postData.author_name} reacted ${emoji} to your post in #${postData.channel_name}`;
      // Show a preview of the post content
      const preview = postData.content.length > 100 ? postData.content.substring(0, 97) + '...' : postData.content;
      body = preview;
    }

    return this.createNotification(orgId, {
      recipient_id: postAuthorId,
      recipient_type: postAuthorType,
      type: 'reaction',
      source_id: postId,
      source_type: 'post',
      actor_id: actorId,
      actor_type: actorType,
      title,
      body,
    });
  },

  async notifyDM(orgId: string, recipientId: string, recipientType: string, actorId: string, actorType: string, channelId: string, messageContent?: string) {
    let title = 'You have a new direct message';
    let body: string | undefined;

    if (messageContent) {
      const preview = messageContent.length > 150 ? messageContent.substring(0, 147) + '...' : messageContent;
      body = preview;
    }

    return this.createNotification(orgId, {
      recipient_id: recipientId,
      recipient_type: recipientType,
      type: 'dm',
      source_id: channelId,
      source_type: 'channel',
      actor_id: actorId,
      actor_type: actorType,
      title,
      body,
    });
  },

  async notifyTaskAssignment(orgId: string, assignedTo: string, assignedType: string, actorId: string, actorType: string, taskId: string, taskTitle: string) {
    return this.createNotification(orgId, {
      recipient_id: assignedTo,
      recipient_type: assignedType,
      type: 'task_assignment',
      source_id: taskId,
      source_type: 'task',
      actor_id: actorId,
      actor_type: actorType,
      title: `You were assigned a task: ${taskTitle}`,
    });
  },
};
