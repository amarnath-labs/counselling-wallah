import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const MAP_FILE =
  './csab-2026-import-map.json';

const BACKUP_FILE =
  './csab-2026-existing-db-backup.json';

const EXPECTED_TOTAL =
  11793;

const EXPECTED_ROUNDS = {
  '1': 7199,
  '2': 4594,
};

const YEAR =
  2026;

const COUNSELLING_TYPE =
  'CSAB_SPECIAL';

const SOURCE_LABEL =
  'Official CSAB Special 2026 OR-CR';


if (!fs.existsSync(MAP_FILE)) {
  throw new Error(
    `Missing ${MAP_FILE}`
  );
}


const mapData =
  JSON.parse(
    fs.readFileSync(
      MAP_FILE,
      'utf8'
    )
  );


const rows =
  mapData.mappedRows;


if (!Array.isArray(rows)) {
  throw new Error(
    'mappedRows missing from import map.'
  );
}


if (
  rows.length !==
  EXPECTED_TOTAL
) {
  throw new Error(
    `Expected ${EXPECTED_TOTAL} mapped rows, got ${rows.length}`
  );
}


/*
|--------------------------------------------------------------------------
| SOURCE AUDIT
|--------------------------------------------------------------------------
*/

const roundCounts =
  {};

let invalidOpening =
  0;

let invalidClosing =
  0;

let dasaRows =
  0;


for (const row of rows) {

  const round =
    String(row.round);


  roundCounts[round] =
    (
      roundCounts[round] ??
      0
    ) + 1;


  if (
    !Number.isInteger(
      Number(row.openingRankNumeric)
    )
  ) {
    invalidOpening += 1;
  }


  if (
    !Number.isInteger(
      Number(row.closingRankNumeric)
    )
  ) {
    invalidClosing += 1;
  }


  const markerText =
    [
      row.academicProgram,
      row.quota,
    ]
      .join(' ');


  if (
    /\bDASA\b/i.test(markerText) ||
    /\bCIWG\b/i.test(markerText)
  ) {
    dasaRows += 1;
  }
}


if (
  roundCounts['1'] !==
  EXPECTED_ROUNDS['1']
) {
  throw new Error(
    `Round 1 source count mismatch: ${roundCounts['1']}`
  );
}


if (
  roundCounts['2'] !==
  EXPECTED_ROUNDS['2']
) {
  throw new Error(
    `Round 2 source count mismatch: ${roundCounts['2']}`
  );
}


if (
  Object.keys(roundCounts)
    .some(
      round =>
        !Object.hasOwn(
          EXPECTED_ROUNDS,
          round
        )
    )
) {
  throw new Error(
    `Unexpected source rounds: ${Object.keys(roundCounts).join(', ')}`
  );
}


if (
  invalidOpening !== 0 ||
  invalidClosing !== 0
) {
  throw new Error(
    `Invalid ranks detected. opening=${invalidOpening}, closing=${invalidClosing}`
  );
}


if (dasaRows !== 0) {
  throw new Error(
    `DASA/CIWG contamination detected: ${dasaRows}`
  );
}


const client =
  await pool.connect();

let transactionOpen =
  false;


try {

  console.log(
    '\n========================================'
  );

  console.log(
    'CSAB SPECIAL 2026 PRODUCTION IMPORT'
  );

  console.log(
    '========================================'
  );


  /*
  |--------------------------------------------------------------------------
  | EXISTING TARGET ROWS
  |--------------------------------------------------------------------------
  */

  const existing =
    await client.query(
      `
      SELECT
        id,
        branch_id,
        year,
        round,
        category,
        quota,
        gender,
        opening_rank,
        closing_rank,
        source_label,
        is_verified,
        data_source_id,
        source_url,
        retrieved_at,
        verification_status,
        counselling_type
      FROM cutoffs
      WHERE
        year = $1
        AND counselling_type = $2
      ORDER BY
        round,
        branch_id,
        category,
        quota,
        gender
      `,
      [
        YEAR,
        COUNSELLING_TYPE,
      ]
    );


  const backup = {
    createdAt:
      new Date()
        .toISOString(),

    year:
      YEAR,

    counsellingType:
      COUNSELLING_TYPE,

    rows:
      existing.rows,
  };


  fs.writeFileSync(
    BACKUP_FILE,
    JSON.stringify(
      backup,
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\nBackup saved:',
    BACKUP_FILE
  );

  console.log(
    'Existing CSAB_SPECIAL 2026 rows:',
    existing.rowCount
  );


  if (
    existing.rowCount !== 0
  ) {
    throw new Error(
      `Import aborted: ${existing.rowCount} existing CSAB_SPECIAL 2026 rows found.`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | BASELINE COUNTS
  |--------------------------------------------------------------------------
  */

  const baseline =
    await client.query(
      `
      SELECT
        counselling_type,
        COUNT(*)::int AS rows
      FROM cutoffs
      GROUP BY counselling_type
      ORDER BY counselling_type
      `
    );


  const baselineMap =
    new Map(
      baseline.rows.map(
        row => [
          row.counselling_type,
          Number(row.rows),
        ]
      )
    );


  console.log(
    '\nBEFORE IMPORT'
  );

  console.table(
    baseline.rows
  );


  /*
  |--------------------------------------------------------------------------
  | BEGIN TRANSACTION
  |--------------------------------------------------------------------------
  */

  await client.query(
    'BEGIN'
  );

  transactionOpen =
    true;


  let inserted =
    0;

  const BATCH_SIZE =
    500;


  for (
    let start = 0;
    start < rows.length;
    start += BATCH_SIZE
  ) {

    const batch =
      rows.slice(
        start,
        start + BATCH_SIZE
      );


    const values =
      [];

    const placeholders =
      [];


    for (
      let index = 0;
      index < batch.length;
      index += 1
    ) {

      const row =
        batch[index];

      const base =
        index * 14;


      placeholders.push(
        `(
          $${base + 1},
          $${base + 2},
          $${base + 3},
          $${base + 4},
          $${base + 5},
          $${base + 6},
          $${base + 7},
          $${base + 8},
          $${base + 9},
          $${base + 10},
          $${base + 11},
          $${base + 12},
          $${base + 13},
          $${base + 14}
        )`
      );


      values.push(
        Number(row.branchId),
        YEAR,
        String(row.round),
        String(row.seatType),
        String(row.quota),
        String(row.gender),
        Number(row.closingRankNumeric),
        SOURCE_LABEL,
        true,
        String(row.sourceUrl),
        new Date(),
        'VERIFIED',
        COUNSELLING_TYPE,
        Number(row.openingRankNumeric)
      );
    }


    const result =
      await client.query(
        `
        INSERT INTO cutoffs (
          branch_id,
          year,
          round,
          category,
          quota,
          gender,
          closing_rank,
          source_label,
          is_verified,
          source_url,
          retrieved_at,
          verification_status,
          counselling_type,
          opening_rank
        )
        VALUES
          ${placeholders.join(',')}
        `,
        values
      );


    inserted +=
      result.rowCount;


    console.log(
      `Inserted: ${inserted}/${EXPECTED_TOTAL}`
    );
  }


  if (
    inserted !==
    EXPECTED_TOTAL
  ) {
    throw new Error(
      `Inserted ${inserted}, expected ${EXPECTED_TOTAL}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | ROUND AUDIT
  |--------------------------------------------------------------------------
  */

  const roundAudit =
    await client.query(
      `
      SELECT
        round,
        COUNT(*)::int AS rows,

        COUNT(*) FILTER (
          WHERE opening_rank IS NULL
        )::int AS null_opening,

        COUNT(*) FILTER (
          WHERE closing_rank IS NULL
        )::int AS null_closing,

        COUNT(*) FILTER (
          WHERE is_verified IS NOT TRUE
        )::int AS not_verified,

        COUNT(*) FILTER (
          WHERE verification_status <> 'VERIFIED'
        )::int AS wrong_status,

        COUNT(*) FILTER (
          WHERE source_label <> $3
        )::int AS wrong_source,

        COUNT(*) FILTER (
          WHERE source_url IS NULL
             OR BTRIM(source_url) = ''
        )::int AS missing_source_url

      FROM cutoffs

      WHERE
        year = $1
        AND counselling_type = $2

      GROUP BY round

      ORDER BY round
      `,
      [
        YEAR,
        COUNSELLING_TYPE,
        SOURCE_LABEL,
      ]
    );


  console.log(
    '\nROUND AUDIT'
  );

  console.table(
    roundAudit.rows
  );


  if (
    roundAudit.rows.length !==
    2
  ) {
    throw new Error(
      `Expected 2 rounds, got ${roundAudit.rows.length}`
    );
  }


  for (
    const row
    of roundAudit.rows
  ) {

    const expected =
      EXPECTED_ROUNDS[
        String(row.round)
      ];


    if (expected == null) {
      throw new Error(
        `Unexpected DB round: ${row.round}`
      );
    }


    if (
      Number(row.rows) !==
      expected
    ) {
      throw new Error(
        `Round ${row.round}: expected ${expected}, got ${row.rows}`
      );
    }


    for (
      const field
      of [
        'null_opening',
        'null_closing',
        'not_verified',
        'wrong_status',
        'wrong_source',
        'missing_source_url',
      ]
    ) {

      if (
        Number(row[field]) !== 0
      ) {
        throw new Error(
          `Round ${row.round}: ${field}=${row[field]}`
        );
      }
    }
  }


  /*
  |--------------------------------------------------------------------------
  | TOTAL
  |--------------------------------------------------------------------------
  */

  const totalResult =
    await client.query(
      `
      SELECT
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE
        year = $1
        AND counselling_type = $2
      `,
      [
        YEAR,
        COUNSELLING_TYPE,
      ]
    );


  const total =
    Number(
      totalResult.rows[0].rows
    );


  console.log(
    '\nTransaction total:',
    total
  );


  if (
    total !==
    EXPECTED_TOTAL
  ) {
    throw new Error(
      `Expected ${EXPECTED_TOTAL}, got ${total}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | DUPLICATE IDENTITIES
  |--------------------------------------------------------------------------
  */

  const duplicates =
    await client.query(
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
          gender,
          counselling_type

        FROM cutoffs

        WHERE
          year = $1
          AND counselling_type = $2

        GROUP BY
          branch_id,
          year,
          round,
          category,
          quota,
          gender,
          counselling_type

        HAVING COUNT(*) > 1
      ) d
      `,
      [
        YEAR,
        COUNSELLING_TYPE,
      ]
    );


  const duplicateGroups =
    Number(
      duplicates.rows[0]
        .duplicate_groups
    );


  console.log(
    'Duplicate identity groups:',
    duplicateGroups
  );


  if (
    duplicateGroups !== 0
  ) {
    throw new Error(
      `Duplicate identities detected: ${duplicateGroups}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | DASA / CIWG CONTAMINATION
  |--------------------------------------------------------------------------
  */

  const contamination =
    await client.query(
      `
      SELECT
        COUNT(*)::int AS rows
      FROM cutoffs c
      JOIN branches b
        ON b.id = c.branch_id
      WHERE
        c.year = $1
        AND c.counselling_type = $2
        AND (
          b.name ~* 'DASA'
          OR c.quota ~* 'DASA'
          OR c.quota ~* 'CIWG'
        )
      `,
      [
        YEAR,
        COUNSELLING_TYPE,
      ]
    );


  const contaminationRows =
    Number(
      contamination.rows[0].rows
    );


  console.log(
    'DASA/CIWG contamination:',
    contaminationRows
  );


  if (
    contaminationRows !== 0
  ) {
    throw new Error(
      `Contamination detected: ${contaminationRows}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | NON-TARGET SAFETY
  |--------------------------------------------------------------------------
  */

  const beforeJosaa =
    baselineMap.get(
      'JOSAA'
    ) ?? 0;

  const beforeUptac =
    baselineMap.get(
      'UPTAC'
    ) ?? 0;


  const safety =
    await client.query(
      `
      SELECT
        counselling_type,
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE counselling_type IN (
        'JOSAA',
        'UPTAC'
      )
      GROUP BY counselling_type
      `
    );


  const safetyMap =
    new Map(
      safety.rows.map(
        row => [
          row.counselling_type,
          Number(row.rows),
        ]
      )
    );


  if (
    (
      safetyMap.get('JOSAA') ??
      0
    ) !== beforeJosaa
  ) {
    throw new Error(
      'JOSAA count changed unexpectedly.'
    );
  }


  if (
    (
      safetyMap.get('UPTAC') ??
      0
    ) !== beforeUptac
  ) {
    throw new Error(
      'UPTAC count changed unexpectedly.'
    );
  }


  console.log(
    'JOSAA unchanged:',
    beforeJosaa
  );

  console.log(
    'UPTAC unchanged:',
    beforeUptac
  );


  /*
  |--------------------------------------------------------------------------
  | COMMIT
  |--------------------------------------------------------------------------
  */

  await client.query(
    'COMMIT'
  );

  transactionOpen =
    false;


  /*
  |--------------------------------------------------------------------------
  | POST-COMMIT VERIFY
  |--------------------------------------------------------------------------
  */

  const committed =
    await client.query(
      `
      SELECT
        round,
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE
        year = $1
        AND counselling_type = $2
      GROUP BY round
      ORDER BY round
      `,
      [
        YEAR,
        COUNSELLING_TYPE,
      ]
    );


  const committedTotal =
    committed.rows.reduce(
      (sum, row) =>
        sum + Number(row.rows),
      0
    );


  console.log(
    '\n========================================'
  );

  console.log(
    'CSAB SPECIAL 2026 PRODUCTION COMMIT PASSED'
  );

  console.log(
    '========================================'
  );


  console.table(
    committed.rows
  );


  console.log(
    'Committed total:',
    committedTotal
  );


  if (
    committedTotal !==
    EXPECTED_TOTAL
  ) {
    throw new Error(
      `Post-commit verification failed: ${committedTotal}`
    );
  }


  console.log(
    'Counselling type:',
    COUNSELLING_TYPE
  );

  console.log(
    'Source:',
    SOURCE_LABEL
  );

  console.log(
    'Verification status: VERIFIED'
  );

  console.log(
    '\nDATABASE MODIFIED: YES — PRODUCTION COMMIT SUCCESSFUL'
  );


} catch (error) {

  if (transactionOpen) {

    try {

      await client.query(
        'ROLLBACK'
      );

      console.error(
        '\nTRANSACTION ROLLED BACK.'
      );

    } catch (
      rollbackError
    ) {

      console.error(
        'ROLLBACK FAILED:',
        rollbackError
      );
    }
  }


  throw error;


} finally {

  client.release();

  await pool.end();
}