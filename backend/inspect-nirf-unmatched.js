import 'dotenv/config';

import fs from 'node:fs/promises';
import { pool } from './src/db/pool.js';

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\bthe\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return new Set(
    normalize(value)
      .split(' ')
      .filter(Boolean)
  );
}

function similarity(a, b) {
  const aTokens = tokens(a);
  const bTokens = tokens(b);

  if (!aTokens.size || !bTokens.size) {
    return 0;
  }

  let common = 0;

  for (const token of aTokens) {
    if (bTokens.has(token)) {
      common++;
    }
  }

  const union = new Set([
    ...aTokens,
    ...bTokens
  ]).size;

  return union
    ? common / union
    : 0;
}

async function main() {
  console.log('');
  console.log('=======================================');
  console.log('NIRF UNMATCHED DATABASE INSPECTOR');
  console.log('=======================================');
  console.log('');

  const raw = await fs.readFile(
    './nirf-unmatched.json',
    'utf8'
  );

  const unmatched = JSON.parse(
    raw.replace(/^\uFEFF/, '')
  );

  const result = await pool.query(`
    SELECT
      id,
      name,
      city,
      state
    FROM colleges
    ORDER BY name
  `);

  const colleges = result.rows;

  console.log(
    'Unmatched NIRF rows:',
    unmatched.length
  );

  console.log(
    'Database colleges:',
    colleges.length
  );

  console.log('');

  const report = [];

  for (const row of unmatched) {
    const ranked = colleges
      .map((college) => ({
        id: college.id,
        name: college.name,
        city: college.city,
        state: college.state,

        score: similarity(
          row.college_name,
          college.name
        )
      }))
      .sort(
        (a, b) =>
          b.score - a.score
      )
      .slice(0, 5);

    report.push({
      nirf_rank:
        row.nirf_rank,

      nirf_name:
        row.college_name,

      nirf_city:
        row.city,

      nirf_state:
        row.state,

      candidates:
        ranked
    });
  }

  console.log(
    '---------------------------------------'
  );

  console.log(
    'TOP DATABASE CANDIDATES'
  );

  console.log(
    '---------------------------------------'
  );

  for (const item of report) {
    console.log('');
    console.log(
      `NIRF #${item.nirf_rank}: ${item.nirf_name}`
    );

    console.log(
      `Location: ${item.nirf_city}, ${item.nirf_state}`
    );

    console.table(
      item.candidates.map(
        (candidate) => ({
          score:
            candidate.score.toFixed(3),

          database_name:
            candidate.name,

          database_city:
            candidate.city,

          database_state:
            candidate.state,

          college_id:
            candidate.id
        })
      )
    );
  }

  await fs.writeFile(
    './nirf-unmatched-candidates.json',

    JSON.stringify(
      report,
      null,
      2
    ),

    'utf8'
  );

  console.log('');
  console.log(
    '[INSPECT] Report saved:'
  );

  console.log(
    './nirf-unmatched-candidates.json'
  );

  console.log('');
  console.log(
    'IMPORTANT: Database has NOT been modified.'
  );
}

main()
  .catch(
    (error) => {
      console.error(
        '[INSPECT] FAILED:',
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
