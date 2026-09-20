import { pool } from "./src/db/pool.js";

async function main() {

  const result = await pool.query(`
    SELECT
      c.id AS college_id,
      c.name AS college_name,

      EXISTS (
        SELECT 1
        FROM college_fee_profiles fp
        WHERE fp.college_id = c.id::text
      ) AS direct_fee,

      (
        SELECT fp.college_id
        FROM college_fee_profiles fp
        WHERE
          LOWER(
            REGEXP_REPLACE(
              fp.college_name_normalized,
              '[^a-z0-9]+',
              '',
              'g'
            )
          )
          =
          LOWER(
            REGEXP_REPLACE(
              c.name,
              '[^a-z0-9]+',
              '',
              'g'
            )
          )
        LIMIT 1
      ) AS exact_name_fee_id

    FROM colleges c

    WHERE EXISTS (
      SELECT 1
      FROM branches b
      JOIN cutoffs co
        ON co.branch_id = b.id
      WHERE
        b.college_id = c.id
        AND co.year = 2026
        AND (
          LOWER(COALESCE(co.counselling_type,'')) = 'josaa'
          OR LOWER(COALESCE(co.source_label,'')) LIKE '%josaa%'
        )
    )

    ORDER BY c.name
  `);

  const missingDirect =
    result.rows.filter(
      row =>
        !row.direct_fee
    );

  console.log("");
  console.log("========================================");
  console.log("CW-REC COLLEGE ID / FEE ID AUDIT V23");
  console.log("========================================");

  console.log("");
  console.log(
    "JoSAA colleges:",
    result.rows.length
  );

  console.log(
    "Without direct fee profile:",
    missingDirect.length
  );

  console.log("");

  console.table(
    missingDirect.map(row => ({
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      exact_name_fee_id:
        row.exact_name_fee_id,

      candidate:
        row.exact_name_fee_id
          ? "EXACT NAME MATCH"
          : "NO EXACT MATCH"
    }))
  );

  console.log("");
  console.log(
    "✅ COLLEGE/FEE ID AUDIT COMPLETE"
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
