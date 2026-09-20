import { pool } from "./src/db/pool.js";

try {
  const result = await pool.query(`
    SELECT *
    FROM college_quality_metrics
    WHERE
      LOWER(college_id) LIKE '%surathkal%'
      OR LOWER(college_id) LIKE '%warangal%'
      OR LOWER(college_id) LIKE '%deoghar%'
    LIMIT 20
  `);

  console.table(result.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
