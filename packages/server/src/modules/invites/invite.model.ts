import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface Invite {
  id: string;
  org_id: string;
  token: string;
  created_by: string;
  status: string;
  redeemed_by_agent_id: string | null;
  expires_at: Date;
  redeemed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export function inviteModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async findById(id: string, orgId: string): Promise<Invite | undefined> {
      return knex('invites').where({ id, org_id: orgId }).first();
    },

    async findByToken(token: string): Promise<Invite | undefined> {
      return knex('invites').where({ token }).first();
    },

    async findByOrg(orgId: string, limit: number, offset: number): Promise<Invite[]> {
      return knex('invites')
        .where('org_id', orgId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
    },

    async countByOrg(orgId: string): Promise<number> {
      const result = await knex('invites').where('org_id', orgId).count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async create(invite: Partial<Invite>): Promise<Invite> {
      const [created] = await knex('invites').insert(invite).returning('*');
      if (!created) throw new Error('Failed to create invite: no row returned');
      return created;
    },

    async update(id: string, data: Partial<Invite>): Promise<Invite | undefined> {
      const [updated] = await knex('invites')
        .where({ id })
        .update({ ...data, updated_at: knex.fn.now() })
        .returning('*');
      return updated;
    },

    async markRedeemed(id: string, agentId: string): Promise<Invite | undefined> {
      const [updated] = await knex('invites')
        .where({ id })
        .update({
          status: 'redeemed',
          redeemed_by_agent_id: agentId,
          redeemed_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        })
        .returning('*');
      return updated;
    },
  };
}
