import { pool } from './src/db/pool.js';
import { resolveCollegeAnnualFee } from './src/services/feeResolver.js';

async function main() {
  const collegesResult = await pool.query(`
    SELECT
      id,
      name
    FROM colleges
    ORDER BY name
  `);

  const profilesResult = await pool.query(`
    SELECT *
    FROM college_fee_profiles
    ORDER BY college_id, fee_year DESC
  `);

  const profileMap = new Map();

  for (const profile of profilesResult.rows) {
    if (!profileMap.has(profile.college_id)) {
      profileMap.set(profile.college_id, []);
    }

    profileMap
      .get(profile.college_id)
      .push(profile);
  }

  const covered = [];
  const missing = [];

  for (const college of collegesResult.rows) {
    const profiles =
      profileMap.get(college.id) || [];

    let best = null;

    for (const profile of profiles) {
      const resolved =
        resolveCollegeAnnualFee(profile);

      if (
        resolved.annualFee !== null &&
        !resolved.needsReview
      ) {
        best = {
          profile,
          resolved
        };

        break;
      }
    }

    if (best) {
      covered.push({
        college_id: college.id,
        college: college.name,
        annual_fee:
          best.resolved.annualFee,
        confidence:
          best.resolved.confidence,
        method:
          best.resolved.method
      });
    } else {
      missing.push({
        college_id: college.id,
        college: college.name,
        profiles_found:
          profiles.length
      });
    }
  }

  const total =
    collegesResult.rows.length;

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
    'CW-REC ALL COLLEGE FEE COVERAGE'
  );

  console.log(
    '========================================'
  );

  console.table([
    {
      total_colleges: total,
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
    '=== COLLEGES WITHOUT USABLE FEE ==='
  );

  console.table(missing);

  console.log('');
  console.log(
    'Missing count:',
    missing.length
  );

  console.log('');
  console.log(
    '✅ ALL-COLLEGE FEE COVERAGE AUDIT COMPLETE'
  );
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
