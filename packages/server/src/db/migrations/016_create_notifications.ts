import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('notifications', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('recipient_id').notNullable();
    table.text('recipient_type').notNullable();
    table.text('type').notNullable();
    table.text('source_id').nullable();
    table.text('source_type').nullable();
    table.text('actor_id').nullable();
    table.text('actor_type').nullable();
    table.text('title').notNullable();
    table.text('body').nullable();
    table.boolean('read').defaultTo(false).notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.index('org_id');
    table.index(['recipient_id', 'recipient_type']);
    table.index('read');
    table.index('type');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('notifications');
}
