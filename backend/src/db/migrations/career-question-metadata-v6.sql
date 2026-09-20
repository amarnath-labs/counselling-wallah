/*
|--------------------------------------------------------------------------
| TruMarg Career Question Metadata V6
|--------------------------------------------------------------------------
|
| Expands the adaptive question bank from broad stage-level targeting
| into class, board, subject, interest and career-family targeting.
|
| Existing V5 questions remain valid.
|
*/

ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS classes text[] NOT NULL DEFAULT '{}';

ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS boards text[] NOT NULL DEFAULT '{}';

ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS interest_clusters text[] NOT NULL DEFAULT '{}';

ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS career_families text[] NOT NULL DEFAULT '{}';

ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS difficulty smallint NOT NULL DEFAULT 2;

ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS discriminator_group text;

ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS context_scope text NOT NULL DEFAULT 'universal';

ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS min_class smallint;

ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS max_class smallint;

ALTER TABLE career_questions
  ADD COLUMN IF NOT EXISTS response_format text NOT NULL DEFAULT 'likert-5';


/*
|--------------------------------------------------------------------------
| Constraints
|--------------------------------------------------------------------------
*/

ALTER TABLE career_questions
  DROP CONSTRAINT IF EXISTS career_questions_difficulty_check;

ALTER TABLE career_questions
  ADD CONSTRAINT career_questions_difficulty_check
  CHECK (difficulty BETWEEN 1 AND 5);


ALTER TABLE career_questions
  DROP CONSTRAINT IF EXISTS career_questions_context_scope_check;

ALTER TABLE career_questions
  ADD CONSTRAINT career_questions_context_scope_check
  CHECK (
    context_scope IS NULL
    OR context_scope IN (
      'universal',
      'class',
      'board',
      'subject',
      'interest',
      'career-discriminator',
      'academic-context',
      'college',
      'post-school-transition',
      'professional',
      'school',
      'school-transition',
      'senior-secondary'
    )
  );


ALTER TABLE career_questions
  DROP CONSTRAINT IF EXISTS career_questions_class_range_check;

ALTER TABLE career_questions
  ADD CONSTRAINT career_questions_class_range_check
  CHECK (
    min_class IS NULL
    OR max_class IS NULL
    OR min_class <= max_class
  );


/*
|--------------------------------------------------------------------------
| GIN indexes
|--------------------------------------------------------------------------
|
| PostgreSQL can efficiently query array metadata using && and @>.
|
*/

CREATE INDEX IF NOT EXISTS idx_career_questions_classes_gin
  ON career_questions
  USING GIN (classes);

CREATE INDEX IF NOT EXISTS idx_career_questions_boards_gin
  ON career_questions
  USING GIN (boards);

CREATE INDEX IF NOT EXISTS idx_career_questions_subjects_gin
  ON career_questions
  USING GIN (subjects);

CREATE INDEX IF NOT EXISTS idx_career_questions_interest_clusters_gin
  ON career_questions
  USING GIN (interest_clusters);

CREATE INDEX IF NOT EXISTS idx_career_questions_career_families_gin
  ON career_questions
  USING GIN (career_families);

CREATE INDEX IF NOT EXISTS idx_career_questions_goals_gin
  ON career_questions
  USING GIN (goals);


/*
|--------------------------------------------------------------------------
| Standard lookup indexes
|--------------------------------------------------------------------------
*/

CREATE INDEX IF NOT EXISTS idx_career_questions_stage_active
  ON career_questions (stage, active);

CREATE INDEX IF NOT EXISTS idx_career_questions_stage_trait_active
  ON career_questions (stage, trait, active);

CREATE INDEX IF NOT EXISTS idx_career_questions_context_scope
  ON career_questions (context_scope);

CREATE INDEX IF NOT EXISTS idx_career_questions_discriminator_group
  ON career_questions (discriminator_group)
  WHERE discriminator_group IS NOT NULL;


/*
|--------------------------------------------------------------------------
| Upgrade existing V5 rows
|--------------------------------------------------------------------------
|
| Existing questions remain universal unless a future V6 seed replaces
| their metadata with more specific targeting.
|
*/

UPDATE career_questions
SET
  classes = COALESCE(classes, '{}'),
  boards = COALESCE(boards, '{}'),
  interest_clusters = COALESCE(interest_clusters, '{}'),
  career_families = COALESCE(career_families, '{}'),
  context_scope = COALESCE(NULLIF(context_scope, ''), 'universal'),
  difficulty = COALESCE(difficulty, 2),
  response_format = COALESCE(NULLIF(response_format, ''), 'likert-5')
WHERE active = true;

