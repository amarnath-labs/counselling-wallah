import { pool } from "./src/db/pool.js";

const NAME = "JoSAA 2026 Round 1";

const SOURCE_URL =
  "https://josaa.admissions.nic.in/applicant/seatallotmentresult/currentorcr.aspx";

async function main() {
  console.log("========================================");
  console.log("CREATE JOSAA 2026 ROUND 1");
  console.log("========================================");

  try {
    // Check whether Round 1 already exists
    const existing = await pool.query(
      `
      SELECT *
      FROM counselling_events
      WHERE name = $1
      LIMIT 1
      `,
      [NAME]
    );

    if (existing.rows.length > 0) {
      console.log("\nRound 1 already exists.");

      console.table(existing.rows);

      return;
    }

    const result = await pool.query(
      `
      INSERT INTO counselling_events (
        name,
        event_date_text,
        status,
        exam_id,
        is_demo,
        source_url,
        retrieved_at,
        verification_status
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        NOW(),
        $7
      )
      RETURNING *
      `,
      [
        NAME,
        "2026",
        "COMPLETED",
        "jee-advanced",
        false,
        SOURCE_URL,
        "VERIFIED"
      ]
    );

    console.log("\nROUND 1 CREATED SUCCESSFULLY");

    console.table(result.rows);

  } catch (error) {
    console.error("\nFAILED TO CREATE ROUND 1");
    console.error(error.stack || error.message);

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();