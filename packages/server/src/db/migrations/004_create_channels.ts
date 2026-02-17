import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('channels', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('name').notNullable();
    table.text('description');
    table.text('type').notNullable().defaultTo('public');
    table.text('created_by');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['org_id', 'name']);
    table.index('org_id');
  });

  await knex.schema.createTable('channel_members', (table) => {
    table.text('channel_id').notNullable().references('id').inTable('channels').onDelete('CASCADE');
    table.text('member_id').notNullable();
    table.text('member_type').notNullable();
    table.timestamp('joined_at').defaultTo(knex.fn.now()).notNullable();

    table.primary(['channel_id', 'member_id', 'member_type']);
    table.index('member_id');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('channel_members');
  await knex.schema.dropTableIfExists('channels');
}
