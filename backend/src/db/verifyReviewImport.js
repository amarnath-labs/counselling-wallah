import pg from "pg";
import "dotenv/config";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

async function main() {
  try {
    console.log("");
    console.log("========================================");
    console.log("REVIEW DATABASE VERIFICATION");
    console.log("========================================");

    const totals = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM college_review_items)
          AS review_items,

        (SELECT COUNT(*) FROM review_aspect_sentiments)
          AS aspect_sentiments,

        (SELECT COUNT(*) FROM review_aggregate_snapshots)
          AS aggregate_snapshots,

        (SELECT COUNT(*) FROM review_platform_aspect_ratings)
          AS platform_aspect_ratings,

        (SELECT COUNT(*) FROM review_sources)
          AS review_sources
    `);

    console.log("");
    console.log("TOTAL DATABASE ROWS");
    console.table(totals.rows);

    const colleges = await pool.query(`
      SELECT
        c.id,
        c.name,

        COUNT(DISTINCT r.id)
          AS reviews,

        COUNT(DISTINCT a.id)
          AS aggregates,

        COUNT(DISTINCT p.id)
          AS platform_aspects

      FROM colleges c

      LEFT JOIN college_review_items r
        ON r.college_id = c.id

      LEFT JOIN review_aggregate_snapshots a
        ON a.college_id = c.id

      LEFT JOIN review_platform_aspect_ratings p
        ON p.college_id = c.id

      WHERE
        r.id IS NOT NULL
        OR a.id IS NOT NULL
        OR p.id IS NOT NULL

      GROUP BY c.id, c.name

      ORDER BY c.name
    `);

    console.log("");
    console.log("COLLEGES WITH REVIEW DATA");
    console.table(colleges.rows);

    const sentimentCounts = await pool.query(`
      SELECT
        LOWER(sentiment) AS sentiment,
        COUNT(*) AS count
      FROM review_aspect_sentiments
      GROUP BY LOWER(sentiment)
      ORDER BY count DESC
    `);

    console.log("");
    console.log("SENTIMENT DISTRIBUTION");
    console.table(sentimentCounts.rows);

    const aspectCounts = await pool.query(`
      SELECT
        LOWER(aspect) AS aspect,
        COUNT(*) AS count
      FROM review_aspect_sentiments
      GROUP BY LOWER(aspect)
      ORDER BY count DESC
      LIMIT 20
    `);

    console.log("");
    console.log("TOP ASPECTS");
    console.table(aspectCounts.rows);

    const sourceCounts = await pool.query(`
      SELECT
        s.name,
        COUNT(DISTINCT r.id) AS reviews
      FROM review_sources s
      LEFT JOIN college_review_items r
        ON r.source_id = s.id
      GROUP BY s.id, s.name
      ORDER BY reviews DESC, s.name
    `);

    console.log("");
    console.log("REVIEW SOURCES");
    console.table(sourceCounts.rows);

    console.log("");
    console.log("========================================");
    console.log("VERIFICATION COMPLETE");
    console.log("========================================");
  } catch (error) {
    console.error("");
    console.error("VERIFICATION FAILED:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

main();