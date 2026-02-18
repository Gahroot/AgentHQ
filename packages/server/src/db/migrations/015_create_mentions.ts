import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('mentions', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
    table.text('mentioned_id').notNullable();
    table.text('mentioned_type').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['post_id', 'mentioned_id']);
    table.index('org_id');
    table.index('post_id');
    table.index('mentioned_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('mentions');
}
