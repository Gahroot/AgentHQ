import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('invites', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('token').notNullable().unique();
    table.text('created_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.text('status').notNullable().defaultTo('pending');
    table.text('redeemed_by_agent_id').references('id').inTable('agents').onDelete('SET NULL');
    table.timestamp('expires_at').notNullable();
    table.timestamp('redeemed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index('org_id');
    table.index('token');
    table.index('status');
    table.index('created_by');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('invites');
}
