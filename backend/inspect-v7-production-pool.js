import "dotenv/config";
import { pool } from "./src/db/pool.js";

try {
  const queries = [
    [
      "IDs starting v7_",
      `
        SELECT stage, COUNT(*)::int AS count
        FROM career_questions
        WHERE active = true
          AND id LIKE 'v7_%'
        GROUP BY stage
        ORDER BY stage
      `
    ],
    [
      "Foundation V7 IDs",
      `
        SELECT COUNT(*)::int AS count
        FROM career_questions
        WHERE active = true
          AND stage = 'foundation'
          AND id LIKE 'v7_%'
      `
    ],
    [
      "Class-8 V7-style IDs",
      `
        SELECT
          id,
          stage,
          section,
          trait,
          context_scope,
          difficulty
        FROM career_questions
        WHERE id LIKE 'v7_class8_%'
        ORDER BY id
        LIMIT 20
      `
    ]
  ];

  for (const [label, sql] of queries) {
    console.log("");
    console.log("====", label, "====");

    const result = await pool.query(sql);
    console.table(result.rows);
  }
}
catch (error) {
  console.error(error);
}
finally {
  await pool.end();
}
