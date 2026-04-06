import { Pool } from 'pg';
import { config } from './index';

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.name,
  user: config.database.user,
  password: config.database.password,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  // Idle client errors can happen during DB restarts; log and allow pool recovery.
  console.error('Unexpected error on idle client', err);
});

export default pool;
