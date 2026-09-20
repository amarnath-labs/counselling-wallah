import "dotenv/config";
import pg from "pg";

const { Client } = pg;

const client = new Client({
  connectionString:
    process.env.DATABASE_URL ||
    process.env.DB_URL,

  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false
});

async function columnExists(table, column) {
  const result = await client.query(
    `
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = $1
      AND column_name = $2
    LIMIT 1
    `,
    [table, column]
  );

  return result.rowCount > 0;
}

async function addColumn(table, column, definition) {
  if (!(await columnExists(table, column))) {
    console.log(`Adding ${table}.${column}`);

    await client.query(
      `ALTER TABLE ${table}
       ADD COLUMN ${column} ${definition}`
    );
  }
}

async function main() {
  await client.connect();

  console.log("=======================================");
  console.log("REVIEW + SENTIMENT SAFE MIGRATION");
  console.log("=======================================");

  await client.query("BEGIN");

  try {
    // --------------------------------------------------
    // 1. REVIEW SOURCES
    // --------------------------------------------------

    await client.query(`
      CREATE TABLE IF NOT EXISTS college_review_sources (
        id BIGSERIAL PRIMARY KEY,
        college_id VARCHAR(255),
        source VARCHAR(30),
        external_place_id VARCHAR(255),
        source_url TEXT,
        rating NUMERIC(4,2),
        review_count INTEGER,
        source_status VARCHAR(50),
        last_synced_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await addColumn(
      "college_review_sources",
      "college_id",
      "VARCHAR(255)"
    );

    await addColumn(
      "college_review_sources",
      "source",
      "VARCHAR(30)"
    );

    await addColumn(
      "college_review_sources",
      "external_place_id",
      "VARCHAR(255)"
    );

    await addColumn(
      "college_review_sources",
      "source_url",
      "TEXT"
    );

    await addColumn(
      "college_review_sources",
      "rating",
      "NUMERIC(4,2)"
    );

    await addColumn(
      "college_review_sources",
      "review_count",
      "INTEGER"
    );

    await addColumn(
      "college_review_sources",
      "source_status",
      "VARCHAR(50)"
    );

    await addColumn(
      "college_review_sources",
      "last_synced_at",
      "TIMESTAMPTZ"
    );

    await addColumn(
      "college_review_sources",
      "created_at",
      "TIMESTAMPTZ DEFAULT NOW()"
    );

    await addColumn(
      "college_review_sources",
      "updated_at",
      "TIMESTAMPTZ DEFAULT NOW()"
    );

    // --------------------------------------------------
    // 2. REVIEWS
    // --------------------------------------------------

    await client.query(`
      CREATE TABLE IF NOT EXISTS college_reviews (
        id BIGSERIAL PRIMARY KEY,
        college_id VARCHAR(255),
        source VARCHAR(30),
        external_review_id TEXT,
        author_name TEXT,
        rating NUMERIC(4,2),
        review_text TEXT,
        review_date TIMESTAMPTZ,
        source_url TEXT,
        language VARCHAR(20),
        sentiment_label VARCHAR(20),
        sentiment_score NUMERIC(6,4),
        placement_sentiment NUMERIC(6,4),
        faculty_sentiment NUMERIC(6,4),
        campus_sentiment NUMERIC(6,4),
        hostel_sentiment NUMERIC(6,4),
        infrastructure_sentiment NUMERIC(6,4),
        fee_roi_sentiment NUMERIC(6,4),
        processed_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const reviewColumns = [
      ["college_id", "VARCHAR(255)"],
      ["source", "VARCHAR(30)"],
      ["external_review_id", "TEXT"],
      ["author_name", "TEXT"],
      ["rating", "NUMERIC(4,2)"],
      ["review_text", "TEXT"],
      ["review_date", "TIMESTAMPTZ"],
      ["source_url", "TEXT"],
      ["language", "VARCHAR(20)"],
      ["sentiment_label", "VARCHAR(20)"],
      ["sentiment_score", "NUMERIC(6,4)"],
      ["placement_sentiment", "NUMERIC(6,4)"],
      ["faculty_sentiment", "NUMERIC(6,4)"],
      ["campus_sentiment", "NUMERIC(6,4)"],
      ["hostel_sentiment", "NUMERIC(6,4)"],
      ["infrastructure_sentiment", "NUMERIC(6,4)"],
      ["fee_roi_sentiment", "NUMERIC(6,4)"],
      ["processed_at", "TIMESTAMPTZ"],
      ["created_at", "TIMESTAMPTZ DEFAULT NOW()"]
    ];

    for (const [column, definition] of reviewColumns) {
      await addColumn(
        "college_reviews",
        column,
        definition
      );
    }

    // --------------------------------------------------
    // 3. SENTIMENT SUMMARY
    // --------------------------------------------------

    await client.query(`
      CREATE TABLE IF NOT EXISTS college_sentiment_summary (
        college_id VARCHAR(255) PRIMARY KEY,
        google_rating NUMERIC(4,2),
        google_review_count INTEGER,
        google_sentiment NUMERIC(6,2),
        reddit_sentiment NUMERIC(6,2),
        quora_sentiment NUMERIC(6,2),
        placement_sentiment NUMERIC(6,2),
        faculty_sentiment NUMERIC(6,2),
        campus_sentiment NUMERIC(6,2),
        hostel_sentiment NUMERIC(6,2),
        infrastructure_sentiment NUMERIC(6,2),
        fee_roi_sentiment NUMERIC(6,2),
        overall_sentiment NUMERIC(6,2),
        review_score NUMERIC(6,2),
        analyzed_reviews INTEGER DEFAULT 0,
        confidence_score NUMERIC(6,2),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    const summaryColumns = [
      ["google_rating", "NUMERIC(4,2)"],
      ["google_review_count", "INTEGER"],
      ["google_sentiment", "NUMERIC(6,2)"],
      ["reddit_sentiment", "NUMERIC(6,2)"],
      ["quora_sentiment", "NUMERIC(6,2)"],
      ["placement_sentiment", "NUMERIC(6,2)"],
      ["faculty_sentiment", "NUMERIC(6,2)"],
      ["campus_sentiment", "NUMERIC(6,2)"],
      ["hostel_sentiment", "NUMERIC(6,2)"],
      ["infrastructure_sentiment", "NUMERIC(6,2)"],
      ["fee_roi_sentiment", "NUMERIC(6,2)"],
      ["overall_sentiment", "NUMERIC(6,2)"],
      ["review_score", "NUMERIC(6,2)"],
      ["analyzed_reviews", "INTEGER DEFAULT 0"],
      ["confidence_score", "NUMERIC(6,2)"],
      ["updated_at", "TIMESTAMPTZ DEFAULT NOW()"]
    ];

    for (const [column, definition] of summaryColumns) {
      await addColumn(
        "college_sentiment_summary",
        column,
        definition
      );
    }

    // --------------------------------------------------
    // 4. SAFE INDEXES
    // --------------------------------------------------

    await client.query(`
      CREATE INDEX IF NOT EXISTS
      idx_college_reviews_college_id
      ON college_reviews(college_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS
      idx_college_reviews_source
      ON college_reviews(source)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS
      idx_review_sources_college
      ON college_review_sources(college_id)
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS
      idx_review_sources_source
      ON college_review_sources(source)
    `);

    // Prevent duplicate source records.
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS
      uq_review_source_college_source
      ON college_review_sources(college_id, source)
      WHERE college_id IS NOT NULL
        AND source IS NOT NULL
    `);

    // Prevent duplicate reviews when external ID exists.
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS
      uq_college_review_external
      ON college_reviews(
        college_id,
        source,
        external_review_id
      )
      WHERE college_id IS NOT NULL
        AND source IS NOT NULL
        AND external_review_id IS NOT NULL
    `);

    await client.query("COMMIT");

    console.log("");
    console.log("REVIEW + SENTIMENT SCHEMA READY");
    console.log("Existing tables/data preserved.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

main()
  .catch(error => {
    console.error("FAILED:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await client.end();
  });