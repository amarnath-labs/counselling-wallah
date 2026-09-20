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
  const client = await pool.connect();

  try {
    console.log("Creating review tables...");
    await client.query("BEGIN");

    await client.query(`
      CREATE TABLE IF NOT EXISTS review_sources (
        id BIGSERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        source_type TEXT,
        base_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS college_review_items (
        id BIGSERIAL PRIMARY KEY,

        college_id TEXT NOT NULL
          REFERENCES colleges(id)
          ON DELETE CASCADE,

        source_id BIGINT
          REFERENCES review_sources(id)
          ON DELETE SET NULL,

        source_review_id TEXT,
        source_url TEXT,

        author_display_name TEXT,
        review_title TEXT,

        review_date DATE,
        observed_at TIMESTAMPTZ,

        content_type TEXT,
        content_access TEXT,
        evidence_strength TEXT,

        programme_level TEXT,

        course TEXT,
        course_verified BOOLEAN NOT NULL DEFAULT FALSE,

        department TEXT,

        branch_text TEXT,
        branch_verified BOOLEAN NOT NULL DEFAULT FALSE,

        rating NUMERIC(8,2),
        rating_scale NUMERIC(8,2),

        duplicate_status TEXT NOT NULL DEFAULT 'unknown',

        duplicate_of BIGINT
          REFERENCES college_review_items(id)
          ON DELETE SET NULL,

        raw_payload JSONB,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS review_aspect_sentiments (
        id BIGSERIAL PRIMARY KEY,

        review_item_id BIGINT NOT NULL
          REFERENCES college_review_items(id)
          ON DELETE CASCADE,

        aspect TEXT NOT NULL,
        target_branch TEXT,
        scope TEXT,
        sentiment TEXT NOT NULL,
        evidence_summary TEXT,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS review_aggregate_snapshots (
        id BIGSERIAL PRIMARY KEY,

        college_id TEXT NOT NULL
          REFERENCES colleges(id)
          ON DELETE CASCADE,

        source_id BIGINT
          REFERENCES review_sources(id)
          ON DELETE SET NULL,

        source_url TEXT,

        aggregate_rating NUMERIC(8,2),
        rating_scale NUMERIC(8,2),

        review_count INTEGER,
        verified_review_count INTEGER,

        observed_values JSONB,
        observation_status TEXT,
        programme_scope TEXT,
        evidence_strength TEXT,
        observed_at TIMESTAMPTZ,
        notes TEXT,

        raw_payload JSONB,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS review_platform_aspect_ratings (
        id BIGSERIAL PRIMARY KEY,

        college_id TEXT NOT NULL
          REFERENCES colleges(id)
          ON DELETE CASCADE,

        source_id BIGINT
          REFERENCES review_sources(id)
          ON DELETE SET NULL,

        aspect TEXT NOT NULL,

        rating NUMERIC(8,2),
        rating_scale NUMERIC(8,2),

        programme_scope TEXT,
        source_url TEXT,
        observed_at TIMESTAMPTZ,

        raw_payload JSONB,

        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_review_items_college
      ON college_review_items(college_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_review_items_source
      ON college_review_items(source_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_review_items_branch
      ON college_review_items(branch_text);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_review_items_programme
      ON college_review_items(programme_level);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_review_aspect_item
      ON review_aspect_sentiments(review_item_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_review_aspect_name
      ON review_aspect_sentiments(aspect);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_review_aggregate_college
      ON review_aggregate_snapshots(college_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_review_platform_aspect_college
      ON review_platform_aspect_ratings(college_id);
    `);

    await client.query("COMMIT");

    console.log("");
    console.log("========================================");
    console.log("REVIEW TABLES CREATED SUCCESSFULLY");
    console.log("========================================");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

main();

