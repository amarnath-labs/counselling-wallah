import 'dotenv/config';

import fs from 'node:fs/promises';

import { pool } from './src/db/pool.js';

const INPUT_FILE =
  './college-website-candidates-verified.json';

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('VERIFIED COLLEGE WEBSITE IMPORT');
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
      'Input JSON must contain an array'
    );
  }

  const verifiedRows =
    rows.filter(
      row =>
        row.candidate_url &&
        row.verification_status === 'verified'
    );

  console.log(
    '[WEBSITE IMPORT] Source rows:',
    rows.length
  );

  console.log(
    '[WEBSITE IMPORT] Verified rows:',
    verifiedRows.length
  );

  const client =
    await pool.connect();

  let updated = 0;
  let skipped = 0;

  try {
    await client.query('BEGIN');

    for (const row of verifiedRows) {
      const result =
        await client.query(
          `
            UPDATE colleges
            SET
              website = $1,
              updated_at = NOW()
            WHERE id = $2
          `,
          [
            row.candidate_url,
            row.college_id,
          ]
        );

      if (result.rowCount === 0) {
        console.warn(
          '[SKIP] College not found:',
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
    console.log('WEBSITE IMPORT SUMMARY');
    console.log('---------------------------------------');

    console.table([
      {
        status: 'Source rows',
        count: rows.length,
      },
      {
        status: 'Verified rows',
        count: verifiedRows.length,
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
      'Only colleges.website was modified.'
    );

    console.log(
      'NIRF data was NOT modified.'
    );

    console.log(
      'Placement data was NOT modified.'
    );

    console.log(
      'Recommendation logic was NOT modified.'
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
        '[WEBSITE IMPORT] FAILED:',
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
