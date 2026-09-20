import "dotenv/config";
import { pool } from "./src/db/pool.js";

const COLLEGE_ID =
  "uptac-ashoka-institute-of-technology-management-varanasi";

async function main() {
  const result = await pool.query(
    `
    SELECT
      bf.branch_id,
      b.name AS branch_name,
      bf.academic_year,
      bf.fee_scope,
      COUNT(fv.id)::int AS variants,
      MIN(fv.total_fee) AS min_total,
      MAX(fv.total_fee) AS max_total
    FROM branch_fees bf
    JOIN branches b
      ON b.id = bf.branch_id
    LEFT JOIN fee_variants fv
      ON fv.branch_fee_id = bf.id
    WHERE bf.college_id = $1
      AND bf.academic_year = 2026
      AND bf.fee_scope = 'branch_specific'
    GROUP BY
      bf.branch_id,
      b.name,
      bf.academic_year,
      bf.fee_scope
    ORDER BY
      b.name
    `,
    [COLLEGE_ID]
  );

  console.log("");
  console.log("=======================================");
  console.log("ASHOKA FEE IMPORT VERIFICATION");
  console.log("=======================================");
  console.log("");

  console.table(result.rows);

  console.log("");
  console.log(
    "Total branch fee masters:",
    result.rows.length
  );

  console.log(
    "Total variants:",
    result.rows.reduce(
      (sum, row) =>
        sum + Number(row.variants || 0),
      0
    )
  );

  await pool.end();
}

main().catch(async (error) => {
  console.error(
    "FAILED:",
    error.message
  );

  try {
    await pool.end();
  } catch {}

  process.exitCode = 1;
});
