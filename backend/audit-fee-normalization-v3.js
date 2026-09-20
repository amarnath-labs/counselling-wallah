import { pool } from './src/db/pool.js';
import {
  resolveCollegeAnnualFee
} from './src/services/feeResolver.js';

async function main() {

  console.log('');
  console.log('========================================');
  console.log('CW-REC FEE NORMALIZATION V3');
  console.log('========================================');

  const result =
    await pool.query(`
      SELECT
        fp.*,
        c.name AS college
      FROM college_fee_profiles fp
      INNER JOIN colleges c
        ON c.id = fp.college_id
      ORDER BY c.name
    `);

  const resolved = [];

  for (const row of result.rows) {

    const fee =
      resolveCollegeAnnualFee(row);

    resolved.push({
      college:
        row.college,

      annual_fee:
        fee.annualFee,

      confidence:
        fee.confidence,

      method:
        fee.method,

      needs_review:
        fee.needsReview,

      reason:
        fee.reason,

      source_kind:
        row.source_kind
    });
  }

  const usable =
    resolved.filter(
      row =>
        row.annual_fee !== null
    );

  const rejected =
    resolved.filter(
      row =>
        row.annual_fee === null
    );

  const review =
    resolved.filter(
      row =>
        row.needs_review
    );

  console.log('');
  console.log(
    '=== NORMALIZATION SUMMARY ==='
  );

  console.table([{
    total_profiles:
      resolved.length,

    usable_profiles:
      usable.length,

    rejected_profiles:
      rejected.length,

    review_required:
      review.length
  }]);

  console.log('');
  console.log(
    '=== REJECTED / NO SAFE FEE ==='
  );

  console.table(
    rejected
  );

  console.log('');
  console.log(
    '=== CONFLICT / REVIEW REQUIRED ==='
  );

  console.table(
    review
  );

  console.log('');
  console.log(
    '=== SAMPLE SAFE FEES ==='
  );

  console.table(
    usable.slice(0, 30)
  );

  console.log('');
  console.log('========================================');
  console.log(
    '✅ FEE NORMALIZATION V3 COMPLETE'
  );
  console.log('========================================');
}

main()
  .catch(error => {
    console.error(
      '\nFEE NORMALIZATION ERROR:\n',
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
