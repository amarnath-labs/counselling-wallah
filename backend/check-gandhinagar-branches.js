import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      b.id,
      b.college_id,
      b.name
    FROM branches b
    WHERE b.college_id IN (
      'iit-gandhinagar',
      'indian-institute-of-technology-gandhinagar'
    )
    ORDER BY b.college_id, b.id;
  `);

  console.table(r.rows);
} finally {
  await pool.end();
}
