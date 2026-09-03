-- ============================================================
-- CW-REC COLLEGE REVIEWS
-- ADDITIVE / IDEMPOTENT
-- NO DATA DELETE
-- ============================================================

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
);

CREATE INDEX IF NOT EXISTS
  idx_college_reviews_college_id
ON college_reviews(college_id);

CREATE INDEX IF NOT EXISTS
  idx_college_reviews_source
ON college_reviews(source);

CREATE INDEX IF NOT EXISTS
  idx_college_reviews_college_source
ON college_reviews(college_id, source);
