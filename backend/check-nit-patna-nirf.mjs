import "dotenv/config";
import { pool } from "./src/db/pool.js";

try {
  const result = await pool.query(`
    SELECT
      c.id AS college_id,
      c.name AS college_name,
      qm.nirf_rank,
      qm.nirf_score,
      qm.academic_year,
      qm.verification_status,
      qm.source_label
    FROM college_quality_metrics qm
    INNER JOIN colleges c
      ON c.id::text = qm.college_id::text
    WHERE LOWER(c.name)
      LIKE '%national institute of technology patna%'
       OR LOWER(c.name)
      LIKE '%nit patna%'
    ORDER BY
      qm.academic_year DESC NULLS LAST,
      qm.retrieved_at DESC NULLS LAST
  `);

  console.table(result.rows);
} finally {
  await pool.end();
}
