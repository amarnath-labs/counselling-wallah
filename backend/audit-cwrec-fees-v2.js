import { pool } from './src/db/pool.js';

async function main() {

  console.log('\n========================================');
  console.log('CW-REC FEE AUDIT V2');
  console.log('========================================');


  const branchSummary = await pool.query(`
    SELECT
      COUNT(*)::int AS total_rows,

      COUNT(*) FILTER (
        WHERE total_annual_fee IS NOT NULL
      )::int AS total_annual_fee_rows,

      COUNT(*) FILTER (
        WHERE tuition_fee IS NOT NULL
      )::int AS tuition_fee_rows,

      COUNT(*) FILTER (
        WHERE hostel_fee IS NOT NULL
      )::int AS hostel_fee_rows,

      COUNT(*) FILTER (
        WHERE other_fee IS NOT NULL
      )::int AS other_fee_rows,

      COUNT(*) FILTER (
        WHERE
          total_annual_fee IS NULL
          AND tuition_fee IS NULL
          AND hostel_fee IS NULL
          AND other_fee IS NULL
      )::int AS completely_empty_rows

    FROM branch_fees
  `);

  console.log('\n=== BRANCH FEE SUMMARY ===');
  console.table(branchSummary.rows);


  const branchStatus = await pool.query(`
    SELECT
      COALESCE(verification_status, '(NULL)')
        AS verification_status,

      COUNT(*)::int AS rows,

      COUNT(*) FILTER (
        WHERE total_annual_fee IS NOT NULL
      )::int AS annual_values,

      COUNT(*) FILTER (
        WHERE
          total_annual_fee IS NULL
          AND tuition_fee IS NULL
          AND hostel_fee IS NULL
          AND other_fee IS NULL
      )::int AS empty_rows

    FROM branch_fees

    GROUP BY
      verification_status

    ORDER BY
      rows DESC
  `);

  console.log('\n=== BRANCH FEE VERIFICATION STATUS ===');
  console.table(branchStatus.rows);


  const suspiciousCollege = await pool.query(`
    SELECT
      c.id AS college_id,
      c.name AS college,

      fp.fee_year,
      fp.annual_total_fee,
      fp.annual_academic_fee,
      fp.total_course_fee,
      fp.first_semester_fee,
      fp.academic_fee_per_semester,
      fp.tuition_fee_per_semester,

      COALESCE(
        fp.annual_total_fee,
        fp.annual_academic_fee,

        CASE
          WHEN fp.total_course_fee IS NOT NULL
          THEN fp.total_course_fee / 4.0
        END,

        CASE
          WHEN fp.first_semester_fee IS NOT NULL
          THEN fp.first_semester_fee * 2
        END,

        CASE
          WHEN fp.academic_fee_per_semester IS NOT NULL
          THEN fp.academic_fee_per_semester * 2
        END,

        CASE
          WHEN fp.tuition_fee_per_semester IS NOT NULL
          THEN fp.tuition_fee_per_semester * 2
        END
      ) AS resolved_annual_cost,

      fp.verification_status,
      fp.source_kind,
      fp.source_url

    FROM college_fee_profiles fp

    INNER JOIN colleges c
      ON c.id = fp.college_id

    WHERE
      COALESCE(
        fp.annual_total_fee,
        fp.annual_academic_fee,

        CASE
          WHEN fp.total_course_fee IS NOT NULL
          THEN fp.total_course_fee / 4.0
        END,

        CASE
          WHEN fp.first_semester_fee IS NOT NULL
          THEN fp.first_semester_fee * 2
        END,

        CASE
          WHEN fp.academic_fee_per_semester IS NOT NULL
          THEN fp.academic_fee_per_semester * 2
        END,

        CASE
          WHEN fp.tuition_fee_per_semester IS NOT NULL
          THEN fp.tuition_fee_per_semester * 2
        END
      ) < 20000

    ORDER BY
      resolved_annual_cost,
      c.name
  `);

  console.log('\n=== SUSPICIOUS COLLEGE RESOLVED ANNUAL COST < 20K ===');
  console.table(suspiciousCollege.rows);


  const suspiciousBranch = await pool.query(`
    SELECT
      bf.id,
      bf.college_id,
      c.name AS college,
      b.name AS branch,

      bf.academic_year,
      bf.fee_scope,

      bf.tuition_fee,
      bf.hostel_fee,
      bf.other_fee,
      bf.total_annual_fee,

      COALESCE(
        bf.total_annual_fee,

        CASE
          WHEN
            bf.tuition_fee IS NOT NULL
            OR bf.hostel_fee IS NOT NULL
            OR bf.other_fee IS NOT NULL
          THEN
            COALESCE(bf.tuition_fee, 0)
            +
            COALESCE(bf.hostel_fee, 0)
            +
            COALESCE(bf.other_fee, 0)
          ELSE NULL
        END
      ) AS resolved_annual_cost,

      bf.verification_status,
      bf.source_label,
      bf.source_url

    FROM branch_fees bf

    LEFT JOIN branches b
      ON b.id = bf.branch_id

    LEFT JOIN colleges c
      ON c.id = bf.college_id

    WHERE
      COALESCE(
        bf.total_annual_fee,

        CASE
          WHEN
            bf.tuition_fee IS NOT NULL
            OR bf.hostel_fee IS NOT NULL
            OR bf.other_fee IS NOT NULL
          THEN
            COALESCE(bf.tuition_fee, 0)
            +
            COALESCE(bf.hostel_fee, 0)
            +
            COALESCE(bf.other_fee, 0)
          ELSE NULL
        END
      ) < 20000

    ORDER BY
      resolved_annual_cost,
      bf.college_id
  `);

  console.log('\n=== SUSPICIOUS BRANCH RESOLVED ANNUAL COST < 20K ===');
  console.table(suspiciousBranch.rows);


  const josaaCoverage = await pool.query(`
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

    college_fee AS (

      SELECT DISTINCT
        college_id

      FROM college_fee_profiles

      WHERE
        COALESCE(
          annual_total_fee,
          annual_academic_fee,
          total_course_fee,
          first_semester_fee,
          academic_fee_per_semester,
          tuition_fee_per_semester
        ) IS NOT NULL
    ),

    branch_fee AS (

      SELECT DISTINCT
        college_id

      FROM branch_fees

      WHERE
        COALESCE(
          total_annual_fee,
          tuition_fee,
          hostel_fee,
          other_fee
        ) IS NOT NULL
    )

    SELECT
      COUNT(*)::int
        AS josaa_colleges,

      COUNT(cf.college_id)::int
        AS college_fee_coverage,

      COUNT(bf.college_id)::int
        AS branch_fee_coverage,

      COUNT(*) FILTER (
        WHERE
          cf.college_id IS NOT NULL
          OR bf.college_id IS NOT NULL
      )::int AS any_fee_coverage

    FROM josaa_colleges j

    LEFT JOIN college_fee cf
      ON cf.college_id = j.id

    LEFT JOIN branch_fee bf
      ON bf.college_id = j.id
  `);

  console.log('\n=== JOSAA 2026 FEE COVERAGE ===');
  console.table(josaaCoverage.rows);


  console.log('\n========================================');
  console.log('✅ READ-ONLY FEE AUDIT V2 COMPLETE');
  console.log('========================================');
}

main()
  .catch(error => {
    console.error('\nFEE AUDIT V2 ERROR:\n', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
