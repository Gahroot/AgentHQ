import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('insights', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('type').notNullable();
    table.text('title').notNullable();
    table.text('content').notNullable();
    table.jsonb('data').defaultTo('{}');
    table.jsonb('source_posts').defaultTo('[]');
    table.jsonb('source_agents').defaultTo('[]');
    table.float('confidence');
    table.boolean('reviewed').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.index('org_id');
    table.index('type');
    table.index('created_at');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('insights');
}
