import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const DB_URL =
  process.env.DATABASE_URL ||
  process.env.DB_URL;

if (!DB_URL) {
  console.error("DATABASE_URL / DB_URL missing");
  process.exit(1);
}

const pool = new Pool({
  connectionString: DB_URL,
});

async function main() {
  try {
    console.log("Checking college + review summary join...\n");

    const result = await pool.query(`
      SELECT
        c.id,
        c.name,
        css.college_id,
        css.review_score,
        css.analyzed_reviews,
        css.confidence_score,
        css.overall_sentiment
      FROM colleges c
      INNER JOIN college_sentiment_summary css
        ON css.college_id = c.id::text
      WHERE css.analyzed_reviews > 0
      ORDER BY css.analyzed_reviews DESC
      LIMIT 10
    `);

    console.log(
      "MATCHING ROWS RETURNED:",
      result.rowCount
    );

    console.table(result.rows);

    const countResult = await pool.query(`
      SELECT
        COUNT(DISTINCT c.id) AS matched_colleges
      FROM colleges c
      INNER JOIN college_sentiment_summary css
        ON css.college_id = c.id::text
      WHERE css.analyzed_reviews > 0
    `);

    console.log(
      "\nTOTAL COLLEGES WITH MATCHED REVIEW DATA:",
      countResult.rows[0].matched_colleges
    );

    if (
      Number(
        countResult.rows[0].matched_colleges
      ) === 27
    ) {
      console.log(
        "\nSUCCESS: All 27 reviewed colleges match colleges.id."
      );
    } else if (
      Number(
        countResult.rows[0].matched_colleges
      ) > 0
    ) {
      console.log(
        "\nPARTIAL MATCH: Some reviewed colleges match, but expected 27."
      );
    } else {
      console.log(
        "\nFAILED: No reviewed colleges match colleges.id."
      );
    }
  } catch (error) {
    console.error("\nCHECK FAILED:");
    console.error(
      error.stack ||
      error.message
    );

    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();