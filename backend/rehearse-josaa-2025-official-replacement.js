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
  'JOSAA 2025 OFFICIAL REPLACEMENT REHEARSAL'
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
  | BEFORE
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
    '\nExisting JoSAA 2025 rows:',
    before.rows[0].rows
  );


  if (
    before.rows[0].rows !==
    EXPECTED_OLD
  ) {
    throw new Error(
      `Expected ${EXPECTED_OLD} existing JoSAA 2025 rows, found ${before.rows[0].rows}`
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
    'Transaction started and cutoffs table locked.'
  );


  /*
  |--------------------------------------------------------------------------
  | DELETE OLD 2025 JOSAA
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
    '\nOld JoSAA 2025 rows deleted inside transaction:',
    deleted.rowCount
  );


  if (
    deleted.rowCount !==
    EXPECTED_OLD
  ) {
    throw new Error(
      `Expected to delete ${EXPECTED_OLD}, deleted ${deleted.rowCount}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | INSERT OFFICIAL ROWS
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
        2025,
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
  | ROUND VERIFY
  |--------------------------------------------------------------------------
  */

  const rounds =
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
    rounds.rows
  );


  const actualRounds =
    Object.fromEntries(
      rounds.rows.map(
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


  /*
  |--------------------------------------------------------------------------
  | TOTAL + NULL VERIFY
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


  const integrityRow =
    integrity.rows[0];


  if (
    integrityRow.total_rows !==
    EXPECTED_TOTAL ||
    integrityRow.null_opening !== 0 ||
    integrityRow.null_closing !== 0
  ) {
    throw new Error(
      'Total/null-rank verification failed.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | DUPLICATE IDENTITY VERIFY
  |--------------------------------------------------------------------------
  */

  const duplicateResult =
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


  const duplicateGroups =
    duplicateResult.rows[0]
      .duplicate_groups;


  console.log(
    '\nDuplicate identity groups:',
    duplicateGroups
  );


  if (
    duplicateGroups !== 0
  ) {
    throw new Error(
      `Duplicate identity groups found: ${duplicateGroups}`
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

  const restored =
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
    restored.rows[0].rows
  );


  if (
    restored.rows[0].rows !==
    EXPECTED_OLD
  ) {
    throw new Error(
      `Rollback verification failed. Expected ${EXPECTED_OLD}, got ${restored.rows[0].rows}`
    );
  }


  console.log(
    '\n========================================'
  );

  console.log(
    'JOSAA 2025 REPLACEMENT REHEARSAL PASSED'
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
    'Original DB rows restored:',
    restored.rows[0].rows
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