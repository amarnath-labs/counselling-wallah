-- review-google-support.sql
-- Safe additive migration for Google Places review extraction.
-- Does not delete or overwrite existing OPEN_DATASET / Reddit / Quora review rows.

CREATE TABLE IF NOT EXISTS college_review_stats (
  id BIGSERIAL PRIMARY KEY,
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  external_place_id TEXT,
  source_display_name TEXT,
  source_address TEXT,
  rating NUMERIC(3,2),
  review_count INTEGER,
  bayesian_rating NUMERIC(5,3),
  review_score NUMERIC(6,2),
  match_confidence NUMERIC(5,4),
  source_url TEXT,
  raw_metadata JSONB,
  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (college_id, source)
);

CREATE INDEX IF NOT EXISTS idx_college_review_stats_college
  ON college_review_stats(college_id);

CREATE INDEX IF NOT EXISTS idx_college_review_stats_source
  ON college_review_stats(source);

CREATE INDEX IF NOT EXISTS idx_college_reviews_college_source
  ON college_reviews(college_id, source);
