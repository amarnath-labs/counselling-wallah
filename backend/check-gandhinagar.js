import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT id, name, city, state, type
    FROM colleges
    WHERE id = 'indian-institute-of-technology-gandhinagar'
       OR id = 'iit-gandhinagar'
  `);

  console.table(r.rows);
} finally {
  await pool.end();
}
