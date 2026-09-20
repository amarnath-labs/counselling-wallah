import { pool } from './src/db/pool.js';
import { resolveCollegeAnnualFee } from './src/services/feeResolver.js';

async function main() {

  /*
   * STEP 1
   * Get exact colleges that actually participate
   * in JoSAA from the cutoff table.
   */
  const josaaResult = await pool.query(`
    SELECT DISTINCT
      c.id,
      c.name
    FROM colleges c
    INNER JOIN branches b
      ON b.college_id = c.id
    INNER JOIN cutoffs co
      ON co.branch_id = b.id
    WHERE co.year = 2026
      AND (
        LOWER(COALESCE(co.counselling_type, '')) = 'josaa'
        OR LOWER(COALESCE(co.source_label, '')) LIKE '%josaa%'
      )
    ORDER BY c.name
  `);

  /*
   * STEP 2
   * Load fee profiles only for those colleges.
   */
  const feeResult = await pool.query(`
    SELECT *
    FROM college_fee_profiles
    WHERE fee_year = 2026
    ORDER BY college_id, updated_at DESC NULLS LAST
  `);

  const profileMap = new Map();

  for (const profile of feeResult.rows) {
    if (!profileMap.has(profile.college_id)) {
      profileMap.set(profile.college_id, []);
    }

    profileMap
      .get(profile.college_id)
      .push(profile);
  }

  const covered = [];
  const missing = [];

  for (const college of josaaResult.rows) {

    const profiles =
      profileMap.get(college.id) || [];

    let bestResolved = null;

    for (const profile of profiles) {

      const resolved =
        resolveCollegeAnnualFee(profile);

      if (
        resolved.annualFee !== null &&
        !resolved.needsReview
      ) {
        bestResolved = {
          profile,
          resolved
        };

        break;
      }
    }

    if (bestResolved) {

      covered.push({
        college_id:
          college.id,

        college:
          college.name,

        annual_fee:
          bestResolved.resolved.annualFee,

        confidence:
          bestResolved.resolved.confidence,

        method:
          bestResolved.resolved.method
      });

    } else {

      missing.push({
        college_id:
          college.id,

        college:
          college.name,

        profiles_found:
          profiles.length
      });
    }
  }

  const total =
    josaaResult.rows.length;

  const coverage =
    total > 0
      ? (
          covered.length /
          total *
          100
        ).toFixed(2)
      : '0.00';

  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    'CW-REC EXACT JOSAA FEE COVERAGE V11'
  );

  console.log(
    '========================================'
  );

  console.table([
    {
      josaa_colleges:
        total,

      fee_covered:
        covered.length,

      missing_fee:
        missing.length,

      coverage_percent:
        `${coverage}%`
    }
  ]);

  console.log('');
  console.log(
    '=== EXACT JOSAA COLLEGES WITHOUT FEE ==='
  );

  console.table(missing);

  console.log('');
  console.log(
    'Missing JoSAA count:',
    missing.length
  );

  console.log('');
  console.log(
    '=== COVERED JOSAA SAMPLE ==='
  );

  console.table(
    covered.slice(0, 30)
  );

  console.log('');
  console.log(
    '✅ EXACT JOSAA FEE COVERAGE AUDIT COMPLETE'
  );
}

main()
  .catch(error => {
    console.error(
      '\nJOSAA COVERAGE AUDIT ERROR:\n',
      error
    );

    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
