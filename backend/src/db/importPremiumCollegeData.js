import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from './pool.js';

/*
|--------------------------------------------------------------------------
| LOAD JSON
|--------------------------------------------------------------------------
|
| Handles:
| - UTF-8 BOM
| - Empty files
| - Normal JSON arrays
|
|--------------------------------------------------------------------------
*/

async function loadJson(filePath) {
  const absolutePath =
    path.resolve(
      process.cwd(),
      filePath
    );

  let raw =
    await fs.readFile(
      absolutePath,
      'utf8'
    );

  // Remove UTF-8 BOM if present.
  raw =
    raw.replace(
      /^\uFEFF/,
      ''
    );

  // Remove accidental leading/trailing whitespace.
  raw =
    raw.trim();

  if (!raw) {
    throw new Error(
      'Input JSON file is empty.'
    );
  }

  return JSON.parse(raw);
}

/*
|--------------------------------------------------------------------------
| INSERT QUALITY DATA
|--------------------------------------------------------------------------
*/

async function insertQuality(
  client,
  row
) {
  await client.query(
    `
    INSERT INTO college_quality_metrics (
      college_id,
      nirf_rank,
      nirf_score,
      accreditation,
      median_package,
      average_package,
      highest_package,
      placement_rate,
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
      $8,
      $9,
      $10,
      $11,
      $12,
      NOW()
    )
    `,
    [
      row.college_id,
      row.nirf_rank ?? null,
      row.nirf_score ?? null,
      row.accreditation ?? null,
      row.median_package ?? null,
      row.average_package ?? null,
      row.highest_package ?? null,
      row.placement_rate ?? null,
      row.academic_year ?? null,
      row.source_label ?? null,
      row.source_url ?? null,
      row.verification_status ?? 'pending',
    ]
  );
}

/*
|--------------------------------------------------------------------------
| INSERT FEES DATA
|--------------------------------------------------------------------------
*/

async function insertFees(
  client,
  row
) {
  await client.query(
    `
    INSERT INTO college_fees (
      college_id,
      tuition_fee,
      hostel_fee,
      other_fee,
      total_annual_fee,
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
      $8,
      $9,
      NOW()
    )
    `,
    [
      row.college_id,
      row.tuition_fee ?? null,
      row.hostel_fee ?? null,
      row.other_fee ?? null,
      row.total_annual_fee ?? null,
      row.academic_year ?? null,
      row.source_label ?? null,
      row.source_url ?? null,
      row.verification_status ?? 'pending',
    ]
  );
}

/*
|--------------------------------------------------------------------------
| MAIN IMPORT
|--------------------------------------------------------------------------
*/

async function main() {
  const filePath =
    process.argv[2];

  if (!filePath) {
    console.error(
      'Usage: node src/db/importPremiumCollegeData.js <json-file>'
    );

    process.exit(1);
  }

  console.log(
    '[PREMIUM IMPORT] Input file:',
    filePath
  );

  /*
  |--------------------------------------------------------------------------
  | LOAD DATA
  |--------------------------------------------------------------------------
  */

  const data =
    await loadJson(
      filePath
    );

  if (
    !Array.isArray(
      data
    )
  ) {
    throw new Error(
      'Input JSON must be an array.'
    );
  }

  console.log(
    '[PREMIUM IMPORT] Rows found:',
    data.length
  );

  /*
  |--------------------------------------------------------------------------
  | DATABASE CONNECTION
  |--------------------------------------------------------------------------
  */

  const client =
    await pool.connect();

  let qualityCount = 0;
  let feesCount = 0;
  let skippedCount = 0;

  try {
    await client.query(
      'BEGIN'
    );

    /*
    |--------------------------------------------------------------------------
    | PROCESS EACH ROW
    |--------------------------------------------------------------------------
    */

    for (
      const row
      of data
    ) {
      const collegeId =
        Number(
          row?.college_id
        );

      /*
      |--------------------------------------------------------------------------
      | INVALID COLLEGE ID
      |--------------------------------------------------------------------------
      */

      if (
        !Number.isFinite(
          collegeId
        ) ||
        collegeId <= 0
      ) {
        console.warn(
          '[PREMIUM IMPORT] Skipping row with invalid college_id:',
          row?.college_id
        );

        skippedCount++;

        continue;
      }

      /*
      |--------------------------------------------------------------------------
      | QUALITY DATA AVAILABLE?
      |--------------------------------------------------------------------------
      */

      const hasQuality =
        row.nirf_rank != null ||
        row.nirf_score != null ||
        row.accreditation != null ||
        row.median_package != null ||
        row.average_package != null ||
        row.highest_package != null ||
        row.placement_rate != null;

      /*
      |--------------------------------------------------------------------------
      | FEES DATA AVAILABLE?
      |--------------------------------------------------------------------------
      */

      const hasFees =
        row.tuition_fee != null ||
        row.hostel_fee != null ||
        row.other_fee != null ||
        row.total_annual_fee != null;

      /*
      |--------------------------------------------------------------------------
      | INSERT QUALITY
      |--------------------------------------------------------------------------
      */

      if (
        hasQuality
      ) {
        await insertQuality(
          client,
          {
            ...row,

            college_id:
              collegeId,
          }
        );

        qualityCount++;
      }

      /*
      |--------------------------------------------------------------------------
      | INSERT FEES
      |--------------------------------------------------------------------------
      */

      if (
        hasFees
      ) {
        await insertFees(
          client,
          {
            ...row,

            college_id:
              collegeId,
          }
        );

        feesCount++;
      }

      /*
      |--------------------------------------------------------------------------
      | NO PREMIUM DATA
      |--------------------------------------------------------------------------
      */

      if (
        !hasQuality &&
        !hasFees
      ) {
        console.warn(
          '[PREMIUM IMPORT] No premium data found for college_id:',
          collegeId
        );

        skippedCount++;
      }
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
      ''
    );

    console.log(
      'Premium data import complete.'
    );

    console.log(
      'Quality rows:',
      qualityCount
    );

    console.log(
      'Fee rows:',
      feesCount
    );

    console.log(
      'Skipped rows:',
      skippedCount
    );
  } catch (error) {
    /*
    |--------------------------------------------------------------------------
    | ROLLBACK
    |--------------------------------------------------------------------------
    */

    await client.query(
      'ROLLBACK'
    );

    console.error(
      'Premium data import failed:',
      error.message
    );

    process.exitCode = 1;
  } finally {
    /*
    |--------------------------------------------------------------------------
    | CLEANUP
    |--------------------------------------------------------------------------
    */

    client.release();

    await pool.end();
  }
}

/*
|--------------------------------------------------------------------------
| RUN
|--------------------------------------------------------------------------
*/

main().catch(
  (error) => {
    console.error(
      'Premium importer crashed:',
      error.message
    );

    process.exitCode = 1;
  }
);