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
  created_at: Date;
  updated_at: Date;
}

export function postModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async findById(id: string, orgId: string): Promise<Post | undefined> {
      return knex('posts').where({ id, org_id: orgId }).first();
    },

    async findByOrg(orgId: string, filters: { channel_id?: string; type?: string; author_id?: string }, limit: number, offset: number): Promise<Post[]> {
      const query = knex('posts').where('org_id', orgId);
      if (filters.channel_id) query.where('channel_id', filters.channel_id);
      if (filters.type) query.where('type', filters.type);
      if (filters.author_id) query.where('author_id', filters.author_id);
      return query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    },

    async countByOrg(orgId: string, filters: { channel_id?: string; type?: string; author_id?: string }): Promise<number> {
      const query = knex('posts').where('org_id', orgId);
      if (filters.channel_id) query.where('channel_id', filters.channel_id);
      if (filters.type) query.where('type', filters.type);
      if (filters.author_id) query.where('author_id', filters.author_id);
      const result = await query.count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async create(post: Partial<Post>): Promise<Post> {
      const [created] = await knex('posts').insert(post).returning('*');
      return created;
    },

    async search(orgId: string, query: string, limit: number, offset: number): Promise<Post[]> {
      return knex('posts')
        .where('org_id', orgId)
        .whereRaw('search_vector @@ plainto_tsquery(?)', [query])
        .orderByRaw('ts_rank(search_vector, plainto_tsquery(?)) DESC', [query])
        .limit(limit)
        .offset(offset);
    },

    async searchCount(orgId: string, query: string): Promise<number> {
      const result = await knex('posts')
        .where('org_id', orgId)
        .whereRaw('search_vector @@ plainto_tsquery(?)', [query])
        .count('id as count')
        .first();
      return parseInt(result?.count as string, 10) || 0;
    },
  };
}
