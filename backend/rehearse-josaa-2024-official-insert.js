import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const INPUT =
  './josaa-2024-import-map-final.json';

const YEAR =
  2024;

const EXPECTED_BEFORE =
  0;

const EXPECTED_TOTAL =
  55961;

const EXPECTED_ROUNDS = {
  '1': 11484,
  '2': 11190,
  '3': 11119,
  '4': 11093,
  '5': 11075,
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


console.log(
  '\n========================================'
);

console.log(
  'JOSAA 2024 OFFICIAL INSERT REHEARSAL'
);

console.log(
  '========================================\n'
);

console.log(
  'Input rows:',
  rows.length
);


const client =
  await pool.connect();

let transactionStarted =
  false;


try {

  /*
  |--------------------------------------------------------------------------
  | PRE-CHECK
  |--------------------------------------------------------------------------
  */

  const before =
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
      [YEAR]
    );


  console.log(
    'Existing JoSAA 2024 rows:',
    before.rows[0].rows
  );


  if (
    before.rows[0].rows !==
    EXPECTED_BEFORE
  ) {
    throw new Error(
      `Expected ${EXPECTED_BEFORE} existing rows, found ${before.rows[0].rows}`
    );
  }


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


  /*
  |--------------------------------------------------------------------------
  | RECHECK AFTER LOCK
  |--------------------------------------------------------------------------
  */

  const lockedCheck =
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
      [YEAR]
    );


  if (
    lockedCheck.rows[0].rows !==
    EXPECTED_BEFORE
  ) {
    throw new Error(
      `JoSAA 2024 state changed before insert. Found ${lockedCheck.rows[0].rows} rows.`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | INSERT
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
        'Official JoSAA 2024 OR-CR Archive',
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


  const actualRounds =
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
      actualRounds[round] !==
      expected
    ) {
      throw new Error(
        `Round ${round}: expected ${expected}, got ${actualRounds[round]}`
      );
    }
  }


  if (
    roundResult.rows.length !==
    Object.keys(
      EXPECTED_ROUNDS
    ).length
  ) {
    throw new Error(
      'Unexpected extra/missing JoSAA 2024 rounds.'
    );
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
      'Integrity validation failed.'
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
      'Duplicate identity validation failed.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SOURCE AUDIT
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
      'Official JoSAA 2024 OR-CR Archive' ||
    sourceAudit.rows[0].verification_status !==
      'VERIFIED' ||
    sourceAudit.rows[0].is_verified !==
      true ||
    sourceAudit.rows[0].counselling_type !==
      'JOSAA'
  ) {
    throw new Error(
      'Source audit failed.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | ALWAYS ROLLBACK
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


  /*
  |--------------------------------------------------------------------------
  | POST-ROLLBACK VERIFY
  |--------------------------------------------------------------------------
  */

  const after =
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
      [YEAR]
    );


  console.log(
    'Rows after rollback:',
    after.rows[0].rows
  );


  if (
    after.rows[0].rows !==
    EXPECTED_BEFORE
  ) {
    throw new Error(
      `Rollback verification failed. Expected ${EXPECTED_BEFORE}, found ${after.rows[0].rows}`
    );
  }


  console.log(
    '\n========================================'
  );

  console.log(
    'JOSAA 2024 INSERT REHEARSAL PASSED'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Official rows tested:',
    EXPECTED_TOTAL
  );

  console.log(
    'Duplicate identities: 0'
  );

  console.log(
    'Null opening ranks: 0'
  );

  console.log(
    'Null closing ranks: 0'
  );

  console.log(
    'Rows restored after rollback:',
    after.rows[0].rows
  );

  console.log(
    '\nDATABASE WAS NOT MODIFIED.'
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