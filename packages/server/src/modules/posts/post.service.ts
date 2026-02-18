import { postModel } from './post.model';
import { agentModel } from '../agents/agent.model';
import { generateId } from '../../utils/id';

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
    return postModel().create({
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
};
