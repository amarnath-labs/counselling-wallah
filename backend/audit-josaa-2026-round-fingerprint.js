import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const INPUT =
  './josaa-2026-all-rounds-normalized.json';

function normalizeText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCollege(value) {
  let text =
    normalizeText(value);

  /*
  |--------------------------------------------------------------------------
  | Known canonical alias
  |--------------------------------------------------------------------------
  */

  if (
    text ===
    'iit gandhinagar'
  ) {
    return (
      'indian institute of technology gandhinagar'
    );
  }

  return text;
}

function profileKey(row) {
  return [
    normalizeCollege(
      row.institute ??
      row.college_name
    ),

    normalizeText(
      row.academicProgram ??
      row.branch_name
    ),

    normalizeText(
      row.seatType ??
      row.category
    ),

    normalizeText(
      row.quota
    ),

    normalizeText(
      row.gender
    ),
  ].join('|');
}

const source =
  JSON.parse(
    fs.readFileSync(
      INPUT,
      'utf8'
    )
  );

const officialRows =
  source.rows.filter(
    row =>
      row.rankRecordType ===
        'STANDARD' &&
      row.usableForStandardPrediction ===
        true
  );

const officialByProfile =
  new Map();

for (
  const row
  of officialRows
) {
  const key =
    profileKey(row);

  if (
    !officialByProfile.has(key)
  ) {
    officialByProfile.set(
      key,
      new Map()
    );
  }

  officialByProfile
    .get(key)
    .set(
      String(row.round),
      row
    );
}

try {

  const result =
    await pool.query(`
      SELECT
        co.id AS cutoff_id,
        co.round,
        co.opening_rank,
        co.closing_rank,
        co.source_label,
        co.verification_status,

        c.name AS college_name,
        b.name AS branch_name,

        co.category,
        co.quota,
        co.gender

      FROM cutoffs co

      JOIN branches b
        ON b.id =
           co.branch_id

      JOIN colleges c
        ON c.id =
           b.college_id

      WHERE co.year = 2026

        AND UPPER(
          COALESCE(
            co.counselling_type,
            ''
          )
        ) = 'JOSAA'

        AND co.round = '1'

        AND co.opening_rank
              IS NOT NULL

        AND co.closing_rank
              IS NOT NULL

      ORDER BY
        co.id
    `);

  const dbRows =
    result.rows;

  console.log(
    '\n========================================'
  );

  console.log(
    'JOSAA 2026 OLD ROUND-1 FINGERPRINT'
  );

  console.log(
    '========================================\n'
  );

  console.log(
    'DB rows tested:',
    dbRows.length
  );


  /*
  |--------------------------------------------------------------------------
  | Match counters
  |--------------------------------------------------------------------------
  */

  const stats = {};

  for (
    const round
    of ['1','2','3','4','5']
  ) {
    stats[round] = {
      round,
      comparable:
        0,

      exactPair:
        0,

      openingOnly:
        0,

      closingOnly:
        0,

      neither:
        0,
    };
  }


  const unmatchedProfiles = [];

  const multiRoundExact = [];

  const samples = [];


  for (
    const db
    of dbRows
  ) {

    const key =
      profileKey(db);

    const rounds =
      officialByProfile.get(
        key
      );

    if (!rounds) {
      unmatchedProfiles.push(
        db
      );

      continue;
    }

    const exactRounds = [];

    for (
      const round
      of ['1','2','3','4','5']
    ) {

      const official =
        rounds.get(round);

      if (!official) {
        continue;
      }

      stats[round]
        .comparable += 1;

      const dbOpening =
        Number(
          db.opening_rank
        );

      const dbClosing =
        Number(
          db.closing_rank
        );

      const openingSame =
        dbOpening ===
        official.openingRank;

      const closingSame =
        dbClosing ===
        official.closingRank;

      if (
        openingSame &&
        closingSame
      ) {

        stats[round]
          .exactPair += 1;

        exactRounds.push(
          round
        );

      } else if (
        openingSame
      ) {

        stats[round]
          .openingOnly += 1;

      } else if (
        closingSame
      ) {

        stats[round]
          .closingOnly += 1;

      } else {

        stats[round]
          .neither += 1;
      }
    }


    if (
      exactRounds.length > 1
    ) {

      multiRoundExact.push({
        cutoffId:
          db.cutoff_id,

        college:
          db.college_name,

        branch:
          db.branch_name,

        category:
          db.category,

        quota:
          db.quota,

        gender:
          db.gender,

        dbOpening:
          Number(
            db.opening_rank
          ),

        dbClosing:
          Number(
            db.closing_rank
          ),

        exactRounds:
          exactRounds.join(','),
      });
    }


    if (
      samples.length < 30
    ) {

      const comparison = {};

      for (
        const round
        of ['1','2','3','4','5']
      ) {

        const official =
          rounds.get(round);

        if (!official) {
          comparison[round] =
            null;

          continue;
        }

        comparison[round] = {
          opening:
            official.openingRank,

          closing:
            official.closingRank,
        };
      }

      samples.push({
        cutoffId:
          db.cutoff_id,

        college:
          db.college_name,

        branch:
          db.branch_name,

        category:
          db.category,

        quota:
          db.quota,

        gender:
          db.gender,

        dbOpening:
          Number(
            db.opening_rank
          ),

        dbClosing:
          Number(
            db.closing_rank
          ),

        officialRounds:
          comparison,

        exactRounds,
      });
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Rank rounds by exact-pair matches
  |--------------------------------------------------------------------------
  */

  const summary =
    Object.values(
      stats
    )
      .map(
        row => ({
          ...row,

          exactPercent:
            row.comparable
              ? Number(
                  (
                    row.exactPair /
                    row.comparable *
                    100
                  ).toFixed(2)
                )
              : 0,
        })
      )
      .sort(
        (a, b) =>
          b.exactPair -
          a.exactPair
      );


  console.log(
    '\nOFFICIAL ROUND MATCH FINGERPRINT'
  );

  console.table(
    summary
  );


  console.log(
    '\nProfiles not found in official normalized data:',
    unmatchedProfiles.length
  );

  console.log(
    'Rows matching multiple official rounds exactly:',
    multiRoundExact.length
  );


  console.log(
    '\nFIRST 20 MULTI-ROUND EXACT MATCHES'
  );

  console.table(
    multiRoundExact.slice(
      0,
      20
    )
  );


  fs.writeFileSync(
    './josaa-2026-round-fingerprint-audit.json',
    JSON.stringify(
      {
        generatedAt:
          new Date()
            .toISOString(),

        readOnly:
          true,

        dbRowsTested:
          dbRows.length,

        summary,

        unmatchedProfileCount:
          unmatchedProfiles.length,

        unmatchedProfileSamples:
          unmatchedProfiles.slice(
            0,
            100
          ),

        multiRoundExactCount:
          multiRoundExact.length,

        multiRoundExactSamples:
          multiRoundExact.slice(
            0,
            100
          ),

        samples,
      },
      null,
      2
    ),
    'utf8'
  );


  console.log(
    '\nSaved:'
  );

  console.log(
    './josaa-2026-round-fingerprint-audit.json'
  );

  console.log(
    '\nNO DATABASE CHANGES MADE.'
  );

} finally {

  await pool.end();
}