/*
=============================================================================
TRUMARG 100K SCALE INDEXES
=============================================================================

IMPORTANT:

1. Run outside a transaction because CREATE INDEX CONCURRENTLY is used.
2. No cutoff row is modified.
3. No recommendation formula is modified.
4. Existing indexes are preserved.
=============================================================================
*/


CREATE INDEX CONCURRENTLY IF NOT EXISTS
idx_cutoffs_results_lookup
ON cutoffs (
  counselling_type,
  year,
  round,
  category,
  closing_rank
);


CREATE INDEX CONCURRENTLY IF NOT EXISTS
idx_cutoffs_uptac_verified_lookup
ON cutoffs (
  year,
  round,
  category,
  closing_rank
)
WHERE
  counselling_type = 'UPTAC'
  AND is_verified = true
  AND verification_status = 'VERIFIED';


CREATE INDEX CONCURRENTLY IF NOT EXISTS
idx_cutoffs_branch_id
ON cutoffs (
  branch_id
);


CREATE INDEX CONCURRENTLY IF NOT EXISTS
idx_branches_college_id
ON branches (
  college_id
);


CREATE INDEX CONCURRENTLY IF NOT EXISTS
idx_college_sentiment_college_id
ON college_sentiment_summary (
  college_id
);


CREATE INDEX CONCURRENTLY IF NOT EXISTS
idx_quality_college_lookup
ON college_quality_metrics (
  college_id,
  academic_year DESC,
  retrieved_at DESC
);


CREATE INDEX CONCURRENTLY IF NOT EXISTS
idx_fee_profile_college_lookup
ON college_fee_profiles (
  college_id,
  verification_status,
  fee_year DESC
);


CREATE INDEX CONCURRENTLY IF NOT EXISTS
idx_branch_fee_lookup
ON branch_fees (
  college_id,
  branch_id,
  academic_year DESC
);


ANALYZE cutoffs;
ANALYZE branches;
ANALYZE college_sentiment_summary;
ANALYZE college_quality_metrics;
ANALYZE college_fee_profiles;
ANALYZE branch_fees;
