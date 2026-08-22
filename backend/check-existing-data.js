import { pool } from "./src/db/pool.js";

try {
  const colleges = await pool.query(`
    SELECT id, name, institute_code
    FROM colleges
    ORDER BY name
    LIMIT 10
  `);

  console.log("\nCOLLEGES:");
  console.table(colleges.rows);

  const branches = await pool.query(`
    SELECT id, college_id, name
    FROM branches
    ORDER BY id
    LIMIT 10
  `);

  console.log("\nBRANCHES:");
  console.table(branches.rows);
} finally {
  await pool.end();
}
