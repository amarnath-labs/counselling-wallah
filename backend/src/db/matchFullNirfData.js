import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';

import { pool } from './pool.js';

import {
  findCollegeMatch,
  normalizeCollegeName,
} from './collegeNameMatcher.js';


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
| MATCHING ENGINE:
|   collegeNameMatcher.js
|
| SAFE ORDER:
|   1. Exact normalized name
|   2. Verified alias
|   3. Conservative fuzzy >= 0.85
|
| IMPORTANT:
| - READ ONLY
| - DOES NOT modify database
| - DOES NOT modify recommendation logic
| - DOES NOT modify cutoff logic
| - DOES NOT modify frontend
|
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| FILES
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
| LOCATION NORMALIZATION
|--------------------------------------------------------------------------
*/

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
| TOKEN SIMILARITY
|--------------------------------------------------------------------------
|
| This is NOT used to auto-match.
|
| It is only used to generate useful candidate lists
| for manual review / unmatched reports.
|
|--------------------------------------------------------------------------
*/

function tokenize(value) {
  return new Set(
    normalizeCollegeName(value)
      .split(' ')
      .filter(Boolean)
  );
}


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


  return union > 0
    ? intersection / union
    : 0;
}


/*
|--------------------------------------------------------------------------
| BUILD REVIEW CANDIDATES
|--------------------------------------------------------------------------
|
| Important:
|
| Candidate scores DO NOT automatically create a match.
|
| They are only informational.
|
|--------------------------------------------------------------------------
*/

function buildCandidates(
  nirf,
  colleges,
  limit = 5
) {
  return colleges
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
    )

    .slice(
      0,
      limit
    );
}


/*
|--------------------------------------------------------------------------
| FORMAT CANDIDATES
|--------------------------------------------------------------------------
*/

function formatCandidates(
  candidates
) {
  return candidates.map(
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
  );
}


/*
|--------------------------------------------------------------------------
| FIND MATCH
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| Automatic matching is delegated to:
|
|     collegeNameMatcher.js
|
| Therefore there is ONE central source of truth.
|
|--------------------------------------------------------------------------
*/

function findMatch(
  nirf,
  colleges
) {
  /*
  |--------------------------------------------------------------------------
  | CENTRAL MATCHER
  |--------------------------------------------------------------------------
  */

  const centralMatch =
    findCollegeMatch(
      nirf.college_name,
      colleges
    );


  /*
  |--------------------------------------------------------------------------
  | CENTRAL MATCHER FOUND A COLLEGE
  |--------------------------------------------------------------------------
  */

  if (centralMatch.college) {
    const location =
      locationMatches(
        nirf,
        centralMatch.college
      );


    /*
    |--------------------------------------------------------------------------
    | EXACT / VERIFIED ALIAS
    |--------------------------------------------------------------------------
    |
    | These are trusted by the central matcher.
    |
    */

    if (
      centralMatch.matchType ===
        'exact' ||
      centralMatch.matchType ===
        'verified_alias'
    ) {
      return {
        status:
          'matched',

        college:
          centralMatch.college,

        matchType:
          centralMatch.matchType,

        confidence:
          centralMatch.score,

        ...location,
      };
    }


    /*
    |--------------------------------------------------------------------------
    | FUZZY SAFETY CHECK
    |--------------------------------------------------------------------------
    |
    | collegeNameMatcher already requires >= 0.85.
    |
    | Full NIRF matcher adds another safety layer:
    | city OR state must agree.
    |
    */

    if (
      centralMatch.matchType ===
        'fuzzy' &&
      (
        location.cityMatch ||
        location.stateMatch
      )
    ) {
      return {
        status:
          'matched',

        college:
          centralMatch.college,

        matchType:
          'safe_fuzzy_location',

        confidence:
          centralMatch.score,

        ...location,
      };
    }
  }


  /*
  |--------------------------------------------------------------------------
  | NOT SAFE ENOUGH FOR AUTOMATIC MATCH
  |--------------------------------------------------------------------------
  |
  | Generate candidates only for review.
  |
  */

  const candidates =
    buildCandidates(
      nirf,
      colleges,
      5
    );


  const best =
    candidates[0];

  const second =
    candidates[1];


  if (!best) {
    return {
      status:
        'unmatched',

      bestScore: 0,

      secondScore: 0,

      candidates: [],
    };
  }


  /*
  |--------------------------------------------------------------------------
  | MANUAL REVIEW
  |--------------------------------------------------------------------------
  |
  | >= 0.55 is ONLY a review threshold.
  |
  | It does NOT mean matched.
  |
  */

  if (
    best.score >= 0.55
  ) {
    return {
      status:
        'manual_review',

      bestScore:
        best.score,

      secondScore:
        second?.score || 0,

      candidates:
        formatCandidates(
          candidates
        ),
    };
  }


  /*
  |--------------------------------------------------------------------------
  | UNMATCHED
  |--------------------------------------------------------------------------
  */

  return {
    status:
      'unmatched',

    bestScore:
      best.score,

    secondScore:
      second?.score || 0,

    candidates:
      formatCandidates(
        candidates.slice(
          0,
          3
        )
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
    'FULL NIRF CENTRAL SAFE MATCHER'
  );

  console.log(
    '======================================='
  );

  console.log('');


  /*
  |--------------------------------------------------------------------------
  | READ NIRF
  |--------------------------------------------------------------------------
  */

  console.log(
    '[MATCH] Reading:',
    INPUT_FILE
  );


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


    /*
    |--------------------------------------------------------------------------
    | MATCHED
    |--------------------------------------------------------------------------
    */

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


    /*
    |--------------------------------------------------------------------------
    | MANUAL REVIEW
    |--------------------------------------------------------------------------
    */

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

        second_score:
          Number(
            match.secondScore.toFixed(3)
          ),

        candidates:
          match.candidates,
      });

      continue;
    }


    /*
    |--------------------------------------------------------------------------
    | UNMATCHED
    |--------------------------------------------------------------------------
    */

    unmatched.push({
      ...nirf,

      best_score:
        Number(
          (
            match.bestScore || 0
          ).toFixed(3)
        ),

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
  | MATCH TYPE BREAKDOWN
  |--------------------------------------------------------------------------
  */

  const matchTypeCounts =
    new Map();


  for (const row of matched) {
    const type =
      row.match_type;

    matchTypeCounts.set(
      type,
      (
        matchTypeCounts.get(
          type
        ) || 0
      ) + 1
    );
  }


  console.log('');

  console.log(
    'MATCHED BY MATCH TYPE'
  );


  console.table(
    Array.from(
      matchTypeCounts.entries()
    ).map(
      ([type, count]) => ({
        type,
        count,
      })
    )
  );


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
  | SAMPLE SAFE MATCHES
  |--------------------------------------------------------------------------
  */

  console.log('');

  console.log(
    'SAMPLE SAFE MATCHES'
  );


  console.table(
    matched
      .slice(
        0,
        30
      )

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
  | VERIFIED ALIAS MATCHES
  |--------------------------------------------------------------------------
  */

  const aliasMatches =
    matched.filter(
      (row) =>
        row.match_type ===
        'verified_alias'
    );


  console.log('');

  console.log(
    'VERIFIED ALIAS MATCHES'
  );


  if (
    aliasMatches.length > 0
  ) {
    console.table(
      aliasMatches.map(
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

          city:
            row.city_match,

          state:
            row.state_match,
        })
      )
    );
  } else {
    console.log(
      'No verified aliases matched.'
    );
  }


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


  /*
  |--------------------------------------------------------------------------
  | FINAL OUTPUT
  |--------------------------------------------------------------------------
  */

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

  console.log(
    'Central matcher: collegeNameMatcher.js'
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