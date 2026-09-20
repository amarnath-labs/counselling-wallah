import pg from "pg";

const { Pool } = pg;

const connectionString =
  process.env.PRODUCTION_DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "PRODUCTION_DATABASE_URL is not set."
  );
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

try {
  const db = await pool.query(`
    SELECT
      current_database() AS database_name
  `);

  console.log(
    "Production database:",
    db.rows[0].database_name
  );

  const result = await pool.query(`
    SELECT
      counselling_type,
      year,
      COUNT(*)::int AS rows
    FROM cutoffs
    WHERE counselling_type IN (
      'JOSAA',
      'CSAB_SPECIAL'
    )
      AND year BETWEEN 2024 AND 2026
    GROUP BY
      counselling_type,
      year
    ORDER BY
      counselling_type,
      year
  `);

  console.table(result.rows);
} finally {
  await pool.end();
}
