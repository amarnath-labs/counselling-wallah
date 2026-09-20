import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  console.log('');
  console.log('=======================================');
  console.log('CREATE FEE VARIANTS TABLE');
  console.log('=======================================');
  console.log('');

  await pool.query(`
    CREATE TABLE IF NOT EXISTS fee_variants (

      id BIGSERIAL PRIMARY KEY,

      branch_fee_id BIGINT NOT NULL
        REFERENCES branch_fees(id)
        ON DELETE CASCADE,

      semester INTEGER,

      fee_period VARCHAR(20),

      student_category VARCHAR(100),

      income_min NUMERIC(12,2),

      income_max NUMERIC(12,2),

      residence_type VARCHAR(30),

      room_type VARCHAR(30),

      tuition_fee NUMERIC(12,2),

      admission_fee NUMERIC(12,2),

      institute_fee NUMERIC(12,2),

      hostel_fee NUMERIC(12,2),

      mess_fee NUMERIC(12,2),

      caution_deposit NUMERIC(12,2),

      other_fee NUMERIC(12,2),

      total_fee NUMERIC(12,2),

      is_one_time_included BOOLEAN
        DEFAULT FALSE,

      verification_status VARCHAR(30)
        DEFAULT 'pending',

      created_at TIMESTAMPTZ
        DEFAULT NOW(),

      updated_at TIMESTAMPTZ
        DEFAULT NOW(),

      CONSTRAINT fee_variants_fee_period_check
        CHECK (
          fee_period IS NULL
          OR fee_period IN (
            'semester',
            'annual'
          )
        ),

      CONSTRAINT fee_variants_residence_type_check
        CHECK (
          residence_type IS NULL
          OR residence_type IN (
            'day_scholar',
            'hosteller'
          )
        ),

      CONSTRAINT fee_variants_room_type_check
        CHECK (
          room_type IS NULL
          OR room_type IN (
            'AC',
            'non_AC'
          )
        ),

      CONSTRAINT fee_variants_semester_check
        CHECK (
          semester IS NULL
          OR semester BETWEEN 1 AND 12
        ),

      CONSTRAINT fee_variants_income_check
        CHECK (
          income_min IS NULL
          OR income_max IS NULL
          OR income_min <= income_max
        ),

      CONSTRAINT fee_variants_amounts_nonnegative_check
        CHECK (
          (tuition_fee IS NULL OR tuition_fee >= 0)
          AND
          (admission_fee IS NULL OR admission_fee >= 0)
          AND
          (institute_fee IS NULL OR institute_fee >= 0)
          AND
          (hostel_fee IS NULL OR hostel_fee >= 0)
          AND
          (mess_fee IS NULL OR mess_fee >= 0)
          AND
          (caution_deposit IS NULL OR caution_deposit >= 0)
          AND
          (other_fee IS NULL OR other_fee >= 0)
          AND
          (total_fee IS NULL OR total_fee >= 0)
        )
    );
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_fee_variants_branch_fee
    ON fee_variants(branch_fee_id);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_fee_variants_semester
    ON fee_variants(semester);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_fee_variants_category
    ON fee_variants(student_category);
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS
      idx_fee_variants_residence
    ON fee_variants(residence_type);
  `);

  console.log(
    'fee_variants table ready.'
  );

  console.log('');
  console.log(
    'Existing branch_fees NOT modified.'
  );

  console.log(
    'Existing college_fees NOT modified.'
  );

  console.log(
    'Existing branches NOT modified.'
  );

  console.log(
    'NIRF data NOT modified.'
  );

  console.log(
    'Placement data NOT modified.'
  );

  console.log(
    'Recommendation logic NOT modified.'
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
