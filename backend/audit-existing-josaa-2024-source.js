import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const YEAR =
  2024;

const BACKUP =
  './josaa-2024-existing-db-backup.json';


console.log(
  '\n========================================'
);

console.log(
  'AUDIT EXISTING JOSAA 2024 DATA'
);

console.log(
  '========================================\n'
);


try {

  /*
  |--------------------------------------------------------------------------
  | ALL EXISTING JOSAA 2024 ROWS
  |--------------------------------------------------------------------------
  */

  const existing =
    await pool.query(
      `
      SELECT *
      FROM cutoffs
      WHERE year = $1
        AND UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) = 'JOSAA'
      ORDER BY
        round,
        branch_id,
        category,
        quota,
        gender,
        id
      `,
      [YEAR]
    );


  console.log(
    'Total existing JoSAA 2024 rows:',
    existing.rows.length
  );


  /*
  |--------------------------------------------------------------------------
  | ROUND DISTRIBUTION
  |--------------------------------------------------------------------------
  */

  const rounds =
    await pool.query(
      `
      SELECT
        round,
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE year = $1
        AND UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) = 'JOSAA'
      GROUP BY round
      ORDER BY round
      `,
      [YEAR]
    );


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
    await pool.query(
      `
      SELECT
        source_label,
        verification_status,
        is_verified,
        source_url,
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE year = $1
        AND UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) = 'JOSAA'
      GROUP BY
        source_label,
        verification_status,
        is_verified,
        source_url
      ORDER BY
        rows DESC,
        source_label
      `,
      [YEAR]
    );


  console.log(
    '\nSOURCE DISTRIBUTION'
  );

  console.table(
    sources.rows
  );


  /*
  |--------------------------------------------------------------------------
  | NULL RANK AUDIT
  |--------------------------------------------------------------------------
  */

  const integrity =
    await pool.query(
      `
      SELECT
        COUNT(*)::int AS total_rows,

        COUNT(*) FILTER (
          WHERE opening_rank IS NULL
        )::int AS null_opening,

        COUNT(*) FILTER (
          WHERE closing_rank IS NULL
        )::int AS null_closing
      FROM cutoffs
      WHERE year = $1
        AND UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) = 'JOSAA'
      `,
      [YEAR]
    );


  console.log(
    '\nINTEGRITY'
  );

  console.table(
    integrity.rows
  );


  /*
  |--------------------------------------------------------------------------
  | DUPLICATE IDENTITIES
  |--------------------------------------------------------------------------
  */

  const duplicates =
    await pool.query(
      `
      SELECT
        COUNT(*)::int AS duplicate_groups
      FROM (
        SELECT
          branch_id,
          year,
          round,
          category,
          quota,
          gender
        FROM cutoffs
        WHERE year = $1
          AND UPPER(
            COALESCE(
              counselling_type,
              ''
            )
          ) = 'JOSAA'
        GROUP BY
          branch_id,
          year,
          round,
          category,
          quota,
          gender
        HAVING COUNT(*) > 1
      ) x
      `,
      [YEAR]
    );


  console.log(
    '\nDuplicate identity groups:',
    duplicates.rows[0]
      .duplicate_groups
  );


  /*
  |--------------------------------------------------------------------------
  | SAMPLE
  |--------------------------------------------------------------------------
  */

  const sample =
    await pool.query(
      `
      SELECT
        c.name AS college,
        b.name AS branch,
        co.round,
        co.category,
        co.quota,
        co.gender,
        co.opening_rank,
        co.closing_rank,
        co.source_label,
        co.verification_status,
        co.is_verified
      FROM cutoffs co
      JOIN branches b
        ON b.id = co.branch_id
      JOIN colleges c
        ON c.id = b.college_id
      WHERE co.year = $1
        AND UPPER(
          COALESCE(
            co.counselling_type,
            ''
          )
        ) = 'JOSAA'
      ORDER BY co.id
      LIMIT 30
      `,
      [YEAR]
    );


  console.log(
    '\nSAMPLE ROWS'
  );

  console.table(
    sample.rows
  );


  /*
  |--------------------------------------------------------------------------
  | BACKUP
  |--------------------------------------------------------------------------
  */

  fs.writeFileSync(
    BACKUP,
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
          existing.rows.length,

        rows:
          existing.rows,
      },
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\nBackup saved:'
  );

  console.log(
    BACKUP
  );


  console.log(
    '\n========================================'
  );

  console.log(
    'JOSAA 2024 EXISTING DATA AUDIT COMPLETE'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Existing rows:',
    existing.rows.length
  );

  console.log(
    'Duplicate identity groups:',
    duplicates.rows[0]
      .duplicate_groups
  );

  console.log(
    '\nDATABASE WAS NOT MODIFIED.'
  );


} finally {

  await pool.end();
}