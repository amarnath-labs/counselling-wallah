import { pool } from './src/db/pool.js';

async function main() {

  console.log('\n========================================');
  console.log('CW-REC JOSAA RANK ANOMALY AUDIT');
  console.log('========================================');

  const rows = await pool.query(`
    SELECT
      co.id,
      c.name AS college,
      b.name AS branch,
      co.year,
      co.round,
      co.category,
      co.quota,
      co.gender,
      co.opening_rank,
      co.closing_rank,
      co.source_label,
      co.source_url,
      co.verification_status,
      co.is_verified
    FROM cutoffs co

    INNER JOIN branches b
      ON b.id = co.branch_id

    INNER JOIN colleges c
      ON c.id = b.college_id

    WHERE
      co.counselling_type = 'JOSAA'
      AND co.year = 2026
      AND co.verification_status = 'VERIFIED'
      AND co.is_verified = true
      AND co.opening_rank > co.closing_rank

    ORDER BY
      c.name,
      b.name,
      co.category,
      co.gender
  `);

  console.log('\n=== OPENING > CLOSING ===');
  console.table(rows.rows);

  console.log('\nAnomaly count:', rows.rows.length);


  const grouped = await pool.query(`
    SELECT
      category,
      quota,
      gender,
      COUNT(*)::int AS rows
    FROM cutoffs
    WHERE
      counselling_type = 'JOSAA'
      AND year = 2026
      AND verification_status = 'VERIFIED'
      AND is_verified = true
      AND opening_rank > closing_rank
    GROUP BY
      category,
      quota,
      gender
    ORDER BY
      rows DESC,
      category
  `);

  console.log('\n=== ANOMALY CONTEXT ===');
  console.table(grouped.rows);


  const verifiedQuality = await pool.query(`
    SELECT
      COUNT(*)::int AS total_verified,

      COUNT(*) FILTER (
        WHERE opening_rank IS NULL
      )::int AS opening_null,

      COUNT(*) FILTER (
        WHERE closing_rank IS NULL
      )::int AS closing_null,

      COUNT(*) FILTER (
        WHERE opening_rank > closing_rank
      )::int AS opening_gt_closing

    FROM cutoffs
    WHERE
      counselling_type = 'JOSAA'
      AND year = 2026
      AND verification_status = 'VERIFIED'
      AND is_verified = true
  `);

  console.log('\n=== VERIFIED DATA QUALITY ===');
  console.table(verifiedQuality.rows);

  console.log('\n✅ READ-ONLY ANOMALY AUDIT COMPLETE');
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
