import "dotenv/config";
import { pool } from "./src/db/pool.js";

try {
  const result = await pool.query(`
    SELECT
      version,
      COUNT(*)::int AS count
    FROM career_questions
    WHERE id LIKE 'v7_%'
    GROUP BY version
    ORDER BY version
  `);

  console.table(result.rows);

  const class8 = await pool.query(`
    SELECT
      id,
      stage,
      version,
      classes,
      context_scope
    FROM career_questions
    WHERE id LIKE 'v7_class8_%'
    ORDER BY id
    LIMIT 10
  `);

  console.table(class8.rows);
}
finally {
  await pool.end();
}
