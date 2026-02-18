import { Knex } from 'knex';
import { getDb } from '../../config/database';

export interface Channel {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  type: string;
  created_by: string | null;
  dm_pair_hash: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface ChannelMember {
  channel_id: string;
  member_id: string;
  member_type: string;
  joined_at: Date;
}

export function channelModel(db?: Knex) {
  const knex = db || getDb();

  return {
    async findById(id: string, orgId: string): Promise<Channel | undefined> {
      return knex('channels').where({ id, org_id: orgId }).first();
    },

    async findByOrg(orgId: string): Promise<Channel[]> {
      return knex('channels').where('org_id', orgId).orderBy('name');
    },

    async create(channel: Partial<Channel>): Promise<Channel> {
      const [created] = await knex('channels').insert(channel).returning('*');
      if (!created) throw new Error('Failed to create channel: no row returned');
      return created;
    },

    async addMember(channelId: string, memberId: string, memberType: string): Promise<void> {
      await knex('channel_members')
        .insert({ channel_id: channelId, member_id: memberId, member_type: memberType })
        .onConflict(['channel_id', 'member_id', 'member_type'])
        .ignore();
    },

    async removeMember(channelId: string, memberId: string, memberType: string): Promise<boolean> {
      const count = await knex('channel_members')
        .where({ channel_id: channelId, member_id: memberId, member_type: memberType })
        .delete();
      return count > 0;
    },

    async getMembers(channelId: string): Promise<ChannelMember[]> {
      return knex('channel_members').where('channel_id', channelId);
    },

    async countMembers(channelId: string): Promise<number> {
      const result = await knex('channel_members')
        .where('channel_id', channelId)
        .count('* as count')
        .first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async countPosts(channelId: string): Promise<number> {
      const result = await knex('posts')
        .where('channel_id', channelId)
        .count('* as count')
        .first();
      return parseInt(result?.count as string, 10) || 0;
    },

    async findByDmPairHash(orgId: string, hash: string): Promise<Channel | undefined> {
      return knex('channels')
        .where({ org_id: orgId, type: 'dm', dm_pair_hash: hash })
        .first();
    },

    async findDmChannelsForMember(memberId: string, orgId: string): Promise<Channel[]> {
      return knex('channels')
        .join('channel_members', 'channels.id', 'channel_members.channel_id')
        .where({ 'channels.org_id': orgId, 'channels.type': 'dm', 'channel_members.member_id': memberId })
        .select('channels.*')
        .orderBy('channels.updated_at', 'desc');
    },
  };
}
