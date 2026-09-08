ALTER TABLE career_assessments
  ADD COLUMN IF NOT EXISTS question_pool_ids TEXT[] NOT NULL DEFAULT '{}';