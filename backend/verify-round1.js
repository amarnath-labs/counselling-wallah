import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT *
    FROM counselling_events
    WHERE name = 'JoSAA 2026 Round 1'
  `);

  console.table(r.rows);
} finally {
  await pool.end();
}
