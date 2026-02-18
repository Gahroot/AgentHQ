import crypto from 'crypto';
import { channelModel } from './channel.model';
import { generateId } from '../../utils/id';

const DEFAULT_CHANNELS = [
  { name: 'general', description: 'General discussion', type: 'public' },
  { name: 'updates', description: 'Agent updates and status', type: 'public' },
  { name: 'learnings', description: 'Shared learnings and insights', type: 'public' },
  { name: 'alerts', description: 'System alerts', type: 'system' },
  { name: 'audit', description: 'Audit trail', type: 'system' },
];

export const channelService = {
  async createDefaultChannels(orgId: string) {
    await Promise.all(DEFAULT_CHANNELS.map(ch =>
      channelModel().create({
        id: generateId(),
        org_id: orgId,
        name: ch.name,
        description: ch.description,
        type: ch.type,
        created_by: null,
      })
    ));
  },

  async listChannels(orgId: string) {
    return channelModel().findByOrg(orgId);
  },

  async createChannel(orgId: string, name: string, description?: string, type?: string, createdBy?: string) {
    return channelModel().create({
      id: generateId(),
      org_id: orgId,
      name,
      description: description || null,
      type: type || 'public',
      created_by: createdBy || null,
    });
  },

  async joinChannel(channelId: string, memberId: string, memberType: string) {
    await channelModel().addMember(channelId, memberId, memberType);
  },

  async leaveChannel(channelId: string, memberId: string, memberType: string) {
    return channelModel().removeMember(channelId, memberId, memberType);
  },

  async getChannel(id: string, orgId: string) {
    return channelModel().findById(id, orgId);
  },

  async getChannelStats(channelId: string) {
    const [memberCount, postCount] = await Promise.all([
      channelModel().countMembers(channelId),
      channelModel().countPosts(channelId),
    ]);
    return { memberCount, postCount };
  },

  async listChannelsByType(orgId: string, type: string) {
    const all = await channelModel().findByOrg(orgId);
    return all.filter(ch => ch.type === type);
  },

  async findOrCreateDM(orgId: string, member1Id: string, member1Type: string, member2Id: string, member2Type: string) {
    const hash = crypto.createHash('sha256').update([member1Id, member2Id].sort().join(':')).digest('hex');

    const existing = await channelModel().findByDmPairHash(orgId, hash);
    if (existing) return existing;

    const channel = await channelModel().create({
      id: generateId(),
      org_id: orgId,
      name: `dm-${member1Id}-${member2Id}`,
      description: null,
      type: 'dm',
      created_by: member1Id,
      dm_pair_hash: hash,
    });

    await channelModel().addMember(channel.id, member1Id, member1Type);
    await channelModel().addMember(channel.id, member2Id, member2Type);

    return channel;
  },

  async listDMConversations(memberId: string, orgId: string) {
    return channelModel().findDmChannelsForMember(memberId, orgId);
  },
};
