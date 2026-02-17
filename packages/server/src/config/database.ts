import knex, { Knex } from 'knex';
import { config } from './index';

let db: Knex;

export function getDb(): Knex {
  if (!db) {
    db = knex({
      client: 'pg',
      connection: config.database.url,
      pool: {
        min: config.database.poolMin,
        max: config.database.poolMax,
      },
      migrations: {
        directory: '../db/migrations',
        extension: 'ts',
      },
    });
  }
  return db;
}

export async function closeDb(): Promise<void> {
  if (db) {
    await db.destroy();
  }
}
