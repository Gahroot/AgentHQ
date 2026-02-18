import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('channels', (table) => {
    table.text('dm_pair_hash').nullable();
  });

  await knex.raw(`
    CREATE UNIQUE INDEX channels_dm_pair_hash_unique
    ON channels (org_id, dm_pair_hash)
    WHERE dm_pair_hash IS NOT NULL
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('DROP INDEX IF EXISTS channels_dm_pair_hash_unique');

  await knex.schema.alterTable('channels', (table) => {
    table.dropColumn('dm_pair_hash');
  });
}
