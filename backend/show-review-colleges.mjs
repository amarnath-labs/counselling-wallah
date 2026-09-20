import "dotenv/config";
import { pool } from "./src/db/pool.js";

try {
  const r =
    await pool.query(`
      SELECT
        college_id,
        COUNT(*)::int AS reviews
      FROM college_review_items
      GROUP BY college_id
      ORDER BY reviews DESC
      LIMIT 5
    `);

  console.table(r.rows);
}
finally {
  await pool.end();
}
