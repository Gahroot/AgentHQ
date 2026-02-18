import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('webhooks', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('url').notNullable();
    table.text('events').notNullable(); // JSON array of event types
    table.text('secret').nullable(); // For signature verification
    table.boolean('active').defaultTo(true).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index('org_id');
    table.index('active');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('webhooks');
}
