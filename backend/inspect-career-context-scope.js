import "dotenv/config";
import { pool } from "./src/db/pool.js";

try {
  const constraint = await pool.query(`
    SELECT
      pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conname =
      'career_questions_context_scope_check'
  `);

  console.log("CURRENT CONSTRAINT:");
  console.log(
    constraint.rows[0]?.definition ||
    "NOT FOUND"
  );

  console.log("");
  console.log("CURRENT CONTEXT_SCOPE VALUES:");

  const values = await pool.query(`
    SELECT
      context_scope,
      COUNT(*)::int AS count
    FROM career_questions
    GROUP BY context_scope
    ORDER BY count DESC, context_scope
  `);

  console.table(values.rows);
}
catch (error) {
  console.error(error);
}
finally {
  await pool.end();
}
