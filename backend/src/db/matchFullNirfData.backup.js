import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';

import { pool } from './pool.js';
import { findCollegeMatch, normalizeCollegeName } from './collegeNameMatcher.js';

/*
|--------------------------------------------------------------------------
| FULL NIRF SAFE MATCHER
|--------------------------------------------------------------------------
|
| INPUT:
|   data/nirf-2025-engineering-full.json
|
| MATCHES:
|   NIRF 2025 records
|       VS
|   colleges table
|
| IMPORTANT:
| - READ ONLY
| - DOES NOT modify database
| - DOES NOT modify recommendation logic
| - DOES NOT modify frontend
|
|--------------------------------------------------------------------------
*/

const INPUT_FILE =
  path.resolve(
    process.cwd(),
    'data',
    'nirf-2025-engineering-full.json'
  );

const MATCHED_FILE =
  path.resolve(
    process.cwd(),
    'nirf-full-matched.json'
  );

const UNMATCHED_FILE =
  path.resolve(
    process.cwd(),
    'nirf-full-unmatched.json'
  );

const REVIEW_FILE =
  path.resolve(
    process.cwd(),
    'nirf-full-manual-review.json'
  );


/*
|--------------------------------------------------------------------------
| NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalize(value) {
  return String(value || '')
    .toLowerCase()

    .replace(/&/g, ' and ')

    .replace(
      /\btechnological\b/g,
      'technology'
    )

    .replace(
      /\buniv\b/g,
      'university'
    )

    .replace(
      /\binst\b/g,
      'institute'
    )

    .replace(
      /[^a-z0-9\s]/g,
      ' '
    )

    .replace(
      /\bthe\b/g,
      ' '
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();
}


function normalizeLocation(value) {
  return String(value || '')
    .toLowerCase()

    .replace(
      /[^a-z0-9\s]/g,
      ' '
    )

    .replace(
      /\s+/g,
      ' '
    )

    .trim();
}


/*
|--------------------------------------------------------------------------
| TOKENIZE
|--------------------------------------------------------------------------
*/

function tokenize(value) {
  return new Set(
    normalize(value)
      .split(' ')
      .filter(Boolean)
  );
}


/*
|--------------------------------------------------------------------------
| NAME SIMILARITY
|--------------------------------------------------------------------------
*/

function similarity(a, b) {
  const first =
    tokenize(a);

  const second =
    tokenize(b);

  if (
    first.size === 0 ||
    second.size === 0
  ) {
    return 0;
  }

  let intersection = 0;

  for (const token of first) {
    if (second.has(token)) {
      intersection++;
    }
  }

  const union =
    new Set([
      ...first,
      ...second,
    ]).size;

  return union
    ? intersection / union
    : 0;
}


/*
|--------------------------------------------------------------------------
| LOCATION CHECK
|--------------------------------------------------------------------------
*/

function locationMatches(
  nirf,
  college
) {
  const nirfCity =
    normalizeLocation(
      nirf.city
    );

  const nirfState =
    normalizeLocation(
      nirf.state
    );

  const dbCity =
    normalizeLocation(
      college.city
    );

  const dbState =
    normalizeLocation(
      college.state
    );

  const cityMatch =
    Boolean(
      nirfCity &&
      dbCity &&
      (
        nirfCity === dbCity ||
        nirfCity.includes(dbCity) ||
        dbCity.includes(nirfCity)
      )
    );

  const stateMatch =
    Boolean(
      nirfState &&
      dbState &&
      (
        nirfState === dbState ||
        nirfState.includes(dbState) ||
        dbState.includes(nirfState)
      )
    );

  return {
    cityMatch,
    stateMatch,
  };
}


/*
|--------------------------------------------------------------------------
| FIND SAFE MATCH
|--------------------------------------------------------------------------
*/

function findMatch(
  nirf,
  colleges
) {
  const nirfName =
    normalize(
      nirf.college_name
    );

  /*
  |--------------------------------------------------------------------------
  | STEP 1 â€” EXACT NORMALIZED NAME
  |--------------------------------------------------------------------------
  */

  const exactMatches =
    colleges.filter(
      (college) =>
        normalize(
          college.name
        ) === nirfName
    );

  if (
    exactMatches.length === 1
  ) {
    const college =
      exactMatches[0];

    const location =
      locationMatches(
        nirf,
        college
      );

    return {
      status: 'matched',

      college,

      matchType:
        'exact_name',

      confidence: 1,

      ...location,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 2 â€” FIND BEST NAME CANDIDATES
  |--------------------------------------------------------------------------
  */

  const candidates =
    colleges
      .map(
        (college) => {
          const score =
            similarity(
              nirf.college_name,
              college.name
            );

          const location =
            locationMatches(
              nirf,
              college
            );

          return {
            college,
            score,
            ...location,
          };
        }
      )

      .sort(
        (a, b) =>
          b.score - a.score
      );


  const best =
    candidates[0];

  const second =
    candidates[1];


  if (!best) {
    return {
      status: 'unmatched',
      candidates: [],
    };
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 3 â€” VERY HIGH NAME + LOCATION
  |--------------------------------------------------------------------------
  |
  | We deliberately require a strong score.
  |
  */

  if (
    best.score >= 0.85 &&
    (
      best.cityMatch ||
      best.stateMatch
    )
  ) {
    return {
      status: 'matched',

      college:
        best.college,

      matchType:
        'high_confidence_name_location',

      confidence:
        best.score,

      cityMatch:
        best.cityMatch,

      stateMatch:
        best.stateMatch,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 4 â€” STRONG NAME + BOTH LOCATION FIELDS
  |--------------------------------------------------------------------------
  */

  if (
    best.score >= 0.75 &&
    best.cityMatch &&
    best.stateMatch
  ) {
    return {
      status: 'matched',

      college:
        best.college,

      matchType:
        'strong_name_city_state',

      confidence:
        best.score,

      cityMatch: true,
      stateMatch: true,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 5 â€” MANUAL REVIEW
  |--------------------------------------------------------------------------
  |
  | Candidate looks plausible but is NOT safe enough
  | for automatic database insertion.
  |
  */

  if (
    best.score >= 0.55
  ) {
    return {
      status:
        'manual_review',

      candidates:
        candidates
          .slice(0, 5)
          .map(
            (candidate) => ({
              college_id:
                candidate.college.id,

              database_name:
                candidate.college.name,

              city:
                candidate.college.city,

              state:
                candidate.college.state,

              name_score:
                Number(
                  candidate.score.toFixed(3)
                ),

              city_match:
                candidate.cityMatch,

              state_match:
                candidate.stateMatch,
            })
          ),

      bestScore:
        best.score,

      secondScore:
        second?.score || 0,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | STEP 6 â€” UNMATCHED
  |--------------------------------------------------------------------------
  */

  return {
    status:
      'unmatched',

    candidates:
      candidates
        .slice(0, 3)
        .map(
          (candidate) => ({
            college_id:
              candidate.college.id,

            database_name:
              candidate.college.name,

            city:
              candidate.college.city,

            state:
              candidate.college.state,

            name_score:
              Number(
                candidate.score.toFixed(3)
              ),
          })
        ),
  };
}


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log('');
  console.log(
    '======================================='
  );

  console.log(
    'FULL NIRF SAFE MATCHER'
  );

  console.log(
    '======================================='
  );

  console.log('');

  console.log(
    '[MATCH] Reading:',
    INPUT_FILE
  );


  /*
  |--------------------------------------------------------------------------
  | READ NIRF
  |--------------------------------------------------------------------------
  */

  let raw =
    await fs.readFile(
      INPUT_FILE,
      'utf8'
    );

  raw =
    raw.replace(
      /^\uFEFF/,
      ''
    );

  const nirfRows =
    JSON.parse(raw);


  if (
    !Array.isArray(
      nirfRows
    )
  ) {
    throw new Error(
      'NIRF JSON must contain an array.'
    );
  }


  console.log(
    '[MATCH] NIRF records:',
    nirfRows.length
  );


  /*
  |--------------------------------------------------------------------------
  | LOAD DATABASE COLLEGES
  |--------------------------------------------------------------------------
  */

  const result =
    await pool.query(`
      SELECT
        id,
        name,
        city,
        state
      FROM colleges
      ORDER BY name
    `);


  const colleges =
    result.rows;


  console.log(
    '[MATCH] Database colleges:',
    colleges.length
  );


  /*
  |--------------------------------------------------------------------------
  | MATCH
  |--------------------------------------------------------------------------
  */

  const matched = [];

  const manualReview = [];

  const unmatched = [];


  for (const nirf of nirfRows) {
    const match =
      findMatch(
        nirf,
        colleges
      );


    if (
      match.status ===
      'matched'
    ) {
      matched.push({
        ...nirf,

        college_id:
          match.college.id,

        database_name:
          match.college.name,

        database_city:
          match.college.city,

        database_state:
          match.college.state,

        match_type:
          match.matchType,

        match_confidence:
          Number(
            match.confidence.toFixed(3)
          ),

        city_match:
          match.cityMatch,

        state_match:
          match.stateMatch,
      });

      continue;
    }


    if (
      match.status ===
      'manual_review'
    ) {
      manualReview.push({
        ...nirf,

        best_score:
          Number(
            match.bestScore.toFixed(3)
          ),

        candidates:
          match.candidates,
      });

      continue;
    }


    unmatched.push({
      ...nirf,

      candidates:
        match.candidates,
    });
  }


  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  console.log('');
  console.log(
    '---------------------------------------'
  );

  console.log(
    'FULL NIRF MATCH SUMMARY'
  );

  console.log(
    '---------------------------------------'
  );


  console.table([
    {
      status:
        'Source NIRF',

      count:
        nirfRows.length,
    },

    {
      status:
        'Matched',

      count:
        matched.length,
    },

    {
      status:
        'Manual review',

      count:
        manualReview.length,
    },

    {
      status:
        'Unmatched',

      count:
        unmatched.length,
    },
  ]);


  /*
  |--------------------------------------------------------------------------
  | BREAKDOWN BY NIRF GROUP
  |--------------------------------------------------------------------------
  */

  const groups = [
    '1-100',
    '101-150',
    '151-200',
    '201-300',
  ];


  function getGroup(row) {
    if (
      row.nirf_rank != null
    ) {
      return '1-100';
    }

    return row.rank_band;
  }


  console.log('');
  console.log(
    'MATCHED BY NIRF GROUP'
  );


  console.table(
    groups.map(
      (group) => ({
        group,

        matched:
          matched.filter(
            (row) =>
              getGroup(row) ===
              group
          ).length,

        manual_review:
          manualReview.filter(
            (row) =>
              getGroup(row) ===
              group
          ).length,

        unmatched:
          unmatched.filter(
            (row) =>
              getGroup(row) ===
              group
          ).length,
      })
    )
  );


  /*
  |--------------------------------------------------------------------------
  | SAMPLE MATCHES
  |--------------------------------------------------------------------------
  */

  console.log('');
  console.log(
    'SAMPLE SAFE MATCHES'
  );


  console.table(
    matched
      .slice(0, 30)
      .map(
        (row) => ({
          nirf:
            row.college_name,

          database:
            row.database_name,

          college_id:
            row.college_id,

          rank:
            row.nirf_rank,

          band:
            row.rank_band,

          type:
            row.match_type,

          confidence:
            row.match_confidence,

          city:
            row.city_match,

          state:
            row.state_match,
        })
      )
  );


  /*
  |--------------------------------------------------------------------------
  | SAVE REPORTS
  |--------------------------------------------------------------------------
  */

  await fs.writeFile(
    MATCHED_FILE,

    JSON.stringify(
      matched,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    REVIEW_FILE,

    JSON.stringify(
      manualReview,
      null,
      2
    ),

    'utf8'
  );


  await fs.writeFile(
    UNMATCHED_FILE,

    JSON.stringify(
      unmatched,
      null,
      2
    ),

    'utf8'
  );


  console.log('');
  console.log(
    '[MATCH] Matched report:'
  );

  console.log(
    MATCHED_FILE
  );


  console.log('');
  console.log(
    '[MATCH] Manual-review report:'
  );

  console.log(
    REVIEW_FILE
  );


  console.log('');
  console.log(
    '[MATCH] Unmatched report:'
  );

  console.log(
    UNMATCHED_FILE
  );


  console.log('');
  console.log(
    'IMPORTANT: DATABASE HAS NOT BEEN MODIFIED.'
  );

  console.log(
    'Existing recommendation logic has NOT been modified.'
  );

  console.log('');
}


/*
|--------------------------------------------------------------------------
| RUN
|--------------------------------------------------------------------------
*/

main()
  .catch(
    (error) => {
      console.error(
        '[FULL NIRF MATCH] FAILED:',
        error.message
      );

      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await pool.end();
    }
  );