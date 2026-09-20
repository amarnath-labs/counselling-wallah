import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const INPUT =
  './josaa-2025-import-map-final.json';

const YEAR =
  2025;

const EXPECTED_OLD =
  65;

const EXPECTED_TOTAL =
  71414;

const EXPECTED_ROUNDS = {
  '1': 12131,
  '2': 11920,
  '3': 11855,
  '4': 11847,
  '5': 11840,
  '6': 11821,
};

const BATCH_SIZE =
  500;


if (!fs.existsSync(INPUT)) {
  throw new Error(
    `Missing input file: ${INPUT}`
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
  source.mappedRows ?? [];


if (
  rows.length !==
  EXPECTED_TOTAL
) {
  throw new Error(
    `Expected ${EXPECTED_TOTAL} mapped rows, got ${rows.length}`
  );
}


const timestamp =
  new Date()
    .toISOString()
    .replace(
      /[:.]/g,
      '-'
    );


const backupFile =
  `./josaa-2025-pre-replacement-${timestamp}.json`;


console.log(
  '\n========================================'
);

console.log(
  'APPLY JOSAA 2025 OFFICIAL REPLACEMENT'
);

console.log(
  '========================================\n'
);

console.log(
  'Validated input rows:',
  rows.length
);


const client =
  await pool.connect();

let transactionStarted =
  false;


try {

  /*
  |--------------------------------------------------------------------------
  | PRE-COMMIT SNAPSHOT
  |--------------------------------------------------------------------------
  */

  const existingRows =
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
      [YEAR]
    );


  console.log(
    'Current JoSAA 2025 rows:',
    existingRows.rows.length
  );


  if (
    existingRows.rows.length !==
    EXPECTED_OLD
  ) {
    throw new Error(
      `Expected ${EXPECTED_OLD} existing JoSAA 2025 rows, found ${existingRows.rows.length}`
    );
  }


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
          existingRows.rows.length,

        rows:
          existingRows.rows,
      },
      null,
      2
    ),
    'utf8'
  );


  console.log(
    'Backup saved:',
    backupFile
  );


  /*
  |--------------------------------------------------------------------------
  | BEGIN + LOCK
  |--------------------------------------------------------------------------
  */

  await client.query(
    'BEGIN'
  );

  transactionStarted =
    true;


  await client.query(
    'LOCK TABLE cutoffs IN SHARE ROW EXCLUSIVE MODE'
  );


  console.log(
    '\nBEGIN transaction'
  );

  console.log(
    'cutoffs write lock acquired'
  );


  /*
  |--------------------------------------------------------------------------
  | DELETE OLD
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
      [YEAR]
    );


  console.log(
    'Old JoSAA 2025 rows deleted:',
    deleted.rowCount
  );


  if (
    deleted.rowCount !==
    EXPECTED_OLD
  ) {
    throw new Error(
      `Expected ${EXPECTED_OLD} deleted rows, got ${deleted.rowCount}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | INSERT OFFICIAL DATA
  |--------------------------------------------------------------------------
  */

  let inserted =
    0;


  for (
    let offset = 0;
    offset < rows.length;
    offset += BATCH_SIZE
  ) {

    const batch =
      rows.slice(
        offset,
        offset + BATCH_SIZE
      );


    const values =
      [];

    const placeholders =
      [];


    for (
      let i = 0;
      i < batch.length;
      i += 1
    ) {

      const row =
        batch[i];

      const base =
        i * 14;


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
        row.branchId,
        YEAR,
        String(row.round),
        row.seatType,
        row.quota,
        row.gender,
        row.openingRank,
        row.closingRank,
        'Official JoSAA 2025 OR-CR Archive',
        true,
        null,
        row.sourceUrl,
        'VERIFIED',
        'JOSAA'
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
          opening_rank,
          closing_rank,
          source_label,
          is_verified,
          data_source_id,
          source_url,
          verification_status,
          counselling_type
        )
        VALUES
          ${placeholders.join(',')}
        `,
        values
      );


    inserted +=
      result.rowCount;


    console.log(
      `Inserted ${inserted}/${rows.length}`
    );
  }


  if (
    inserted !==
    EXPECTED_TOTAL
  ) {
    throw new Error(
      `Expected ${EXPECTED_TOTAL} inserts, got ${inserted}`
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
        AND counselling_type = 'JOSAA'
      GROUP BY round
      ORDER BY round
      `,
      [YEAR]
    );


  console.log(
    '\nROUND COUNTS'
  );

  console.table(
    roundResult.rows
  );


  const roundCounts =
    Object.fromEntries(
      roundResult.rows.map(
        row => [
          String(row.round),
          row.rows,
        ]
      )
    );


  for (
    const [
      round,
      expected
    ]
    of Object.entries(
      EXPECTED_ROUNDS
    )
  ) {

    if (
      roundCounts[round] !==
      expected
    ) {
      throw new Error(
        `Round ${round}: expected ${expected}, got ${roundCounts[round]}`
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | INTEGRITY
  |--------------------------------------------------------------------------
  */

  const integrity =
    await client.query(
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
        AND counselling_type = 'JOSAA'
      `,
      [YEAR]
    );


  console.log(
    '\nINTEGRITY'
  );

  console.table(
    integrity.rows
  );


  const state =
    integrity.rows[0];


  if (
    state.total_rows !==
      EXPECTED_TOTAL ||
    state.null_opening !==
      0 ||
    state.null_closing !==
      0
  ) {
    throw new Error(
      'Integrity verification failed.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | DUPLICATES
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
          gender
        FROM cutoffs
        WHERE year = $1
          AND counselling_type = 'JOSAA'
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


  if (
    duplicates.rows[0]
      .duplicate_groups !==
    0
  ) {
    throw new Error(
      'Duplicate identity verification failed.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SOURCE VERIFY
  |--------------------------------------------------------------------------
  */

  const sourceAudit =
    await client.query(
      `
      SELECT
        source_label,
        verification_status,
        is_verified,
        counselling_type,
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE year = $1
        AND counselling_type = 'JOSAA'
      GROUP BY
        source_label,
        verification_status,
        is_verified,
        counselling_type
      `,
      [YEAR]
    );


  console.log(
    '\nSOURCE AUDIT'
  );

  console.table(
    sourceAudit.rows
  );


  if (
    sourceAudit.rows.length !== 1 ||
    sourceAudit.rows[0].rows !==
      EXPECTED_TOTAL ||
    sourceAudit.rows[0].source_label !==
      'Official JoSAA 2025 OR-CR Archive' ||
    sourceAudit.rows[0].verification_status !==
      'VERIFIED' ||
    sourceAudit.rows[0].is_verified !==
      true ||
    sourceAudit.rows[0].counselling_type !==
      'JOSAA'
  ) {
    throw new Error(
      'Source verification failed.'
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
    '\nJOSAA 2025 REPLACEMENT COMMITTED'
  );


  /*
  |--------------------------------------------------------------------------
  | POST-COMMIT VERIFY
  |--------------------------------------------------------------------------
  */

  const finalCheck =
    await client.query(
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
        AND counselling_type = 'JOSAA'
      `,
      [YEAR]
    );


  console.log(
    '\nPOST-COMMIT STATE'
  );

  console.table(
    finalCheck.rows
  );


  if (
    finalCheck.rows[0]
      .total_rows !==
      EXPECTED_TOTAL ||
    finalCheck.rows[0]
      .null_opening !==
      0 ||
    finalCheck.rows[0]
      .null_closing !==
      0
  ) {
    throw new Error(
      'Post-commit verification failed.'
    );
  }


  console.log(
    '\n========================================'
  );

  console.log(
    'JOSAA 2025 OFFICIAL REPLACEMENT PASSED'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Final JoSAA 2025 rows:',
    finalCheck.rows[0]
      .total_rows
  );

  console.log(
    'Null opening:',
    finalCheck.rows[0]
      .null_opening
  );

  console.log(
    'Null closing:',
    finalCheck.rows[0]
      .null_closing
  );

  console.log(
    'Backup:',
    backupFile
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
        '\nROLLBACK completed.'
      );

    } catch (
      rollbackError
    ) {

      console.error(
        'ROLLBACK ERROR:',
        rollbackError
      );
    }
  }

  throw error;


} finally {

  client.release();

  await pool.end();
}