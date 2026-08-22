import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      id,
      name,
      city,
      state,
      type
    FROM colleges
    ORDER BY name;
  `);

  console.table(r.rows);
} finally {
  await pool.end();
}
