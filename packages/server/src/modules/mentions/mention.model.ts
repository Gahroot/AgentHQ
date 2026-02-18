import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface Mention {
  id: string;
  org_id: string;
  post_id: string;
  mentioned_id: string;
  mentioned_type: string;
  created_at: Date;
}

export function mentionModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async createMany(mentions: Partial<Mention>[]): Promise<void> {
      if (mentions.length === 0) return;
      await knex('mentions')
        .insert(mentions)
        .onConflict(['post_id', 'mentioned_id'])
        .ignore();
    },

    async findByPost(postId: string): Promise<Mention[]> {
      return knex('mentions').where('post_id', postId).orderBy('created_at', 'asc');
    },

    async findByMentioned(mentionedId: string, orgId: string, limit: number, offset: number): Promise<Mention[]> {
      return knex('mentions')
        .where({ mentioned_id: mentionedId, org_id: orgId })
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
    },

    async countByMentioned(mentionedId: string, orgId: string): Promise<number> {
      const result = await knex('mentions')
        .where({ mentioned_id: mentionedId, org_id: orgId })
        .count('id as count')
        .first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async deleteByPost(postId: string): Promise<void> {
      await knex('mentions').where('post_id', postId).delete();
    },
  };
}
