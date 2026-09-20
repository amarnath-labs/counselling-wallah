import { pool } from './src/db/pool.js';

async function main() {
  console.log('\n========================================');
  console.log('CW-REC QUALITY COVERAGE AUDIT');
  console.log('========================================');

  const metrics = await pool.query(`
    SELECT
      COUNT(*)::int AS total_rows,
      COUNT(DISTINCT college_id)::int AS colleges,
      COUNT(*) FILTER (
        WHERE LOWER(COALESCE(verification_status, '')) = 'verified'
      )::int AS verified_rows,
      COUNT(*) FILTER (
        WHERE nirf_rank IS NOT NULL
      )::int AS nirf_rank_rows,
      COUNT(*) FILTER (
        WHERE nirf_score IS NOT NULL
      )::int AS nirf_score_rows,
      COUNT(*) FILTER (
        WHERE placement_rate IS NOT NULL
      )::int AS placement_rows,
      COUNT(*) FILTER (
        WHERE median_package IS NOT NULL
      )::int AS median_package_rows,
      COUNT(*) FILTER (
        WHERE average_package IS NOT NULL
      )::int AS average_package_rows
    FROM college_quality_metrics
  `);

  console.log('\n=== QUALITY METRIC TOTALS ===');
  console.table(metrics.rows);


  const status = await pool.query(`
    SELECT
      COALESCE(verification_status, '(NULL)')
        AS verification_status,
      COUNT(*)::int AS rows,
      COUNT(DISTINCT college_id)::int AS colleges
    FROM college_quality_metrics
    GROUP BY verification_status
    ORDER BY rows DESC
  `);

  console.log('\n=== QUALITY VERIFICATION STATUS ===');
  console.table(status.rows);


  const years = await pool.query(`
    SELECT
      academic_year,
      COUNT(*)::int AS rows,
      COUNT(DISTINCT college_id)::int AS colleges
    FROM college_quality_metrics
    GROUP BY academic_year
    ORDER BY academic_year DESC NULLS LAST
  `);

  console.log('\n=== QUALITY YEARS ===');
  console.table(years.rows);


  const coverage = await pool.query(`
    WITH josaa_colleges AS (
      SELECT DISTINCT
        c.id,
        c.name
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
        AND co.opening_rank IS NOT NULL
        AND co.closing_rank IS NOT NULL
        AND co.opening_rank <= co.closing_rank
    ),

    latest_quality AS (
      SELECT DISTINCT ON (college_id)
        college_id,
        nirf_rank,
        nirf_score,
        placement_rate,
        median_package,
        average_package,
        highest_package,
        academic_year,
        source_label,
        source_url,
        verification_status
      FROM college_quality_metrics
      WHERE
        LOWER(COALESCE(verification_status, '')) = 'verified'
      ORDER BY
        college_id,
        academic_year DESC NULLS LAST,
        retrieved_at DESC NULLS LAST,
        id DESC
    )

    SELECT
      COUNT(*)::int AS josaa_colleges,

      COUNT(q.college_id)::int
        AS direct_quality_matches,

      COUNT(*) FILTER (
        WHERE q.nirf_score IS NOT NULL
      )::int AS nirf_score_coverage,

      COUNT(*) FILTER (
        WHERE q.placement_rate IS NOT NULL
      )::int AS placement_coverage,

      COUNT(*) FILTER (
        WHERE q.median_package IS NOT NULL
      )::int AS median_package_coverage

    FROM josaa_colleges j
    LEFT JOIN latest_quality q
      ON q.college_id = j.id
  `);

  console.log('\n=== VERIFIED JOSAA QUALITY COVERAGE ===');
  console.table(coverage.rows);


  const missing = await pool.query(`
    WITH josaa_colleges AS (
      SELECT DISTINCT
        c.id,
        c.name,
        c.type
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
        AND co.opening_rank IS NOT NULL
        AND co.closing_rank IS NOT NULL
        AND co.opening_rank <= co.closing_rank
    ),

    verified_quality AS (
      SELECT DISTINCT college_id
      FROM college_quality_metrics
      WHERE
        LOWER(COALESCE(verification_status, '')) = 'verified'
    )

    SELECT
      j.id,
      j.name,
      j.type
    FROM josaa_colleges j
    LEFT JOIN verified_quality q
      ON q.college_id = j.id
    WHERE q.college_id IS NULL
    ORDER BY
      j.type,
      j.name
  `);

  console.log('\n=== JOSAA COLLEGES WITHOUT VERIFIED QUALITY ===');
  console.table(missing.rows);


  const sample = await pool.query(`
    SELECT
      c.name AS college,
      c.type,
      q.academic_year,
      q.nirf_rank,
      q.nirf_score,
      q.placement_rate,
      q.median_package,
      q.average_package,
      q.highest_package,
      q.source_label,
      q.verification_status
    FROM college_quality_metrics q
    INNER JOIN colleges c
      ON c.id = q.college_id
    WHERE
      LOWER(COALESCE(q.verification_status, '')) = 'verified'
    ORDER BY
      q.academic_year DESC NULLS LAST,
      c.name
    LIMIT 100
  `);

  console.log('\n=== VERIFIED QUALITY SAMPLE ===');
  console.table(sample.rows);

  console.log('\n========================================');
  console.log('✅ READ-ONLY QUALITY COVERAGE AUDIT COMPLETE');
  console.log('========================================');
}

main()
  .catch(error => {
    console.error('\nQUALITY COVERAGE AUDIT ERROR:\n', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
