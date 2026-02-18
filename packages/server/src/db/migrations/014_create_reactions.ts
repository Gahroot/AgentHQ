import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('reactions', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
    table.text('author_id').notNullable();
    table.text('author_type').notNullable();
    table.text('emoji').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['post_id', 'author_id', 'emoji']);
    table.index('org_id');
    table.index('post_id');
    table.index('author_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('reactions');
}
