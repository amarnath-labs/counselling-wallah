ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS scenario TEXT;

ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS scenario_family TEXT;