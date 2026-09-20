import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const { rows } = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_user AS database_user,
      inet_server_addr()::text AS server_address,
      inet_server_port() AS server_port
  `);

  console.table(rows);

  const rawUrl =
    process.env.DATABASE_URL ||
    process.env.DB_URL ||
    '';

  if (rawUrl) {
    try {
      const parsed = new URL(rawUrl);

      console.log('ENV DB HOST:', parsed.hostname);
      console.log('ENV DB PORT:', parsed.port || '5432');
      console.log('ENV DB NAME:', parsed.pathname.replace(/^\//, ''));
    } catch {
      console.log('ENV DB URL exists but could not be parsed.');
    }
  } else {
    console.log('NO DATABASE_URL / DB_URL FOUND');
  }

} finally {
  await pool.end();
}
