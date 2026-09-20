import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {

  console.log('');
  console.log('=======================================');
  console.log('CREATE BRANCH FEES TABLE');
  console.log('=======================================');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS branch_fees (

      id BIGSERIAL PRIMARY KEY,

      college_id TEXT NOT NULL
        REFERENCES colleges(id)
        ON DELETE CASCADE,

      branch_id BIGINT NULL
        REFERENCES branches(id)
        ON DELETE CASCADE,

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
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_branch_fees_college
    ON branch_fees(college_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_branch_fees_branch
    ON branch_fees(branch_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_branch_fees_year
    ON branch_fees(academic_year);
  `);

  console.log('');
  console.log('branch_fees table ready.');
  console.log('');
  console.log('Existing branches NOT modified.');
  console.log('Existing college_fees NOT modified.');
  console.log('NIRF data NOT modified.');
  console.log('Placement data NOT modified.');
  console.log('Recommendation logic NOT modified.');

} catch (error) {

  console.error(
    'FAILED:',
    error.message
  );

  process.exitCode = 1;

} finally {

  await pool.end();

}
