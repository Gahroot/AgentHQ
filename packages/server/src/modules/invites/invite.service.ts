import { inviteModel, InviteType, InviteRole } from './invite.model';
import { agentService } from '../agents/agent.service';
import { generateId } from '../../utils/id';
import { generateInviteToken } from '../../utils/crypto';
import { getDb } from '../../config/database';

const INVITE_EXPIRY_DAYS = 7;

export const inviteService = {
  async createAgentInvite(orgId: string, createdByUserId: string) {
    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = await inviteModel().create({
      id: generateId(),
      org_id: orgId,
      token,
      created_by: createdByUserId,
      invite_type: 'agent' as InviteType,
      expires_at: expiresAt,
    });

    return { invite, token };
  },

  async createUserInvite(orgId: string, createdByUserId: string, email: string, role: InviteRole = 'member') {
    // Check if there's already a pending invite for this email
    const existing = await inviteModel().findByEmail(email, orgId);
    if (existing) {
      return {
        error: {
          code: 'PENDING_INVITE_EXISTS',
          message: 'A pending invite already exists for this email',
        },
        invite: existing,
      };
    }

    // Check if user is already in the org
    const db = getDb();
    const existingUser = await db('users')
      .where({ email, org_id: orgId })
      .first();
    if (existingUser) {
      return {
        error: {
          code: 'USER_ALREADY_IN_ORG',
          message: 'This user is already a member of this organization',
        },
      };
    }

    const token = generateInviteToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = await inviteModel().create({
      id: generateId(),
      org_id: orgId,
      token,
      created_by: createdByUserId,
      invite_type: 'user' as InviteType,
      email,
      role,
      expires_at: expiresAt,
    });

    return { invite, token };
  },

  async redeemAgentInvite(token: string, agentName: string) {
    const invite = await inviteModel().findByToken(token);

    if (!invite) {
      return { error: { code: 'INVALID_TOKEN', message: 'Invalid invite token' } };
    }

    if (invite.invite_type !== 'agent') {
      return { error: { code: 'INVALID_INVITE_TYPE', message: 'This invite is for users, not agents' } };
    }

    if (invite.status !== 'pending') {
      return { error: { code: 'TOKEN_ALREADY_USED', message: 'This invite token has already been used' } };
    }

    if (new Date(invite.expires_at) < new Date()) {
      await inviteModel().update(invite.id, { status: 'expired' });
      return { error: { code: 'TOKEN_EXPIRED', message: 'This invite token has expired' } };
    }

    const { agent, apiKey } = await agentService.registerAgent(invite.org_id, agentName);
    await inviteModel().markAgentRedeemed(invite.id, agent.id);

    return { agent, apiKey, orgId: invite.org_id };
  },

  async redeemUserInvite(token: string, name: string, password: string) {
    const invite = await inviteModel().findByToken(token);

    if (!invite) {
      return { error: { code: 'INVALID_TOKEN', message: 'Invalid invite token' } };
    }

    if (invite.invite_type !== 'user') {
      return { error: { code: 'INVALID_INVITE_TYPE', message: 'This invite is for agents, not users' } };
    }

    if (invite.status !== 'pending') {
      return { error: { code: 'TOKEN_ALREADY_USED', message: 'This invite token has already been used' } };
    }

    if (new Date(invite.expires_at) < new Date()) {
      await inviteModel().update(invite.id, { status: 'expired' });
      return { error: { code: 'TOKEN_EXPIRED', message: 'This invite token has expired' } };
    }

    const { hashPassword } = await import('../../utils/crypto');
    const { signAccessToken, signRefreshToken } = await import('../../auth/jwt');
    const db = getDb();

    // Check if email already exists (user might have registered elsewhere)
    const existingUser = await db('users').where('email', invite.email).first();
    if (existingUser) {
      return { error: { code: 'EMAIL_EXISTS', message: 'This email is already registered' } };
    }

    // Create the user
    const userId = generateId();
    const passwordHash = await hashPassword(password);
    const userRole = invite.role || 'member';

    await db('users').insert({
      id: userId,
      org_id: invite.org_id,
      email: invite.email!,
      password_hash: passwordHash,
      name,
      role: userRole,
    });

    // Mark invite as redeemed
    await inviteModel().markUserRedeemed(invite.id, userId);

    // Get org details
    const org = await db('orgs').where('id', invite.org_id).first();

    // Generate tokens
    const accessToken = signAccessToken({ sub: userId, org_id: invite.org_id, role: userRole });
    const refreshToken = signRefreshToken({ sub: userId, org_id: invite.org_id, role: userRole });

    return {
      user: {
        id: userId,
        email: invite.email!,
        name,
        role: userRole,
        org_id: invite.org_id,
      },
      org,
      accessToken,
      refreshToken,
    };
  },

  async listInvites(orgId: string, limit: number, offset: number, inviteType?: InviteType) {
    const [invites, total] = await Promise.all([
      inviteType
        ? inviteModel().findByOrgAndType(orgId, inviteType, limit, offset)
        : inviteModel().findByOrg(orgId, limit, offset),
      inviteType
        ? inviteModel().countByOrgAndType(orgId, inviteType)
        : inviteModel().countByOrg(orgId),
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

  async getInviteByToken(token: string) {
    const invite = await inviteModel().findByToken(token);

    if (!invite) {
      return { error: { code: 'INVALID_TOKEN', message: 'Invalid invite token' } };
    }

    if (invite.status !== 'pending') {
      if (invite.status === 'expired') {
        return { error: { code: 'TOKEN_EXPIRED', message: 'This invite token has expired' } };
      }
      if (invite.status === 'revoked') {
        return { error: { code: 'TOKEN_REVOKED', message: 'This invite token has been revoked' } };
      }
      return { error: { code: 'TOKEN_ALREADY_USED', message: 'This invite token has already been used' } };
    }

    if (new Date(invite.expires_at) < new Date()) {
      await inviteModel().update(invite.id, { status: 'expired' });
      return { error: { code: 'TOKEN_EXPIRED', message: 'This invite token has expired' } };
    }

    // Get org name for display
    const db = getDb();
    const org = await db('orgs').where('id', invite.org_id).first();

    return {
      invite: {
        ...invite,
        org_name: org?.name || null,
      },
    };
  },
};
