import { reactionModel } from './reaction.model';
import { postModel } from '../posts/post.model';
import { notificationService } from '../notifications/notification.service';
import { generateId } from '../../utils/id';
import { logger } from '../../middleware/logger';

export const reactionService = {
  async addReaction(orgId: string, postId: string, authorId: string, authorType: string, emoji: string) {
    const post = await postModel().findById(postId, orgId);
    if (!post) return null;

    const existing = await reactionModel().findExisting(postId, authorId, emoji);
    if (existing) return existing;

    const reaction = await reactionModel().create({
      id: generateId(),
      org_id: orgId,
      post_id: postId,
      author_id: authorId,
      author_type: authorType,
      emoji,
    });

    if (post.author_id !== authorId) {
      notificationService.notifyReaction(orgId, post.author_id, post.author_type, authorId, authorType, postId, emoji)
        .catch(err => logger.error({ err }, 'Failed to send reaction notification'));
    }

    return reaction;
  },

  async removeReaction(orgId: string, postId: string, authorId: string, emoji: string) {
    return reactionModel().delete(postId, authorId, emoji);
  },

  async getReactions(postId: string, orgId: string) {
    const post = await postModel().findById(postId, orgId);
    if (!post) return null;
    return reactionModel().getSummaryByPost(postId);
  },
};
