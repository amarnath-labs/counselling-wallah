/*
|--------------------------------------------------------------------------
| CAREER V7 QUESTION VERSION FIX
|--------------------------------------------------------------------------
|
| V7 question-bank rows were seeded with the legacy/default version value.
| V7 assessment retrieval explicitly locks questions to version = 7.
|
*/

UPDATE career_questions
SET
  version = 7,
  updated_at = NOW()
WHERE
  id LIKE 'v7_%'
  AND version IS DISTINCT FROM 7;