import { Knex } from 'knex';
import { getDb } from '../../config/database';

export type InviteType = 'agent' | 'user';
export type InviteStatus = 'pending' | 'redeemed' | 'expired' | 'revoked';
export type InviteRole = 'viewer' | 'member' | 'admin' | 'owner';

export interface Invite {
  id: string;
  org_id: string;
  token: string;
  created_by: string;
  status: InviteStatus;
  invite_type: InviteType;
  email: string | null;
  role: InviteRole | null;
  redeemed_by_agent_id: string | null;
  redeemed_by_user_id: string | null;
  expires_at: Date;
  redeemed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface CreateInviteInput {
  id: string;
  org_id: string;
  token: string;
  created_by: string;
  invite_type: InviteType;
  email?: string;
  role?: InviteRole;
  expires_at: Date;
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

    async findByOrgAndType(orgId: string, inviteType: InviteType, limit: number, offset: number): Promise<Invite[]> {
      return knex('invites')
        .where({ org_id: orgId, invite_type: inviteType })
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);
    },

    async countByOrg(orgId: string): Promise<number> {
      const result = await knex('invites').where('org_id', orgId).count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async countByOrgAndType(orgId: string, inviteType: InviteType): Promise<number> {
      const result = await knex('invites').where({ org_id: orgId, invite_type: inviteType }).count('id as count').first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async findByEmail(email: string, orgId: string): Promise<Invite | undefined> {
      return knex('invites')
        .where({ email, org_id: orgId })
        .where('status', 'pending')
        .where('invite_type', 'user')
        .first();
    },

    async create(input: CreateInviteInput): Promise<Invite> {
      const [created] = await knex('invites').insert({
        id: input.id,
        org_id: input.org_id,
        token: input.token,
        created_by: input.created_by,
        invite_type: input.invite_type,
        email: input.email || null,
        role: input.role || null,
        status: 'pending',
        expires_at: input.expires_at,
      }).returning('*');
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

    async markAgentRedeemed(id: string, agentId: string): Promise<Invite | undefined> {
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

    async markUserRedeemed(id: string, userId: string): Promise<Invite | undefined> {
      const [updated] = await knex('invites')
        .where({ id })
        .update({
          status: 'redeemed',
          redeemed_by_user_id: userId,
          redeemed_at: knex.fn.now(),
          updated_at: knex.fn.now(),
        })
        .returning('*');
      return updated;
    },
  };
}
