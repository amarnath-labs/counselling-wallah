import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';

import { pool } from './src/db/pool.js';

const INPUT_FILE =
  path.resolve(
    process.cwd(),
    'nirf-placement-raw.json'
  );

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('NIRF PLACEMENT IMPORT');
  console.log('=======================================');
  console.log('');

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
      'nirf-placement-raw.json must contain an array'
    );
  }

  console.log(
    '[IMPORT] Source rows:',
    rows.length
  );

  const client =
    await pool.connect();

  let updated = 0;
  let skipped = 0;

  try {
    await client.query('BEGIN');

    for (const row of rows) {
      if (
        !row.college_id ||
        !row.median_salary
      ) {
        skipped++;
        continue;
      }

      const placementRate =
        row.placement_rate_raw ?? null;

      const result =
        await client.query(
          `
          UPDATE college_quality_metrics
          SET
            median_package = $1,
            placement_rate = $2,
            source_label = $3,
            source_url = $4,
            verification_status = 'verified',
            retrieved_at = NOW()
          WHERE college_id = $5
            AND academic_year = 2025
          `,
          [
            row.median_salary,
            placementRate,
            'NIRF 2025 Engineering Institution PDF',
            row.source_url ?? null,
            row.college_id,
          ]
        );

      if (result.rowCount === 0) {
        console.warn(
          '[SKIP] No quality row found:',
          row.college_id
        );

        skipped++;
        continue;
      }

      updated++;
    }

    await client.query('COMMIT');

    console.log('');
    console.log('---------------------------------------');
    console.log('PLACEMENT IMPORT SUMMARY');
    console.log('---------------------------------------');

    console.table([
      {
        status: 'Source rows',
        count: rows.length,
      },
      {
        status: 'Updated',
        count: updated,
      },
      {
        status: 'Skipped',
        count: skipped,
      },
    ]);

    console.log('');
    console.log(
      'Existing NIRF rank/score preserved.'
    );

    console.log(
      'Average/highest package not modified.'
    );

    console.log(
      'Recommendation logic not modified.'
    );
  } catch (error) {
    await client.query('ROLLBACK');

    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch(
    (error) => {
      console.error(
        '[IMPORT] FAILED:',
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
