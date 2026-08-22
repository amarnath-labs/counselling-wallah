import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT *
    FROM data_sources
    WHERE label = 'JoSAA 2026 Round 1 Official OR/CR'
  `);

  console.table(r.rows);
} finally {
  await pool.end();
}
