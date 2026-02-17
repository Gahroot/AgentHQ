import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('orgs', (table) => {
    table.text('id').primary();
    table.text('name').notNullable();
    table.text('slug').notNullable().unique();
    table.text('plan').notNullable().defaultTo('free');
    table.jsonb('settings').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('orgs');
}
