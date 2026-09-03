-- ============================================================
-- CW-REC BRANCH FEES
-- ADDITIVE / IDEMPOTENT
-- NO DATA DELETE
-- NO FOREIGN KEY DEPENDENCY
-- ============================================================

CREATE TABLE IF NOT EXISTS branch_fees (

  id BIGSERIAL PRIMARY KEY,

  college_id TEXT NOT NULL,

  branch_id BIGINT NULL,

  program VARCHAR(50) NOT NULL
    DEFAULT 'B.Tech',

  fee_scope VARCHAR(30) NOT NULL,

  tuition_fee NUMERIC(12,2),

  hostel_fee NUMERIC(12,2),

  other_fee NUMERIC(12,2),

  total_annual_fee NUMERIC(12,2),

  academic_year INTEGER,

  source_label VARCHAR(255),

  source_url TEXT,

  verification_status VARCHAR(30)
    DEFAULT 'pending',

  retrieved_at TIMESTAMPTZ
    DEFAULT NOW(),

  created_at TIMESTAMPTZ
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ
    DEFAULT NOW(),

  CONSTRAINT branch_fees_scope_check
    CHECK (
      fee_scope IN (
        'all_btech_branches',
        'branch_specific'
      )
    ),

  CONSTRAINT branch_fees_scope_branch_check
    CHECK (
      (
        fee_scope = 'all_btech_branches'
        AND branch_id IS NULL
      )
      OR
      (
        fee_scope = 'branch_specific'
        AND branch_id IS NOT NULL
      )
    )
);

CREATE INDEX IF NOT EXISTS
  idx_branch_fees_college
ON branch_fees(college_id);

CREATE INDEX IF NOT EXISTS
  idx_branch_fees_branch
ON branch_fees(branch_id);

CREATE INDEX IF NOT EXISTS
  idx_branch_fees_year
ON branch_fees(academic_year);
