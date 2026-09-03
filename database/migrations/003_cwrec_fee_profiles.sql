-- ============================================================
-- CW-REC COLLEGE FEE PROFILES
-- ADDITIVE / IDEMPOTENT
-- ============================================================

CREATE TABLE IF NOT EXISTS college_fee_profiles (
  id BIGSERIAL PRIMARY KEY,

  college_id TEXT NULL,

  college_name_raw TEXT NOT NULL,
  college_name_normalized TEXT NOT NULL,

  fee_year INTEGER NOT NULL DEFAULT 2026,

  tuition_fee_per_semester INTEGER NULL,
  academic_fee_per_semester INTEGER NULL,
  first_semester_fee INTEGER NULL,
  mess_fee_per_semester INTEGER NULL,
  annual_academic_fee INTEGER NULL,

  source_url TEXT NULL,
  extraction_status TEXT NULL,

  confidence_score INTEGER NOT NULL DEFAULT 0,

  verification_status TEXT NOT NULL
    DEFAULT 'needs_review',

  source_kind TEXT NOT NULL
    DEFAULT 'official_scrape',

  is_manually_verified BOOLEAN NOT NULL
    DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  CONSTRAINT college_fee_profiles_confidence_check
    CHECK (
      confidence_score >= 0
      AND confidence_score <= 100
    ),

  CONSTRAINT college_fee_profiles_status_check
    CHECK (
      verification_status IN (
        'needs_review',
        'review_recommended',
        'high_confidence',
        'verified'
      )
    )
);

ALTER TABLE college_fee_profiles
  ADD COLUMN IF NOT EXISTS
    hostel_fee_per_semester NUMERIC(12,2),

  ADD COLUMN IF NOT EXISTS
    annual_total_fee NUMERIC(12,2),

  ADD COLUMN IF NOT EXISTS
    total_course_fee NUMERIC(12,2);

CREATE UNIQUE INDEX IF NOT EXISTS
  college_fee_profiles_name_year_uidx
ON college_fee_profiles (
  college_name_normalized,
  fee_year
);

CREATE INDEX IF NOT EXISTS
  college_fee_profiles_college_id_idx
ON college_fee_profiles (
  college_id
);

CREATE INDEX IF NOT EXISTS
  college_fee_profiles_verification_idx
ON college_fee_profiles (
  verification_status,
  confidence_score DESC
);
