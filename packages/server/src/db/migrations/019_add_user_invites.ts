import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('invites', (table) => {
    // Add type column to distinguish between agent and user invites
    table.text('invite_type').notNullable().defaultTo('agent');

    // Add email column for user invites (nullable since agent invites don't need it)
    table.text('email').nullable();

    // Add role column for user invites to specify the role of invited user
    table.text('role').nullable();

    // Add redeemed_by_user_id column for tracking user invite redemptions
    table.text('redeemed_by_user_id').references('id').inTable('users').onDelete('SET NULL');
  });
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('invites', (table) => {
    table.dropColumn('redeemed_by_user_id');
    table.dropColumn('role');
    table.dropColumn('email');
    table.dropColumn('invite_type');
  });
}
