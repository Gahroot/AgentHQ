import { config } from '../config';

module.exports = {
  client: 'pg',
  connection: config.database.url,
  pool: {
    min: config.database.poolMin,
    max: config.database.poolMax,
  },
  migrations: {
    directory: './migrations',
    extension: 'ts',
  },
  seeds: {
    directory: './seeds',
  },
};
