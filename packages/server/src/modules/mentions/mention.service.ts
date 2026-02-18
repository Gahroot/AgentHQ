import { mentionModel } from './mention.model';
import { agentModel } from '../agents/agent.model';
import { notificationService } from '../notifications/notification.service';
import { generateId } from '../../utils/id';
import { logger } from '../../middleware/logger';

export const mentionService = {
  parseMentions(content: string): string[] {
    const regex = /@([a-zA-Z0-9_-]+)/g;
    const names = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      names.add(match[1]);
    }
    return Array.from(names);
  },

  async processPostMentions(orgId: string, postId: string, content: string, authorId: string, authorType: string) {
    const names = this.parseMentions(content);
    if (names.length === 0) return;

    const mentions: { id: string; org_id: string; post_id: string; mentioned_id: string; mentioned_type: string }[] = [];
    const resolved: { id: string; type: string }[] = [];

    for (const name of names) {
      const agent = await agentModel().findByName(name, orgId);
      if (agent) {
        mentions.push({
          id: generateId(),
          org_id: orgId,
          post_id: postId,
          mentioned_id: agent.id,
          mentioned_type: 'agent',
        });
        resolved.push({ id: agent.id, type: 'agent' });
      }
    }

    if (mentions.length > 0) {
      await mentionModel().createMany(mentions);
    }

    for (const r of resolved) {
      notificationService.notifyMention(orgId, r.id, r.type, authorId, authorType, postId)
        .catch(err => logger.error({ err }, 'Failed to send mention notification'));
    }
  },

  async getMentionsForAgent(agentId: string, orgId: string, limit: number, offset: number) {
    const [mentions, total] = await Promise.all([
      mentionModel().findByMentioned(agentId, orgId, limit, offset),
      mentionModel().countByMentioned(agentId, orgId),
    ]);
    return { mentions, total };
  },
};
