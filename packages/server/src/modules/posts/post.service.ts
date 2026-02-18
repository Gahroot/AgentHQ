import { postModel } from './post.model';
import { agentModel } from '../agents/agent.model';
import { mentionService } from '../mentions/mention.service';
import { notificationService } from '../notifications/notification.service';
import { generateId } from '../../utils/id';
import { logger } from '../../middleware/logger';
import { getDb } from '../../config/database';

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
    pinned?: boolean;
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
      pinned: data.pinned ?? false,
    });

    mentionService.processPostMentions(orgId, post.id, data.content, data.author_id, data.author_type)
      .catch(err => logger.error({ err }, 'Failed to process mentions'));

    if (data.parent_id) {
      const parentPost = await postModel().findById(data.parent_id, orgId);
      if (parentPost && parentPost.author_id !== data.author_id) {
        notificationService.notifyReply(orgId, parentPost.author_id, parentPost.author_type, data.author_id, data.author_type, post.id)
          .catch(err => logger.error({ err }, 'Failed to send reply notification'));
      }

      // Increment reply_count on the root post
      const rootId = await this.findRootPostId(data.parent_id, orgId);
      const rootPost = await postModel().findById(rootId, orgId);
      if (rootPost) {
        const metadata = rootPost.metadata || {};
        metadata.reply_count = (metadata.reply_count || 0) + 1;
        await postModel().update(rootId, orgId, { metadata } as any);
      }
    }

    // Check if this is a DM channel and send notification to the other participant
    const channel = await (await import('../channels/channel.model')).channelModel().findById(data.channel_id, orgId);
    if (channel && channel.type === 'dm') {
      // Get the other DM participant
      const members = await (await import('../channels/channel.model')).channelModel().getMembers(data.channel_id);
      const otherMember = members.find(m => m.member_id !== data.author_id);
      if (otherMember) {
        notificationService.notifyDM(orgId, otherMember.member_id, otherMember.member_type, data.author_id, data.author_type, data.channel_id, data.content)
          .catch(err => logger.error({ err }, 'Failed to send DM notification'));
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

    const thread = await postModel().findThreadRecursive(id, orgId);

    // Build authors map from all posts in the thread
    const allPosts = [post, ...thread];
    const agentIds = [...new Set(allPosts.filter(p => p.author_type === 'agent').map(p => p.author_id))];
    const userIds = [...new Set(allPosts.filter(p => p.author_type === 'user').map(p => p.author_id))];

    const authors: Record<string, { id: string; name: string; type: 'agent' | 'user' }> = {};

    if (agentIds.length > 0) {
      const db = getDb();
      const agentRows = await db('agents').whereIn('id', agentIds).where('org_id', orgId);
      for (const agent of agentRows) {
        authors[agent.id] = { id: agent.id, name: agent.name, type: 'agent' };
      }
    }

    if (userIds.length > 0) {
      const db = getDb();
      const userRows = await db('users').whereIn('id', userIds).select('id', 'name');
      for (const user of userRows) {
        authors[user.id] = { id: user.id, name: user.name, type: 'user' };
      }
    }

    return {
      post,
      thread,
      authors,
      author: {
        id: post.author_id,
        name: authors[post.author_id]?.name || post.author_id,
        type: post.author_type as 'agent' | 'user',
      },
    };
  },

  async findRootPostId(postId: string, orgId: string): Promise<string> {
    let currentId = postId;
    for (let i = 0; i < 50; i++) { // safety limit
      const post = await postModel().findById(currentId, orgId);
      if (!post || !post.parent_id) return currentId;
      currentId = post.parent_id;
    }
    return currentId;
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
