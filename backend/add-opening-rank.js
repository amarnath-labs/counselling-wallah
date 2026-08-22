import { pool } from "./src/db/pool.js";

try {
  await pool.query(`
    ALTER TABLE cutoffs
    ADD COLUMN IF NOT EXISTS opening_rank INTEGER
  `);

  console.log("opening_rank column ready");
} catch (error) {
  console.error(error);
} finally {
  await pool.end();
}
