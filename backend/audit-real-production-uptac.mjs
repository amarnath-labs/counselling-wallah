import pg from 'pg';

const { Pool } = pg;

const productionUrl =
  process.env.PRODUCTION_DATABASE_URL;

if (!productionUrl) {
  console.error('STOPPED: PRODUCTION_DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: productionUrl,
});

try {
  const identity = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_user AS database_user,
      inet_server_addr()::text AS server_address,
      inet_server_port() AS server_port
  `);

  console.log('PRODUCTION DB IDENTITY:');
  console.table(identity.rows);

  const counts = await pool.query(`
    SELECT
      COUNT(*) FILTER (
        WHERE LOWER(COALESCE(counselling_type, '')) = 'uptac'
      )::int AS uptac_total,

      COUNT(*) FILTER (
        WHERE
          LOWER(COALESCE(counselling_type, '')) = 'uptac'
          AND year = 2025
          AND round = '1'
          AND category = 'OPEN'
      )::int AS uptac_2025_round1_open,

      COUNT(*) FILTER (
        WHERE
          LOWER(COALESCE(counselling_type, '')) = 'uptac'
          AND year = 2025
          AND round = '1'
          AND category = 'OPEN'
          AND closing_rank >= 50000
      )::int AS uptac_rank_50000
    FROM cutoffs
  `);

  console.log('\nUPTAC COUNTS:');
  console.table(counts.rows);

} catch (error) {
  console.error('FAILED:', error.message);
} finally {
  await pool.end();
}
