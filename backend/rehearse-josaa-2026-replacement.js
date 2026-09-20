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
| LOAD PREPARED MAPPING
|--------------------------------------------------------------------------
*/

if (!fs.existsSync(INPUT)) {
  throw new Error(
    `Missing mapping file: ${INPUT}`
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
    `Expected ${EXPECTED_TOTAL} mapped rows, got ${rows.length}`
  );
}


/*
|--------------------------------------------------------------------------
| PRE-TRANSACTION VALIDATION
|--------------------------------------------------------------------------
*/

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
    )
  ) {
    throw new Error(
      `Invalid opening rank at row ${index}`
    );
  }

  if (
    !Number.isSafeInteger(
      row.closingRank
    )
  ) {
    throw new Error(
      `Invalid closing rank at row ${index}`
    );
  }

  if (
    !['1','2','3','4','5']
      .includes(
        String(row.round)
      )
  ) {
    throw new Error(
      `Unexpected round at row ${index}: ${row.round}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| DUPLICATE IDENTITY AUDIT
|--------------------------------------------------------------------------
*/

function identityKey(row) {
  return [
    row.branchId,
    YEAR,
    String(row.round),
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
}

const seen =
  new Set();

const duplicates =
  [];

for (
  const row
  of rows
) {
  const key =
    identityKey(row);

  if (
    seen.has(key)
  ) {
    duplicates.push({
      key,
      row,
    });
  } else {
    seen.add(key);
  }
}

if (
  duplicates.length > 0
) {
  fs.writeFileSync(
    './josaa-2026-rehearsal-duplicates.json',
    JSON.stringify(
      duplicates,
      null,
      2
    ),
    'utf8'
  );

  throw new Error(
    `Mapped dataset contains ${duplicates.length} duplicate identities.`
  );
}


/*
|--------------------------------------------------------------------------
| ROUND COUNTS BEFORE TOUCHING DB
|--------------------------------------------------------------------------
*/

const inputRoundCounts =
  {};

for (
  const row
  of rows
) {
  const round =
    String(row.round);

  inputRoundCounts[round] =
    (
      inputRoundCounts[round] ||
      0
    ) + 1;
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
    inputRoundCounts[round] !==
    expected
  ) {
    throw new Error(
      `Round ${round}: expected ${expected}, got ${inputRoundCounts[round]}`
    );
  }
}


console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2026 REPLACEMENT REHEARSAL'
);

console.log(
  '========================================\n'
);

console.log(
  'Mapped rows:',
  rows.length
);

console.log(
  'Duplicate identities:',
  duplicates.length
);

console.log(
  '\nInput round counts:'
);

console.table(
  Object.entries(
    inputRoundCounts
  ).map(
    ([round, count]) => ({
      round,
      count,
    })
  )
);


/*
|--------------------------------------------------------------------------
| GET DEDICATED CLIENT
|--------------------------------------------------------------------------
*/

const client =
  await pool.connect();

let transactionStarted =
  false;

try {

  /*
  |--------------------------------------------------------------------------
  | BACKUP CURRENT JOSAA 2026 ROWS TO FILE
  |--------------------------------------------------------------------------
  */

  const current =
    await client.query(`
      SELECT
        co.*
      FROM cutoffs co
      WHERE co.year = $1
        AND UPPER(
          COALESCE(
            co.counselling_type,
            ''
          )
        ) = 'JOSAA'
      ORDER BY
        co.id
    `,
    [
      YEAR,
    ]);

  const backupFile =
    `./josaa-${YEAR}-db-before-replacement.json`;

  fs.writeFileSync(
    backupFile,
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
          current.rows.length,

        rows:
          current.rows,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(
    '\nExisting JoSAA 2026 rows:',
    current.rows.length
  );

  console.log(
    'Backup saved:',
    backupFile
  );


  /*
  |--------------------------------------------------------------------------
  | BEGIN REHEARSAL TRANSACTION
  |--------------------------------------------------------------------------
  */

  await client.query(
    'BEGIN'
  );

  transactionStarted =
    true;

  console.log(
    '\nBEGIN transaction'
  );


  /*
  |--------------------------------------------------------------------------
  | DELETE EXISTING JOSAA 2026 INSIDE TRANSACTION ONLY
  |--------------------------------------------------------------------------
  */

  const deleted =
    await client.query(`
      DELETE FROM cutoffs
      WHERE year = $1
        AND UPPER(
          COALESCE(
            counselling_type,
            ''
          )
        ) = 'JOSAA'
      RETURNING id
    `,
    [
      YEAR,
    ]);

  console.log(
    'Rows deleted inside rehearsal:',
    deleted.rowCount
  );


  /*
  |--------------------------------------------------------------------------
  | INSERT OFFICIAL STANDARD DATA
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

    const insert =
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
      insert.rowCount;

    console.log(
      `Inserted rehearsal rows: ${insertedTotal}/${rows.length}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | VALIDATE TOTAL COUNT
  |--------------------------------------------------------------------------
  */

  const totalResult =
    await client.query(`
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
    ]);

  const dbTotal =
    totalResult.rows[0]
      .rows;

  if (
    dbTotal !==
    EXPECTED_TOTAL
  ) {
    throw new Error(
      `Rehearsal total mismatch: expected ${EXPECTED_TOTAL}, got ${dbTotal}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | VALIDATE EACH ROUND
  |--------------------------------------------------------------------------
  */

  const roundResult =
    await client.query(`
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
      ORDER BY
        round::int
    `,
    [
      YEAR,
    ]);

  console.log(
    '\nREHEARSAL ROUND COUNTS'
  );

  console.table(
    roundResult.rows
  );

  for (
    const row
    of roundResult.rows
  ) {
    const expected =
      EXPECTED_BY_ROUND[
        String(row.round)
      ];

    if (
      expected ===
      undefined
    ) {
      throw new Error(
        `Unexpected round in rehearsal DB: ${row.round}`
      );
    }

    if (
      row.rows !==
      expected
    ) {
      throw new Error(
        `Round ${row.round}: expected ${expected}, got ${row.rows}`
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | VALIDATE NULL RANKS
  |--------------------------------------------------------------------------
  */

  const nullAudit =
    await client.query(`
      SELECT
        COUNT(*) FILTER (
          WHERE opening_rank IS NULL
        )::int
          AS missing_opening,

        COUNT(*) FILTER (
          WHERE closing_rank IS NULL
        )::int
          AS missing_closing

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
    ]);

  console.log(
    '\nNULL RANK AUDIT'
  );

  console.table(
    nullAudit.rows
  );

  if (
    nullAudit.rows[0]
      .missing_opening !==
      0 ||
    nullAudit.rows[0]
      .missing_closing !==
      0
  ) {
    throw new Error(
      'Null rank validation failed.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | VALIDATE DUPLICATES INSIDE DATABASE
  |--------------------------------------------------------------------------
  */

  const duplicateAudit =
    await client.query(`
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
      LIMIT 100
    `,
    [
      YEAR,
    ]);

  console.log(
    '\nDuplicate identities inside rehearsal DB:',
    duplicateAudit.rows.length
  );

  if (
    duplicateAudit.rows.length >
    0
  ) {
    console.table(
      duplicateAudit.rows
    );

    throw new Error(
      'Duplicate identity validation failed.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | FINAL REHEARSAL SUMMARY
  |--------------------------------------------------------------------------
  */

  console.log(
    '\n========================================'
  );

  console.log(
    'REHEARSAL VALIDATION PASSED'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Expected total:',
    EXPECTED_TOTAL
  );

  console.log(
    'Inserted total:',
    insertedTotal
  );

  console.log(
    'Validated total:',
    dbTotal
  );

  console.log(
    'Missing ranks: 0'
  );

  console.log(
    'Duplicate identities: 0'
  );


  /*
  |--------------------------------------------------------------------------
  | ALWAYS ROLLBACK REHEARSAL
  |--------------------------------------------------------------------------
  */

  await client.query(
    'ROLLBACK'
  );

  transactionStarted =
    false;

  console.log(
    '\nROLLBACK completed.'
  );

  console.log(
    'DATABASE WAS NOT MODIFIED.'
  );


  /*
  |--------------------------------------------------------------------------
  | VERIFY OLD DATA RETURNED AFTER ROLLBACK
  |--------------------------------------------------------------------------
  */

  const afterRollback =
    await client.query(`
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
    ]);

  console.log(
    '\nRows after rollback:',
    afterRollback.rows[0]
      .rows
  );

  console.log(
    'Rows before rehearsal:',
    current.rows.length
  );

  if (
    afterRollback.rows[0]
      .rows !==
    current.rows.length
  ) {
    throw new Error(
      'ROLLBACK verification failed: original row count was not restored.'
    );
  }

  console.log(
    'ROLLBACK verification PASSED.'
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
        '\nEmergency ROLLBACK completed.'
      );
    } catch (
      rollbackError
    ) {
      console.error(
        '\nROLLBACK ERROR:',
        rollbackError
      );
    }
  }

  throw error;

} finally {

  client.release();

  await pool.end();
}