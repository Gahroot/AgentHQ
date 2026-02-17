import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('integrations', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('type').notNullable(); // fub, dotloop, quickbooks
    table.text('status').notNullable().defaultTo('disconnected'); // connected, disconnected, error
    table.text('credentials_encrypted');
    table.jsonb('settings').defaultTo('{}');
    table.text('last_error');
    table.timestamp('last_synced_at');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.unique(['org_id', 'type']);
    table.index('org_id');
    table.index('type');
    table.index('status');
  });

  await knex.schema.createTable('integration_sync_log', (table) => {
    table.text('id').primary();
    table.text('integration_id').notNullable().references('id').inTable('integrations').onDelete('CASCADE');
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('operation').notNullable();
    table.text('status').notNullable().defaultTo('started'); // started, completed, failed
    table.integer('records_synced').defaultTo(0);
    table.text('error');
    table.jsonb('metadata').defaultTo('{}');
    table.timestamp('started_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('completed_at');

    table.index('integration_id');
    table.index('org_id');
    table.index('status');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('integration_sync_log');
  await knex.schema.dropTableIfExists('integrations');
}
