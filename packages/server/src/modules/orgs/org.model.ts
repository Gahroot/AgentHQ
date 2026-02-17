import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface Org {
  id: string;
  name: string;
  slug: string;
  plan: string;
  settings: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export function orgModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async findById(id: string): Promise<Org | undefined> {
      return knex('orgs').where('id', id).first();
    },

    async findBySlug(slug: string): Promise<Org | undefined> {
      return knex('orgs').where('slug', slug).first();
    },

    async create(org: Partial<Org>): Promise<Org> {
      const [created] = await knex('orgs').insert(org).returning('*');
      if (!created) throw new Error('Failed to create org: no row returned');
      return created;
    },

    async update(id: string, data: Partial<Org>): Promise<Org | undefined> {
      const [updated] = await knex('orgs')
        .where('id', id)
        .update({ ...data, updated_at: knex.fn.now() })
        .returning('*');
      return updated;
    },
  };
}
