import { pool } from "./src/db/pool.js";

const collegeId =
  "national-institute-of-technology-warangal";

const sourceUrl =
  "https://nitw.ac.in/main/academics/feestructure/";

async function main() {
  const client =
    await pool.connect();

  try {
    await client.query("BEGIN");

    const before =
      await client.query(`
        SELECT
          college_id,
          tuition_fee_per_semester,
          annual_academic_fee,
          total_course_fee,
          source_kind,
          verification_status,
          source_url
        FROM college_fee_profiles
        WHERE college_id = $1
        ORDER BY fee_year DESC
        LIMIT 1
      `, [collegeId]);

    console.log("\n=== BEFORE ===");
    console.table(before.rows);

    const result =
      await client.query(`
        UPDATE college_fee_profiles
        SET
          tuition_fee_per_semester = 62500,
          annual_academic_fee = 125000,
          source_kind = 'official',
          verification_status = 'high_confidence',
          source_url = $2,
          updated_at = NOW()
        WHERE college_id = $1
        RETURNING
          college_id,
          fee_year,
          tuition_fee_per_semester,
          annual_academic_fee,
          total_course_fee,
          source_kind,
          verification_status,
          source_url
      `, [
        collegeId,
        sourceUrl
      ]);

    if (
      result.rowCount !== 1
    ) {
      throw new Error(
        `Expected 1 profile, updated ${result.rowCount}`
      );
    }

    console.log("\n=== AFTER ===");
    console.table(result.rows);

    await client.query("COMMIT");

    console.log(
      "\n✅ NIT Warangal fee enrichment committed."
    );
  } catch (error) {
    await client.query("ROLLBACK");

    console.error(
      "\n❌ Rolled back:",
      error
    );

    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main()
  .finally(async () => {
    await pool.end();
  });
