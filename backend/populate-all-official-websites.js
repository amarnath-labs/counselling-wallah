import "dotenv/config";

import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";


/*
|--------------------------------------------------------------------------
| FILES
|--------------------------------------------------------------------------
*/

const INPUT =
  "./all-db-colleges-fee-input.json";

const OUTPUT =
  "./all-db-colleges-fee-input-enriched.json";

const UNRESOLVED_OUTPUT =
  "./all-db-colleges-official-website-unresolved.json";

const MATCH_REPORT_OUTPUT =
  "./all-db-colleges-official-website-match-report.json";


/*
|--------------------------------------------------------------------------
| OFFICIAL DIRECTORY SOURCES
|--------------------------------------------------------------------------
*/

const JOSAA_DIRECTORY =
  "https://josaa.admissions.nic.in/applicant/seatmatrix/instituteview.aspx";


/*
|--------------------------------------------------------------------------
| KNOWN VERIFIED WEBSITE OVERRIDES
|--------------------------------------------------------------------------
|
| Only verified official websites.
|--------------------------------------------------------------------------
*/

const VERIFIED_OVERRIDES = {
  "assam university, silchar":
    "https://www.aus.ac.in/",

  "abss institute of technology, meerut,meerut":
    "https://www.abss.edu.in/",

  "accurate institute of management & technology,gautam buddh nagar":
    "https://www.accurate.in/",

  "ajay kumar garg engg. college,ghaziabad":
    "https://www.akgec.ac.in/",

  "ambalika institute of management & technology,lucknow":
    "https://www.aimt.edu.in/"
};


/*
|--------------------------------------------------------------------------
| NORMALIZATION
|--------------------------------------------------------------------------
*/

function normalizeName(value) {
  return String(
    value ?? ""
  )
    .toLowerCase()

    .replace(
      /&/g,
      " and "
    )

    .replace(
      /\bindian institute of technology\b/g,
      "iit"
    )

    .replace(
      /\bnational institute of technology\b/g,
      "nit"
    )

    .replace(
      /\bindian institute of information technology\b/g,
      "iiit"
    )

    .replace(
      /\binstitute\b/g,
      "inst"
    )

    .replace(
      /\btechnology\b/g,
      "tech"
    )

    .replace(
      /\bengineering\b/g,
      "engg"
    )

    .replace(
      /\buniversity\b/g,
      "univ"
    )

    .replace(
      /\bcollege\b/g,
      "coll"
    )

    .replace(
      /[^a-z0-9]+/g,
      " "
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();
}


function tokens(value) {
  return new Set(
    normalizeName(
      value
    )
      .split(" ")
      .filter(
        token =>
          token.length >= 2
      )
  );
}


/*
|--------------------------------------------------------------------------
| SIMILARITY
|--------------------------------------------------------------------------
*/

function similarity(a, b) {
  const A =
    tokens(a);

  const B =
    tokens(b);

  if (
    A.size === 0 ||
    B.size === 0
  ) {
    return 0;
  }

  let common = 0;

  for (
    const token
    of A
  ) {
    if (
      B.has(token)
    ) {
      common++;
    }
  }

  const union =
    new Set([
      ...A,
      ...B
    ]).size;

  return (
    union > 0
      ? common / union
      : 0
  );
}


/*
|--------------------------------------------------------------------------
| WEBSITE CLEANUP
|--------------------------------------------------------------------------
*/

function normalizeWebsite(value) {
  let website =
    String(
      value ?? ""
    )
      .trim();

  if (!website) {
    return null;
  }

  website =
    website.replace(
      /^website\s*:\s*/i,
      ""
    );

  website =
    website.replace(
      /[),.;]+$/,
      ""
    );

  if (
    !/^https?:\/\//i.test(
      website
    )
  ) {
    website =
      `https://${website}`;
  }

  try {
    return new URL(
      website
    ).href;
  } catch {
    return null;
  }
}


/*
|--------------------------------------------------------------------------
| FETCH
|--------------------------------------------------------------------------
*/

async function fetchHtml(url) {
  const response =
    await axios.get(
      url,
      {
        timeout:
          60000,

        maxRedirects:
          8,

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36",

          Accept:
            "text/html,application/xhtml+xml,*/*"
        }
      }
    );

  return String(
    response.data ?? ""
  );
}


/*
|--------------------------------------------------------------------------
| PARSE JOSAA 2026 DIRECTORY
|--------------------------------------------------------------------------
|
| JoSAA institute directory rows expose:
|
| Institute code/name
| address
| phone/fax/website
| email
|--------------------------------------------------------------------------
*/

async function loadJosaaInstitutes() {
  console.log(
    "Fetching JoSAA 2026 institute directory..."
  );

  const html =
    await fetchHtml(
      JOSAA_DIRECTORY
    );

  const $ =
    cheerio.load(
      html
    );

  const records = [];

  $("tr").each(
    (
      _,
      tr
    ) => {
      const cells =
        $(tr)
          .find(
            "td"
          )
          .map(
            (
              __,
              td
            ) =>
              $(td)
                .text()
                .replace(
                  /\s+/g,
                  " "
                )
                .trim()
          )
          .get();

      if (
        cells.length < 3
      ) {
        return;
      }

      const rowText =
        cells.join(
          " | "
        );

      if (
        !/website\s*:/i.test(
          rowText
        )
      ) {
        return;
      }

      let name = null;

      /*
      |--------------------------------------------------------------------------
      | Usually institute code/name is one of the early cells.
      |--------------------------------------------------------------------------
      */

      for (
        const cell
        of cells.slice(
          0,
          4
        )
      ) {
        if (
          /institute|university|iit|nit|iiit|college|school/i.test(
            cell
          ) &&
          !/website/i.test(
            cell
          )
        ) {
          name =
            cell
              .replace(
                /^\d+\s*/,
                ""
              )
              .trim();

          break;
        }
      }

      if (!name) {
        return;
      }

      const websiteMatch =
        rowText.match(
          /website\s*:\s*([^\s|]+)/i
        );

      if (!websiteMatch) {
        return;
      }

      const website =
        normalizeWebsite(
          websiteMatch[1]
        );

      if (!website) {
        return;
      }

      records.push({
        source:
          "JOSAA_2026",

        institute_name:
          name,

        official_website:
          website
      });
    }
  );


  /*
  |--------------------------------------------------------------------------
  | Deduplicate
  |--------------------------------------------------------------------------
  */

  const unique =
    new Map();

  for (
    const row
    of records
  ) {
    const key =
      normalizeName(
        row.institute_name
      );

    if (
      !unique.has(key)
    ) {
      unique.set(
        key,
        row
      );
    }
  }

  return [
    ...unique.values()
  ];
}


/*
|--------------------------------------------------------------------------
| FIND BEST OFFICIAL DIRECTORY MATCH
|--------------------------------------------------------------------------
*/

function findBestMatch(
  collegeName,
  directory
) {
  const exactName =
    normalizeName(
      collegeName
    );


  /*
  |--------------------------------------------------------------------------
  | Exact normalized match first
  |--------------------------------------------------------------------------
  */

  const exact =
    directory.find(
      row =>
        normalizeName(
          row.institute_name
        ) ===
        exactName
    );

  if (exact) {
    return {
      ...exact,

      confidence:
        100,

      match_type:
        "EXACT"
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Similarity fallback
  |--------------------------------------------------------------------------
  */

  let best = null;
  let bestScore = 0;

  for (
    const candidate
    of directory
  ) {
    const score =
      similarity(
        collegeName,
        candidate.institute_name
      );

    if (
      score >
      bestScore
    ) {
      bestScore =
        score;

      best =
        candidate;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Strict threshold.
  |
  | Do not auto-accept weak matches.
  |--------------------------------------------------------------------------
  */

  if (
    best &&
    bestScore >= 0.72
  ) {
    return {
      ...best,

      confidence:
        Math.round(
          bestScore *
          100
        ),

      match_type:
        "FUZZY_STRICT"
    };
  }

  return null;
}


/*
|--------------------------------------------------------------------------
| MAIN
|--------------------------------------------------------------------------
*/

async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "ALL COLLEGES OFFICIAL WEBSITE RESOLVER"
  );

  console.log(
    "======================================="
  );

  console.log("");


  const raw =
    await fs.readFile(
      INPUT,
      "utf8"
    );


  const rows =
    JSON.parse(
      raw.replace(
        /^\uFEFF/,
        ""
      )
    );


  if (
    !Array.isArray(
      rows
    )
  ) {
    throw new Error(
      "Input must be an array."
    );
  }


  console.log(
    "Input colleges:",
    rows.length
  );


  console.log("");


  /*
  |--------------------------------------------------------------------------
  | Load official JoSAA directory
  |--------------------------------------------------------------------------
  */

  let josaa = [];

  try {
    josaa =
      await loadJosaaInstitutes();

    console.log(
      "JoSAA official institutes parsed:",
      josaa.length
    );

  } catch (error) {
    console.log(
      "JoSAA fetch failed:",
      error.message
    );
  }


  console.log("");


  const output = [];

  const report = [];


  for (
    let i = 0;
    i < rows.length;
    i++
  ) {
    const row =
      rows[i];

    const normalizedName =
      normalizeName(
        row.college_name
      );


    console.log(
      `[${i + 1}/${rows.length}] ${row.college_name}`
    );


    /*
    |--------------------------------------------------------------------------
    | Existing website wins.
    |--------------------------------------------------------------------------
    */

    if (
      row.official_website
    ) {
      output.push({
        ...row,

        website_resolution_status:
          "EXISTING"
      });


      report.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        status:
          "EXISTING",

        official_website:
          row.official_website,

        confidence:
          100
      });


      console.log(
        " -> EXISTING"
      );

      continue;
    }


    /*
    |--------------------------------------------------------------------------
    | Verified manual override
    |--------------------------------------------------------------------------
    */

    const override =
      VERIFIED_OVERRIDES[
        normalizedName
      ];


    if (override) {
      output.push({
        ...row,

        official_website:
          override,

        website_resolution_status:
          "VERIFIED_OVERRIDE",

        website_resolution_confidence:
          100
      });


      report.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        status:
          "VERIFIED_OVERRIDE",

        official_website:
          override,

        confidence:
          100
      });


      console.log(
        " -> VERIFIED_OVERRIDE"
      );

      continue;
    }


    /*
    |--------------------------------------------------------------------------
    | JoSAA official directory
    |--------------------------------------------------------------------------
    */

    const josaaMatch =
      findBestMatch(
        row.college_name,
        josaa
      );


    if (josaaMatch) {
      output.push({
        ...row,

        official_website:
          josaaMatch
            .official_website,

        official_website_source:
          "JOSAA_2026",

        official_directory_name:
          josaaMatch
            .institute_name,

        website_resolution_status:
          "OFFICIAL_DIRECTORY_MATCH",

        website_resolution_confidence:
          josaaMatch
            .confidence
      });


      report.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        status:
          "OFFICIAL_DIRECTORY_MATCH",

        official_name:
          josaaMatch
            .institute_name,

        official_website:
          josaaMatch
            .official_website,

        confidence:
          josaaMatch
            .confidence,

        match_type:
          josaaMatch
            .match_type
      });


      console.log(
        " -> JOSAA",
        josaaMatch.confidence + "%"
      );

      continue;
    }


    /*
    |--------------------------------------------------------------------------
    | Still unresolved.
    |--------------------------------------------------------------------------
    */

    output.push({
      ...row,

      website_resolution_status:
        "UNRESOLVED"
    });


    report.push({
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      status:
        "UNRESOLVED",

      official_website:
        null,

      confidence:
        0
    });


    console.log(
      " -> UNRESOLVED"
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Split unresolved
  |--------------------------------------------------------------------------
  */

  const unresolved =
    output.filter(
      row =>
        !row.official_website
    );


  const resolved =
    output.filter(
      row =>
        row.official_website
    );


  /*
  |--------------------------------------------------------------------------
  | Save
  |--------------------------------------------------------------------------
  */

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      output,
      null,
      2
    ),

    "utf8"
  );


  await fs.writeFile(
    UNRESOLVED_OUTPUT,

    JSON.stringify(
      unresolved,
      null,
      2
    ),

    "utf8"
  );


  await fs.writeFile(
    MATCH_REPORT_OUTPUT,

    JSON.stringify(
      report,
      null,
      2
    ),

    "utf8"
  );


  /*
  |--------------------------------------------------------------------------
  | Summary
  |--------------------------------------------------------------------------
  */

  const statusCounts = {};

  for (
    const row
    of report
  ) {
    statusCounts[
      row.status
    ] =
      (
        statusCounts[
          row.status
        ] ||
        0
      ) +
      1;
  }


  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "OFFICIAL WEBSITE RESOLUTION SUMMARY"
  );

  console.log(
    "======================================="
  );


  console.table(
    Object.entries(
      statusCounts
    ).map(
      (
        [
          status,
          count
        ]
      ) => ({
        status,
        count
      })
    )
  );


  console.log(
    "Total:",
    output.length
  );


  console.log(
    "Resolved:",
    resolved.length
  );


  console.log(
    "Unresolved:",
    unresolved.length
  );


  console.log("");

  console.log(
    "Resolved preview:"
  );


  console.table(
    report
      .filter(
        row =>
          row.status !==
          "UNRESOLVED"
      )
      .slice(
        0,
        30
      )
      .map(
        row => ({
          college:
            row.college_name,

          status:
            row.status,

          confidence:
            row.confidence,

          website:
            row.official_website
        })
      )
  );


  console.log("");

  console.log(
    "Saved:",
    OUTPUT
  );


  console.log(
    "Saved:",
    UNRESOLVED_OUTPUT
  );


  console.log(
    "Saved:",
    MATCH_REPORT_OUTPUT
  );


  console.log("");

  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
  );
}


main().catch(
  error => {
    console.error(
      "FAILED:",
      error.message
    );

    process.exitCode =
      1;
  }
);