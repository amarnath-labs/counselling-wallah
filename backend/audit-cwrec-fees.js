import { pool } from './src/db/pool.js';

async function main() {

  console.log('\n========================================');
  console.log('CW-REC FEE QUALITY AUDIT');
  console.log('========================================');

  const summary = await pool.query(`
    SELECT
      COUNT(*)::int AS total_college_fee_profiles,

      COUNT(*) FILTER (
        WHERE annual_total_fee IS NOT NULL
      )::int AS annual_total_fee_rows,

      COUNT(*) FILTER (
        WHERE annual_academic_fee IS NOT NULL
      )::int AS annual_academic_fee_rows,

      COUNT(*) FILTER (
        WHERE total_course_fee IS NOT NULL
      )::int AS total_course_fee_rows,

      COUNT(*) FILTER (
        WHERE first_semester_fee IS NOT NULL
      )::int AS first_semester_fee_rows,

      COUNT(*) FILTER (
        WHERE tuition_fee_per_semester IS NOT NULL
      )::int AS tuition_semester_rows

    FROM college_fee_profiles
  `);

  console.log('\n=== COLLEGE FEE PROFILE SUMMARY ===');
  console.table(summary.rows);


  const branchSummary = await pool.query(`
    SELECT
      COUNT(*)::int AS total_branch_fee_rows,

      COUNT(*) FILTER (
        WHERE annual_fee IS NOT NULL
      )::int AS annual_fee_rows,

      COUNT(*) FILTER (
        WHERE total_fee IS NOT NULL
      )::int AS total_fee_rows,

      COUNT(*) FILTER (
        WHERE tuition_fee IS NOT NULL
      )::int AS tuition_fee_rows

    FROM branch_fees
  `);

  console.log('\n=== BRANCH FEE SUMMARY ===');
  console.table(branchSummary.rows);


  const suspiciousCollege = await pool.query(`
    SELECT
      c.name AS college,
      fp.fee_year,
      fp.annual_total_fee,
      fp.annual_academic_fee,
      fp.total_course_fee,
      fp.first_semester_fee,
      fp.academic_fee_per_semester,
      fp.tuition_fee_per_semester,
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

    ORDER BY college
  `);

  console.log('\n=== SUSPICIOUS COLLEGE ANNUAL COST < 20K ===');
  console.table(suspiciousCollege.rows);


  const suspiciousBranch = await pool.query(`
    SELECT
      c.name AS college,
      b.name AS branch,
      bf.fee_year,
      bf.annual_fee,
      bf.total_fee,
      bf.tuition_fee,
      bf.verification_status,
      bf.source_label,
      bf.source_url
    FROM branch_fees bf
    LEFT JOIN branches b
      ON b.id::text = bf.branch_id::text
    LEFT JOIN colleges c
      ON c.id = b.college_id
    WHERE
      COALESCE(
        bf.annual_fee,
        CASE
          WHEN bf.total_fee IS NOT NULL
          THEN bf.total_fee / 4.0
        END,
        bf.tuition_fee
      ) < 20000

    ORDER BY
      c.name,
      b.name
  `);

  console.log('\n=== SUSPICIOUS BRANCH ANNUAL COST < 20K ===');
  console.table(suspiciousBranch.rows);


  console.log('\n========================================');
  console.log('✅ READ-ONLY FEE AUDIT COMPLETE');
  console.log('========================================');
}

main()
  .catch(error => {
    console.error('\nFEE AUDIT ERROR:\n', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
