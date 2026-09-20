import { pool } from './src/db/pool.js';
import { resolveCollegeAnnualFee } from './src/services/feeResolver.js';

function normalizeName(value = '') {
  return value
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/\bindian institute of information technology\b/g, ' iiit ')
    .replace(/\bnational institute of technology\b/g, ' nit ')
    .replace(/\batal bihari vajpayee\b/g, '')
    .replace(/\bdr\.?\b/g, '')
    .replace(/\binstitute\b/g, ' inst ')
    .replace(/\btechnology\b/g, ' tech ')
    .replace(/\bmanagement\b/g, ' mgmt ')
    .replace(/\buniversity\b/g, ' univ ')
    .replace(/\bof\b/g, ' ')
    .replace(/\band\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokens(value) {
  return new Set(
    normalizeName(value)
      .split(' ')
      .filter(x => x.length > 1)
  );
}

function similarity(a, b) {
  const A = tokens(a);
  const B = tokens(b);

  if (!A.size || !B.size) return 0;

  let common = 0;

  for (const token of A) {
    if (B.has(token)) common++;
  }

  const union =
    new Set([...A, ...B]).size;

  return common / union;
}

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

  const profilesResult =
    await pool.query(`
      SELECT *
      FROM college_fee_profiles
      WHERE fee_year = 2026
      ORDER BY updated_at DESC NULLS LAST
    `);

  const allCollegesResult =
    await pool.query(`
      SELECT id, name
      FROM colleges
      ORDER BY name
    `);

  const profilesByCollege =
    new Map();

  for (const profile of profilesResult.rows) {

    if (!profilesByCollege.has(profile.college_id)) {
      profilesByCollege.set(
        profile.college_id,
        []
      );
    }

    profilesByCollege
      .get(profile.college_id)
      .push(profile);
  }

  const coveredCollegeIds =
    new Set();

  const resolvedFeeByCollege =
    new Map();

  for (const college of allCollegesResult.rows) {

    const profiles =
      profilesByCollege.get(college.id) || [];

    for (const profile of profiles) {

      const resolved =
        resolveCollegeAnnualFee(profile);

      if (
        resolved.annualFee !== null &&
        !resolved.needsReview
      ) {
        coveredCollegeIds.add(
          college.id
        );

        resolvedFeeByCollege.set(
          college.id,
          resolved
        );

        break;
      }
    }
  }

  const missing =
    josaaResult.rows.filter(
      college =>
        !coveredCollegeIds.has(
          college.id
        )
    );

  const candidates = [];

  for (const missingCollege of missing) {

    const matches = [];

    for (
      const candidate of
      allCollegesResult.rows
    ) {

      if (
        candidate.id ===
        missingCollege.id
      ) {
        continue;
      }

      if (
        !coveredCollegeIds.has(
          candidate.id
        )
      ) {
        continue;
      }

      const score =
        similarity(
          missingCollege.name,
          candidate.name
        );

      if (score >= 0.35) {

        const resolved =
          resolvedFeeByCollege.get(
            candidate.id
          );

        matches.push({
          candidate_id:
            candidate.id,

          candidate_name:
            candidate.name,

          similarity:
            Number(
              score.toFixed(3)
            ),

          annual_fee:
            resolved?.annualFee ??
            null
        });
      }
    }

    matches.sort(
      (a, b) =>
        b.similarity -
        a.similarity
    );

    candidates.push({
      missing_id:
        missingCollege.id,

      missing_name:
        missingCollege.name,

      best_candidate_id:
        matches[0]?.candidate_id ??
        null,

      best_candidate_name:
        matches[0]?.candidate_name ??
        null,

      similarity:
        matches[0]?.similarity ??
        null,

      candidate_fee:
        matches[0]?.annual_fee ??
        null
    });
  }

  console.log('');
  console.log(
    '========================================'
  );

  console.log(
    'CW-REC JOSAA DUPLICATE ID AUDIT V12'
  );

  console.log(
    '========================================'
  );

  console.log('');
  console.log(
    'JoSAA IDs:',
    josaaResult.rows.length
  );

  console.log(
    'Missing fee IDs:',
    missing.length
  );

  console.log('');
  console.log(
    '=== POSSIBLE CANONICAL MATCHES ==='
  );

  console.table(candidates);

  console.log('');
  console.log(
    'IMPORTANT: THIS SCRIPT DOES NOT UPDATE DATABASE'
  );

  console.log(
    '✅ DUPLICATE AUDIT COMPLETE'
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
