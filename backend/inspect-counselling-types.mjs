import { pool } from "./src/db/pool.js";

try {
  const { rows } = await pool.query(`
    SELECT
      counselling_type,
      COUNT(*)::int AS count
    FROM cutoffs
    GROUP BY counselling_type
    ORDER BY count DESC
  `);

  console.table(rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
