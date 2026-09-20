import 'dotenv/config';

import fs from 'node:fs/promises';
import path from 'node:path';

import axios from 'axios';
import * as cheerio from 'cheerio';

console.log('[DEBUG] fetchNirfData.js loaded');


/*
|--------------------------------------------------------------------------
| NIRF 2025 ENGINEERING COLLECTOR
|--------------------------------------------------------------------------
|
| SAFE / ADDITIVE ONLY
|
| This file:
| - DOES NOT modify database
| - DOES NOT modify recommendation logic
| - DOES NOT modify frontend
|
| It only downloads official NIRF data
| and creates a JSON file.
|
|--------------------------------------------------------------------------
*/

const NIRF_URL =
  'https://www.nirfindia.org/Rankings/2025/EngineeringRanking.html';

const OUTPUT_FILE =
  path.resolve(
    process.cwd(),
    'data',
    'nirf-2025-engineering.json'
  );


/*
|--------------------------------------------------------------------------
| CLEAN TEXT
|--------------------------------------------------------------------------
*/

function cleanText(value) {
  return String(
    value || ''
  )
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}


/*
|--------------------------------------------------------------------------
| NUMBER PARSER
|--------------------------------------------------------------------------
*/

function parseNumber(value) {
  const cleaned =
    cleanText(value)
      .replace(/,/g, '');

  if (!cleaned) {
    return null;
  }

  const number =
    Number(cleaned);

  return Number.isFinite(number)
    ? number
    : null;
}


/*
|--------------------------------------------------------------------------
| CLEAN INSTITUTE NAME
|--------------------------------------------------------------------------
*/

function cleanCollegeName(value) {
  return cleanText(value)
    .replace(
      /More\s*Details/gi,
      ' '
    )
    .replace(
      /\bClose\b/gi,
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
| FETCH HTML
|--------------------------------------------------------------------------
*/

async function fetchHtml() {
  console.log(
    '[NIRF FETCH] Downloading official NIRF page...'
  );

  const response =
    await axios.get(
      NIRF_URL,
      {
        timeout: 30000,

        headers: {
          'User-Agent':
            'Mozilla/5.0 CounsellingWallah/1.0',

          Accept:
            'text/html,application/xhtml+xml',
        },
      }
    );

  console.log(
    '[NIRF FETCH] HTTP status:',
    response.status
  );

  return response.data;
}


/*
|--------------------------------------------------------------------------
| EXTRACT COLLEGE NAME
|--------------------------------------------------------------------------
|
| NIRF cell[1] contains both the institute name
| and hidden "More Details" metric content.
|
| Example:
|
| Indian Institute of Technology Madras
| More Details
| Close
| TLR (100)...
|
| We keep only the institute name.
|
|--------------------------------------------------------------------------
*/

function extractCollegeName(
  $,
  cell
) {
  const clone =
    $(cell).clone();

  /*
  |--------------------------------------------------------------------------
  | Remove elements that commonly contain hidden details
  |--------------------------------------------------------------------------
  */

  clone
    .find(
      'script, style, button'
    )
    .remove();

  let text =
    cleanText(
      clone.text()
    );

  /*
  |--------------------------------------------------------------------------
  | Cut everything after More Details
  |--------------------------------------------------------------------------
  */

  text =
    text
      .split(
        /More\s*Details/i
      )[0];

  /*
  |--------------------------------------------------------------------------
  | Fallback protection
  |--------------------------------------------------------------------------
  */

  text =
    text
      .split(
        /Close\s*\|/i
      )[0];

  text =
    text
      .split(
        /TLR\s*\(100\)/i
      )[0];

  return cleanCollegeName(
    text
  );
}


/*
|--------------------------------------------------------------------------
| PARSE NIRF TABLE
|--------------------------------------------------------------------------
|
| Confirmed NIRF 2025 Engineering row structure:
|
| [0]  Institute ID
| [1]  Institute Name + hidden details
| [2]  TLR
| [3]  RPC
| [4]  GO
| [5]  OI
| [6]  Perception
| [7]  City
| [8]  State
| [9]  NIRF Score
| [10] NIRF Rank
|
|--------------------------------------------------------------------------
*/

function parseNirfRows(html) {
  const $ =
    cheerio.load(
      html
    );

  const rows = [];

  $('table tbody tr').each(
    (
      index,
      element
    ) => {
      const cells =
        $(element)
          .find('td');

      /*
      |--------------------------------------------------------------------------
      | We require the complete 11-column NIRF ranking row
      |--------------------------------------------------------------------------
      */

      if (
        cells.length < 11
      ) {
        return;
      }


      /*
      |--------------------------------------------------------------------------
      | INSTITUTE ID
      |--------------------------------------------------------------------------
      */

      const instituteId =
        cleanText(
          $(cells[0]).text()
        );

      /*
      |--------------------------------------------------------------------------
      | Engineering institute IDs start with IR-E-
      |--------------------------------------------------------------------------
      */

      if (
        !instituteId ||
        !instituteId.startsWith(
          'IR-E-'
        )
      ) {
        return;
      }


      /*
      |--------------------------------------------------------------------------
      | COLLEGE NAME
      |--------------------------------------------------------------------------
      */

      const collegeName =
        extractCollegeName(
          $,
          cells[1]
        );


      /*
      |--------------------------------------------------------------------------
      | OPTIONAL NIRF COMPONENT SCORES
      |--------------------------------------------------------------------------
      |
      | These are collected for validation/debugging.
      | They are NOT currently used by recommendation logic.
      |
      |--------------------------------------------------------------------------
      */

      const tlrScore =
        parseNumber(
          $(cells[2]).text()
        );

      const rpcScore =
        parseNumber(
          $(cells[3]).text()
        );

      const goScore =
        parseNumber(
          $(cells[4]).text()
        );

      const oiScore =
        parseNumber(
          $(cells[5]).text()
        );

      const perceptionScore =
        parseNumber(
          $(cells[6]).text()
        );


      /*
      |--------------------------------------------------------------------------
      | CORRECT NIRF LOCATION COLUMNS
      |--------------------------------------------------------------------------
      */

      const city =
        cleanText(
          $(cells[7]).text()
        );

      const state =
        cleanText(
          $(cells[8]).text()
        );


      /*
      |--------------------------------------------------------------------------
      | CORRECT NIRF FINAL SCORE + RANK
      |--------------------------------------------------------------------------
      */

      const score =
        parseNumber(
          $(cells[9]).text()
        );

      const rank =
        parseNumber(
          $(cells[10]).text()
        );


      /*
      |--------------------------------------------------------------------------
      | REQUIRED FIELD VALIDATION
      |--------------------------------------------------------------------------
      */

      if (
        !collegeName ||
        !city ||
        !state ||
        score === null ||
        rank === null
      ) {
        console.warn(
          '[NIRF FETCH] Skipping malformed row:',
          {
            index,
            instituteId,
            collegeName,
            city,
            state,
            score,
            rank,
          }
        );

        return;
      }


      /*
      |--------------------------------------------------------------------------
      | RANK SANITY CHECK
      |--------------------------------------------------------------------------
      */

      if (
        !Number.isInteger(
          rank
        ) ||
        rank <= 0 ||
        rank > 10000
      ) {
        console.warn(
          '[NIRF FETCH] Invalid rank:',
          {
            instituteId,
            collegeName,
            rank,
          }
        );

        return;
      }


      /*
      |--------------------------------------------------------------------------
      | SCORE SANITY CHECK
      |--------------------------------------------------------------------------
      */

      if (
        score < 0 ||
        score > 100
      ) {
        console.warn(
          '[NIRF FETCH] Invalid score:',
          {
            instituteId,
            collegeName,
            score,
          }
        );

        return;
      }


      /*
      |--------------------------------------------------------------------------
      | COMPONENT SCORE SANITY CHECK
      |--------------------------------------------------------------------------
      */

      const componentScores = [
        tlrScore,
        rpcScore,
        goScore,
        oiScore,
        perceptionScore,
      ];

      const invalidComponent =
        componentScores.some(
          (value) =>
            value !== null &&
            (
              value < 0 ||
              value > 100
            )
        );

      if (invalidComponent) {
        console.warn(
          '[NIRF FETCH] Invalid component score:',
          {
            instituteId,
            collegeName,
            tlrScore,
            rpcScore,
            goScore,
            oiScore,
            perceptionScore,
          }
        );

        return;
      }


      /*
      |--------------------------------------------------------------------------
      | FINAL NORMALIZED ROW
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      |
      | Existing importer-compatible fields remain:
      |
      | institute_id
      | college_name
      | city
      | state
      | nirf_rank
      | nirf_score
      | academic_year
      | ranking_category
      | source_label
      | source_url
      | verification_status
      |
      | Component scores are extra/additive JSON information only.
      |
      |--------------------------------------------------------------------------
      */

      rows.push({
        institute_id:
          instituteId,

        college_name:
          collegeName,

        city,

        state,

        nirf_rank:
          rank,

        nirf_score:
          score,

        tlr_score:
          tlrScore,

        rpc_score:
          rpcScore,

        graduation_outcomes_score:
          goScore,

        outreach_inclusivity_score:
          oiScore,

        perception_score:
          perceptionScore,

        academic_year:
          2025,

        ranking_category:
          'Engineering',

        source_label:
          'NIRF 2025 Engineering',

        source_url:
          NIRF_URL,

        verification_status:
          'verified',
      });
    }
  );

  return rows;
}


/*
|--------------------------------------------------------------------------
| REMOVE DUPLICATES
|--------------------------------------------------------------------------
*/

function deduplicateRows(
  rows
) {
  const seen =
    new Set();

  const result = [];

  for (
    const row
    of rows
  ) {
    const key =
      `${row.institute_id}|${row.nirf_rank}`;

    if (
      seen.has(
        key
      )
    ) {
      continue;
    }

    seen.add(
      key
    );

    result.push(
      row
    );
  }

  return result;
}


/*
|--------------------------------------------------------------------------
| BASIC VALIDATION
|--------------------------------------------------------------------------
*/

function validateRows(
  rows
) {
  if (
    rows.length === 0
  ) {
    throw new Error(
      'No NIRF rows were parsed.'
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Protect against accidentally parsing wrong table
  |--------------------------------------------------------------------------
  */

  if (
    rows.length < 10
  ) {
    throw new Error(
      `Suspicious NIRF result: only ${rows.length} rows parsed.`
    );
  }


  for (
    const row
    of rows
  ) {
    if (
      !row.institute_id
    ) {
      throw new Error(
        'A NIRF row has no institute_id.'
      );
    }


    if (
      !row.college_name
    ) {
      throw new Error(
        'A NIRF row has no college_name.'
      );
    }


    if (
      !row.city
    ) {
      throw new Error(
        `Missing city for ${row.college_name}`
      );
    }


    if (
      !row.state
    ) {
      throw new Error(
        `Missing state for ${row.college_name}`
      );
    }


    if (
      !Number.isFinite(
        row.nirf_rank
      )
    ) {
      throw new Error(
        `Invalid NIRF rank for ${row.college_name}`
      );
    }


    if (
      !Number.isInteger(
        row.nirf_rank
      )
    ) {
      throw new Error(
        `Non-integer NIRF rank for ${row.college_name}: ${row.nirf_rank}`
      );
    }


    if (
      !Number.isFinite(
        row.nirf_score
      )
    ) {
      throw new Error(
        `Invalid NIRF score for ${row.college_name}`
      );
    }


    if (
      row.nirf_score < 0 ||
      row.nirf_score > 100
    ) {
      throw new Error(
        `Out-of-range NIRF score for ${row.college_name}: ${row.nirf_score}`
      );
    }
  }
}


/*
|--------------------------------------------------------------------------
| SORT RESULTS
|--------------------------------------------------------------------------
*/

function sortRows(
  rows
) {
  return [
    ...rows,
  ].sort(
    (a, b) =>
      a.nirf_rank -
      b.nirf_rank
  );
}


/*
|--------------------------------------------------------------------------
| SAVE JSON
|--------------------------------------------------------------------------
*/

async function saveJson(
  rows
) {
  const directory =
    path.dirname(
      OUTPUT_FILE
    );

  await fs.mkdir(
    directory,
    {
      recursive:
        true,
    }
  );


  await fs.writeFile(
    OUTPUT_FILE,

    JSON.stringify(
      rows,
      null,
      2
    ),

    'utf8'
  );


  console.log(
    '[NIRF FETCH] JSON saved:'
  );

  console.log(
    OUTPUT_FILE
  );
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
    'NIRF 2025 ENGINEERING COLLECTOR'
  );

  console.log(
    '======================================='
  );

  console.log('');


  const html =
    await fetchHtml();


  console.log(
    '[NIRF FETCH] Parsing ranking table...'
  );


  const parsed =
    parseNirfRows(
      html
    );


  const deduplicated =
    deduplicateRows(
      parsed
    );


  const rows =
    sortRows(
      deduplicated
    );


  validateRows(
    rows
  );


  console.log('');

  console.log(
    '---------------------------------------'
  );

  console.log(
    'NIRF FETCH SUMMARY'
  );

  console.log(
    '---------------------------------------'
  );


  console.log(
    'Rows parsed:',
    rows.length
  );


  /*
  |--------------------------------------------------------------------------
  | SHOW FIRST 20
  |--------------------------------------------------------------------------
  */

  console.table(
    rows
      .slice(
        0,
        20
      )
      .map(
        (row) => ({
          rank:
            row.nirf_rank,

          college:
            row.college_name,

          city:
            row.city,

          state:
            row.state,

          score:
            row.nirf_score,
        })
      )
  );


  /*
  |--------------------------------------------------------------------------
  | QUICK SANITY CHECK
  |--------------------------------------------------------------------------
  */

  const first =
    rows[0];

  if (first) {
    console.log('');

    console.log(
      '[NIRF FETCH] Top-ranked row:'
    );

    console.log({
      rank:
        first.nirf_rank,

      college:
        first.college_name,

      city:
        first.city,

      state:
        first.state,

      score:
        first.nirf_score,
    });
  }


  await saveJson(
    rows
  );


  console.log('');

  console.log(
    'NIRF collection complete.'
  );

  console.log(
    'IMPORTANT: Database has NOT been modified.'
  );

  console.log('');
}


/*
|--------------------------------------------------------------------------
| RUN
|--------------------------------------------------------------------------
*/

main().catch(
  (error) => {
    console.error(
      '[NIRF FETCH] FAILED:',
      error.message
    );

    process.exitCode = 1;
  }
);