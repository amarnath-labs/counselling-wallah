-- ============================================================
-- COUNSELLING WALLAH DATABASE SCHEMA
-- ============================================================


-- ============================================================
-- EXAMS
-- ============================================================

CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- COLLEGES
-- ============================================================

CREATE TABLE IF NOT EXISTS colleges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  type TEXT NOT NULL,
  established INTEGER,
  website TEXT,
  portal TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
-- BRANCHES
-- ============================================================

CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,

  college_id TEXT NOT NULL
    REFERENCES colleges(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,

  fees BIGINT,

  median_package BIGINT,
  average_package BIGINT,
  highest_package BIGINT,

  placement_rate NUMERIC(5,2),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(college_id, name)
);


-- ============================================================
-- DATA SOURCES
-- ============================================================

CREATE TABLE IF NOT EXISTS data_sources (
  id BIGSERIAL PRIMARY KEY,

  label TEXT NOT NULL,

  source_type TEXT NOT NULL
    DEFAULT 'demo',

  is_verified BOOLEAN NOT NULL
    DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW()
);


-- ============================================================
-- CUTOFFS
-- ============================================================

CREATE TABLE IF NOT EXISTS cutoffs (
  id BIGSERIAL PRIMARY KEY,

  branch_id BIGINT NOT NULL
    REFERENCES branches(id)
    ON DELETE CASCADE,

  year INTEGER NOT NULL,

  round TEXT NOT NULL,

  category TEXT NOT NULL
    DEFAULT 'OPEN',

  quota TEXT NOT NULL
    DEFAULT 'OS',

  gender TEXT NOT NULL
    DEFAULT 'Gender-Neutral',

  closing_rank INTEGER NOT NULL,

  source_label TEXT,

  is_verified BOOLEAN NOT NULL
    DEFAULT FALSE,

  data_source_id BIGINT
    REFERENCES data_sources(id),

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  UNIQUE(
    branch_id,
    year,
    round,
    category,
    quota,
    gender
  )
);


-- ============================================================
-- COUNSELLING EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS counselling_events (
  id BIGSERIAL PRIMARY KEY,

  name TEXT NOT NULL,

  event_date_text TEXT NOT NULL,

  status TEXT NOT NULL
    CHECK (
      status IN (
        'done',
        'now',
        'upcoming'
      )
    ),

  exam_id TEXT
    REFERENCES exams(id)
    ON DELETE SET NULL,

  is_demo BOOLEAN NOT NULL
    DEFAULT TRUE,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW()
);


-- ============================================================
-- EXISTING INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_colleges_state
ON colleges(state);

CREATE INDEX IF NOT EXISTS idx_branches_college
ON branches(college_id);

CREATE INDEX IF NOT EXISTS idx_cutoffs_branch_year
ON cutoffs(branch_id, year);

CREATE INDEX IF NOT EXISTS idx_cutoffs_branch_year_round
ON cutoffs(branch_id, year, round);

CREATE INDEX IF NOT EXISTS idx_cutoffs_branch_year_id
ON cutoffs(branch_id, year, id DESC);

CREATE INDEX IF NOT EXISTS idx_counselling_events_exam
ON counselling_events(exam_id);



-- ============================================================
-- PREMIUM RECOMMENDATION DATA
-- ADDITIVE ONLY
-- ============================================================


-- ============================================================
-- COLLEGE QUALITY METRICS
-- ============================================================

CREATE TABLE IF NOT EXISTS college_quality_metrics (
  id BIGSERIAL PRIMARY KEY,

  /*
  ------------------------------------------------------------
  IMPORTANT:
  colleges.id is TEXT slug, not numeric.
  ------------------------------------------------------------
  */

  college_id TEXT NOT NULL,

  nirf_rank INTEGER,

  nirf_score NUMERIC(6,2),

  accreditation VARCHAR(100),

  median_package NUMERIC(12,2),

  average_package NUMERIC(12,2),

  highest_package NUMERIC(12,2),

  placement_rate NUMERIC(6,2),

  academic_year INTEGER,

  source_label VARCHAR(255),

  source_url TEXT,

  verification_status VARCHAR(50)
    DEFAULT 'pending',

  retrieved_at TIMESTAMPTZ
    DEFAULT NOW(),

  created_at TIMESTAMPTZ
    DEFAULT NOW()
);


-- ============================================================
-- FEES
-- ============================================================

CREATE TABLE IF NOT EXISTS college_fees (
  id BIGSERIAL PRIMARY KEY,

  college_id TEXT NOT NULL,

  tuition_fee NUMERIC(12,2),

  hostel_fee NUMERIC(12,2),

  other_fee NUMERIC(12,2),

  total_annual_fee NUMERIC(12,2),

  academic_year INTEGER,

  source_label VARCHAR(255),

  source_url TEXT,

  verification_status VARCHAR(50)
    DEFAULT 'pending',

  retrieved_at TIMESTAMPTZ
    DEFAULT NOW(),

  created_at TIMESTAMPTZ
    DEFAULT NOW()
);


-- ============================================================
-- COLLEGE REVIEWS
-- ============================================================

CREATE TABLE IF NOT EXISTS college_reviews (
  id BIGSERIAL PRIMARY KEY,

  college_id TEXT NOT NULL,

  rating NUMERIC(3,2),

  review_text TEXT,

  review_source VARCHAR(100),

  source_url TEXT,

  review_date DATE,

  language VARCHAR(50),

  verification_status VARCHAR(50)
    DEFAULT 'pending',

  created_at TIMESTAMPTZ
    DEFAULT NOW()
);


-- ============================================================
-- REVIEW SENTIMENT
-- ============================================================

CREATE TABLE IF NOT EXISTS college_review_sentiment (
  id BIGSERIAL PRIMARY KEY,

  review_id BIGINT NOT NULL,

  overall_sentiment VARCHAR(20),

  overall_score NUMERIC(6,4),

  academics_score NUMERIC(6,4),

  placements_score NUMERIC(6,4),

  faculty_score NUMERIC(6,4),

  infrastructure_score NUMERIC(6,4),

  hostel_score NUMERIC(6,4),

  campus_life_score NUMERIC(6,4),

  value_for_money_score NUMERIC(6,4),

  model_name VARCHAR(255),

  confidence NUMERIC(6,4),

  created_at TIMESTAMPTZ
    DEFAULT NOW()
);



-- ============================================================
-- FIX EXISTING PREMIUM TABLES
-- ============================================================
--
-- Earlier Premium tables may already have college_id BIGINT.
-- Existing Counselling Wallah college IDs are TEXT slugs.
--
-- Examples:
--
-- dtu-delhi
-- bit-mesra
-- gati-shakti-vishwavidyalaya-vadodara
--
-- Convert old premium columns safely to TEXT.
-- ============================================================

ALTER TABLE college_quality_metrics
ALTER COLUMN college_id
TYPE TEXT
USING college_id::TEXT;


ALTER TABLE college_fees
ALTER COLUMN college_id
TYPE TEXT
USING college_id::TEXT;


ALTER TABLE college_reviews
ALTER COLUMN college_id
TYPE TEXT
USING college_id::TEXT;



-- ============================================================
-- PREMIUM INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_quality_college
ON college_quality_metrics(college_id);


CREATE INDEX IF NOT EXISTS idx_quality_college_year
ON college_quality_metrics(
  college_id,
  academic_year
);


CREATE INDEX IF NOT EXISTS idx_fees_college
ON college_fees(college_id);


CREATE INDEX IF NOT EXISTS idx_fees_college_year
ON college_fees(
  college_id,
  academic_year
);


CREATE INDEX IF NOT EXISTS idx_reviews_college
ON college_reviews(college_id);


CREATE INDEX IF NOT EXISTS idx_reviews_college_date
ON college_reviews(
  college_id,
  review_date
);


CREATE INDEX IF NOT EXISTS idx_sentiment_review
ON college_review_sentiment(review_id);