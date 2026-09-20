import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

if (!connectionString) {
  console.error(
    'DATABASE_URL / DB_URL / POSTGRES_URL not found.'
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl:
    process.env.NODE_ENV === 'production' ||
    /render\.com/i.test(connectionString)
      ? { rejectUnauthorized: false }
      : undefined,
});

try {

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fee_source_records (

      id BIGSERIAL PRIMARY KEY,

      college_id TEXT NULL,

      college_name TEXT NOT NULL,

      program TEXT NULL,

      branch_id BIGINT NULL,

      academic_year INTEGER NOT NULL,

      fee_scope TEXT NOT NULL
        DEFAULT 'college_program',

      tuition_fee_per_semester NUMERIC(12,2),

      academic_fee_per_semester NUMERIC(12,2),

      hostel_fee_per_semester NUMERIC(12,2),

      mess_fee_per_semester NUMERIC(12,2),

      first_semester_fee NUMERIC(12,2),

      first_year_fee NUMERIC(12,2),

      annual_academic_fee NUMERIC(12,2),

      annual_total_fee NUMERIC(12,2),

      total_course_fee NUMERIC(12,2),

      one_time_fee NUMERIC(12,2),

      security_deposit NUMERIC(12,2),

      source_kind VARCHAR(30) NOT NULL,

      source_label VARCHAR(255),

      source_url TEXT NOT NULL,

      source_priority INTEGER NOT NULL
        DEFAULT 50,

      confidence_score INTEGER NOT NULL
        DEFAULT 50,

      verification_status VARCHAR(30) NOT NULL
        DEFAULT 'pending_review',

      extraction_method VARCHAR(30)
        DEFAULT 'manual',

      notes TEXT,

      retrieved_at TIMESTAMPTZ
        DEFAULT NOW(),

      created_at TIMESTAMPTZ
        DEFAULT NOW(),

      updated_at TIMESTAMPTZ
        DEFAULT NOW(),

      CONSTRAINT fee_source_confidence_check
        CHECK (
          confidence_score >= 0
          AND confidence_score <= 100
        ),

      CONSTRAINT fee_source_priority_check
        CHECK (
          source_priority >= 0
          AND source_priority <= 100
        ),

      CONSTRAINT fee_source_status_check
        CHECK (
          verification_status IN (
            'pending_review',
            'review_recommended',
            'high_confidence',
            'verified',
            'rejected',
            'stale'
          )
        ),

      CONSTRAINT fee_source_kind_check
        CHECK (
          source_kind IN (
            'official',
            'counselling_portal',
            'collegedunia',
            'shiksha',
            'careers360',
            'other_secondary'
          )
        )
    );
  `);


  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_fee_source_records_college
    ON fee_source_records (
      college_id
    );
  `);


  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_fee_source_records_year
    ON fee_source_records (
      academic_year
    );
  `);


  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_fee_source_records_status
    ON fee_source_records (
      verification_status,
      confidence_score DESC
    );
  `);


  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS
      fee_source_unique_source_record
    ON fee_source_records (
      COALESCE(college_id, ''),
      academic_year,
      source_url
    );
  `);


  console.log('');
  console.log(
    '========================================'
  );
  console.log(
    'FEE SOURCE RECORDS TABLE READY'
  );
  console.log(
    '========================================'
  );

} catch (error) {

  console.error(
    'FAILED:',
    error.message
  );

  process.exitCode = 1;

} finally {

  await pool.end();

}
