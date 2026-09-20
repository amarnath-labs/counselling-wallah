import 'dotenv/config';
import fs from 'node:fs/promises';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    SELECT DISTINCT
      q.college_id,
      c.name,
      c.city,
      c.state,
      c.website,
      q.nirf_rank,
      q.academic_year
    FROM college_quality_metrics q
    JOIN colleges c
      ON c.id = q.college_id
    WHERE q.academic_year = 2025
    ORDER BY
      q.nirf_rank NULLS LAST,
      c.name
  `);

  console.log('');
  console.log('=======================================');
  console.log('FEES TARGET COLLEGES');
  console.log('=======================================');
  console.log('');

  console.log(
    'Target colleges:',
    result.rows.length
  );

  console.table(
    result.rows.slice(0, 25)
  );

  await fs.writeFile(
    './fees-target-colleges.json',
    JSON.stringify(
      result.rows,
      null,
      2
    ),
    'utf8'
  );

  console.log('');
  console.log(
    'Saved: ./fees-target-colleges.json'
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
