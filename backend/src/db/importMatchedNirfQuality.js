import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';

import { pool } from './pool.js';


/*
|--------------------------------------------------------------------------
| VERIFIED MATCHED NIRF -> QUALITY IMPORTER
|--------------------------------------------------------------------------
|
| INPUT:
|   nirf-full-matched.json
|
| WRITES ONLY:
|   college_quality_metrics
|
| UPDATES ONLY:
|   nirf_rank
|   nirf_score
|   academic_year
|   source_label
|   source_url
|   verification_status
|   retrieved_at
|
| DOES NOT TOUCH:
|   accreditation
|   median_package
|   average_package
|   highest_package
|   placement_rate
|
| DOES NOT MODIFY:
|   recommendation logic
|   cutoff logic
|   colleges
|   branches
|   fees
|   reviews
|   frontend
|
*/


const INPUT_FILE =
  path.resolve(
    process.cwd(),
    'nirf-full-matched.json'
  );


async function readInput() {
  console.log(
    '[NIRF QUALITY] Reading:',
    INPUT_FILE
  );

  const raw =
    await fs.readFile(
      INPUT_FILE,
      'utf8'
    );

  const rows =
    JSON.parse(
      raw.replace(/^\uFEFF/, '')
    );

  if (!Array.isArray(rows)) {
    throw new Error(
      'Input JSON must contain an array.'
    );
  }

  return rows;
}


function validateRow(row) {
  if (!row.college_id) {
    return false;
  }

  if (!row.academic_year) {
    return false;
  }

  if (
    row.match_type !== 'exact' &&
    row.match_type !== 'verified_alias' &&
    row.match_type !== 'safe_fuzzy_location'
  ) {
    return false;
  }

  return true;
}


async function findExisting(
  client,
  collegeId,
  academicYear
) {
  const result =
    await client.query(
      `
        SELECT
          id,
          college_id,
          academic_year
        FROM college_quality_metrics
        WHERE college_id = $1
          AND academic_year = $2
        ORDER BY id ASC
      `,
      [
        collegeId,
        academicYear,
      ]
    );

  return result.rows;
}


async function updateExisting(
  client,
  id,
  row
) {
  await client.query(
    `
      UPDATE college_quality_metrics
      SET
        nirf_rank = $1,
        nirf_score = $2,
        source_label = $3,
        source_url = $4,
        verification_status = $5,
        retrieved_at = NOW()
      WHERE id = $6
    `,
    [
      row.nirf_rank ?? null,
      row.nirf_score ?? null,
      row.source_label ??
        'NIRF 2025 Engineering',
      row.source_url ?? null,
      'verified',
      id,
    ]
  );
}


async function insertNew(
  client,
  row
) {
  await client.query(
    `
      INSERT INTO college_quality_metrics (
        college_id,
        nirf_rank,
        nirf_score,
        academic_year,
        source_label,
        source_url,
        verification_status,
        retrieved_at
      )
      VALUES (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        NOW()
      )
    `,
    [
      row.college_id,
      row.nirf_rank ?? null,
      row.nirf_score ?? null,
      row.academic_year,
      row.source_label ??
        'NIRF 2025 Engineering',
      row.source_url ?? null,
      'verified',
    ]
  );
}


async function main() {
  console.log('');
  console.log(
    '======================================='
  );
  console.log(
    'VERIFIED NIRF QUALITY IMPORT'
  );
  console.log(
    '======================================='
  );
  console.log('');

  const rows =
    await readInput();

  console.log(
    '[NIRF QUALITY] Source rows:',
    rows.length
  );

  const validRows =
    rows.filter(validateRow);

  console.log(
    '[NIRF QUALITY] Safe rows:',
    validRows.length
  );

  const client =
    await pool.connect();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let existingDuplicateGroups = 0;

  try {
    await client.query('BEGIN');

    for (const row of validRows) {
      /*
      |--------------------------------------------------------------------------
      | VERIFY COLLEGE STILL EXISTS
      |--------------------------------------------------------------------------
      */

      const collegeCheck =
        await client.query(
          `
            SELECT id
            FROM colleges
            WHERE id = $1
            LIMIT 1
          `,
          [row.college_id]
        );

      if (
        collegeCheck.rowCount === 0
      ) {
        console.warn(
          '[SKIP] College not found:',
          row.college_id
        );

        skipped++;
        continue;
      }


      /*
      |--------------------------------------------------------------------------
      | FIND EXISTING QUALITY ROW
      |--------------------------------------------------------------------------
      */

      const existing =
        await findExisting(
          client,
          row.college_id,
          row.academic_year
        );


      /*
      |--------------------------------------------------------------------------
      | INSERT
      |--------------------------------------------------------------------------
      */

      if (
        existing.length === 0
      ) {
        await insertNew(
          client,
          row
        );

        inserted++;
        continue;
      }


      /*
      |--------------------------------------------------------------------------
      | UPDATE EXISTING
      |--------------------------------------------------------------------------
      |
      | If old duplicates already exist, we DO NOT delete them automatically.
      | We update only the oldest row and report the duplicate group.
      |
      */

      if (
        existing.length > 1
      ) {
        existingDuplicateGroups++;

        console.warn(
          '[WARNING] Existing duplicate quality rows:',
          row.college_id,
          row.academic_year,
          'count =',
          existing.length
        );
      }

      await updateExisting(
        client,
        existing[0].id,
        row
      );

      updated++;
    }


    /*
    |--------------------------------------------------------------------------
    | COMMIT
    |--------------------------------------------------------------------------
    */

    await client.query(
      'COMMIT'
    );


    console.log('');
    console.log(
      '---------------------------------------'
    );
    console.log(
      'NIRF QUALITY IMPORT SUMMARY'
    );
    console.log(
      '---------------------------------------'
    );

    console.table([
      {
        status: 'Source matched',
        count: rows.length,
      },
      {
        status: 'Safe processed',
        count: validRows.length,
      },
      {
        status: 'Inserted',
        count: inserted,
      },
      {
        status: 'Updated',
        count: updated,
      },
      {
        status: 'Skipped',
        count: skipped,
      },
      {
        status:
          'Existing duplicate groups',
        count:
          existingDuplicateGroups,
      },
    ]);

    console.log('');
    console.log(
      'NIRF quality import complete.'
    );

    console.log(
      'Recommendation logic was NOT modified.'
    );

    console.log(
      'Cutoff logic was NOT modified.'
    );
  } catch (error) {
    await client.query(
      'ROLLBACK'
    );

    throw error;
  } finally {
    client.release();
  }
}


main()
  .catch(
    (error) => {
      console.error(
        '[NIRF QUALITY] FAILED:',
        error.message
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await pool.end();
    }
  );