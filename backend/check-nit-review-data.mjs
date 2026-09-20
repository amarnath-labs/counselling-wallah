import { pool } from "./src/db/pool.js";

const ids = [
  "national-institute-of-technology-rourkela",
  "national-institute-of-technology-silchar"
];

for (const id of ids) {

  console.log("\n================================");
  console.log(id);
  console.log("================================");

  const summary = await pool.query(
    `
    SELECT *
    FROM college_sentiment_summary
    WHERE college_id = $1
    `,
    [id]
  );

  console.log(
    "SENTIMENT SUMMARY:",
    summary.rows
  );

  const reviews = await pool.query(
    `
    SELECT
      id,
      college_id,
      source,
      branch_text,
      rating,
      evidence_strength
    FROM college_review_items
    WHERE college_id = $1
    ORDER BY id
    LIMIT 20
    `,
    [id]
  );

  console.log(
    "REVIEW ITEMS:",
    reviews.rows
  );
}

await pool.end();

