import knex from 'knex';
import { config } from '../config';

async function migrate() {
  const db = knex({
    client: 'pg',
    connection: config.database.url,
  });
  try {
    const [batch, migrations] = await db.migrate.latest({
      directory: __dirname + '/migrations',
      loadExtensions: ['.js'],
    });
    if (migrations.length > 0) {
      console.log(`Migrations batch ${batch} applied: ${migrations.join(', ')}`);
    } else {
      console.log('Database already up to date');
    }
  } finally {
    await db.destroy();
  }
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
