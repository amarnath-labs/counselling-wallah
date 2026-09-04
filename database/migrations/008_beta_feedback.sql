CREATE TABLE IF NOT EXISTS beta_feedback (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NULL,
  email TEXT NULL,
  page TEXT NULL,
  category TEXT NOT NULL DEFAULT 'feedback',
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_created_at
ON beta_feedback(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_status
ON beta_feedback(status);

CREATE INDEX IF NOT EXISTS idx_beta_feedback_user_id
ON beta_feedback(user_id);
