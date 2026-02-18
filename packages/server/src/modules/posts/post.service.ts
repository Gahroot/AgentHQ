import { postModel } from './post.model';
import { agentModel } from '../agents/agent.model';
import { mentionService } from '../mentions/mention.service';
import { notificationService } from '../notifications/notification.service';
import { generateId } from '../../utils/id';
import { logger } from '../../middleware/logger';

export const postService = {
  async createPost(orgId: string, data: {
    channel_id: string;
    author_id: string;
    author_type: string;
    type?: string;
    title?: string;
    content: string;
    metadata?: Record<string, any>;
    parent_id?: string;
  }) {
    const post = await postModel().create({
      id: generateId(),
      org_id: orgId,
      channel_id: data.channel_id,
      author_id: data.author_id,
      author_type: data.author_type,
      type: data.type || 'update',
      title: data.title || null,
      content: data.content,
      metadata: data.metadata || {},
      parent_id: data.parent_id || null,
      pinned: false,
    });

    mentionService.processPostMentions(orgId, post.id, data.content, data.author_id, data.author_type)
      .catch(err => logger.error({ err }, 'Failed to process mentions'));

    if (data.parent_id) {
      const parentPost = await postModel().findById(data.parent_id, orgId);
      if (parentPost && parentPost.author_id !== data.author_id) {
        notificationService.notifyReply(orgId, parentPost.author_id, parentPost.author_type, data.author_id, data.author_type, post.id)
          .catch(err => logger.error({ err }, 'Failed to send reply notification'));
      }
    }

    return post;
  },

  async listPosts(orgId: string, filters: { channel_id?: string; type?: string; author_id?: string; since?: string }, limit: number, offset: number) {
    const [posts, total] = await Promise.all([
      postModel().findByOrg(orgId, filters, limit, offset),
      postModel().countByOrg(orgId, filters),
    ]);
    return { posts, total };
  },

  async getPost(id: string, orgId: string) {
    const post = await postModel().findById(id, orgId);
    if (!post) return null;

    const thread = await postModel().findByParent(id, orgId);

    let authorName = post.author_id;
    if (post.author_type === 'agent') {
      const agent = await agentModel().findById(post.author_id, orgId);
      if (agent) authorName = agent.name;
    }

    return {
      post,
      thread,
      author: {
        id: post.author_id,
        name: authorName,
        type: post.author_type as 'agent' | 'user',
      },
    };
  },

  async searchPosts(orgId: string, query: string, limit: number, offset: number) {
    const [posts, total] = await Promise.all([
      postModel().search(orgId, query, limit, offset),
      postModel().searchCount(orgId, query),
    ]);
    return { posts, total };
  },

  async editPost(id: string, orgId: string, authorId: string, data: { title?: string; content?: string }) {
    const post = await postModel().findById(id, orgId);
    if (!post) return null;
    if (post.author_id !== authorId) return { forbidden: true as const };

    await postModel().createEdit({
      id: generateId(),
      post_id: id,
      org_id: orgId,
      previous_content: post.content,
      previous_title: post.title,
      edited_by: authorId,
    });

    const updateData: Record<string, unknown> = { edited_at: new Date() };
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;

    return postModel().update(id, orgId, updateData);
  },

  async deletePost(id: string, orgId: string, authorId: string) {
    const post = await postModel().findById(id, orgId);
    if (!post) return null;
    if (post.author_id !== authorId) return { forbidden: true as const };
    return postModel().softDelete(id, orgId);
  },

  async getPostEdits(postId: string, orgId: string) {
    const post = await postModel().findById(postId, orgId);
    if (!post) return null;
    return postModel().getEdits(postId, orgId);
  },
};
