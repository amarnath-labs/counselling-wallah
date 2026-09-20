import { pool } from './src/db/pool.js';
import { resolveCollegeAnnualFee } from './src/services/feeResolver.js';

const FEE_ALIASES = {
  'atal-bihari-vajpayee-indian-institute-of-information-technology-management-gwalior':
    'iiitm-gwalior',

  'iiit-allahabad':
    'indian-institute-of-information-technology-allahabad',

  'iiit-pune':
    'indian-institute-of-information-technology-pune',

  'nit-calicut':
    'national-institute-of-technology-calicut',

  'nit-rourkela':
    'national-institute-of-technology-rourkela',

  'nit-trichy':
    'national-institute-of-technology-tiruchirappalli',

  'nit-warangal':
    'national-institute-of-technology-warangal'
};

async function main() {

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

  const feeResult = await pool.query(`
    SELECT *
    FROM college_fee_profiles
    WHERE fee_year = 2026
    ORDER BY college_id, updated_at DESC NULLS LAST
  `);

  const profilesByCollege = new Map();

  for (const profile of feeResult.rows) {
    if (!profilesByCollege.has(profile.college_id)) {
      profilesByCollege.set(profile.college_id, []);
    }

    profilesByCollege
      .get(profile.college_id)
      .push(profile);
  }

  const direct = [];
  const aliasResolved = [];
  const missing = [];

  for (const college of josaaResult.rows) {

    const canonicalId =
      FEE_ALIASES[college.id] ??
      college.id;

    const profiles =
      profilesByCollege.get(canonicalId) || [];

    let resolvedFee = null;

    for (const profile of profiles) {

      const resolved =
        resolveCollegeAnnualFee(profile);

      if (
        resolved.annualFee !== null &&
        !resolved.needsReview
      ) {
        resolvedFee = resolved;
        break;
      }
    }

    if (!resolvedFee) {

      missing.push({
        college_id: college.id,
        college: college.name,
        lookup_id: canonicalId
      });

      continue;
    }

    const row = {
      college_id: college.id,
      college: college.name,
      lookup_id: canonicalId,
      annual_fee: resolvedFee.annualFee,
      confidence: resolvedFee.confidence,
      method: resolvedFee.method
    };

    if (canonicalId === college.id) {
      direct.push(row);
    } else {
      aliasResolved.push(row);
    }
  }

  const total =
    josaaResult.rows.length;

  const covered =
    direct.length +
    aliasResolved.length;

  const coverage =
    total > 0
      ? (
          covered /
          total *
          100
        ).toFixed(2)
      : '0.00';

  console.log('');
  console.log('========================================');
  console.log('CW-REC PRODUCTION JOSAA FEE COVERAGE V15');
  console.log('========================================');

  console.table([
    {
      josaa_ids: total,
      direct_fee: direct.length,
      alias_fee: aliasResolved.length,
      total_covered: covered,
      missing_fee: missing.length,
      coverage_percent: `${coverage}%`
    }
  ]);

  console.log('');
  console.log('=== RESOLVED THROUGH ALIAS ===');
  console.table(aliasResolved);

  console.log('');
  console.log('=== STILL MISSING ===');
  console.table(missing);

  console.log('');
  console.log(
    'Missing count:',
    missing.length
  );

  console.log('');
  console.log(
    '✅ PRODUCTION-AWARE JOSAA AUDIT COMPLETE'
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
