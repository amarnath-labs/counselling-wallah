import pg from "pg";
import fs from "fs";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.PRODUCTION_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

try {
  const result = await pool.query(`
    SELECT *
    FROM cutoffs
    WHERE counselling_type IN (
      'JOSAA',
      'CSAB_SPECIAL'
    )
      AND year BETWEEN 2024 AND 2026
    ORDER BY id
  `);

  fs.writeFileSync(
    "./production-history-before-sync.json",
    JSON.stringify(result.rows, null, 2),
    "utf8"
  );

  console.log(
    "Backup rows:",
    result.rows.length
  );
} finally {
  await pool.end();
}
