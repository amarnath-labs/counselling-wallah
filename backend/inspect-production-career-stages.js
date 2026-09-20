import "dotenv/config";
import { pool } from "./src/db/pool.js";

try {
  const result = await pool.query(`
    SELECT
      stage,
      COUNT(*)::int AS count
    FROM career_questions
    WHERE active = true
    GROUP BY stage
    ORDER BY stage
  `);

  console.table(result.rows);

  const foundation = await pool.query(`
    SELECT
      id,
      stage,
      section,
      trait,
      active,
      context_scope
    FROM career_questions
    WHERE stage = 'foundation'
    ORDER BY id
    LIMIT 20
  `);

  console.log("");
  console.log(
    "FOUNDATION SAMPLE COUNT:",
    foundation.rowCount
  );

  console.table(foundation.rows);
}
catch (error) {
  console.error(error);
}
finally {
  await pool.end();
}
