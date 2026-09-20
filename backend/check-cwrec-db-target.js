import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const { rows } = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_user AS database_user,
      inet_server_addr()::text AS server_ip,
      inet_server_port() AS server_port
  `);

  console.log(rows[0]);

  const tables = [
    'college_quality_metrics',
    'college_fee_profiles',
    'branch_fees',
    'college_reviews'
  ];

  for (const table of tables) {
    const result = await pool.query(
      `SELECT COUNT(*)::int AS count FROM ${table}`
    );

    console.log(`${table}: ${result.rows[0].count}`);
  }

} catch (error) {
  console.error('FAILED:', error.message);
} finally {
  await pool.end();
}
