import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('posts', (table) => {
    table.timestamp('edited_at').nullable();
    table.timestamp('deleted_at').nullable();
  });

  await knex.schema.createTable('post_edits', (table) => {
    table.text('id').primary();
    table.text('post_id').notNullable().references('id').inTable('posts').onDelete('CASCADE');
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('previous_content').notNullable();
    table.text('previous_title').nullable();
    table.text('edited_by').notNullable();
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.index('post_id');
    table.index('org_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('post_edits');

  await knex.schema.alterTable('posts', (table) => {
    table.dropColumn('edited_at');
    table.dropColumn('deleted_at');
  });
}
