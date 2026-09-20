import { pool } from "./src/db/pool.js";

try {
  const result = await pool.query(`
    SELECT
      c.id,
      c.name,
      COUNT(co.id) AS cutoff_count
    FROM colleges c
    LEFT JOIN branches b
      ON b.college_id = c.id
    LEFT JOIN cutoffs co
      ON co.branch_id = b.id
    WHERE
      c.id IN (
        'national-institute-of-technology-karnataka-surathkal',
        'nit-surathkal',
        'national-institute-of-technology-warangal',
        'nit-warangal',
        'birla-institute-of-technology-deoghar-off-campus'
      )
    GROUP BY
      c.id,
      c.name
    ORDER BY
      cutoff_count DESC
  `);

  console.table(result.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
