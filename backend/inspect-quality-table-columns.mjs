import "dotenv/config";
import { pool } from "./src/db/pool.js";

try {
  const result = await pool.query(`
    SELECT
      column_name,
      data_type
    FROM information_schema.columns
    WHERE table_name = 'college_quality_metrics'
    ORDER BY ordinal_position
  `);

  console.table(result.rows);
} finally {
  await pool.end();
}
