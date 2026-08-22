import { pool } from "./src/db/pool.js";

const LABEL = "JoSAA 2026 Round 1 Official OR/CR";

const SOURCE_URL =
  "https://josaa.admissions.nic.in/applicant/seatallotmentresult/currentorcr.aspx";

try {
  console.log("========================================");
  console.log("CREATING JOSAA ROUND 1 DATA SOURCE");
  console.log("========================================");

  const existing = await pool.query(
    `
    SELECT *
    FROM data_sources
    WHERE label = $1
    LIMIT 1
    `,
    [LABEL]
  );

  if (existing.rows.length > 0) {
    console.log("\nDATA SOURCE ALREADY EXISTS");
    console.table(existing.rows);
  } else {
    const result = await pool.query(
      `
      INSERT INTO data_sources (
        label,
        source_type,
        is_verified,
        organization,
        source_url,
        official,
        last_checked_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        NOW()
      )
      RETURNING *
      `,
      [
        LABEL,
        "official",
        true,
        "JoSAA",
        SOURCE_URL,
        true
      ]
    );

    console.log("\nDATA SOURCE CREATED SUCCESSFULLY");
    console.table(result.rows);
  }
} catch (error) {
  console.error("\nFAILED:");
  console.error(error.stack || error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
