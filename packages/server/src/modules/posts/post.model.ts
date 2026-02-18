import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface Post {
  id: string;
  org_id: string;
  channel_id: string;
  author_id: string;
  author_type: string;
  type: string;
  title: string | null;
  content: string;
  metadata: Record<string, any>;
  parent_id: string | null;
  pinned: boolean;
  edited_at: Date | null;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface PostEdit {
  id: string;
  post_id: string;
  org_id: string;
  previous_content: string;
  previous_title: string | null;
  edited_by: string;
  created_at: Date;
}

export function postModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async findById(id: string, orgId: string): Promise<Post | undefined> {
      return knex('posts').where({ id, org_id: orgId }).first();
    },

    async findByOrg(orgId: string, filters: { channel_id?: string; type?: string; author_id?: string; since?: string }, limit: number, offset: number): Promise<Post[]> {
      const query = knex('posts').where('org_id', orgId).whereNull('deleted_at');
      if (filters.channel_id) query.where('channel_id', filters.channel_id);
      if (filters.type) query.where('type', filters.type);
      if (filters.author_id) query.where('author_id', filters.author_id);
      if (filters.since) query.where('created_at', '>=', filters.since);
      return query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    },

    async countByOrg(orgId: string, filters: { channel_id?: string; type?: string; author_id?: string; since?: string }): Promise<number> {
      const query = knex('posts').where('org_id', orgId).whereNull('deleted_at');
      if (filters.channel_id) query.where('channel_id', filters.channel_id);
      if (filters.type) query.where('type', filters.type);
      if (filters.author_id) query.where('author_id', filters.author_id);
      if (filters.since) query.where('created_at', '>=', filters.since);
      const result = await query.count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async create(post: Partial<Post>): Promise<Post> {
      const [created] = await knex('posts').insert(post).returning('*');
      if (!created) throw new Error('Failed to create post: no row returned');
      return created;
    },

    async findByParent(parentId: string, orgId: string): Promise<Post[]> {
      return knex('posts')
        .where({ parent_id: parentId, org_id: orgId })
        .whereNull('deleted_at')
        .orderBy('created_at', 'asc');
    },

    async search(orgId: string, query: string, limit: number, offset: number): Promise<Post[]> {
      return knex('posts')
        .where('org_id', orgId)
        .whereNull('deleted_at')
        .whereRaw('search_vector @@ plainto_tsquery(?)', [query])
        .orderByRaw('ts_rank(search_vector, plainto_tsquery(?)) DESC', [query])
        .limit(limit)
        .offset(offset);
    },

    async searchCount(orgId: string, query: string): Promise<number> {
      const result = await knex('posts')
        .where('org_id', orgId)
        .whereNull('deleted_at')
        .whereRaw('search_vector @@ plainto_tsquery(?)', [query])
        .count('id as count')
        .first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async update(id: string, orgId: string, data: Partial<Post>): Promise<Post | undefined> {
      const [updated] = await knex('posts')
        .where({ id, org_id: orgId })
        .update({ ...data, updated_at: knex.fn.now() })
        .returning('*');
      return updated;
    },

    async softDelete(id: string, orgId: string): Promise<boolean> {
      const count = await knex('posts')
        .where({ id, org_id: orgId })
        .whereNull('deleted_at')
        .update({ deleted_at: knex.fn.now() });
      return count > 0;
    },

    async createEdit(edit: Partial<PostEdit>): Promise<PostEdit> {
      const [created] = await knex('post_edits').insert(edit).returning('*');
      if (!created) throw new Error('Failed to create post edit: no row returned');
      return created;
    },

    async getEdits(postId: string, orgId: string): Promise<PostEdit[]> {
      return knex('post_edits')
        .where({ post_id: postId, org_id: orgId })
        .orderBy('created_at', 'desc');
    },
  };
}
