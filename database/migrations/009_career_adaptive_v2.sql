BEGIN;

CREATE TABLE IF NOT EXISTS career_questions (
  id TEXT PRIMARY KEY,
  stage TEXT NOT NULL,
  section TEXT NOT NULL,
  trait TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'measurement',
  text TEXT NOT NULL,
  options_json JSONB NOT NULL DEFAULT '[
    {"value":1,"label":"Strongly disagree"},
    {"value":2,"label":"Disagree"},
    {"value":3,"label":"Not sure"},
    {"value":4,"label":"Agree"},
    {"value":5,"label":"Strongly agree"}
  ]'::jsonb,
  degrees TEXT[] NOT NULL DEFAULT '{}',
  branches TEXT[] NOT NULL DEFAULT '{}',
  streams TEXT[] NOT NULL DEFAULT '{}',
  subjects TEXT[] NOT NULL DEFAULT '{}',
  skills TEXT[] NOT NULL DEFAULT '{}',
  goals TEXT[] NOT NULL DEFAULT '{}',
  tags TEXT[] NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 3,
  weight NUMERIC(6,3) NOT NULL DEFAULT 1,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_career_questions_stage_active
  ON career_questions(stage, active);

CREATE INDEX IF NOT EXISTS idx_career_questions_trait
  ON career_questions(trait);

CREATE TABLE IF NOT EXISTS career_assessments (
  id UUID PRIMARY KEY,
  stage TEXT NOT NULL,
  profile_json JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'abandoned')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS career_assessment_answers (
  id BIGSERIAL PRIMARY KEY,
  assessment_id UUID NOT NULL
    REFERENCES career_assessments(id)
    ON DELETE CASCADE,
  question_id TEXT NOT NULL
    REFERENCES career_questions(id),
  value INTEGER NOT NULL
    CHECK (value BETWEEN 1 AND 5),
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assessment_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_career_answers_assessment
  ON career_assessment_answers(assessment_id, answered_at);

CREATE TABLE IF NOT EXISTS career_recommendations (
  assessment_id UUID PRIMARY KEY
    REFERENCES career_assessments(id)
    ON DELETE CASCADE,
  report_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
