import "dotenv/config";
import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      b.id,
      b.name,
      c.name AS college_name
    FROM branches b
    JOIN colleges c
      ON c.id = b.college_id
    WHERE LOWER(c.name) LIKE '%surathkal%'
      AND LOWER(b.name) LIKE '%computer science%'
    ORDER BY b.id
  `);

  console.table(r.rows);
}
finally {
  await pool.end();
}
