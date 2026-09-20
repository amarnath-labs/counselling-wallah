import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const MAP_FILE =
  './csab-2026-import-map.json';

const EXPECTED_ROWS =
  11793;

const COUNSELLING_TYPE =
  'CSAB_SPECIAL';

const SOURCE_LABEL =
  'Official CSAB Special 2026 OR-CR';


if (!fs.existsSync(MAP_FILE)) {
  throw new Error(
    `Missing ${MAP_FILE}`
  );
}


const data =
  JSON.parse(
    fs.readFileSync(
      MAP_FILE,
      'utf8'
    )
  );


const rows =
  data.mappedRows;


if (!Array.isArray(rows)) {
  throw new Error(
    'mappedRows missing.'
  );
}


if (
  rows.length !==
  EXPECTED_ROWS
) {
  throw new Error(
    `Expected ${EXPECTED_ROWS}, got ${rows.length}`
  );
}


const client =
  await pool.connect();


try {

  console.log(
    '\n========================================'
  );

  console.log(
    'CSAB 2026 INSERT ROLLBACK REHEARSAL'
  );

  console.log(
    '========================================'
  );


  /*
  |--------------------------------------------------------------------------
  | CORRECT EXISTING-DATA CHECK
  |--------------------------------------------------------------------------
  */

  const existing =
    await client.query(
      `
      SELECT
        round,
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE
        year = 2026
        AND counselling_type = $1
      GROUP BY round
      ORDER BY round
      `,
      [
        COUNSELLING_TYPE,
      ]
    );


  console.log(
    '\nEXISTING CSAB_SPECIAL 2026'
  );


  if (existing.rows.length) {
    console.table(
      existing.rows
    );
  } else {
    console.log(
      '0 existing rows.'
    );
  }


  const existingTotal =
    existing.rows.reduce(
      (sum, row) =>
        sum + Number(row.rows),
      0
    );


  console.log(
    'Existing total:',
    existingTotal
  );


  if (existingTotal !== 0) {
    throw new Error(
      `Existing CSAB_SPECIAL 2026 rows detected: ${existingTotal}. Rehearsal aborted.`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | BEGIN TRANSACTION
  |--------------------------------------------------------------------------
  */

  await client.query(
    'BEGIN'
  );


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
        index * 13;


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
          $${base + 13}
        )`
      );


      values.push(
        Number(row.branchId),
        2026,
        String(row.round),
        row.seatType,
        row.quota,
        row.gender,
        row.closingRankNumeric,
        SOURCE_LABEL,
        true,
        row.sourceUrl,
        'VERIFIED',
        COUNSELLING_TYPE,
        row.openingRankNumeric
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
          verification_status,
          counselling_type,
          opening_rank
        )
        VALUES
          ${placeholders.join(',')}
        RETURNING id
        `,
        values
      );


    inserted +=
      result.rowCount;


    console.log(
      `Inserted in transaction: ${inserted}/${rows.length}`
    );
  }


  /*
  |--------------------------------------------------------------------------
  | TRANSACTION AUDIT
  |--------------------------------------------------------------------------
  */

  const countResult =
    await client.query(
      `
      SELECT
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE
        year = 2026
        AND counselling_type = $1
      `,
      [
        COUNSELLING_TYPE,
      ]
    );


  const transactionTotal =
    countResult.rows[0].rows;


  const rounds =
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
        )::int AS null_closing
      FROM cutoffs
      WHERE
        year = 2026
        AND counselling_type = $1
      GROUP BY round
      ORDER BY round
      `,
      [
        COUNSELLING_TYPE,
      ]
    );


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
          year = 2026
          AND counselling_type = $1
        GROUP BY
          branch_id,
          year,
          round,
          category,
          quota,
          gender,
          counselling_type
        HAVING COUNT(*) > 1
      ) duplicate_groups
      `,
      [
        COUNSELLING_TYPE,
      ]
    );


  console.log(
    '\nTRANSACTION ROUND AUDIT'
  );

  console.table(
    rounds.rows
  );


  console.log(
    '\nTransaction total:',
    transactionTotal
  );

  console.log(
    'Duplicate identity groups:',
    duplicates.rows[0].duplicate_groups
  );


  if (
    transactionTotal !==
    EXPECTED_ROWS
  ) {
    throw new Error(
      `Expected ${EXPECTED_ROWS} transaction rows, got ${transactionTotal}`
    );
  }


  const expectedRounds = {
    '1': 7199,
    '2': 4594,
  };


  for (
    const row
    of rounds.rows
  ) {

    const expected =
      expectedRounds[
        String(row.round)
      ];


    if (
      Number(row.rows) !==
      expected
    ) {
      throw new Error(
        `Round ${row.round}: expected ${expected}, got ${row.rows}`
      );
    }


    if (
      Number(row.null_opening) !== 0 ||
      Number(row.null_closing) !== 0
    ) {
      throw new Error(
        `Null ranks detected in Round ${row.round}`
      );
    }
  }


  if (
    Number(
      duplicates.rows[0]
        .duplicate_groups
    ) !== 0
  ) {
    throw new Error(
      'Duplicate identity groups detected.'
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


  const afterRollback =
    await client.query(
      `
      SELECT
        COUNT(*)::int AS rows
      FROM cutoffs
      WHERE
        year = 2026
        AND counselling_type = $1
      `,
      [
        COUNSELLING_TYPE,
      ]
    );


  console.log(
    '\n========================================'
  );

  console.log(
    'ROLLBACK REHEARSAL PASSED'
  );

  console.log(
    '========================================'
  );

  console.log(
    'Inserted temporarily:',
    inserted
  );

  console.log(
    'Round 1 expected:',
    7199
  );

  console.log(
    'Round 2 expected:',
    4594
  );

  console.log(
    'Rows after rollback:',
    afterRollback.rows[0].rows
  );

  console.log(
    '\nDATABASE PERMANENTLY MODIFIED: NO'
  );


} catch (error) {

  try {
    await client.query(
      'ROLLBACK'
    );
  } catch {
    // ignore rollback failure
  }

  throw error;

} finally {

  client.release();

  await pool.end();
}