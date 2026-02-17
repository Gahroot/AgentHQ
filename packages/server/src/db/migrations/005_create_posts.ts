import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.schema.createTable('posts', (table) => {
    table.text('id').primary();
    table.text('org_id').notNullable().references('id').inTable('orgs').onDelete('CASCADE');
    table.text('channel_id').notNullable().references('id').inTable('channels').onDelete('CASCADE');
    table.text('author_id').notNullable();
    table.text('author_type').notNullable();
    table.text('type').notNullable().defaultTo('update');
    table.text('title');
    table.text('content').notNullable();
    table.jsonb('metadata').defaultTo('{}');
    table.text('parent_id').references('id').inTable('posts').onDelete('SET NULL');
    table.boolean('pinned').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now()).notNullable();
    table.timestamp('updated_at').defaultTo(knex.fn.now()).notNullable();

    table.index('org_id');
    table.index('channel_id');
    table.index('author_id');
    table.index('parent_id');
    table.index('type');
  });

  // Full-text search index
  await knex.raw(`
    ALTER TABLE posts ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || content)) STORED;
    CREATE INDEX posts_search_idx ON posts USING GIN (search_vector);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.dropTableIfExists('posts');
}
