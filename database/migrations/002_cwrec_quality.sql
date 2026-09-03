-- ============================================================
-- CW-REC COLLEGE QUALITY METRICS
-- ADDITIVE / IDEMPOTENT
-- ============================================================

CREATE TABLE IF NOT EXISTS college_quality_metrics (
  id BIGSERIAL PRIMARY KEY,
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
  verification_status VARCHAR(50) DEFAULT 'pending',
  retrieved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quality_college
ON college_quality_metrics(college_id);

CREATE INDEX IF NOT EXISTS idx_quality_college_year
ON college_quality_metrics(college_id, academic_year);
