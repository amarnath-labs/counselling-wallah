import { pool } from './src/db/pool.js';

async function main() {
  console.log('\n========================================');
  console.log('CW-REC JOSAA 2026 DATA QUALITY AUDIT');
  console.log('========================================');

  const sources = await pool.query(`
    SELECT
      source_label,
      source_url,
      verification_status,
      is_verified,
      COUNT(*)::int AS rows,
      COUNT(DISTINCT branch_id)::int AS branches
    FROM cutoffs
    WHERE
      counselling_type = 'JOSAA'
      AND year = 2026
    GROUP BY
      source_label,
      source_url,
      verification_status,
      is_verified
    ORDER BY
      rows DESC,
      source_label
  `);

  console.log('\n=== 2026 SOURCES ===');
  console.table(sources.rows);


  const verification = await pool.query(`
    SELECT
      COALESCE(verification_status, '(NULL)')
        AS verification_status,
      is_verified,
      COUNT(*)::int AS rows
    FROM cutoffs
    WHERE
      counselling_type = 'JOSAA'
      AND year = 2026
    GROUP BY
      verification_status,
      is_verified
    ORDER BY
      rows DESC
  `);

  console.log('\n=== VERIFICATION DISTRIBUTION ===');
  console.table(verification.rows);


  const rounds = await pool.query(`
    SELECT
      round,
      COUNT(*)::int AS rows,
      COUNT(DISTINCT branch_id)::int AS branches
    FROM cutoffs
    WHERE
      counselling_type = 'JOSAA'
      AND year = 2026
    GROUP BY round
    ORDER BY round
  `);

  console.log('\n=== ROUND COVERAGE ===');
  console.table(rounds.rows);


  const categories = await pool.query(`
    SELECT
      category,
      gender,
      COUNT(*)::int AS rows
    FROM cutoffs
    WHERE
      counselling_type = 'JOSAA'
      AND year = 2026
    GROUP BY
      category,
      gender
    ORDER BY
      category,
      gender
  `);

  console.log('\n=== CATEGORY + GENDER COVERAGE ===');
  console.table(categories.rows);


  const collegeTypes = await pool.query(`
    SELECT
      c.type,
      COUNT(*)::int AS rows,
      COUNT(DISTINCT c.id)::int AS colleges
    FROM cutoffs co
    INNER JOIN branches b
      ON b.id = co.branch_id
    INNER JOIN colleges c
      ON c.id = b.college_id
    WHERE
      co.counselling_type = 'JOSAA'
      AND co.year = 2026
    GROUP BY c.type
    ORDER BY rows DESC
  `);

  console.log('\n=== COLLEGE TYPE COVERAGE ===');
  console.table(collegeTypes.rows);


  const suspicious = await pool.query(`
    SELECT
      c.name AS college,
      c.type,
      COUNT(*)::int AS rows
    FROM cutoffs co
    INNER JOIN branches b
      ON b.id = co.branch_id
    INNER JOIN colleges c
      ON c.id = b.college_id
    WHERE
      co.counselling_type = 'JOSAA'
      AND co.year = 2026
      AND (
        LOWER(COALESCE(c.type, '')) NOT IN (
          'iit',
          'nit',
          'iiit',
          'gfti',
          'gftis'
        )
        AND LOWER(c.name) NOT LIKE
          'indian institute of technology%'
        AND LOWER(c.name) NOT LIKE
          'national institute of technology%'
        AND LOWER(c.name) NOT LIKE
          'indian institute of information technology%'
      )
    GROUP BY
      c.name,
      c.type
    ORDER BY
      rows DESC,
      c.name
    LIMIT 100
  `);

  console.log('\n=== POSSIBLE NON-JOSAA COLLEGES ===');
  console.table(suspicious.rows);


  const rankQuality = await pool.query(`
    SELECT
      COUNT(*)::int AS total,

      COUNT(*) FILTER (
        WHERE opening_rank IS NULL
      )::int AS opening_null,

      COUNT(*) FILTER (
        WHERE closing_rank IS NULL
      )::int AS closing_null,

      COUNT(*) FILTER (
        WHERE opening_rank <= 0
      )::int AS opening_invalid,

      COUNT(*) FILTER (
        WHERE closing_rank <= 0
      )::int AS closing_invalid,

      COUNT(*) FILTER (
        WHERE opening_rank > closing_rank
      )::int AS opening_gt_closing

    FROM cutoffs
    WHERE
      counselling_type = 'JOSAA'
      AND year = 2026
  `);

  console.log('\n=== RANK QUALITY ===');
  console.table(rankQuality.rows);


  console.log('\n========================================');
  console.log('✅ READ-ONLY AUDIT COMPLETE');
  console.log('No database rows modified.');
  console.log('========================================');
}

main()
  .catch(error => {
    console.error('\nJOSAA 2026 AUDIT ERROR:\n', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
