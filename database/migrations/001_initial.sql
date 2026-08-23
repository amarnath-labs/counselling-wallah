CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS branches (
  id BIGSERIAL PRIMARY KEY,
  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS data_sources (
  id BIGSERIAL PRIMARY KEY,
  label TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'demo',
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cutoffs (
  id BIGSERIAL PRIMARY KEY,
  branch_id BIGINT NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  round TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'OPEN',
  quota TEXT NOT NULL DEFAULT 'OS',
  gender TEXT NOT NULL DEFAULT 'Gender-Neutral',
  closing_rank INTEGER NOT NULL,
  source_label TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  data_source_id BIGINT REFERENCES data_sources(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(branch_id, year, round, category, quota, gender)
);

CREATE TABLE IF NOT EXISTS counselling_events (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  event_date_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('done', 'now', 'upcoming')),
  exam_id TEXT REFERENCES exams(id) ON DELETE SET NULL,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colleges_state ON colleges(state);
CREATE INDEX IF NOT EXISTS idx_branches_college ON branches(college_id);
CREATE INDEX IF NOT EXISTS idx_cutoffs_branch_year ON cutoffs(branch_id, year);
CREATE INDEX IF NOT EXISTS idx_cutoffs_branch_year_round ON cutoffs(branch_id, year, round);
CREATE INDEX IF NOT EXISTS idx_cutoffs_branch_year_id ON cutoffs(branch_id, year, id DESC);
CREATE INDEX IF NOT EXISTS idx_counselling_events_exam ON counselling_events(exam_id);

