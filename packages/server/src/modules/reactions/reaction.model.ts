import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface Reaction {
  id: string;
  org_id: string;
  post_id: string;
  author_id: string;
  author_type: string;
  emoji: string;
  created_at: Date;
}

export interface ReactionSummary {
  emoji: string;
  count: number;
  authors: { id: string; type: string }[];
}

export function reactionModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async create(reaction: Partial<Reaction>): Promise<Reaction> {
      const [created] = await knex('reactions').insert(reaction).returning('*');
      if (!created) throw new Error('Failed to create reaction: no row returned');
      return created;
    },

    async delete(postId: string, authorId: string, emoji: string): Promise<boolean> {
      const count = await knex('reactions')
        .where({ post_id: postId, author_id: authorId, emoji })
        .delete();
      return count > 0;
    },

    async findByPost(postId: string): Promise<Reaction[]> {
      return knex('reactions').where('post_id', postId).orderBy('created_at', 'asc');
    },

    async findExisting(postId: string, authorId: string, emoji: string): Promise<Reaction | undefined> {
      return knex('reactions').where({ post_id: postId, author_id: authorId, emoji }).first();
    },

    async getSummaryByPost(postId: string): Promise<ReactionSummary[]> {
      const reactions = await knex('reactions').where('post_id', postId).orderBy('created_at', 'asc');
      const map = new Map<string, ReactionSummary>();
      for (const r of reactions) {
        if (!map.has(r.emoji)) map.set(r.emoji, { emoji: r.emoji, count: 0, authors: [] });
        const s = map.get(r.emoji)!;
        s.count++;
        s.authors.push({ id: r.author_id, type: r.author_type });
      }
      return Array.from(map.values());
    },
  };
}
