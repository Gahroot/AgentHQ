import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // RE Agent Profiles
  await knex.schema.createTable('re_agent_profiles', (table) => {
    table.text('agent_id').primary().references('id').inTable('agents').onDelete('CASCADE');
    table.text('role').notNullable(); // listing_agent, buyers_agent, broker, transaction_coordinator
    table.text('license_number');
    table.jsonb('specializations').defaultTo('[]');
    table.jsonb('territories').defaultTo('[]');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();
  });

  // RE Transactions
  await knex.schema.createTable('re_transactions', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('property_address').notNullable();
    table.text('mls_number');
    table.text('status').notNullable().defaultTo('prospecting');
    table.text('type').notNullable(); // buy, sell, lease
    table.decimal('listing_price', 12, 2);
    table.decimal('sale_price', 12, 2);
    table.decimal('commission_rate', 5, 4);
    table.decimal('commission_amount', 12, 2);
    table.text('listing_agent_id').references('id').inTable('agents').onDelete('SET NULL');
    table.text('buyers_agent_id').references('id').inTable('agents').onDelete('SET NULL');
    table.text('client_name');
    table.jsonb('key_dates').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index('org_id');
    table.index('status');
    table.index('listing_agent_id');
    table.index('buyers_agent_id');
  });

  // RE Metrics
  await knex.schema.createTable('re_metrics', (table) => {
    table.text('id').primary(); // use ULID
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('agent_id').references('id').inTable('agents').onDelete('CASCADE'); // null = org-wide
    table.text('period').notNullable(); // daily, weekly, monthly
    table.date('period_start').notNullable();
    table.jsonb('metrics').defaultTo('{}');
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();

    table.index('org_id');
    table.index('agent_id');
    table.index(['org_id', 'period', 'period_start']);
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('re_metrics');
  await knex.schema.dropTableIfExists('re_transactions');
  await knex.schema.dropTableIfExists('re_agent_profiles');
}
