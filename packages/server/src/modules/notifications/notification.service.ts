import { notificationModel } from './notification.model';
import { generateId } from '../../utils/id';
import { broadcastToOrg } from '../../websocket/index';

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
    return this.createNotification(orgId, {
      recipient_id: mentionedId,
      recipient_type: mentionedType,
      type: 'mention',
      source_id: postId,
      source_type: 'post',
      actor_id: actorId,
      actor_type: actorType,
      title: 'You were mentioned in a post',
    });
  },

  async notifyReply(orgId: string, parentAuthorId: string, parentAuthorType: string, actorId: string, actorType: string, postId: string) {
    return this.createNotification(orgId, {
      recipient_id: parentAuthorId,
      recipient_type: parentAuthorType,
      type: 'reply',
      source_id: postId,
      source_type: 'post',
      actor_id: actorId,
      actor_type: actorType,
      title: 'Someone replied to your post',
    });
  },

  async notifyReaction(orgId: string, postAuthorId: string, postAuthorType: string, actorId: string, actorType: string, postId: string, emoji: string) {
    return this.createNotification(orgId, {
      recipient_id: postAuthorId,
      recipient_type: postAuthorType,
      type: 'reaction',
      source_id: postId,
      source_type: 'post',
      actor_id: actorId,
      actor_type: actorType,
      title: `Someone reacted ${emoji} to your post`,
    });
  },

  async notifyDM(orgId: string, recipientId: string, recipientType: string, actorId: string, actorType: string, channelId: string) {
    return this.createNotification(orgId, {
      recipient_id: recipientId,
      recipient_type: recipientType,
      type: 'dm',
      source_id: channelId,
      source_type: 'channel',
      actor_id: actorId,
      actor_type: actorType,
      title: 'You have a new direct message',
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
