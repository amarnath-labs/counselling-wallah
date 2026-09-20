import fs from 'node:fs';
import path from 'node:path';
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

const inputFile =
  process.argv[2] ||
  path.resolve(
    process.cwd(),
    'fee-source-import.json'
  );

if (!fs.existsSync(inputFile)) {
  console.error(
    `Input file not found: ${inputFile}`
  );
  process.exit(1);
}

const data = JSON.parse(
  fs.readFileSync(
    inputFile,
    'utf8'
  ).replace(/^\uFEFF/, '')
);

if (!Array.isArray(data)) {
  console.error(
    'Expected JSON array.'
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

function clean(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const text =
    String(value).trim();

  return text || null;
}

function money(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const n =
    Number(value);

  if (
    !Number.isFinite(n) ||
    n < 0 ||
    n > 100000000
  ) {
    return null;
  }

  return Math.round(n);
}

function integer(value) {
  const n =
    Number(value);

  return Number.isInteger(n)
    ? n
    : null;
}

function score(value, fallback = 50) {
  const n =
    Number(value);

  if (!Number.isFinite(n)) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(
      100,
      Math.round(n)
    )
  );
}

function getSourcePriority(kind) {
  const map = {
    official: 100,
    counselling_portal: 95,
    collegedunia: 70,
    shiksha: 65,
    careers360: 65,
    other_secondary: 50,
  };

  return map[kind] ?? 50;
}

function getDefaultConfidence(kind) {
  const map = {
    official: 90,
    counselling_portal: 88,
    collegedunia: 72,
    shiksha: 68,
    careers360: 68,
    other_secondary: 55,
  };

  return map[kind] ?? 50;
}

async function resolveCollegeId(
  client,
  collegeName,
  suppliedId
) {
  if (suppliedId) {
    const exactId =
      await client.query(
        `
        SELECT id
        FROM colleges
        WHERE id = $1
        LIMIT 1
        `,
        [suppliedId]
      );

    if (exactId.rows.length) {
      return exactId.rows[0].id;
    }
  }

  if (!collegeName) {
    return null;
  }

  const exactName =
    await client.query(
      `
      SELECT id
      FROM colleges
      WHERE LOWER(TRIM(name)) =
            LOWER(TRIM($1))
      LIMIT 1
      `,
      [collegeName]
    );

  if (exactName.rows.length) {
    return exactName.rows[0].id;
  }

  return null;
}

async function importRecord(
  client,
  item
) {
  const collegeName =
    clean(
      item.college_name
    );

  if (!collegeName) {
    return {
      action: 'skipped',
      reason: 'missing college_name',
    };
  }

  const sourceKind =
    clean(
      item.source_kind
    ) || 'other_secondary';

  const allowedKinds = [
    'official',
    'counselling_portal',
    'collegedunia',
    'shiksha',
    'careers360',
    'other_secondary',
  ];

  if (
    !allowedKinds.includes(
      sourceKind
    )
  ) {
    return {
      action: 'skipped',
      reason:
        `invalid source_kind: ${sourceKind}`,
    };
  }

  const sourceUrl =
    clean(
      item.source_url
    );

  if (!sourceUrl) {
    return {
      action: 'skipped',
      reason: 'missing source_url',
    };
  }

  const academicYear =
    integer(
      item.academic_year
    );

  if (!academicYear) {
    return {
      action: 'skipped',
      reason: 'invalid academic_year',
    };
  }

  const collegeId =
    await resolveCollegeId(
      client,
      collegeName,
      clean(
        item.college_id
      )
    );

  const sourcePriority =
    score(
      item.source_priority,
      getSourcePriority(
        sourceKind
      )
    );

  const confidenceScore =
    score(
      item.confidence_score,
      getDefaultConfidence(
        sourceKind
      )
    );

  const allowedStatuses = [
    'pending_review',
    'review_recommended',
    'high_confidence',
    'verified',
    'rejected',
    'stale',
  ];

  let verificationStatus =
    clean(
      item.verification_status
    );

  if (
    !allowedStatuses.includes(
      verificationStatus
    )
  ) {
    verificationStatus =
      sourceKind === 'official'
        ? 'high_confidence'
        : 'pending_review';
  }

  const result =
    await client.query(
      `
      INSERT INTO fee_source_records (

        college_id,
        college_name,

        program,
        branch_id,

        academic_year,
        fee_scope,

        tuition_fee_per_semester,
        academic_fee_per_semester,
        hostel_fee_per_semester,
        mess_fee_per_semester,

        first_semester_fee,
        first_year_fee,

        annual_academic_fee,
        annual_total_fee,

        total_course_fee,

        one_time_fee,
        security_deposit,

        source_kind,
        source_label,
        source_url,

        source_priority,
        confidence_score,

        verification_status,
        extraction_method,

        notes,

        retrieved_at,
        updated_at
      )

      VALUES (

        $1,
        $2,

        $3,
        $4,

        $5,
        $6,

        $7,
        $8,
        $9,
        $10,

        $11,
        $12,

        $13,
        $14,

        $15,

        $16,
        $17,

        $18,
        $19,
        $20,

        $21,
        $22,

        $23,
        $24,

        $25,

        NOW(),
        NOW()
      )

      ON CONFLICT (
        (
          COALESCE(
            college_id,
            ''
          )
        ),
        academic_year,
        source_url
      )

      DO UPDATE SET

        college_name =
          EXCLUDED.college_name,

        program =
          COALESCE(
            EXCLUDED.program,
            fee_source_records.program
          ),

        branch_id =
          COALESCE(
            EXCLUDED.branch_id,
            fee_source_records.branch_id
          ),

        fee_scope =
          EXCLUDED.fee_scope,

        tuition_fee_per_semester =
          COALESCE(
            EXCLUDED.tuition_fee_per_semester,
            fee_source_records.tuition_fee_per_semester
          ),

        academic_fee_per_semester =
          COALESCE(
            EXCLUDED.academic_fee_per_semester,
            fee_source_records.academic_fee_per_semester
          ),

        hostel_fee_per_semester =
          COALESCE(
            EXCLUDED.hostel_fee_per_semester,
            fee_source_records.hostel_fee_per_semester
          ),

        mess_fee_per_semester =
          COALESCE(
            EXCLUDED.mess_fee_per_semester,
            fee_source_records.mess_fee_per_semester
          ),

        first_semester_fee =
          COALESCE(
            EXCLUDED.first_semester_fee,
            fee_source_records.first_semester_fee
          ),

        first_year_fee =
          COALESCE(
            EXCLUDED.first_year_fee,
            fee_source_records.first_year_fee
          ),

        annual_academic_fee =
          COALESCE(
            EXCLUDED.annual_academic_fee,
            fee_source_records.annual_academic_fee
          ),

        annual_total_fee =
          COALESCE(
            EXCLUDED.annual_total_fee,
            fee_source_records.annual_total_fee
          ),

        total_course_fee =
          COALESCE(
            EXCLUDED.total_course_fee,
            fee_source_records.total_course_fee
          ),

        one_time_fee =
          COALESCE(
            EXCLUDED.one_time_fee,
            fee_source_records.one_time_fee
          ),

        security_deposit =
          COALESCE(
            EXCLUDED.security_deposit,
            fee_source_records.security_deposit
          ),

        source_label =
          COALESCE(
            EXCLUDED.source_label,
            fee_source_records.source_label
          ),

        source_priority =
          GREATEST(
            fee_source_records.source_priority,
            EXCLUDED.source_priority
          ),

        confidence_score =
          GREATEST(
            fee_source_records.confidence_score,
            EXCLUDED.confidence_score
          ),

        verification_status =
          CASE

            WHEN
              fee_source_records.verification_status =
              'verified'
            THEN
              'verified'

            WHEN
              EXCLUDED.verification_status =
              'verified'
            THEN
              'verified'

            WHEN
              EXCLUDED.confidence_score >=
              fee_source_records.confidence_score
            THEN
              EXCLUDED.verification_status

            ELSE
              fee_source_records.verification_status

          END,

        extraction_method =
          EXCLUDED.extraction_method,

        notes =
          COALESCE(
            EXCLUDED.notes,
            fee_source_records.notes
          ),

        retrieved_at =
          NOW(),

        updated_at =
          NOW()

      RETURNING
        id,
        college_id,
        college_name,
        source_kind,
        verification_status,
        confidence_score
      `,
      [
        collegeId,
        collegeName,

        clean(
          item.program
        ),

        integer(
          item.branch_id
        ),

        academicYear,

        clean(
          item.fee_scope
        ) ||
          'college_program',

        money(
          item.tuition_fee_per_semester
        ),

        money(
          item.academic_fee_per_semester
        ),

        money(
          item.hostel_fee_per_semester
        ),

        money(
          item.mess_fee_per_semester
        ),

        money(
          item.first_semester_fee
        ),

        money(
          item.first_year_fee
        ),

        money(
          item.annual_academic_fee
        ),

        money(
          item.annual_total_fee
        ),

        money(
          item.total_course_fee
        ),

        money(
          item.one_time_fee
        ),

        money(
          item.security_deposit
        ),

        sourceKind,

        clean(
          item.source_label
        ),

        sourceUrl,

        sourcePriority,
        confidenceScore,

        verificationStatus,

        clean(
          item.extraction_method
        ) ||
          'manual',

        clean(
          item.notes
        ),
      ]
    );

  return {
    action: 'imported',
    ...result.rows[0],
  };
}

const client =
  await pool.connect();

try {

  await client.query(
    'BEGIN'
  );

  const summary = {
    imported: 0,
    skipped: 0,
  };

  for (
    const item of data
  ) {
    const result =
      await importRecord(
        client,
        item
      );

    if (
      result.action ===
      'imported'
    ) {
      summary.imported++;

      console.log(
        `[IMPORTED] ${result.college_name} | ${result.source_kind} | ${result.verification_status}`
      );
    } else {
      summary.skipped++;

      console.log(
        `[SKIPPED] ${item.college_name || 'unknown'} | ${result.reason}`
      );
    }
  }

  await client.query(
    'COMMIT'
  );

  console.log('');
  console.log(
    '========================================'
  );
  console.log(
    'FEE SOURCE IMPORT COMPLETE'
  );
  console.log(
    '========================================'
  );

  console.table(
    summary
  );

} catch (error) {

  await client.query(
    'ROLLBACK'
  );

  console.error(
    'IMPORT FAILED:',
    error
  );

  process.exitCode = 1;

} finally {

  client.release();

  await pool.end();

}
