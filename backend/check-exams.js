import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT *
    FROM exams
    ORDER BY id
  `);

  console.table(r.rows);
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
