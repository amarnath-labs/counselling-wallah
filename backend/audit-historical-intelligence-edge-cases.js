import 'dotenv/config';

import { pool } from './src/db/pool.js';

import {
  classifyRankRatio,
  buildHistoricalAdmissionIntelligence,
} from './src/services/historicalAdmissionIntelligence.js';


function assert(
  condition,
  message
) {
  if (!condition) {
    throw new Error(
      `ASSERTION FAILED: ${message}`
    );
  }

  console.log(
    `PASS: ${message}`
  );
}


async function loadRows(
  branchId,
  category,
  josaaQuota,
  csabQuota,
  gender
) {

  const result =
    await pool.query(
      `
      SELECT
        year,
        round,
        opening_rank AS "openingRank",
        closing_rank AS "closingRank",
        counselling_type AS "counsellingType"
      FROM cutoffs
      WHERE branch_id = $1
        AND category = $2
        AND gender = $5
        AND year BETWEEN 2024 AND 2026
        AND (
          (
            counselling_type = 'JOSAA'
            AND quota = $3
          )
          OR
          (
            counselling_type = 'CSAB_SPECIAL'
            AND quota = $4
          )
        )
      ORDER BY
        year DESC,
        CASE
          WHEN round ~ '^[0-9]+$'
          THEN round::integer
          ELSE 999
        END
      `,
      [
        branchId,
        category,
        josaaQuota,
        csabQuota,
        gender,
      ]
    );


  return {
    josaaRows:
      result.rows.filter(
        row =>
          row.counsellingType ===
          'JOSAA'
      ),

    csabRows:
      result.rows.filter(
        row =>
          row.counsellingType ===
          'CSAB_SPECIAL'
      ),
  };
}


async function main() {

  console.log(
    '\n========================================'
  );

  console.log(
    'HISTORICAL INTELLIGENCE EDGE AUDIT'
  );

  console.log(
    'READ ONLY'
  );

  console.log(
    '========================================'
  );


  /*
  |--------------------------------------------------------------------------
  | 1. BUCKET BOUNDARIES
  |--------------------------------------------------------------------------
  */

  console.log(
    '\n===== BUCKET BOUNDARIES ====='
  );

  assert(
    classifyRankRatio(0.60) ===
      'Backup',
    '0.60 => Backup'
  );

  assert(
    classifyRankRatio(0.600001) ===
      'Safe',
    '>0.60 => Safe'
  );

  assert(
    classifyRankRatio(0.85) ===
      'Safe',
    '0.85 => Safe'
  );

  assert(
    classifyRankRatio(0.850001) ===
      'Target',
    '>0.85 => Target'
  );

  assert(
    classifyRankRatio(1.05) ===
      'Target',
    '1.05 => Target'
  );

  assert(
    classifyRankRatio(1.050001) ===
      'Dream',
    '>1.05 => Dream'
  );


  /*
  |--------------------------------------------------------------------------
  | 2. MISSING-YEAR WEIGHT RENORMALIZATION
  |--------------------------------------------------------------------------
  */

  console.log(
    '\n===== MISSING YEAR ====='
  );

  const missingYear =
    buildHistoricalAdmissionIntelligence({
      studentRank:
        40000,

      josaaRows: [
        {
          year: 2026,
          round: '5',
          openingRank: 30000,
          closingRank: 50000,
        },
        {
          year: 2025,
          round: '6',
          openingRank: 29000,
          closingRank: 45000,
        },
      ],

      csabRows: [],
    });


  assert(
    Math.abs(
      missingYear.josaa.usedWeight -
      0.80
    ) < 0.000001,
    'Missing 2024 uses available weight 0.80'
  );

  assert(
    Number.isFinite(
      missingYear.josaa.weightedRankRatio
    ),
    'Missing year still produces weighted ratio'
  );

  assert(
    missingYear.csab.available ===
      false,
    'No CSAB rows => CSAB unavailable'
  );


  /*
  |--------------------------------------------------------------------------
  | 3. FIND REAL IIT BRANCH
  |--------------------------------------------------------------------------
  */

  console.log(
    '\n===== IIT / NO-CSAB CASE ====='
  );

  const iit =
    await pool.query(
      `
      SELECT
        b.id AS branch_id,
        b.name AS branch_name,
        c.name AS college_name
      FROM branches b
      JOIN colleges c
        ON c.id = b.college_id
      WHERE
        (
          c.name ILIKE
            'Indian Institute of Technology%'
          OR c.name ILIKE
            '%IIT%'
        )
        AND EXISTS (
          SELECT 1
          FROM cutoffs x
          WHERE x.branch_id = b.id
            AND x.counselling_type =
              'JOSAA'
            AND x.year BETWEEN
              2024 AND 2026
            AND x.category = 'OPEN'
            AND x.gender =
              'Gender-Neutral'
            AND x.quota = 'AI'
        )
      ORDER BY c.name, b.name
      LIMIT 1
      `
    );


  if (
    iit.rows.length > 0
  ) {

    const sample =
      iit.rows[0];


    console.log(
      'IIT sample:',
      sample
    );


    const rows =
      await loadRows(
        sample.branch_id,
        'OPEN',
        'AI',
        'All India',
        'Gender-Neutral'
      );


    const intelligence =
      buildHistoricalAdmissionIntelligence({
        studentRank:
          10000,

        josaaRows:
          rows.josaaRows,

        csabRows:
          rows.csabRows,
      });


    console.log(
      'JoSAA rows:',
      rows.josaaRows.length
    );

    console.log(
      'CSAB rows:',
      rows.csabRows.length
    );


    assert(
      rows.josaaRows.length > 0,
      'IIT has JoSAA history'
    );

    assert(
      rows.csabRows.length === 0,
      'IIT has no CSAB Special history'
    );

    assert(
      intelligence.csab.available ===
        false,
      'IIT CSAB intelligence unavailable'
    );

  } else {

    console.log(
      'No IIT sample automatically found.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | 4. REAL DUAL-ROUTE AI SAMPLE
  |--------------------------------------------------------------------------
  */

  console.log(
    '\n===== JOSAA + CSAB CASE ====='
  );

  const dualRoute =
    await pool.query(
      `
      SELECT
        b.id AS branch_id,
        b.name AS branch_name,
        c.name AS college_name
      FROM branches b
      JOIN colleges c
        ON c.id = b.college_id
      WHERE EXISTS (
        SELECT 1
        FROM cutoffs j
        WHERE j.branch_id = b.id
          AND j.counselling_type =
            'JOSAA'
          AND j.year BETWEEN
            2024 AND 2026
          AND j.category = 'OPEN'
          AND j.gender =
            'Gender-Neutral'
          AND j.quota = 'AI'
      )
      AND EXISTS (
        SELECT 1
        FROM cutoffs s
        WHERE s.branch_id = b.id
          AND s.counselling_type =
            'CSAB_SPECIAL'
          AND s.year BETWEEN
            2024 AND 2026
          AND s.category = 'OPEN'
          AND s.gender =
            'Gender-Neutral'
          AND s.quota = 'All India'
      )
      ORDER BY c.name, b.name
      LIMIT 1
      `
    );


  assert(
    dualRoute.rows.length === 1,
    'Found real JoSAA + CSAB branch'
  );


  const dual =
    dualRoute.rows[0];


  console.log(
    'Dual-route sample:',
    dual
  );


  const dualRows =
    await loadRows(
      dual.branch_id,
      'OPEN',
      'AI',
      'All India',
      'Gender-Neutral'
    );


  const dualIntelligence =
    buildHistoricalAdmissionIntelligence({
      studentRank:
        40000,

      josaaRows:
        dualRows.josaaRows,

      csabRows:
        dualRows.csabRows,
    });


  assert(
    dualIntelligence.josaa.available ===
      true,
    'JoSAA intelligence available'
  );

  assert(
    dualIntelligence.csab.available ===
      true,
    'CSAB intelligence available'
  );

  assert(
    dualIntelligence.josaa.years.length >=
      1,
    'JoSAA year summaries produced'
  );

  assert(
    dualIntelligence.csab.years.length >=
      1,
    'CSAB year summaries produced'
  );


  /*
  |--------------------------------------------------------------------------
  | 5. HOME-STATE QUOTA MAPPING DATA EXISTS
  |--------------------------------------------------------------------------
  */

  console.log(
    '\n===== HOME STATE CASE ====='
  );

  const homeState =
    await pool.query(
      `
      SELECT
        b.id AS branch_id,
        b.name AS branch_name,
        c.name AS college_name
      FROM branches b
      JOIN colleges c
        ON c.id = b.college_id
      WHERE EXISTS (
        SELECT 1
        FROM cutoffs j
        WHERE j.branch_id = b.id
          AND j.counselling_type =
            'JOSAA'
          AND j.year BETWEEN
            2024 AND 2026
          AND j.category = 'OPEN'
          AND j.gender =
            'Gender-Neutral'
          AND j.quota = 'HS'
      )
      AND EXISTS (
        SELECT 1
        FROM cutoffs s
        WHERE s.branch_id = b.id
          AND s.counselling_type =
            'CSAB_SPECIAL'
          AND s.year BETWEEN
            2024 AND 2026
          AND s.category = 'OPEN'
          AND s.gender =
            'Gender-Neutral'
          AND s.quota = 'Home State'
      )
      ORDER BY c.name, b.name
      LIMIT 1
      `
    );


  if (
    homeState.rows.length > 0
  ) {

    const sample =
      homeState.rows[0];


    console.log(
      'Home-state sample:',
      sample
    );


    const rows =
      await loadRows(
        sample.branch_id,
        'OPEN',
        'HS',
        'Home State',
        'Gender-Neutral'
      );


    assert(
      rows.josaaRows.length > 0,
      'JoSAA HS rows available'
    );

    assert(
      rows.csabRows.length > 0,
      'CSAB Home State rows available'
    );

  } else {

    console.log(
      'No shared HS/Home State sample found.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | FINAL
  |--------------------------------------------------------------------------
  */

  console.log(
    '\n========================================'
  );

  console.log(
    'EDGE AUDIT COMPLETE'
  );

  console.log(
    'NO DATABASE CHANGES MADE'
  );

  console.log(
    '========================================'
  );
}


main()
  .catch(
    error => {

      console.error(
        '\nEDGE AUDIT FAILED'
      );

      console.error(
        error
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await pool.end();
    }
  );
