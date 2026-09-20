import "dotenv/config";
import { pool } from "./src/db/pool.js";

const tables = [
  "college_reviews",
  "college_review_items",
  "college_review_sources",
  "college_sentiment_summary",
  "review_sources",
  "review_aspect_sentiments",
  "review_aggregate_snapshots",
  "review_platform_aspect_ratings",
];

try {
  console.log(
    "\n========================================"
  );
  console.log(
    "TRUMARG REVIEW INTELLIGENCE AUDIT"
  );
  console.log(
    "========================================\n"
  );

  for (const table of tables) {
    const exists = await pool.query(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = $1
      ) AS exists
    `, [table]);

    if (!exists.rows[0].exists) {
      console.log(
        `\n${table}: MISSING`
      );
      continue;
    }

    const count = await pool.query(
      `SELECT COUNT(*)::int AS rows FROM "${table}"`
    );

    console.log(
      `\n${table}: ${count.rows[0].rows} rows`
    );

    const columns = await pool.query(`
      SELECT
        column_name,
        data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);

    console.table(columns.rows);
  }

  console.log(
    "\n========================================"
  );
  console.log(
    "ASPECT DISTRIBUTION"
  );
  console.log(
    "========================================"
  );

  const aspectCheck = await pool.query(`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'review_aspect_sentiments'
    ) AS exists
  `);

  if (aspectCheck.rows[0].exists) {
    const r = await pool.query(`
      SELECT
        COALESCE(aspect, 'NULL') AS aspect,
        COUNT(*)::int AS rows
      FROM review_aspect_sentiments
      GROUP BY aspect
      ORDER BY rows DESC
    `).catch(() => null);

    if (r) {
      console.table(r.rows);
    }
  }

} finally {
  await pool.end();
}
