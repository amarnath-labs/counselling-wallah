import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  console.log('');
  console.log('=======================================');
  console.log('NIRF DUPLICATE CLEANUP');
  console.log('=======================================');

  const before = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM college_quality_metrics
    WHERE
      source_label ILIKE '%NIRF%'
      OR source_url ILIKE '%nirfindia%'
  `);

  console.log(
    'NIRF rows before cleanup:',
    before.rows[0].count
  );

  const deleted = await pool.query(`
    DELETE FROM college_quality_metrics
    WHERE id IN (
      SELECT id
      FROM (
        SELECT
          id,
          ROW_NUMBER() OVER (
            PARTITION BY
              college_id,
              academic_year,
              nirf_rank
            ORDER BY
              retrieved_at DESC NULLS LAST,
              created_at DESC NULLS LAST,
              id DESC
          ) AS row_number
        FROM college_quality_metrics
        WHERE
          source_label ILIKE '%NIRF%'
          OR source_url ILIKE '%nirfindia%'
      ) duplicate_rows
      WHERE row_number > 1
    )
    RETURNING id
  `);

  console.log(
    'Duplicate rows deleted:',
    deleted.rowCount
  );

  const after = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM college_quality_metrics
    WHERE
      source_label ILIKE '%NIRF%'
      OR source_url ILIKE '%nirfindia%'
  `);

  console.log(
    'NIRF rows after cleanup:',
    after.rows[0].count
  );

  const duplicateCheck = await pool.query(`
    SELECT
      college_id,
      academic_year,
      nirf_rank,
      COUNT(*)::int AS copies
    FROM college_quality_metrics
    WHERE
      source_label ILIKE '%NIRF%'
      OR source_url ILIKE '%nirfindia%'
    GROUP BY
      college_id,
      academic_year,
      nirf_rank
    HAVING COUNT(*) > 1
    ORDER BY copies DESC
  `);

  console.log(
    'Duplicate groups remaining:',
    duplicateCheck.rowCount
  );

  if (duplicateCheck.rowCount > 0) {
    console.table(
      duplicateCheck.rows
    );
  }

  console.log('');
  console.log('NIRF cleanup complete.');
} catch (error) {
  console.error(
    'NIRF CLEANUP FAILED:',
    error.message
  );

  process.exitCode = 1;
} finally {
  await pool.end();
}
