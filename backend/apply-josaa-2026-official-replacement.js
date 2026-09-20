import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const INPUT =
  './josaa-2026-import-map.json';

const YEAR =
  2026;

const EXPECTED_TOTAL =
  64327;

const EXPECTED_BY_ROUND = {
  '1': 13085,
  '2': 12871,
  '3': 12815,
  '4': 12793,
  '5': 12763,
};

const BATCH_SIZE =
  500;


/*
|--------------------------------------------------------------------------
| SAFETY: LOAD MAPPED DATA
|--------------------------------------------------------------------------
*/

if (!fs.existsSync(INPUT)) {
  throw new Error(
    `Missing input: ${INPUT}`
  );
}

const source =
  JSON.parse(
    fs.readFileSync(
      INPUT,
      'utf8'
    )
  );

const rows =
  Array.isArray(source.mappedRows)
    ? source.mappedRows
    : [];

if (
  rows.length !==
  EXPECTED_TOTAL
) {
  throw new Error(
    `Safety stop: expected ${EXPECTED_TOTAL} mapped rows, found ${rows.length}`
  );
}


/*
|--------------------------------------------------------------------------
| SAFETY: VALIDATE INPUT
|--------------------------------------------------------------------------
*/

const identities =
  new Set();

const roundCounts =
  {};

for (
  let index = 0;
  index < rows.length;
  index += 1
) {

  const row =
    rows[index];

  if (!row.branchId) {
    throw new Error(
      `Missing branchId at row ${index}`
    );
  }

  if (
    !Number.isSafeInteger(
      row.openingRank
    ) ||
    !Number.isSafeInteger(
      row.closingRank
    )
  ) {
    throw new Error(
      `Invalid rank at row ${index}`
    );
  }

  const round =
    String(row.round);

  if (
    !Object.hasOwn(
      EXPECTED_BY_ROUND,
      round
    )
  ) {
    throw new Error(
      `Unexpected round: ${round}`
    );
  }

  roundCounts[round] =
    (
      roundCounts[round] ||
      0
    ) + 1;

  const identity =
    [
      row.branchId,
      YEAR,
      round,
      row.seatType,
      row.quota,
      row.gender,
    ]
      .map(
        value =>
          String(value ?? '')
            .trim()
            .toLowerCase()
      )
      .join('|');

  if (
    identities.has(
      identity
    )
  ) {
    throw new Error(
      `Duplicate mapped identity found: ${identity}`
    );
  }

  identities.add(
    identity
  );
}

for (
  const [
    round,
    expected,
  ]
  of Object.entries(
    EXPECTED_BY_ROUND
  )
) {

  if (
    roundCounts[round] !==
    expected
  ) {
    throw new Error(
      `Input round ${round}: expected ${expected}, got ${roundCounts[round]}`
    );
  }
}


console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2026 OFFICIAL REPLACEMENT'
);

console.log(
  '========================================\n'
);

console.log(
  'Validated input rows:',
  rows.length
);

console.table(
  Object.entries(
    roundCounts
  ).map(
    ([round, count]) => ({
      round,
      count,
    })
  )
);


/*
|--------------------------------------------------------------------------
| DATABASE CLIENT
|--------------------------------------------------------------------------
*/

const client =
  await pool.connect();

let transactionStarted =
  false;

try {

  /*
  |--------------------------------------------------------------------------
  | DATABASE BACKUP BEFORE WRITE
  |--------------------------------------------------------------------------
  */

  const existing =
    await client.query(
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
      ORDER BY id
      `,
      [
        YEAR,
      ]
    );

  const timestamp =
    new Date()
      .toISOString()
      .replace(
        /[:.]/g,
        '-'
      );

  const backupPath =
    `./josaa-${YEAR}-pre-replacement-${timestamp}.json`;

  fs.writeFileSync(
    backupPath,
    JSON.stringify(
      {
        exportedAt:
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
    '\nCurrent DB rows:',
    existing.rows.length
  );

  console.log(
    'Backup created:',
    backupPath
  );


  /*
  |--------------------------------------------------------------------------
  | TRANSACTION
  |--------------------------------------------------------------------------
  */

  await client.query(
    'BEGIN'
  );

  transactionStarted =
    true;

  console.log(
    '\nBEGIN'
  );


  /*
  |--------------------------------------------------------------------------
  | LOCK TARGET
  |--------------------------------------------------------------------------
  */

  await client.query(`
    LOCK TABLE cutoffs
    IN SHARE ROW EXCLUSIVE MODE
  `);

  console.log(
    'cutoffs table write lock acquired.'
  );


  /*
  |--------------------------------------------------------------------------
  | DELETE ONLY JOSAA 2026
  |--------------------------------------------------------------------------
  */

  const deleted =
    await client.query(
      `
      DELETE FROM cutoffs
      WHERE year = $1
        AND UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) = 'JOSAA'
      `,
      [
        YEAR,
      ]
    );

  if (
    deleted.rowCount !==
    existing.rows.length
  ) {
    throw new Error(
      `Delete count mismatch: expected ${existing.rows.length}, deleted ${deleted.rowCount}`
    );
  }

  console.log(
    'Old JoSAA 2026 rows deleted:',
    deleted.rowCount
  );


  /*
  |--------------------------------------------------------------------------
  | INSERT OFFICIAL STANDARD ROWS
  |--------------------------------------------------------------------------
  */

  let insertedTotal =
    0;

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

    let parameter =
      1;

    for (
      const row
      of batch
    ) {

      placeholders.push(
        `(
          $${parameter++},
          $${parameter++},
          $${parameter++},
          $${parameter++},
          $${parameter++},
          $${parameter++},
          $${parameter++},
          $${parameter++},
          $${parameter++},
          $${parameter++},
          $${parameter++},
          $${parameter++},
          $${parameter++},
          $${parameter++}
        )`
      );

      values.push(
        row.branchId,
        YEAR,
        String(row.round),
        row.seatType,
        row.quota,
        row.gender,
        row.openingRank,
        row.closingRank,
        'Official JoSAA 2026 OR-CR',
        true,
        row.sourceUrl ||
          'https://josaa.admissions.nic.in/applicant/SeatAllotmentResult/CurrentORCR.aspx',
        new Date(),
        'VERIFIED',
        'JOSAA'
      );
    }

    const inserted =
      await client.query(
        `
        INSERT INTO cutoffs (
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
          source_url,
          retrieved_at,
          verification_status,
          counselling_type
        )
        VALUES
          ${placeholders.join(',')}
        `,
        values
      );

    insertedTotal +=
      inserted.rowCount;

    console.log(
      `Inserted: ${insertedTotal}/${EXPECTED_TOTAL}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | POST-INSERT TOTAL
  |--------------------------------------------------------------------------
  */

  const totalResult =
    await client.query(
      `
      SELECT
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE year = $1
        AND UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) = 'JOSAA'
      `,
      [
        YEAR,
      ]
    );

  const total =
    totalResult.rows[0]
      .rows;

  if (
    total !==
    EXPECTED_TOTAL
  ) {
    throw new Error(
      `Post-insert total mismatch: expected ${EXPECTED_TOTAL}, got ${total}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | ROUND COUNTS
  |--------------------------------------------------------------------------
  */

  const roundResult =
    await client.query(
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
      ORDER BY round::int
      `,
      [
        YEAR,
      ]
    );

  console.log(
    '\nFINAL ROUND COUNTS'
  );

  console.table(
    roundResult.rows
  );

  if (
    roundResult.rows.length !==
    5
  ) {
    throw new Error(
      `Expected exactly 5 rounds, got ${roundResult.rows.length}`
    );
  }

  for (
    const result
    of roundResult.rows
  ) {

    const expected =
      EXPECTED_BY_ROUND[
        String(result.round)
      ];

    if (
      expected === undefined ||
      result.rows !== expected
    ) {
      throw new Error(
        `Round ${result.round}: expected ${expected}, got ${result.rows}`
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | NULL RANK AUDIT
  |--------------------------------------------------------------------------
  */

  const nullResult =
    await client.query(
      `
      SELECT
        COUNT(*) FILTER (
          WHERE opening_rank IS NULL
        )::int AS missing_opening,

        COUNT(*) FILTER (
          WHERE closing_rank IS NULL
        )::int AS missing_closing

      FROM cutoffs

      WHERE year = $1
        AND UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) = 'JOSAA'
      `,
      [
        YEAR,
      ]
    );

  console.log(
    '\nFINAL NULL AUDIT'
  );

  console.table(
    nullResult.rows
  );

  if (
    nullResult.rows[0]
      .missing_opening !==
      0 ||
    nullResult.rows[0]
      .missing_closing !==
      0
  ) {
    throw new Error(
      'Null rank audit failed.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | DUPLICATE AUDIT
  |--------------------------------------------------------------------------
  */

  const duplicateResult =
    await client.query(
      `
      SELECT
        branch_id,
        year,
        round,
        category,
        quota,
        gender,
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
        branch_id,
        year,
        round,
        category,
        quota,
        gender
      HAVING COUNT(*) > 1
      LIMIT 1
      `,
      [
        YEAR,
      ]
    );

  if (
    duplicateResult.rows.length !==
    0
  ) {
    throw new Error(
      'Duplicate identities detected after import.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | COMMIT
  |--------------------------------------------------------------------------
  */

  await client.query(
    'COMMIT'
  );

  transactionStarted =
    false;

  console.log(
    '\n========================================'
  );

  console.log(
    'JOSAA 2026 REPLACEMENT COMMITTED'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Old rows removed:',
    deleted.rowCount
  );

  console.log(
    'Official rows inserted:',
    insertedTotal
  );

  console.log(
    'Validated rows:',
    total
  );

  console.log(
    'Missing ranks: 0'
  );

  console.log(
    'Duplicate identities: 0'
  );

  console.log(
    '\nBackup:',
    backupPath
  );


  /*
  |--------------------------------------------------------------------------
  | VERIFY AFTER COMMIT
  |--------------------------------------------------------------------------
  */

  const afterCommit =
    await client.query(
      `
      SELECT
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE year = $1
        AND UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) = 'JOSAA'
      `,
      [
        YEAR,
      ]
    );

  if (
    afterCommit.rows[0]
      .rows !==
    EXPECTED_TOTAL
  ) {
    throw new Error(
      'Post-COMMIT verification failed.'
    );
  }

  console.log(
    '\nPost-COMMIT rows:',
    afterCommit.rows[0]
      .rows
  );

  console.log(
    'Post-COMMIT verification PASSED.'
  );

} catch (error) {

  if (
    transactionStarted
  ) {

    try {

      await client.query(
        'ROLLBACK'
      );

      console.error(
        '\nROLLBACK completed. No partial replacement retained.'
      );

    } catch (
      rollbackError
    ) {

      console.error(
        '\nCRITICAL ROLLBACK ERROR:',
        rollbackError
      );
    }
  }

  throw error;

} finally {

  client.release();

  await pool.end();
}