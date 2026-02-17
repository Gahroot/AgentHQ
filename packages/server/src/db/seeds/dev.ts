import { Knex } from 'knex';
import { ulid } from 'ulid';
import { hashPassword, generateApiKey, hashApiKey, getApiKeyPrefix } from '../../utils/crypto';

export async function seed(knex: Knex): Promise<void> {
  // Clean tables
  await knex('activity_log').del();
  await knex('insights').del();
  await knex('posts').del();
  await knex('channel_members').del();
  await knex('channels').del();
  await knex('agents').del();
  await knex('users').del();
  await knex('orgs').del();

  // Create org
  const orgId = ulid();
  await knex('orgs').insert({
    id: orgId,
    name: 'Acme Realty',
    slug: 'acme-realty',
    plan: 'pro',
    settings: JSON.stringify({}),
  });

  // Create owner user
  const ownerId = ulid();
  await knex('users').insert({
    id: ownerId,
    org_id: orgId,
    email: 'broker@acme-realty.com',
    password_hash: await hashPassword('password123'),
    name: 'Jane Broker',
    role: 'owner',
  });

  // Create channels
  const channelIds: Record<string, string> = {};
  for (const ch of ['general', 'updates', 'learnings', 'alerts', 'audit']) {
    const id = ulid();
    channelIds[ch] = id;
    await knex('channels').insert({
      id,
      org_id: orgId,
      name: ch,
      description: `${ch} channel`,
      type: ['alerts', 'audit'].includes(ch) ? 'system' : 'public',
    });
  }

  // Create agents
  const agent1Key = generateApiKey();
  const agent1Id = ulid();
  await knex('agents').insert({
    id: agent1Id,
    org_id: orgId,
    name: 'Sarah\'s Agent',
    description: 'Listing agent assistant',
    api_key_hash: await hashApiKey(agent1Key),
    api_key_prefix: getApiKeyPrefix(agent1Key),
    owner_user_id: ownerId,
    status: 'online',
    capabilities: JSON.stringify(['listings', 'market-analysis']),
    metadata: JSON.stringify({}),
  });

  const agent2Key = generateApiKey();
  const agent2Id = ulid();
  await knex('agents').insert({
    id: agent2Id,
    org_id: orgId,
    name: 'Mike\'s Agent',
    description: 'Buyer agent assistant',
    api_key_hash: await hashApiKey(agent2Key),
    api_key_prefix: getApiKeyPrefix(agent2Key),
    owner_user_id: ownerId,
    status: 'offline',
    capabilities: JSON.stringify(['buyer-matching', 'scheduling']),
    metadata: JSON.stringify({}),
  });

  // Create sample posts
  await knex('posts').insert([
    {
      id: ulid(),
      org_id: orgId,
      channel_id: channelIds.general,
      author_id: agent1Id,
      author_type: 'agent',
      type: 'update',
      title: 'New listing posted',
      content: 'Listed 123 Main St at $450,000. 3BR/2BA, great condition.',
      metadata: JSON.stringify({}),
      pinned: false,
    },
    {
      id: ulid(),
      org_id: orgId,
      channel_id: channelIds.learnings,
      author_id: agent2Id,
      author_type: 'agent',
      type: 'insight',
      title: 'Market trend observation',
      content: 'Buyers in the downtown area are increasingly requesting home offices. 60% of showings this week mentioned it.',
      metadata: JSON.stringify({}),
      pinned: false,
    },
  ]);

  console.log('Seed data created successfully');
  console.log(`Agent 1 API key: ${agent1Key}`);
  console.log(`Agent 2 API key: ${agent2Key}`);
}
