import { pool } from "./src/db/pool.js";

try {
  const { rows } = await pool.query(`
    SELECT
      counselling_type,
      year,
      round,
      category,
      COUNT(*)::int AS count
    FROM cutoffs
    WHERE counselling_type IN (
      'JOSAA',
      'CSAB_SPECIAL',
      'CSAB_SUPERNUMERARY',
      'CSAB_NEUT'
    )
    GROUP BY
      counselling_type,
      year,
      round,
      category
    ORDER BY
      year DESC,
      counselling_type,
      round,
      category
    LIMIT 100
  `);

  console.table(rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
