import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const YEAR =
  2025;

console.log(
  '\n========================================'
);

console.log(
  'EXISTING JOSAA 2025 DB AUDIT'
);

console.log(
  '========================================\n'
);

try {

  /*
  |--------------------------------------------------------------------------
  | TOTAL
  |--------------------------------------------------------------------------
  */

  const total =
    await pool.query(`
      SELECT
        COUNT(*)::int AS total_rows
      FROM cutoffs
      WHERE year = $1
        AND UPPER(COALESCE(counselling_type, '')) = 'JOSAA'
    `, [
      YEAR,
    ]);


  console.log(
    'Total existing JoSAA 2025 rows:',
    total.rows[0].total_rows
  );


  /*
  |--------------------------------------------------------------------------
  | ROUND DISTRIBUTION
  |--------------------------------------------------------------------------
  */

  const rounds =
    await pool.query(`
      SELECT
        round,
        COUNT(*)::int AS rows,
        COUNT(opening_rank)::int AS opening_present,
        COUNT(closing_rank)::int AS closing_present
      FROM cutoffs
      WHERE year = $1
        AND UPPER(COALESCE(counselling_type, '')) = 'JOSAA'
      GROUP BY round
      ORDER BY round
    `, [
      YEAR,
    ]);


  console.log(
    '\nROUND DISTRIBUTION'
  );

  console.table(
    rounds.rows
  );


  /*
  |--------------------------------------------------------------------------
  | SOURCE DISTRIBUTION
  |--------------------------------------------------------------------------
  */

  const sources =
    await pool.query(`
      SELECT
        source_label,
        source_url,
        verification_status,
        is_verified,
        COUNT(*)::int AS rows,
        COUNT(opening_rank)::int AS opening_present,
        COUNT(closing_rank)::int AS closing_present
      FROM cutoffs
      WHERE year = $1
        AND UPPER(COALESCE(counselling_type, '')) = 'JOSAA'
      GROUP BY
        source_label,
        source_url,
        verification_status,
        is_verified
      ORDER BY rows DESC
    `, [
      YEAR,
    ]);


  console.log(
    '\nSOURCE DISTRIBUTION'
  );

  console.table(
    sources.rows
  );


  /*
  |--------------------------------------------------------------------------
  | DUPLICATE IDENTITY AUDIT
  |--------------------------------------------------------------------------
  */

  const duplicates =
    await pool.query(`
      SELECT
        branch_id,
        year,
        round,
        category,
        quota,
        gender,
        COUNT(*)::int AS count
      FROM cutoffs
      WHERE year = $1
        AND UPPER(COALESCE(counselling_type, '')) = 'JOSAA'
      GROUP BY
        branch_id,
        year,
        round,
        category,
        quota,
        gender
      HAVING COUNT(*) > 1
      ORDER BY count DESC
      LIMIT 100
    `, [
      YEAR,
    ]);


  console.log(
    '\nDUPLICATE IDENTITIES'
  );

  console.log(
    'Duplicate identity groups:',
    duplicates.rows.length
  );

  if (
    duplicates.rows.length
  ) {
    console.table(
      duplicates.rows
    );
  }


  /*
  |--------------------------------------------------------------------------
  | NULL RANK AUDIT
  |--------------------------------------------------------------------------
  */

  const nullRanks =
    await pool.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE opening_rank IS NULL
        )::int AS null_opening,

        COUNT(*) FILTER (
          WHERE closing_rank IS NULL
        )::int AS null_closing
      FROM cutoffs
      WHERE year = $1
        AND UPPER(COALESCE(counselling_type, '')) = 'JOSAA'
    `, [
      YEAR,
    ]);


  console.log(
    '\nNULL RANK AUDIT'
  );

  console.table(
    nullRanks.rows
  );


  /*
  |--------------------------------------------------------------------------
  | SAMPLE
  |--------------------------------------------------------------------------
  */

  const sample =
    await pool.query(`
      SELECT
        c.id,
        c.branch_id,
        b.name AS branch_name,
        col.name AS college_name,
        c.year,
        c.round,
        c.category,
        c.quota,
        c.gender,
        c.opening_rank,
        c.closing_rank,
        c.source_label,
        c.source_url,
        c.verification_status,
        c.is_verified,
        c.created_at
      FROM cutoffs c
      JOIN branches b
        ON b.id = c.branch_id
      JOIN colleges col
        ON col.id = b.college_id
      WHERE c.year = $1
        AND UPPER(COALESCE(c.counselling_type, '')) = 'JOSAA'
      ORDER BY c.id
      LIMIT 20
    `, [
      YEAR,
    ]);


  console.log(
    '\nFIRST 20 ROWS'
  );

  console.table(
    sample.rows
  );


  /*
  |--------------------------------------------------------------------------
  | BACKUP SNAPSHOT
  |--------------------------------------------------------------------------
  */

  const backup =
    await pool.query(`
      SELECT *
      FROM cutoffs
      WHERE year = $1
        AND UPPER(COALESCE(counselling_type, '')) = 'JOSAA'
      ORDER BY id
    `, [
      YEAR,
    ]);


  const backupFile =
    './josaa-2025-existing-db-backup.json';


  fs.writeFileSync(
    backupFile,
    JSON.stringify(
      {
        capturedAt:
          new Date()
            .toISOString(),

        year:
          YEAR,

        counsellingType:
          'JOSAA',

        rowCount:
          backup.rows.length,

        rows:
          backup.rows,
      },
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\nSaved backup:'
  );

  console.log(
    backupFile
  );


  console.log(
    '\nDATABASE WAS NOT MODIFIED.'
  );

} finally {

  await pool.end();
}