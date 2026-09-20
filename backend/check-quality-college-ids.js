import { pool } from "./src/db/pool.js";

try {
  const result = await pool.query(`
    SELECT
      c.id,
      c.name,
      c.type,
      c.city,
      c.state
    FROM colleges c
    WHERE
      LOWER(c.name) LIKE '%surathkal%'
      OR LOWER(c.name) LIKE '%warangal%'
      OR LOWER(c.name) LIKE '%deoghar%'
    ORDER BY c.name
  `);

  console.table(result.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
