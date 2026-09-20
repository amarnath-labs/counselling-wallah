import "dotenv/config";
import { pool } from "./src/db/pool.js";

const tables = [
  "career_questions",
  "career_assessments",
  "career_assessment_answers",
  "career_recommendations",
];

for (const table of tables) {
  try {
    const existsResult = await pool.query(
      "SELECT to_regclass($1) AS name",
      [`public.${table}`]
    );

    const exists = Boolean(
      existsResult.rows[0]?.name
    );

    console.log(
      `${table}: ${exists ? "EXISTS" : "MISSING"}`
    );

    if (exists) {
      const countResult =
        await pool.query(
          `SELECT COUNT(*)::int AS count FROM ${table}`
        );

      console.log(
        `  rows: ${countResult.rows[0].count}`
      );
    }
  } catch (error) {
    console.error(
      `${table}: ERROR`,
      error.message
    );
  }
}

await pool.end();
