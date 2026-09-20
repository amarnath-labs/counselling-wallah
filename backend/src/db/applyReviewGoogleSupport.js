import 'dotenv/config';
import { pool } from './pool.js';

const sql = '-- review-google-support.sql\n-- Safe additive migration for Google Places review extraction.\n-- Does not delete or overwrite existing OPEN_DATASET / Reddit / Quora review rows.\n\nCREATE TABLE IF NOT EXISTS college_review_stats (\n  id BIGSERIAL PRIMARY KEY,\n  college_id TEXT NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,\n  source TEXT NOT NULL,\n  external_place_id TEXT,\n  source_display_name TEXT,\n  source_address TEXT,\n  rating NUMERIC(3,2),\n  review_count INTEGER,\n  bayesian_rating NUMERIC(5,3),\n  review_score NUMERIC(6,2),\n  match_confidence NUMERIC(5,4),\n  source_url TEXT,\n  raw_metadata JSONB,\n  last_synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),\n  UNIQUE (college_id, source)\n);\n\nCREATE INDEX IF NOT EXISTS idx_college_review_stats_college\n  ON college_review_stats(college_id);\n\nCREATE INDEX IF NOT EXISTS idx_college_review_stats_source\n  ON college_review_stats(source);\n\nCREATE INDEX IF NOT EXISTS idx_college_reviews_college_source\n  ON college_reviews(college_id, source);\n';

try {
  await pool.query(sql);
  console.log('Google review support migration applied.');
} catch (error) {
  console.error('Migration failed:', error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
