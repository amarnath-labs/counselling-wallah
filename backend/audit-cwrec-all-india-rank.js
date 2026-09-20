import { pool } from './src/db/pool.js';

const queries = [

  {
    label: 'ALL INDIA TOTAL',
    sql: `
      SELECT COUNT(*)::int AS rows
      FROM cw_rec_uptac_cutoffs_2025
      WHERE quota = 'All India'
    `
  },

  {
    label: 'ALL INDIA OPEN',
    sql: `
      SELECT COUNT(*)::int AS rows
      FROM cw_rec_uptac_cutoffs_2025
      WHERE quota = 'All India'
        AND category = 'OPEN'
    `
  },

  {
    label: 'ALL INDIA OPEN ROUND 1',
    sql: `
      SELECT COUNT(*)::int AS rows
      FROM cw_rec_uptac_cutoffs_2025
      WHERE quota = 'All India'
        AND category = 'OPEN'
        AND round::text = '1'
    `
  },

  {
    label: 'ALL INDIA OPEN ROUND 1 RANK 50000',
    sql: `
      SELECT COUNT(*)::int AS rows
      FROM cw_rec_uptac_cutoffs_2025
      WHERE quota = 'All India'
        AND category = 'OPEN'
        AND round::text = '1'
        AND closing_rank >= 50000
    `
  },

  {
    label: 'ALL INDIA MALE ELIGIBLE RANK 50000',
    sql: `
      SELECT COUNT(*)::int AS rows
      FROM cw_rec_uptac_cutoffs_2025
      WHERE quota = 'All India'
        AND category = 'OPEN'
        AND round::text = '1'
        AND closing_rank >= 50000
        AND LOWER(TRIM(COALESCE(gender, ''))) =
            'both male and female seats'
    `
  },

  {
    label: 'ALL INDIA FEMALE ELIGIBLE RANK 50000',
    sql: `
      SELECT COUNT(*)::int AS rows
      FROM cw_rec_uptac_cutoffs_2025
      WHERE quota = 'All India'
        AND category = 'OPEN'
        AND round::text = '1'
        AND closing_rank >= 50000
        AND LOWER(COALESCE(gender, '')) LIKE '%female%'
    `
  }

];

for (const item of queries) {
  const result =
    await pool.query(item.sql);

  console.log(
    item.label,
    '=>',
    result.rows[0].rows
  );
}

console.log('\nALL INDIA ROUND/CATEGORY SAMPLE');

const sample =
  await pool.query(`
    SELECT
      quota,
      category,
      round,
      gender,
      opening_rank,
      closing_rank
    FROM cw_rec_uptac_cutoffs_2025
    WHERE quota = 'All India'
    ORDER BY closing_rank DESC
    LIMIT 20
  `);

console.table(sample.rows);

await pool.end();
