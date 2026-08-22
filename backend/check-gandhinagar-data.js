import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      c.id,
      c.name,
      c.city,
      c.state,
      c.type,
      COUNT(DISTINCT b.id)::int AS branches,
      COUNT(DISTINCT co.id)::int AS cutoffs
    FROM colleges c
    LEFT JOIN branches b
      ON b.college_id = c.id
    LEFT JOIN cutoffs co
      ON co.branch_id = b.id
    WHERE c.id IN (
      'iit-gandhinagar',
      'indian-institute-of-technology-gandhinagar'
    )
    GROUP BY c.id, c.name, c.city, c.state, c.type
    ORDER BY c.id;
  `);

  console.table(r.rows);
} finally {
  await pool.end();
}
