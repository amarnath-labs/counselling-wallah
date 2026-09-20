import 'dotenv/config';

import fs from 'node:fs/promises';
import { pool } from './src/db/pool.js';

function looksSuspicious(value) {
  const text = String(value || '').trim();

  if (!text) {
    return false;
  }

  return (
    text.includes('@') ||
    text.includes(';') ||
    text.includes('http://') ||
    text.includes('https://') ||
    text.length > 80
  );
}

try {
  const result = await pool.query(`
    SELECT
      q.college_id,
      c.name,
      c.city,
      c.state,
      c.website,
      q.nirf_rank
    FROM college_quality_metrics q
    JOIN colleges c
      ON c.id = q.college_id
    WHERE q.academic_year = 2025
    ORDER BY
      q.nirf_rank NULLS LAST,
      c.name
  `);

  const rows = result.rows;

  const websiteMissing =
    rows.filter(
      row => !row.website
    );

  const suspicious =
    rows.filter(
      row =>
        looksSuspicious(row.city) ||
        looksSuspicious(row.state)
    );

  console.log('');
  console.log('=======================================');
  console.log('FEES TARGET METADATA AUDIT');
  console.log('=======================================');

  console.table([
    {
      metric: 'Target colleges',
      count: rows.length,
    },
    {
      metric: 'Website available',
      count:
        rows.filter(row => row.website).length,
    },
    {
      metric: 'Website missing',
      count: websiteMissing.length,
    },
    {
      metric: 'Suspicious city/state',
      count: suspicious.length,
    },
  ]);

  console.log('');
  console.log('SUSPICIOUS METADATA');
  console.table(suspicious);

  await fs.writeFile(
    './fees-metadata-audit.json',
    JSON.stringify(
      {
        total: rows.length,
        website_missing: websiteMissing,
        suspicious_metadata: suspicious,
      },
      null,
      2
    ),
    'utf8'
  );

  console.log('');
  console.log(
    'Saved: ./fees-metadata-audit.json'
  );

  console.log(
    'DATABASE HAS NOT BEEN MODIFIED.'
  );

} catch (error) {
  console.error(
    'FAILED:',
    error.message
  );

  process.exitCode = 1;
} finally {
  await pool.end();
}
