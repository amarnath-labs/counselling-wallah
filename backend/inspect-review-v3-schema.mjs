import { pool } from "./src/db/pool.js";

const tables = [
  "review_sources",
  "college_review_items",
  "review_aspect_sentiments",
  "review_aggregate_snapshots",
  "review_platform_aspect_ratings",
];

try {

  for (const table of tables) {

    console.log("");
    console.log("========================================");
    console.log(table);
    console.log("========================================");

    const { rows } = await pool.query(
      `
        SELECT
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `,
      [table]
    );

    console.table(rows);
  }


  console.log("");
  console.log("========================================");
  console.log("REVIEW DATA COUNTS");
  console.log("========================================");


  const counts = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM review_sources)::int
        AS review_sources,

      (SELECT COUNT(*) FROM college_review_items)::int
        AS college_review_items,

      (SELECT COUNT(*) FROM review_aspect_sentiments)::int
        AS review_aspect_sentiments,

      (SELECT COUNT(*) FROM review_aggregate_snapshots)::int
        AS review_aggregate_snapshots,

      (SELECT COUNT(*) FROM review_platform_aspect_ratings)::int
        AS review_platform_aspect_ratings
  `);

  console.table(counts.rows);


  console.log("");
  console.log("========================================");
  console.log("PROGRAMME LEVELS");
  console.log("========================================");

  const programmes = await pool.query(`
    SELECT
      programme_level,
      COUNT(*)::int AS count
    FROM college_review_items
    GROUP BY programme_level
    ORDER BY count DESC
  `);

  console.table(programmes.rows);


  console.log("");
  console.log("========================================");
  console.log("CONTENT ACCESS");
  console.log("========================================");

  const access = await pool.query(`
    SELECT
      content_access,
      evidence_strength,
      COUNT(*)::int AS count
    FROM college_review_items
    GROUP BY
      content_access,
      evidence_strength
    ORDER BY count DESC
  `);

  console.table(access.rows);


  console.log("");
  console.log("========================================");
  console.log("DUPLICATE STATUS");
  console.log("========================================");

  const duplicates = await pool.query(`
    SELECT
      duplicate_status,
      COUNT(*)::int AS count
    FROM college_review_items
    GROUP BY duplicate_status
    ORDER BY count DESC
  `);

  console.table(duplicates.rows);


  console.log("");
  console.log("========================================");
  console.log("ASPECTS");
  console.log("========================================");

  const aspects = await pool.query(`
    SELECT
      aspect,
      sentiment,
      COUNT(*)::int AS count
    FROM review_aspect_sentiments
    GROUP BY
      aspect,
      sentiment
    ORDER BY
      aspect,
      sentiment
  `);

  console.table(aspects.rows);


  console.log("");
  console.log("========================================");
  console.log("SOURCE TYPES");
  console.log("========================================");

  const sources = await pool.query(`
    SELECT
      source_type,
      COUNT(*)::int AS count
    FROM review_sources
    GROUP BY source_type
    ORDER BY count DESC
  `);

  console.table(sources.rows);


} catch (error) {

  console.error("");
  console.error("REVIEW V3 SCHEMA AUDIT FAILED");
  console.error(error);

} finally {

  await pool.end();
}