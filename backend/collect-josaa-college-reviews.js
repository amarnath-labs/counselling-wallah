import fs from "node:fs";
import { pool } from "./src/db/pool.js";

const API_BASE =
  process.env.REVIEW_API_BASE ||
  "http://localhost:4000/api";

const STATE_FILE =
  "./josaa-review-collection-state.json";

const REPORT_FILE =
  "./josaa-review-collection-report.json";

const delay =
  ms =>
    new Promise(
      resolve =>
        setTimeout(resolve, ms)
    );


function parseArgs() {
  const args =
    process.argv.slice(2);

  const options = {
    limit: null,
    delayMs: 1500,
    retry: 2,
    force: false,
  };

  for (
    let i = 0;
    i < args.length;
    i++
  ) {
    if (
      args[i] === "--limit"
    ) {
      options.limit =
        Number(args[++i]) ||
        null;
    }

    else if (
      args[i] === "--delay"
    ) {
      options.delayMs =
        Number(args[++i]) ||
        0;
    }

    else if (
      args[i] === "--retry"
    ) {
      options.retry =
        Number(args[++i]) ||
        0;
    }

    else if (
      args[i] === "--force"
    ) {
      options.force =
        true;
    }
  }

  return options;
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
    };
  }

  try {
    return JSON.parse(
      fs.readFileSync(
        STATE_FILE,
        "utf8"
      )
    );
  }
  catch {
    return {
      completed: {},
      failed: {},
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
    "utf8"
  );
}


async function getJosaaColleges() {
  /*
  |--------------------------------------------------------------------------
  | JoSAA institute universe
  |--------------------------------------------------------------------------
  |
  | IIT
  | NIT
  | IIIT
  | GFTI
  |
  | Both type + name patterns are used because older rows may not have a
  | perfectly normalized college.type.
  |--------------------------------------------------------------------------
  */

  const result =
    await pool.query(
      `
      SELECT DISTINCT
        c.id::text AS id,
        c.name,
        LOWER(
          COALESCE(
            c.type,
            ''
          )
        ) AS type
      FROM colleges c
      WHERE
        LOWER(
          COALESCE(
            c.type,
            ''
          )
        ) IN (
          'iit',
          'nit',
          'iiit',
          'gfti',
          'gftis'
        )

        OR LOWER(c.name)
          LIKE
          'indian institute of technology%'

        OR LOWER(c.name)
          LIKE
          'iit %'

        OR LOWER(c.name)
          LIKE
          'national institute of technology%'

        OR LOWER(c.name)
          LIKE
          '%indian institute of information technology%'

        OR LOWER(c.name)
          LIKE
          '%institute of information technology%'

      ORDER BY
        c.name ASC
      `
    );

  return (
    result.rows ||
    []
  );
}


async function getStatus(
  collegeId
) {
  try {
    const response =
      await fetch(
        `${API_BASE}/review-enrichment/${encodeURIComponent(
          collegeId
        )}/status`
      );

    if (!response.ok) {
      return null;
    }

    return await response.json();
  }
  catch {
    return null;
  }
}


function standardFrom(
  data
) {
  return (
    data?.standard ||
    data?.after?.standard ||
    {}
  );
}


function usableCount(
  data
) {
  return Number(
    standardFrom(data)
      ?.usableReviews ||
    0
  );
}


function ready(
  data
) {
  const s =
    standardFrom(data);

  return Boolean(
    s?.ready ??
    s?.standardMet
  );
}


async function fillTo100(
  collegeId
) {
  const response =
    await fetch(
      `${API_BASE}/review-enrichment/${encodeURIComponent(
        collegeId
      )}/fill-to-100`,
      {
        method:
          "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body:
          "{}",
      }
    );

  const text =
    await response.text();

  let data = {};

  try {
    data =
      text
        ? JSON.parse(text)
        : {};
  }
  catch {
    data = {
      raw: text,
    };
  }

  if (!response.ok) {
    throw new Error(
      data?.error ||
      data?.message ||
      `HTTP ${response.status}`
    );
  }

  return data;
}


async function processCollege(
  college,
  options
) {
  const before =
    await getStatus(
      college.id
    );

  const beforeReviews =
    usableCount(
      before
    );

  if (
    ready(before) &&
    !options.force
  ) {
    return {
      collegeId:
        college.id,

      collegeName:
        college.name,

      collegeType:
        college.type,

      skipped:
        true,

      qualified:
        true,

      beforeReviews,

      afterReviews:
        beforeReviews,

      addedReviews:
        0,

      reason:
        "already-qualified",
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
      const result =
        await fillTo100(
          college.id
        );

      const after =
        result?.after ||
        await getStatus(
          college.id
        );

      const afterReviews =
        usableCount(
          after
        );

      return {
        collegeId:
          college.id,

        collegeName:
          college.name,

        collegeType:
          college.type,

        skipped:
          false,

        qualified:
          ready(
            after
          ),

        beforeReviews,

        afterReviews,

        addedReviews:
          Math.max(
            0,
            afterReviews -
            beforeReviews
          ),

        standard:
          standardFrom(
            after
          ),

        steps:
          result?.steps ||
          [],
      };
    }
    catch (error) {
      lastError = error;

      if (
        attempt <
        options.retry
      ) {
        await delay(
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

  let colleges =
    await getJosaaColleges();

  if (
    options.limit
  ) {
    colleges =
      colleges.slice(
        0,
        options.limit
      );
  }


  const state =
    loadState();


  const report = {
    startedAt:
      new Date()
        .toISOString(),

    totalJosaaColleges:
      colleges.length,

    processed: 0,
    qualified: 0,
    evidenceBuilding: 0,
    skipped: 0,
    failed: 0,
    newReviews: 0,

    colleges: [],
  };


  console.log("");
  console.log(
    "================================================"
  );
  console.log(
    "TRUMARG JoSAA REVIEW COLLECTION"
  );
  console.log(
    "================================================"
  );
  console.log(
    "IIT + NIT + IIIT + GFTI"
  );
  console.log(
    `Colleges: ${colleges.length}`
  );
  console.log("");


  for (
    let i = 0;
    i <
      colleges.length;
    i++
  ) {
    const college =
      colleges[i];


    if (
      state.completed[
        college.id
      ]?.status ===
        "qualified" &&
      !options.force
    ) {
      console.log(
        `[${i + 1}/${colleges.length}] RESUME SKIP: ${college.name}`
      );

      report.skipped++;

      continue;
    }


    console.log("");
    console.log(
      `[${i + 1}/${colleges.length}] ${college.name}`
    );

    console.log(
      `ID: ${college.id}`
    );

    console.log(
      `TYPE: ${college.type || "unknown"}`
    );


    try {
      const result =
        await processCollege(
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
      }


      if (
        result.qualified
      ) {
        report.qualified++;
      }
      else {
        report.evidenceBuilding++;
      }


      report.newReviews +=
        result.addedReviews ||
        0;


      state.completed[
        college.id
      ] = {
        collegeName:
          college.name,

        status:
          result.qualified
            ? "qualified"
            : "evidence-building",

        reviews:
          result.afterReviews,

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
        `Added: ${result.addedReviews}`
      );

      console.log(
        result.qualified
          ? "STATUS: QUALIFIED"
          : "STATUS: EVIDENCE BUILDING"
      );


      const standard =
        result.standard ||
        {};

      if (
        standard.independentSources !==
        undefined
      ) {
        console.log(
          `Sources: ${standard.independentSources}`
        );
      }

      if (
        standard.maximumSourceShare !==
        undefined
      ) {
        console.log(
          `Max source share: ${
            Math.round(
              Number(
                standard.maximumSourceShare
              ) *
              100
            )
          }%`
        );
      }


      for (
        const step of
        result.steps ||
        []
      ) {
        console.log(
          `  ${
            step.source ||
            "Source"
          }: ${
            step.status ||
            step.error ||
            step.result?.status ||
            step.mode ||
            "processed"
          }`
        );
      }
    }

    catch (error) {
      report.failed++;

      state.failed[
        college.id
      ] = {
        collegeName:
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
      "utf8"
    );


    if (
      i <
      colleges.length - 1
    ) {
      await delay(
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
    "utf8"
  );


  console.log("");
  console.log(
    "================================================"
  );
  console.log(
    "JoSAA REVIEW BATCH COMPLETE"
  );
  console.log(
    "================================================"
  );

  console.log(
    `Processed: ${report.processed}`
  );

  console.log(
    `Qualified: ${report.qualified}`
  );

  console.log(
    `Evidence building: ${report.evidenceBuilding}`
  );

  console.log(
    `Skipped: ${report.skipped}`
  );

  console.log(
    `Failed: ${report.failed}`
  );

  console.log(
    `New usable reviews: ${report.newReviews}`
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
        "FATAL:",
        error
      );

      process.exitCode =
        1;
    }
  )
  .finally(
    async () => {
      await pool.end();
    }
  );
