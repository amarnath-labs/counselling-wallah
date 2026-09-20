import "dotenv/config";
import { pool } from "./src/db/pool.js";

const tables = [
  "review_sources",
  "college_review_items",
  "review_aspect_sentiments",
  "review_platform_aspect_ratings",
];

try {
  for (const table of tables) {
    console.log(
      `\n========== ${table} ==========`
    );

    const r = await pool.query(`
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);

    console.table(r.rows);
  }
}
finally {
  await pool.end();
}
