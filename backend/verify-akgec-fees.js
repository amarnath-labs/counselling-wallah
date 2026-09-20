import "dotenv/config";
import { pool } from "./src/db/pool.js";

const COLLEGE_ID =
  "uptac-ajay-kumar-garg-engg-college-ghaziabad";

async function main() {
  console.log("");
  console.log(
    "======================================="
  );
  console.log(
    "AKGEC FEE IMPORT VERIFICATION"
  );
  console.log(
    "======================================="
  );
  console.log("");

  const result =
    await pool.query(
      `
      SELECT
        bf.branch_id,
        b.name AS branch_name,
        bf.academic_year,
        bf.fee_scope,
        COUNT(fv.id)::int AS variants,
        MIN(fv.total_fee) AS min_total,
        MAX(fv.total_fee) AS max_total,
        STRING_AGG(
          DISTINCT fv.student_category,
          ', '
        ) AS categories
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
      [
        COLLEGE_ID
      ]
    );

  console.table(
    result.rows
  );

  const totalVariants =
    result.rows.reduce(
      (
        sum,
        row
      ) =>
        sum +
        Number(
          row.variants || 0
        ),
      0
    );

  const normal =
    result.rows.filter(
      row =>
        !/\(\s*FW\s*\)/i.test(
          row.branch_name
        )
    );

  const fw =
    result.rows.filter(
      row =>
        /\(\s*FW\s*\)/i.test(
          row.branch_name
        )
    );

  console.log("");

  console.log(
    "Total branch masters:",
    result.rows.length
  );

  console.log(
    "Normal branches:",
    normal.length
  );

  console.log(
    "FW branches:",
    fw.length
  );

  console.log(
    "Total variants:",
    totalVariants
  );

  console.log("");

  const pass =
    result.rows.length === 24 &&
    normal.length === 12 &&
    fw.length === 12 &&
    totalVariants === 96 &&
    result.rows.every(
      row =>
        Number(
          row.variants
        ) === 4
    );

  console.log(
    "VERIFICATION:",
    pass
      ? "PASS"
      : "FAILED"
  );

  console.log("");

  console.log(
    "DATABASE HAS NOT BEEN MODIFIED BY THIS VERIFIER."
  );

  await pool.end();
}

main().catch(
  async error => {
    console.error(
      "FAILED:",
      error.message
    );

    try {
      await pool.end();
    } catch {}

    process.exitCode =
      1;
  }
);