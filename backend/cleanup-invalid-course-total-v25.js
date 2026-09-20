import { pool } from "./src/db/pool.js";

const collegeId =
  "national-institute-of-technology-karnataka-surathkal";

async function main() {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const result = await client.query(`
      UPDATE college_fee_profiles
      SET
        total_course_fee = NULL,
        updated_at = NOW()
      WHERE college_id = $1
      RETURNING
        college_id,
        fee_year,
        tuition_fee_per_semester,
        annual_academic_fee,
        total_course_fee,
        source_kind,
        verification_status
    `, [collegeId]);

    console.table(result.rows);

    await client.query("COMMIT");

    console.log(
      "\n✅ Invalid course total removed."
    );
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
  }
}

main()
  .finally(async () => {
    await pool.end();
  });
