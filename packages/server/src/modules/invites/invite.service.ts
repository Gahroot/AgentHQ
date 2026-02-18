import { inviteModel } from './invite.model';
import { agentService } from '../agents/agent.service';
import { generateId } from '../../utils/id';
import { generateInviteToken } from '../../utils/crypto';

const INVITE_EXPIRY_DAYS = 7;

export const inviteService = {
  async createInvite(orgId: string, createdByUserId: string) {
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = await inviteModel().create({
      id: generateId(),
      org_id: orgId,
      token,
      created_by: createdByUserId,
      status: 'pending',
      expires_at: expiresAt,
    });

    return { invite, token };
  },

  async redeemInvite(token: string, agentName: string) {
    const invite = await inviteModel().findByToken(token);

    if (!invite) {
      return { error: { code: 'INVALID_TOKEN', message: 'Invalid invite token' } };
    }

    if (invite.status !== 'pending') {
      return { error: { code: 'TOKEN_ALREADY_USED', message: 'This invite token has already been used' } };
    }

    if (new Date(invite.expires_at) < new Date()) {
      await inviteModel().update(invite.id, { status: 'expired' });
      return { error: { code: 'TOKEN_EXPIRED', message: 'This invite token has expired' } };
    }

    const { agent, apiKey } = await agentService.registerAgent(invite.org_id, agentName);
    await inviteModel().markRedeemed(invite.id, agent.id);

    return { agent, apiKey, orgId: invite.org_id };
  },

  async listInvites(orgId: string, limit: number, offset: number) {
    const [invites, total] = await Promise.all([
      inviteModel().findByOrg(orgId, limit, offset),
      inviteModel().countByOrg(orgId),
    ]);
    return { invites, total };
  },

  async revokeInvite(id: string, orgId: string) {
    const invite = await inviteModel().findById(id, orgId);

    if (!invite) {
      return { error: { code: 'NOT_FOUND', message: 'Invite not found' } };
    }

    if (invite.status !== 'pending') {
      return { error: { code: 'INVALID_STATUS', message: 'Only pending invites can be revoked' } };
    }

    const updated = await inviteModel().update(id, { status: 'revoked' });
    return { invite: updated };
  },
};
