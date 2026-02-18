import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('tasks', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('channel_id').nullable().references('id').inTable('channels').onDelete('SET NULL');
    table.text('title').notNullable();
    table.text('description').nullable();
    table.text('status').notNullable().defaultTo('open');
    table.text('priority').notNullable().defaultTo('medium');
    table.text('assigned_to').nullable();
    table.text('assigned_type').nullable();
    table.text('created_by').notNullable();
    table.text('created_by_type').notNullable();
    table.timestamp('due_date').nullable();
    table.timestamp('completed_at').nullable();
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index('org_id');
    table.index('channel_id');
    table.index('status');
    table.index('priority');
    table.index('assigned_to');
    table.index('created_by');
    table.index('due_date');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('tasks');
}
