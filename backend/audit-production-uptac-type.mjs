import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const distinct = await pool.query(`
    SELECT
      counselling_type,
      COUNT(*)::int AS count
    FROM cutoffs
    WHERE LOWER(COALESCE(counselling_type, '')) = 'uptac'
    GROUP BY counselling_type
    ORDER BY count DESC
  `);

  console.log('COUNSELLING TYPE VALUES:');
  console.table(distinct.rows);

  const exactUpper = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM cutoffs co
    INNER JOIN branches b
      ON b.id = co.branch_id
    INNER JOIN colleges c
      ON c.id = b.college_id
    WHERE
      co.year = 2025
      AND co.round = '1'
      AND co.category = 'OPEN'
      AND co.closing_rank >= 50000
      AND co.counselling_type = 'UPTAC'
      AND co.verification_status = 'VERIFIED'
      AND co.is_verified = true
  `);

  const caseInsensitive = await pool.query(`
    SELECT COUNT(*)::int AS count
    FROM cutoffs co
    INNER JOIN branches b
      ON b.id = co.branch_id
    INNER JOIN colleges c
      ON c.id = b.college_id
    WHERE
      co.year = 2025
      AND co.round = '1'
      AND co.category = 'OPEN'
      AND co.closing_rank >= 50000
      AND LOWER(COALESCE(co.counselling_type, '')) = 'uptac'
      AND co.verification_status = 'VERIFIED'
      AND co.is_verified = true
  `);

  console.log(
    'EXACT UPPERCASE:',
    exactUpper.rows[0].count
  );

  console.log(
    'CASE INSENSITIVE:',
    caseInsensitive.rows[0].count
  );

} finally {
  await pool.end();
}
