import 'dotenv/config';
import fs from 'node:fs/promises';
import pg from 'pg';

const { Pool } = pg;

const IMPORT_FILE =
  './tmp/csab/import-prep/csab-import-ready.json';

const IMPORT_YEARS =
  new Set([
    2024,
    2025,
  ]);

const EXPECTED = {
  2024: 9734,
  2025: 13454,
};

const EXPECTED_NEW_TOTAL =
  23188;

const EXPECTED_2026 =
  11793;


const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.DB_URL;

if (!connectionString) {
  throw new Error(
    'Database connection string not found.'
  );
}


const pool =
  new Pool({
    connectionString,

    ssl:
      connectionString.includes('localhost') ||
      connectionString.includes('127.0.0.1')
        ? false
        : {
            rejectUnauthorized: false,
          },
  });


function chunk(
  rows,
  size
) {

  const result =
    [];

  for (
    let index = 0;
    index < rows.length;
    index += size
  ) {

    result.push(
      rows.slice(
        index,
        index + size
      )
    );
  }

  return result;
}


async function main() {

  const allRows =
    JSON.parse(
      await fs.readFile(
        IMPORT_FILE,
        'utf8'
      )
    );


  const rows =
    allRows.filter(
      row =>
        IMPORT_YEARS.has(
          Number(row.year)
        )
    );


  console.log(
    '\n========================================'
  );

  console.log(
    'CSAB HISTORICAL IMPORT'
  );

  console.log(
    '2024 + 2025 ONLY'
  );

  console.log(
    '========================================'
  );


  console.log(
    'Import candidates:',
    rows.length
  );


  if (
    rows.length !==
    EXPECTED_NEW_TOTAL
  ) {

    throw new Error(
      `Expected ${EXPECTED_NEW_TOTAL} rows but file contains ${rows.length}`
    );
  }


  const sourceCounts =
    rows.reduce(
      (acc, row) => {

        const year =
          Number(row.year);

        acc[year] =
          (
            acc[year] || 0
          ) + 1;

        return acc;
      },
      {}
    );


  console.log(
    '\n===== SOURCE COUNTS ====='
  );

  console.table(
    sourceCounts
  );


  for (
    const [year, expected]
    of Object.entries(
      EXPECTED
    )
  ) {

    if (
      Number(
        sourceCounts[year] || 0
      ) !==
      expected
    ) {

      throw new Error(
        `Source count mismatch for ${year}`
      );
    }
  }


  const client =
    await pool.connect();


  try {

    /*
    |--------------------------------------------------------------------------
    | PRE-FLIGHT: verify ID has automatic default
    |--------------------------------------------------------------------------
    */

    const idDefaultResult =
      await client.query(
        `
        SELECT column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'cutoffs'
          AND column_name = 'id'
        `
      );


    const idDefault =
      idDefaultResult.rows[0]
        ?.column_default;


    console.log(
      '\nCutoff ID default:',
      idDefault
    );


    if (!idDefault) {

      throw new Error(
        'cutoffs.id has no automatic default. Import stopped before any DB change.'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | PRE-FLIGHT: existing CSAB state
    |--------------------------------------------------------------------------
    */

    const beforeResult =
      await client.query(
        `
        SELECT
          year,
          round,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year IN (
            2024,
            2025,
            2026
          )
        GROUP BY
          year,
          round
        ORDER BY
          year,
          round
        `
      );


    console.log(
      '\n===== BEFORE IMPORT ====='
    );

    console.table(
      beforeResult.rows
    );


    const historicalExisting =
      await client.query(
        `
        SELECT COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year IN (
            2024,
            2025
          )
        `
      );


    const oldHistoricalCount =
      historicalExisting.rows[0]
        .rows;


    if (
      oldHistoricalCount !== 0
    ) {

      throw new Error(
        `Safety stop: database already contains ${oldHistoricalCount} CSAB_SPECIAL rows for 2024/2025.`
      );
    }


    const existing2026Result =
      await client.query(
        `
        SELECT COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year = 2026
        `
      );


    const existing2026 =
      existing2026Result.rows[0]
        .rows;


    if (
      existing2026 !==
      EXPECTED_2026
    ) {

      throw new Error(
        `Safety stop: expected ${EXPECTED_2026} existing 2026 rows, found ${existing2026}.`
      );
    }


    /*
    |--------------------------------------------------------------------------
    | BEGIN ONE TRANSACTION
    |--------------------------------------------------------------------------
    */

    await client.query(
      'BEGIN'
    );


    console.log(
      '\nTransaction started.'
    );


    let inserted =
      0;


    const batches =
      chunk(
        rows,
        500
      );


    for (
      let batchIndex = 0;
      batchIndex < batches.length;
      batchIndex++
    ) {

      const batch =
        batches[batchIndex];


      const values =
        [];


      const placeholders =
        [];


      for (
        let index = 0;
        index < batch.length;
        index++
      ) {

        const row =
          batch[index];


        const offset =
          values.length;


        values.push(
          row.branch_id,
          row.year,
          row.round,
          row.category,
          row.quota,
          row.gender,
          row.closing_rank,
          row.source_label,
          true,
          row.source_url,
          'VERIFIED',
          'CSAB_SPECIAL',
          row.opening_rank
        );


        placeholders.push(
          `(
            $${offset + 1},
            $${offset + 2},
            $${offset + 3},
            $${offset + 4},
            $${offset + 5},
            $${offset + 6},
            $${offset + 7},
            $${offset + 8},
            $${offset + 9},
            $${offset + 10},
            NOW(),
            $${offset + 11},
            $${offset + 12},
            $${offset + 13}
          )`
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
          ON CONFLICT (
            branch_id,
            year,
            round,
            category,
            quota,
            gender,
            counselling_type
          )
          DO NOTHING
          RETURNING id
          `,
          values
        );


      inserted +=
        result.rowCount;


      console.log(
        `Batch ${batchIndex + 1}/${batches.length}: inserted ${result.rowCount}`
      );
    }


    console.log(
      '\nInserted inside transaction:',
      inserted
    );


    /*
    |--------------------------------------------------------------------------
    | STRICT INSERT COUNT
    |--------------------------------------------------------------------------
    */

    if (
      inserted !==
      EXPECTED_NEW_TOTAL
    ) {

      throw new Error(
        `Insert count mismatch. Expected ${EXPECTED_NEW_TOTAL}, inserted ${inserted}. Transaction will rollback.`
      );
    }


    /*
    |--------------------------------------------------------------------------
    | VERIFY INSIDE TRANSACTION
    |--------------------------------------------------------------------------
    */

    const verifyResult =
      await client.query(
        `
        SELECT
          year,
          round,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year IN (
            2024,
            2025,
            2026
          )
        GROUP BY
          year,
          round
        ORDER BY
          year,
          round
        `
      );


    console.log(
      '\n===== VERIFY BEFORE COMMIT ====='
    );

    console.table(
      verifyResult.rows
    );


    const yearTotalsResult =
      await client.query(
        `
        SELECT
          year,
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year IN (
            2024,
            2025,
            2026
          )
        GROUP BY year
        ORDER BY year
        `
      );


    console.log(
      '\n===== YEAR TOTALS ====='
    );

    console.table(
      yearTotalsResult.rows
    );


    const yearTotals =
      new Map(
        yearTotalsResult.rows.map(
          row => [
            Number(row.year),
            Number(row.rows),
          ]
        )
      );


    if (
      yearTotals.get(2024) !==
        EXPECTED[2024] ||
      yearTotals.get(2025) !==
        EXPECTED[2025] ||
      yearTotals.get(2026) !==
        EXPECTED_2026
    ) {

      throw new Error(
        'Post-insert year totals do not match expected values.'
      );
    }


    /*
    |--------------------------------------------------------------------------
    | FINAL TOTAL
    |--------------------------------------------------------------------------
    */

    const totalResult =
      await client.query(
        `
        SELECT
          COUNT(*)::integer AS rows
        FROM cutoffs
        WHERE counselling_type =
          'CSAB_SPECIAL'
          AND year IN (
            2024,
            2025,
            2026
          )
        `
      );


    const total =
      totalResult.rows[0]
        .rows;


    if (
      total !==
      34981
    ) {

      throw new Error(
        `Final 3-year total mismatch: ${total}`
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


    console.log(
      '\n========================================'
    );

    console.log(
      'CSAB IMPORT COMMITTED SUCCESSFULLY'
    );

    console.log(
      '========================================'
    );

    console.log(
      '2024:',
      EXPECTED[2024]
    );

    console.log(
      '2025:',
      EXPECTED[2025]
    );

    console.log(
      '2026 preserved:',
      EXPECTED_2026
    );

    console.log(
      '3-year total:',
      total
    );


  } catch (error) {

    try {

      await client.query(
        'ROLLBACK'
      );

    } catch {
      // Transaction may not have started.
    }


    console.error(
      '\n========================================'
    );

    console.error(
      'IMPORT NOT COMMITTED / ROLLED BACK'
    );

    console.error(
      '========================================'
    );


    throw error;

  } finally {

    client.release();

    await pool.end();
  }
}


main().catch(
  error => {

    console.error(
      '\nCSAB IMPORT FAILED'
    );

    console.error(
      error
    );

    process.exitCode = 1;
  }
);
