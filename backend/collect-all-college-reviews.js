import fs from 'node:fs';
import { pool } from './src/db/pool.js';

const API_BASE =
  process.env.REVIEW_API_BASE ||
  'http://localhost:4000/api';

const STATE_FILE =
  './all-college-review-collection-state.json';

const REPORT_FILE =
  './all-college-review-collection-report.json';


function sleep(ms) {
  return new Promise(
    resolve =>
      setTimeout(
        resolve,
        ms
      )
  );
}


function parseArgs() {
  const args =
    process.argv.slice(2);

  const out = {
    limit: null,
    startAfter: null,
    delayMs: 1500,
    retry: 2,
    onlyMissing: false,
  };

  for (
    let i = 0;
    i < args.length;
    i++
  ) {
    const arg =
      args[i];

    if (
      arg === '--limit'
    ) {
      out.limit =
        Number(
          args[++i]
        ) || null;
    }

    else if (
      arg ===
      '--start-after'
    ) {
      out.startAfter =
        String(
          args[++i] || ''
        ).trim() ||
        null;
    }

    else if (
      arg === '--delay'
    ) {
      out.delayMs =
        Math.max(
          0,
          Number(
            args[++i]
          ) || 0
        );
    }

    else if (
      arg === '--retry'
    ) {
      out.retry =
        Math.max(
          0,
          Number(
            args[++i]
          ) || 0
        );
    }

    else if (
      arg ===
      '--only-missing'
    ) {
      out.onlyMissing =
        true;
    }
  }

  return out;
}


function loadState() {
  if (
    !fs.existsSync(
      STATE_FILE
    )
  ) {
    return {
      completed: {},
      failed: {},
      lastCollegeId: null,
      updatedAt: null,
    };
  }

  try {
    return JSON.parse(
      fs.readFileSync(
        STATE_FILE,
        'utf8'
      )
    );
  }
  catch {
    return {
      completed: {},
      failed: {},
      lastCollegeId: null,
      updatedAt: null,
    };
  }
}


function saveState(
  state
) {
  state.updatedAt =
    new Date()
      .toISOString();

  fs.writeFileSync(
    STATE_FILE,
    JSON.stringify(
      state,
      null,
      2
    ),
    'utf8'
  );
}


async function loadColleges(
  options
) {
  const result =
    await pool.query(
      `
      SELECT
        id::text AS id,
        name
      FROM colleges
      WHERE id IS NOT NULL
        AND name IS NOT NULL
      ORDER BY name ASC
      `
    );

  let colleges =
    result.rows || [];

  if (
    options.startAfter
  ) {
    const index =
      colleges.findIndex(
        college =>
          college.id ===
          options.startAfter
      );

    if (
      index >= 0
    ) {
      colleges =
        colleges.slice(
          index + 1
        );
    }
  }

  if (
    options.limit
  ) {
    colleges =
      colleges.slice(
        0,
        options.limit
      );
  }

  return colleges;
}


async function getExistingStatus(
  collegeId
) {
  const response =
    await fetch(
      `${API_BASE}/review-enrichment/${encodeURIComponent(
        collegeId
      )}/status`
    );

  if (!response.ok) {
    return null;
  }

  return response.json();
}


function readUsableReviews(
  payload
) {
  return Number(
    payload?.standard
      ?.usableReviews ??
    payload?.usableReviews ??
    payload?.after
      ?.standard
      ?.usableReviews ??
    0
  );
}


function readStandardMet(
  payload
) {
  return Boolean(
    payload?.standard
      ?.standardMet ??
    payload?.standardMet ??
    payload?.after
      ?.standard
      ?.standardMet
  );
}


async function fillCollege(
  collegeId
) {
  const response =
    await fetch(
      `${API_BASE}/review-enrichment/${encodeURIComponent(
        collegeId
      )}/fill-to-100`,
      {
        method: 'POST',

        headers: {
          'Content-Type':
            'application/json',
        },

        body:
          JSON.stringify({}),
      }
    );

  const text =
    await response.text();

  let body;

  try {
    body =
      text
        ? JSON.parse(text)
        : {};
  }
  catch {
    body = {
      raw: text,
    };
  }

  if (!response.ok) {
    throw new Error(
      body?.error ||
      body?.message ||
      `HTTP ${response.status}`
    );
  }

  return body;
}


async function collectOne(
  college,
  options
) {
  const before =
    await getExistingStatus(
      college.id
    );

  const beforeCount =
    readUsableReviews(
      before
    );

  const beforeQualified =
    readStandardMet(
      before
    );

  if (
    options.onlyMissing &&
    beforeQualified
  ) {
    return {
      collegeId:
        college.id,

      collegeName:
        college.name,

      skipped:
        true,

      reason:
        'already-qualified',

      beforeReviews:
        beforeCount,

      afterReviews:
        beforeCount,

      standardMet:
        true,
    };
  }

  let lastError = null;

  for (
    let attempt = 0;
    attempt <=
      options.retry;
    attempt++
  ) {
    try {
      const fill =
        await fillCollege(
          college.id
        );

      const after =
        fill?.after ||
        await getExistingStatus(
          college.id
        );

      return {
        collegeId:
          college.id,

        collegeName:
          college.name,

        skipped:
          false,

        beforeReviews:
          beforeCount,

        afterReviews:
          readUsableReviews(
            after
          ),

        standardMet:
          readStandardMet(
            after
          ),

        steps:
          Array.isArray(
            fill?.steps
          )
            ? fill.steps
            : [],
      };
    }
    catch (error) {
      lastError = error;

      if (
        attempt <
        options.retry
      ) {
        await sleep(
          2000 *
          (
            attempt + 1
          )
        );
      }
    }
  }

  throw lastError;
}


async function main() {
  const options =
    parseArgs();

  const state =
    loadState();

  const colleges =
    await loadColleges(
      options
    );

  const report = {
    startedAt:
      new Date()
        .toISOString(),

    options,

    totalSelected:
      colleges.length,

    processed:
      0,

    qualified:
      0,

    skipped:
      0,

    failed:
      0,

    addedReviews:
      0,

    colleges: [],
  };


  console.log('');
  console.log(
    '================================================'
  );
  console.log(
    'TRUMARG ALL-COLLEGE REVIEW COLLECTION'
  );
  console.log(
    '================================================'
  );
  console.log(
    `API: ${API_BASE}`
  );
  console.log(
    `Colleges selected: ${colleges.length}`
  );
  console.log('');


  for (
    let index = 0;
    index <
      colleges.length;
    index++
  ) {
    const college =
      colleges[index];

    if (
      state.completed[
        college.id
      ]
    ) {
      console.log(
        `[${index + 1}/${colleges.length}] SKIP completed: ${college.name}`
      );

      report.skipped++;

      continue;
    }


    console.log('');
    console.log(
      `[${index + 1}/${colleges.length}] ${college.name}`
    );

    console.log(
      `ID: ${college.id}`
    );


    try {
      const result =
        await collectOne(
          college,
          options
        );


      report.processed++;

      report.colleges.push(
        result
      );


      if (
        result.skipped
      ) {
        report.skipped++;

        state.completed[
          college.id
        ] = {
          status:
            'already-qualified',

          at:
            new Date()
              .toISOString(),
        };

        console.log(
          `Already qualified: ${result.afterReviews} reviews`
        );
      }

      else {
        const added =
          Math.max(
            0,
            (
              result.afterReviews ||
              0
            ) -
            (
              result.beforeReviews ||
              0
            )
          );

        report.addedReviews +=
          added;


        if (
          result.standardMet
        ) {
          report.qualified++;
        }


        state.completed[
          college.id
        ] = {
          status:
            result.standardMet
              ? 'qualified'
              : 'processed',

          beforeReviews:
            result.beforeReviews,

          afterReviews:
            result.afterReviews,

          addedReviews:
            added,

          at:
            new Date()
              .toISOString(),
        };


        delete state.failed[
          college.id
        ];


        console.log(
          `Reviews: ${result.beforeReviews} -> ${result.afterReviews}`
        );

        console.log(
          `Added: ${added}`
        );

        console.log(
          `Qualified: ${result.standardMet ? 'YES' : 'NO'}`
        );


        for (
          const step of
          result.steps ||
          []
        ) {
          console.log(
            `  ${step.source || 'Source'}: ${
              step.status ||
              step.error ||
              step.added ||
              step.mode ||
              'done'
            }`
          );
        }
      }
    }

    catch (error) {
      report.failed++;

      state.failed[
        college.id
      ] = {
        name:
          college.name,

        error:
          error?.message ||
          String(error),

        at:
          new Date()
            .toISOString(),
      };


      console.error(
        `FAILED: ${
          error?.message ||
          error
        }`
      );
    }


    state.lastCollegeId =
      college.id;

    saveState(
      state
    );


    fs.writeFileSync(
      REPORT_FILE,
      JSON.stringify(
        report,
        null,
        2
      ),
      'utf8'
    );


    if (
      index <
      colleges.length - 1
    ) {
      await sleep(
        options.delayMs
      );
    }
  }


  report.finishedAt =
    new Date()
      .toISOString();


  fs.writeFileSync(
    REPORT_FILE,
    JSON.stringify(
      report,
      null,
      2
    ),
    'utf8'
  );


  console.log('');
  console.log(
    '================================================'
  );
  console.log(
    'BATCH COMPLETE'
  );
  console.log(
    '================================================'
  );
  console.log(
    `Processed: ${report.processed}`
  );
  console.log(
    `Qualified: ${report.qualified}`
  );
  console.log(
    `Skipped: ${report.skipped}`
  );
  console.log(
    `Failed: ${report.failed}`
  );
  console.log(
    `New usable reviews: ${report.addedReviews}`
  );
  console.log(
    `State: ${STATE_FILE}`
  );
  console.log(
    `Report: ${REPORT_FILE}`
  );
}


main()
  .catch(
    error => {
      console.error(
        'FATAL:',
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
