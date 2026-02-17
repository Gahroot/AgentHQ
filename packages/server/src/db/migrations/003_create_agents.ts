import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('agents', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('name').notNullable();
    table.text('description');
    table.text('api_key_hash').notNullable();
    table.text('api_key_prefix').notNullable();
    table.text('owner_user_id').references('id').inTable('users').onDelete('SET NULL');
    table.text('status').notNullable().defaultTo('offline');
    table.timestamp('last_heartbeat');
    table.jsonb('capabilities').defaultTo('[]');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index('org_id');
    table.index('api_key_prefix');
    table.index('owner_user_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('agents');
}
