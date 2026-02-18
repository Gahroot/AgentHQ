import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  await knex.raw(`
    ALTER TABLE insights ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || content)) STORED;
  `);

  await knex.raw(`
    CREATE INDEX insights_search_vector_idx ON insights USING GIN (search_vector);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS insights_search_vector_idx;`);
  await knex.raw(`ALTER TABLE insights DROP COLUMN IF EXISTS search_vector;`);
}
