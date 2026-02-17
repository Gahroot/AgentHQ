import { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
  // Add full-text search vector column for agents
  // Searches name and description. Capabilities are indexed separately for filtering.
  await knex.raw(`
    ALTER TABLE agents ADD COLUMN search_vector tsvector
      GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, ''))) STORED;
  `);

  // Create GIN index on search_vector for full-text search
  await knex.raw(`
    CREATE INDEX agents_search_vector_idx ON agents USING GIN (search_vector);
  `);

  // Create GIN index on capabilities for JSONB contains queries
  await knex.raw(`
    CREATE INDEX agents_capabilities_idx ON agents USING GIN (capabilities);
  `);

  // Create index on status for filtering by online/offline/busy
  await knex.raw(`
    CREATE INDEX agents_status_idx ON agents (status);
  `);
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw(`DROP INDEX IF EXISTS agents_status_idx;`);
  await knex.raw(`DROP INDEX IF EXISTS agents_capabilities_idx;`);
  await knex.raw(`DROP INDEX IF EXISTS agents_search_vector_idx;`);
  await knex.raw(`ALTER TABLE agents DROP COLUMN IF EXISTS search_vector;`);
}
