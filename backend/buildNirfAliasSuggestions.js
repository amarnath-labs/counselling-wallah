import 'dotenv/config';

import fs from 'node:fs/promises';
import { pool } from './src/db/pool.js';


/*
|--------------------------------------------------------------------------
| NIRF ALIAS SUGGESTION BUILDER
|--------------------------------------------------------------------------
|
| SAFE / READ-ONLY
|
| This script:
| - reads nirf-unmatched.json
| - reads colleges table
| - compares names + city/state
| - creates alias suggestions
|
| It DOES NOT:
| - modify database
| - insert NIRF rows
| - change recommendation logic
| - change frontend
|
|--------------------------------------------------------------------------
*/


function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\bthe\b/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


function tokens(value) {
  return new Set(
    normalize(value)
      .split(' ')
      .filter(Boolean)
  );
}


function similarity(a, b) {
  const first = tokens(a);
  const second = tokens(b);

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


function sameLocation(
  nirf,
  college
) {
  const nirfCity =
    normalize(nirf.city);

  const nirfState =
    normalize(nirf.state);

  const dbCity =
    normalize(college.city);

  const dbState =
    normalize(college.state);

  const cityMatch =
    nirfCity &&
    dbCity &&
    (
      nirfCity === dbCity ||
      nirfCity.includes(dbCity) ||
      dbCity.includes(nirfCity)
    );

  const stateMatch =
    nirfState &&
    dbState &&
    (
      nirfState === dbState ||
      nirfState.includes(dbState) ||
      dbState.includes(nirfState)
    );

  return {
    cityMatch:
      Boolean(cityMatch),

    stateMatch:
      Boolean(stateMatch),
  };
}


function classifySuggestion(
  nirf,
  candidate
) {
  if (!candidate) {
    return 'missing_from_db';
  }

  const location =
    sameLocation(
      nirf,
      candidate
    );

  const score =
    candidate.score;


  /*
  |--------------------------------------------------------------------------
  | VERY STRONG NAME + LOCATION
  |--------------------------------------------------------------------------
  */

  if (
    score >= 0.80 &&
    location.stateMatch &&
    location.cityMatch
  ) {
    return 'strong_alias_candidate';
  }


  /*
  |--------------------------------------------------------------------------
  | STRONG NAME + SAME STATE
  |--------------------------------------------------------------------------
  */

  if (
    score >= 0.75 &&
    location.stateMatch
  ) {
    return 'alias_candidate';
  }


  /*
  |--------------------------------------------------------------------------
  | MEDIUM NAME + EXACT LOCATION
  |--------------------------------------------------------------------------
  */

  if (
    score >= 0.60 &&
    location.stateMatch &&
    location.cityMatch
  ) {
    return 'manual_alias_review';
  }


  /*
  |--------------------------------------------------------------------------
  | LOW SCORE / WRONG LOCATION
  |--------------------------------------------------------------------------
  */

  if (
    score < 0.50
  ) {
    return 'likely_missing_from_db';
  }

  return 'manual_review';
}


async function main() {
  console.log('');

  console.log(
    '======================================='
  );

  console.log(
    'NIRF ALIAS SUGGESTION BUILDER'
  );

  console.log(
    '======================================='
  );

  console.log('');


  /*
  |--------------------------------------------------------------------------
  | LOAD UNMATCHED NIRF
  |--------------------------------------------------------------------------
  */

  const raw =
    await fs.readFile(
      './nirf-unmatched.json',
      'utf8'
    );

  const unmatched =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ''
      )
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
    'Unmatched NIRF rows:',
    unmatched.length
  );

  console.log(
    'Database colleges:',
    colleges.length
  );

  console.log('');


  const report = [];


  /*
  |--------------------------------------------------------------------------
  | BUILD CANDIDATES
  |--------------------------------------------------------------------------
  */

  for (const nirf of unmatched) {
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
              sameLocation(
                nirf,
                college
              );

            return {
              ...college,

              score,

              city_match:
                location.cityMatch,

              state_match:
                location.stateMatch,
            };
          }
        )
        .sort(
          (a, b) => {
            /*
            |--------------------------------------------------------------------------
            | Prefer:
            | 1. higher name similarity
            | 2. same state
            | 3. same city
            |--------------------------------------------------------------------------
            */

            if (
              b.score !==
              a.score
            ) {
              return (
                b.score -
                a.score
              );
            }

            if (
              b.state_match !==
              a.state_match
            ) {
              return (
                Number(
                  b.state_match
                ) -
                Number(
                  a.state_match
                )
              );
            }

            return (
              Number(
                b.city_match
              ) -
              Number(
                a.city_match
              )
            );
          }
        )
        .slice(
          0,
          5
        );


    const best =
      candidates[0] || null;


    const action =
      classifySuggestion(
        nirf,
        best
      );


    report.push({
      nirf_rank:
        nirf.nirf_rank,

      nirf_name:
        nirf.college_name,

      nirf_city:
        nirf.city,

      nirf_state:
        nirf.state,

      nirf_score:
        nirf.nirf_score,

      recommended_action:
        action,

      best_candidate:
        best
          ? {
              college_id:
                best.id,

              database_name:
                best.name,

              database_city:
                best.city,

              database_state:
                best.state,

              similarity:
                Number(
                  best.score.toFixed(
                    3
                  )
                ),

              city_match:
                best.city_match,

              state_match:
                best.state_match,
            }
          : null,

      top_candidates:
        candidates.map(
          (candidate) => ({
            college_id:
              candidate.id,

            database_name:
              candidate.name,

            database_city:
              candidate.city,

            database_state:
              candidate.state,

            similarity:
              Number(
                candidate.score.toFixed(
                  3
                )
              ),

            city_match:
              candidate.city_match,

            state_match:
              candidate.state_match,
          })
        ),
    });
  }


  /*
  |--------------------------------------------------------------------------
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const summary = {};

  for (const row of report) {
    const key =
      row.recommended_action;

    summary[key] =
      (
        summary[key] || 0
      ) + 1;
  }


  console.log(
    '---------------------------------------'
  );

  console.log(
    'SUGGESTION SUMMARY'
  );

  console.log(
    '---------------------------------------'
  );

  console.table(
    Object.entries(
      summary
    ).map(
      ([action, count]) => ({
        action,
        count,
      })
    )
  );


  /*
  |--------------------------------------------------------------------------
  | SHOW POTENTIAL ALIASES ONLY
  |--------------------------------------------------------------------------
  */

  const aliasCandidates =
    report.filter(
      (row) =>
        row.recommended_action ===
          'strong_alias_candidate' ||
        row.recommended_action ===
          'alias_candidate' ||
        row.recommended_action ===
          'manual_alias_review'
    );


  console.log('');

  console.log(
    '---------------------------------------'
  );

  console.log(
    'POTENTIAL SAFE ALIASES'
  );

  console.log(
    '---------------------------------------'
  );


  console.table(
    aliasCandidates.map(
      (row) => ({
        rank:
          row.nirf_rank,

        nirf_name:
          row.nirf_name,

        nirf_location:
          `${row.nirf_city}, ${row.nirf_state}`,

        database_name:
          row.best_candidate
            ?.database_name,

        database_location:
          row.best_candidate
            ? `${row.best_candidate.database_city}, ${row.best_candidate.database_state}`
            : null,

        similarity:
          row.best_candidate
            ?.similarity,

        city_match:
          row.best_candidate
            ?.city_match,

        state_match:
          row.best_candidate
            ?.state_match,

        action:
          row.recommended_action,
      })
    )
  );


  /*
  |--------------------------------------------------------------------------
  | SAVE FULL REPORT
  |--------------------------------------------------------------------------
  */

  await fs.writeFile(
    './nirf-alias-suggestions.json',

    JSON.stringify(
      report,
      null,
      2
    ),

    'utf8'
  );


  console.log('');

  console.log(
    '[ALIAS] Full report saved:'
  );

  console.log(
    './nirf-alias-suggestions.json'
  );

  console.log('');

  console.log(
    'IMPORTANT: Database has NOT been modified.'
  );

  console.log('');
}


main()
  .catch(
    (error) => {
      console.error(
        '[ALIAS] FAILED:',
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