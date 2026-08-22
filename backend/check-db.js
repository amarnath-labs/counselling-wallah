import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM colleges) AS colleges,
      (SELECT COUNT(*) FROM branches) AS branches,
      (SELECT COUNT(*) FROM cutoffs) AS cutoffs
  `);

  console.table(r.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
