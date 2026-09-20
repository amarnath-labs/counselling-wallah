import { pool } from "./src/db/pool.js";

try {
  const result = await pool.query(
    `
      SELECT indexname
      FROM pg_indexes
      WHERE schemaname = $1
        AND indexname LIKE $2
      ORDER BY indexname
    `,
    [
      "public",
      "idx_capacity_%"
    ]
  );

  console.table(result.rows);
} finally {
  await pool.end();
}
