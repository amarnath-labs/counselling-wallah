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


function numberOrNull(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const n = Number(value);

  return Number.isFinite(n)
    ? Math.round(n)
    : null;
}


function normalizeName(value) {
  return String(value || '')
    .toLowerCase()
    .replace(
      /\bindian institute of information technology\b/g,
      'iiit'
    )
    .replace(
      /\bindian institute of technology\b/g,
      'iit'
    )
    .replace(
      /\bnational institute of technology\b/g,
      'nit'
    )
    .replace(
      /[^a-z0-9]+/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}


function pickFirst(
  rows,
  field
) {
  for (const row of rows) {
    const value =
      numberOrNull(
        row[field]
      );

    if (value !== null) {
      return value;
    }
  }

  return null;
}


function percentDifference(
  a,
  b
) {
  if (
    !a ||
    !b
  ) {
    return 0;
  }

  return (
    Math.abs(a - b) /
    Math.max(a, b)
  ) * 100;
}


function detectConflict(
  rows,
  field
) {
  const values =
    rows
      .map(
        row =>
          numberOrNull(
            row[field]
          )
      )
      .filter(
        value =>
          value !== null &&
          value > 0
      );

  if (values.length < 2) {
    return false;
  }

  for (
    let i = 0;
    i < values.length;
    i++
  ) {
    for (
      let j = i + 1;
      j < values.length;
      j++
    ) {

      if (
        percentDifference(
          values[i],
          values[j]
        ) > 20
      ) {
        return true;
      }

    }
  }

  return false;
}


async function resolveOne(
  client,
  collegeId,
  academicYear
) {

  const sourceResult =
    await client.query(
      `
      SELECT *
      FROM fee_source_records

      WHERE
        college_id = $1

        AND academic_year = $2

        AND verification_status NOT IN (
          'rejected',
          'stale'
        )

      ORDER BY

        source_priority DESC,

        confidence_score DESC,

        CASE
          WHEN source_kind = 'official'
            THEN 1
          ELSE 0
        END DESC,

        updated_at DESC
      `,
      [
        collegeId,
        academicYear,
      ]
    );


  const rows =
    sourceResult.rows;


  if (!rows.length) {
    return {
      action: 'skipped',
      reason: 'no usable source records',
    };
  }


  const top =
    rows[0];


  const tuition =
    pickFirst(
      rows,
      'tuition_fee_per_semester'
    );


  const academicPerSemester =
    pickFirst(
      rows,
      'academic_fee_per_semester'
    );


  const hostel =
    pickFirst(
      rows,
      'hostel_fee_per_semester'
    );


  const mess =
    pickFirst(
      rows,
      'mess_fee_per_semester'
    );


  const firstSemester =
    pickFirst(
      rows,
      'first_semester_fee'
    );


  const firstYear =
    pickFirst(
      rows,
      'first_year_fee'
    );


  let annualAcademic =
    pickFirst(
      rows,
      'annual_academic_fee'
    );


  let annualTotal =
    pickFirst(
      rows,
      'annual_total_fee'
    );


  /*
  |--------------------------------------------------------------------------
  | SAFE ANNUAL TOTAL
  |--------------------------------------------------------------------------
  |
  | Priority:
  |
  | 1. Source-reported annual_total_fee
  |
  | 2. If first-semester payable + complete recurring
  |    second-semester components are known:
  |
  |    first semester
  |    + academic semester
  |    + hostel semester
  |    + mess semester
  |
  | No missing component is silently treated as zero.
  |
  */

  if (
    annualTotal === null &&
    firstSemester !== null &&
    academicPerSemester !== null &&
    hostel !== null &&
    mess !== null
  ) {
    annualTotal =
      firstSemester +
      academicPerSemester +
      hostel +
      mess;
  }


  /*
  | Alternative safe recurring-year calculation.
  |
  | Use only when complete annual academic +
  | hostel + mess components are available.
  */

  if (
    annualTotal === null &&
    annualAcademic !== null &&
    hostel !== null &&
    mess !== null
  ) {
    annualTotal =
      annualAcademic +
      hostel * 2 +
      mess * 2;
  }


  const totalCourse =
    pickFirst(
      rows,
      'total_course_fee'
    );


  /*
  |--------------------------------------------------------------------------
  | FALLBACK ANNUAL ACADEMIC FEE
  |--------------------------------------------------------------------------
  */

  if (
    annualAcademic === null &&
    academicPerSemester !== null
  ) {
    annualAcademic =
      academicPerSemester * 2;
  }

  if (
    annualAcademic === null &&
    tuition !== null
  ) {
    annualAcademic =
      tuition * 2;
  }


  /*
  |--------------------------------------------------------------------------
  | CONFLICT DETECTION
  |--------------------------------------------------------------------------
  */

  const conflictFields = [
    'tuition_fee_per_semester',
    'academic_fee_per_semester',
    'hostel_fee_per_semester',
    'mess_fee_per_semester',
    'first_semester_fee',
    'first_year_fee',
    'annual_academic_fee',
    'annual_total_fee',
    'total_course_fee',
  ];


  const conflicts =
    conflictFields.filter(
      field =>
        detectConflict(
          rows,
          field
        )
    );


  /*
  |--------------------------------------------------------------------------
  | CONFIDENCE
  |--------------------------------------------------------------------------
  */

  const hasOfficial =
    rows.some(
      row =>
        row.source_kind ===
        'official'
    );


  const officialVerified =
    rows.some(
      row =>
        row.source_kind ===
          'official' &&
        row.verification_status ===
          'verified'
    );


  let confidence =
    Number(
      top.confidence_score ||
      0
    );


  let verificationStatus =
    top.verification_status;


  if (
    conflicts.length > 0
  ) {
    verificationStatus =
      'review_recommended';

    confidence =
      Math.min(
        confidence,
        70
      );
  } else if (
    officialVerified
  ) {
    verificationStatus =
      'verified';

    confidence =
      Math.max(
        confidence,
        95
      );
  } else if (
    annualAcademic === null &&
    tuition === null &&
    academicPerSemester === null
  ) {

    verificationStatus =
      'review_recommended';

    confidence =
      Math.min(
        confidence,
        70
      );

  } else if (
    hasOfficial &&
    confidence >= 85 &&
    rows.some(
      row =>
        row.verification_status ===
          'high_confidence' ||
        row.verification_status ===
          'verified'
    )
  ) {
    verificationStatus =
      'high_confidence';
  } else if (
    rows.length >= 2 &&
    confidence >= 65
  ) {
    /*
     * Multiple sources alone are NOT enough for
     * high-confidence status.
     *
     * They may be secondary sources, use different
     * fee definitions, or disagree on course totals.
     */
    verificationStatus =
      'review_recommended';
  } else {
    verificationStatus =
      'review_recommended';
  }


  const collegeName =
    top.college_name;


  const normalizedName =
    normalizeName(
      collegeName
    );


  /*
  |--------------------------------------------------------------------------
  | UPSERT NORMALIZED PROFILE
  |--------------------------------------------------------------------------
  */

  const existing =
    await client.query(
      `
      SELECT
        id,
        is_manually_verified,
        verification_status

      FROM college_fee_profiles

      WHERE
        college_id = $1

        AND fee_year = $2

      ORDER BY id DESC

      LIMIT 1
      `,
      [
        collegeId,
        academicYear,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | MANUAL VERIFIED PROTECTION
  |--------------------------------------------------------------------------
  */

  if (
    existing.rows.length &&
    existing.rows[0]
      .is_manually_verified
  ) {
    return {
      action: 'protected',
      college: collegeName,
      reason:
        'manually verified profile protected',
    };
  }


  await client.query(
    `
    INSERT INTO college_fee_profiles (

      college_id,

      college_name_raw,
      college_name_normalized,

      fee_year,

      tuition_fee_per_semester,

      academic_fee_per_semester,

      hostel_fee_per_semester,

      mess_fee_per_semester,

      first_semester_fee,

      annual_academic_fee,

      annual_total_fee,

      total_course_fee,

      source_url,

      extraction_status,

      confidence_score,

      verification_status,

      source_kind,

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

      NOW()
    )

    ON CONFLICT (
      college_name_normalized,
      fee_year
    )

    DO UPDATE SET

      college_id =
        EXCLUDED.college_id,

      college_name_raw =
        EXCLUDED.college_name_raw,

      tuition_fee_per_semester =
        COALESCE(
          EXCLUDED.tuition_fee_per_semester,
          college_fee_profiles
            .tuition_fee_per_semester
        ),

      academic_fee_per_semester =
        COALESCE(
          EXCLUDED.academic_fee_per_semester,
          college_fee_profiles
            .academic_fee_per_semester
        ),

      hostel_fee_per_semester =
        COALESCE(
          EXCLUDED.hostel_fee_per_semester,
          college_fee_profiles
            .hostel_fee_per_semester
        ),

      mess_fee_per_semester =
        COALESCE(
          EXCLUDED.mess_fee_per_semester,
          college_fee_profiles
            .mess_fee_per_semester
        ),

      first_semester_fee =
        COALESCE(
          EXCLUDED.first_semester_fee,
          college_fee_profiles
            .first_semester_fee
        ),

      annual_academic_fee =
        COALESCE(
          EXCLUDED.annual_academic_fee,
          college_fee_profiles
            .annual_academic_fee
        ),

      annual_total_fee =
        COALESCE(
          EXCLUDED.annual_total_fee,
          college_fee_profiles
            .annual_total_fee
        ),

      total_course_fee =
        COALESCE(
          EXCLUDED.total_course_fee,
          college_fee_profiles
            .total_course_fee
        ),

      source_url =
        EXCLUDED.source_url,

      extraction_status =
        EXCLUDED.extraction_status,

      confidence_score =
        EXCLUDED.confidence_score,

      verification_status =
        EXCLUDED.verification_status,

      source_kind =
        EXCLUDED.source_kind,

      updated_at =
        NOW()
    `,
    [
      collegeId,

      collegeName,
      normalizedName,

      academicYear,

      tuition,

      academicPerSemester,

      hostel,

      mess,

      firstSemester,

      annualAcademic,

      annualTotal,

      totalCourse,

      top.source_url,

      conflicts.length
        ? `conflict:${conflicts.join(',')}`
        : 'resolved',

      confidence,

      verificationStatus,

      top.source_kind,
    ]
  );


  return {

    action: 'resolved',

    college:
      collegeName,

    sources:
      rows.length,

    tuition,

    academicPerSemester,

    hostel,

    mess,

    firstSemester,

    firstYear,

    annualAcademic,

    annualTotal,

    totalCourse,

    confidence,

    verificationStatus,

    conflicts,
  };
}


const client =
  await pool.connect();


try {

  await client.query(
    'BEGIN'
  );


  const targets =
    await client.query(
      `
      SELECT DISTINCT
        college_id,
        academic_year

      FROM fee_source_records

      WHERE
        college_id IS NOT NULL

        AND verification_status NOT IN (
          'rejected',
          'stale'
        )

      ORDER BY
        college_id,
        academic_year
      `
    );


  console.log('');
  console.log(
    '======================================'
  );

  console.log(
    'FEE PROFILE RESOLVER'
  );

  console.log(
    '======================================'
  );

  console.log(
    `Targets: ${targets.rows.length}`
  );

  console.log('');


  let resolved = 0;
  let protectedCount = 0;
  let skipped = 0;


  for (
    const target of targets.rows
  ) {

    const result =
      await resolveOne(
        client,
        target.college_id,
        Number(
          target.academic_year
        )
      );


    if (
      result.action ===
      'resolved'
    ) {

      resolved++;

      console.log(
        `[RESOLVED] ${result.college}`
      );

      console.log(
        `  Sources: ${result.sources}`
      );

      console.log(
        `  Annual academic: ${result.annualAcademic ?? 'N/A'}`
      );

      console.log(
        `  Confidence: ${result.confidence}`
      );

      console.log(
        `  Status: ${result.verificationStatus}`
      );


      if (
        result.conflicts.length
      ) {
        console.log(
          `  Conflicts: ${result.conflicts.join(', ')}`
        );
      }

    } else if (
      result.action ===
      'protected'
    ) {

      protectedCount++;

      console.log(
        `[PROTECTED] ${result.college}`
      );

    } else {

      skipped++;

    }

  }


  await client.query(
    'COMMIT'
  );


  console.log('');

  console.log(
    '======================================'
  );

  console.log(
    'RESOLVER COMPLETE'
  );

  console.log(
    '======================================'
  );

  console.table({
    resolved,
    protected:
      protectedCount,
    skipped,
  });


} catch (error) {

  await client.query(
    'ROLLBACK'
  );


  console.error(
    'RESOLVER FAILED:',
    error
  );


  process.exitCode = 1;


} finally {

  client.release();

  await pool.end();

}
