import { pool } from "./src/db/pool.js";

console.log("\n========================================");
console.log("college_review_items SCHEMA");
console.log("========================================");

const schema = await pool.query(`
  SELECT
    column_name,
    data_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'college_review_items'
  ORDER BY ordinal_position
`);

console.table(schema.rows);


const ids = [
  "national-institute-of-technology-rourkela",
  "national-institute-of-technology-silchar"
];

for (const id of ids) {

  console.log("\n========================================");
  console.log(id);
  console.log("========================================");

  const summary = await pool.query(
    `
    SELECT *
    FROM college_sentiment_summary
    WHERE college_id = $1
    `,
    [id]
  );

  console.log("\nSENTIMENT SUMMARY:");
  console.dir(
    summary.rows,
    {
      depth: null,
      colors: true
    }
  );


  const count = await pool.query(
    `
    SELECT COUNT(*)::int AS count
    FROM college_review_items
    WHERE college_id = $1
    `,
    [id]
  );

  console.log(
    "\nREVIEW ITEM COUNT:",
    count.rows[0]?.count
  );


  const reviews = await pool.query(
    `
    SELECT *
    FROM college_review_items
    WHERE college_id = $1
    ORDER BY id
    LIMIT 5
    `,
    [id]
  );

  console.log("\nSAMPLE REVIEW ITEMS:");

  console.dir(
    reviews.rows,
    {
      depth: null,
      colors: true
    }
  );
}

await pool.end();
