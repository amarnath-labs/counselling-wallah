import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";

const INPUT =
  "./all-colleges-fee-source-family.json";

const OUTPUT =
  "./all-colleges-fee-source-family-enriched.json";

const JOSAA_MATCH_OUTPUT =
  "./josaa-official-website-matches.json";

const JOSAA_REVIEW_OUTPUT =
  "./josaa-official-website-review.json";

const JOSAA_URL =
  "https://josaa.admissions.nic.in/applicant/seatmatrix/instituteview.aspx";

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function clean(value) {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeName(value) {
  return clean(value)
    .toLowerCase()

    .replace(/&/g, " and ")

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
      /\bindian institute of engineering science and technology\b/g,
      "iiest"
    )

    .replace(
      /\bat al bihari vajpayee indian institute of information technology and management\b/g,
      "abv iiitm"
    )

    .replace(
      /\batal bihari vajpayee indian institute of information technology and management\b/g,
      "abv iiitm"
    )

    .replace(
      /\bdr\.?\b/g,
      ""
    )

    .replace(
      /\bcollege\b/g,
      "coll"
    )

    .replace(
      /\binstitute\b/g,
      "inst"
    )

    .replace(
      /\buniversity\b/g,
      "univ"
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
      /[^a-z0-9]+/g,
      " "
    )

    .replace(
      /\s+/g,
      " "
    )

    .trim();
}

function tokenSet(value) {
  return new Set(
    normalizeName(value)
      .split(" ")
      .filter(
        token =>
          token.length >= 2
      )
  );
}

function similarity(a, b) {
  const A =
    tokenSet(a);

  const B =
    tokenSet(b);

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

  return (
    common /
    Math.max(
      A.size,
      B.size
    )
  );
}

function normalizeWebsite(value) {
  let website =
    clean(value);

  if (!website) {
    return null;
  }

  website =
    website
      .replace(
        /^website\s*:\s*/i,
        ""
      )
      .replace(
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
| FETCH JOSAA
|--------------------------------------------------------------------------
*/

async function fetchJosaa() {
  console.log(
    "Fetching official JoSAA 2026 directory..."
  );

  const response =
    await axios.get(
      JOSAA_URL,
      {
        timeout:
          90000,

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
| PARSE JOSAA DIRECTORY
|--------------------------------------------------------------------------
*/

function parseJosaa(html) {
  const $ =
    cheerio.load(
      html
    );

  const institutes = [];

  $("tr").each(
    (
      _,
      tr
    ) => {
      const cells =
        $(tr)
          .find("td")
          .map(
            (
              __,
              td
            ) =>
              clean(
                $(td).text()
              )
          )
          .get();

      if (
        cells.length < 4
      ) {
        return;
      }

      const combined =
        cells.join(
          " | "
        );

      const websiteMatch =
        combined.match(
          /Website\s*:\s*(https?:\/\/[^\s|]+|www\.[^\s|]+|[a-z0-9.-]+\.(?:ac\.in|edu\.in|edu|in))/i
        );

      if (!websiteMatch) {
        return;
      }

      /*
      |--------------------------------------------------------------------------
      | Find institute code/name cell.
      |
      | JoSAA rows normally contain something like:
      | 101 Indian Institute of Technology Bhubaneswar
      |--------------------------------------------------------------------------
      */

      let instituteCode = null;
      let instituteName = null;

      for (
        const cell
        of cells
      ) {
        const match =
          cell.match(
            /^(\d{3,5})\s+(.+)$/
          );

        if (
          match &&
          /institute|university|iit|nit|iiit|school|college|technology/i.test(
            match[2]
          )
        ) {
          instituteCode =
            match[1];

          instituteName =
            clean(
              match[2]
            );

          break;
        }
      }

      /*
      |--------------------------------------------------------------------------
      | Fallback:
      | some HTML renderings split code/name.
      |--------------------------------------------------------------------------
      */

      if (!instituteName) {
        for (
          let i = 0;
          i < cells.length;
          i++
        ) {
          if (
            /^\d{3,5}$/.test(
              cells[i]
            ) &&
            cells[i + 1] &&
            /institute|university|iit|nit|iiit|school|college|technology/i.test(
              cells[i + 1]
            )
          ) {
            instituteCode =
              cells[i];

            instituteName =
              cells[i + 1];

            break;
          }
        }
      }

      if (
        !instituteName
      ) {
        return;
      }

      const website =
        normalizeWebsite(
          websiteMatch[1]
        );

      if (!website) {
        return;
      }

      institutes.push({
        josaa_code:
          instituteCode,

        institute_name:
          instituteName,

        official_website:
          website,

        source:
          JOSAA_URL
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
    const institute
    of institutes
  ) {
    const key =
      `${institute.josaa_code}|${normalizeName(
        institute.institute_name
      )}`;

    if (
      !unique.has(key)
    ) {
      unique.set(
        key,
        institute
      );
    }
  }

  return [
    ...unique.values()
  ];
}

/*
|--------------------------------------------------------------------------
| MATCH DB COLLEGE TO JOSAA
|--------------------------------------------------------------------------
*/

function findBestMatch(
  collegeName,
  josaaRows
) {
  const normalized =
    normalizeName(
      collegeName
    );

  /*
  |--------------------------------------------------------------------------
  | Exact match
  |--------------------------------------------------------------------------
  */

  const exact =
    josaaRows.find(
      row =>
        normalizeName(
          row.institute_name
        ) ===
        normalized
    );

  if (exact) {
    return {
      ...exact,

      match_type:
        "EXACT",

      confidence:
        100
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Strict fuzzy match
  |--------------------------------------------------------------------------
  */

  let best = null;
  let bestScore = 0;

  for (
    const row
    of josaaRows
  ) {
    const score =
      similarity(
        collegeName,
        row.institute_name
      );

    if (
      score >
      bestScore
    ) {
      best =
        row;

      bestScore =
        score;
    }
  }

  if (
    best &&
    bestScore >= 0.72
  ) {
    return {
      ...best,

      match_type:
        "FUZZY_STRICT",

      confidence:
        Math.round(
          bestScore *
          100
        )
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
    "JOSAA OFFICIAL WEBSITE BULK POPULATOR"
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
      "Input JSON must contain an array."
    );
  }

  console.log(
    "DB colleges:",
    rows.length
  );

  const html =
    await fetchJosaa();

  const josaaRows =
    parseJosaa(
      html
    );

  console.log(
    "Official JoSAA institutes parsed:",
    josaaRows.length
  );

  if (
    josaaRows.length <
    100
  ) {
    throw new Error(
      `JoSAA parsing looks incomplete: only ${josaaRows.length} institutes parsed. Import stopped safely.`
    );
  }

  const matches = [];
  const review = [];
  const enriched = [];

  for (
    const row
    of rows
  ) {
    /*
    |--------------------------------------------------------------------------
    | Preserve existing website
    |--------------------------------------------------------------------------
    */

    if (
      row.official_website
    ) {
      enriched.push(
        row
      );

      continue;
    }

    /*
    |--------------------------------------------------------------------------
    | Only JoSAA-family rows automatically consume JoSAA directory.
    |--------------------------------------------------------------------------
    */

    if (
      row.source_family !==
      "JOSAA"
    ) {
      enriched.push(
        row
      );

      continue;
    }

    const match =
      findBestMatch(
        row.college_name,
        josaaRows
      );

    if (!match) {
      review.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        source_family:
          row.source_family,

        status:
          "JOSAA_MATCH_REVIEW_REQUIRED"
      });

      enriched.push(
        row
      );

      continue;
    }

    const updated = {
      ...row,

      official_website:
        match.official_website,

      official_website_source:
        "JOSAA_2026_OFFICIAL_DIRECTORY",

      official_website_source_url:
        JOSAA_URL,

      josaa_institute_code:
        match.josaa_code,

      josaa_official_name:
        match.institute_name,

      website_match_type:
        match.match_type,

      website_match_confidence:
        match.confidence,

      website_resolution_status:
        "OFFICIAL_WEBSITE_RESOLVED"
    };

    matches.push({
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      josaa_code:
        match.josaa_code,

      josaa_name:
        match.institute_name,

      official_website:
        match.official_website,

      confidence:
        match.confidence,

      match_type:
        match.match_type
    });

    enriched.push(
      updated
    );
  }

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      enriched,
      null,
      2
    ),

    "utf8"
  );

  await fs.writeFile(
    JOSAA_MATCH_OUTPUT,

    JSON.stringify(
      matches,
      null,
      2
    ),

    "utf8"
  );

  await fs.writeFile(
    JOSAA_REVIEW_OUTPUT,

    JSON.stringify(
      review,
      null,
      2
    ),

    "utf8"
  );

  const josaaInput =
    rows.filter(
      row =>
        row.source_family ===
        "JOSAA"
    ).length;

  const withWebsite =
    enriched.filter(
      row =>
        row.official_website
    ).length;

  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "JOSAA WEBSITE RESOLUTION SUMMARY"
  );

  console.log(
    "======================================="
  );

  console.table([
    {
      metric:
        "Total DB colleges",

      count:
        rows.length
    },

    {
      metric:
        "JoSAA-family DB colleges",

      count:
        josaaInput
    },

    {
      metric:
        "Official JoSAA directory rows",

      count:
        josaaRows.length
    },

    {
      metric:
        "JoSAA matches resolved",

      count:
        matches.length
    },

    {
      metric:
        "JoSAA review required",

      count:
        review.length
    },

    {
      metric:
        "All DB rows now having website",

      count:
        withWebsite
    }
  ]);

  console.log("");

  console.log(
    "MATCH SAMPLE"
  );

  console.table(
    matches
      .slice(
        0,
        30
      )
      .map(
        row => ({
          college:
            row.college_name,

          josaa:
            row.josaa_name,

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
    JOSAA_MATCH_OUTPUT
  );

  console.log(
    "Saved:",
    JOSAA_REVIEW_OUTPUT
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

    process.exitCode = 1;
  }
);