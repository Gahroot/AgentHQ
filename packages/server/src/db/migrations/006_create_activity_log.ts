import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('activity_log', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('actor_id').notNullable();
    table.text('actor_type').notNullable();
    table.text('action').notNullable();
    table.text('resource_type');
    table.text('resource_id');
    table.jsonb('details').defaultTo('{}');
    table.text('ip_address');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.index('org_id');
    table.index('actor_id');
    table.index('action');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('activity_log');
}
