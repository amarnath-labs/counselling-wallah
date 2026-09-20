import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";

/*
|--------------------------------------------------------------------------
| INPUT / OUTPUT
|--------------------------------------------------------------------------
|
| IMPORTANT:
| INPUT must be the JoSAA-enriched 363-college file.
|
| DO NOT overwrite this input with:
| all-colleges-fee-source-family.json
|--------------------------------------------------------------------------
*/

const INPUT =
  "./all-colleges-fee-source-family-enriched.json";

const OUTPUT =
  "./all-colleges-fee-source-family-enriched-uptac.json";

const MATCH_OUTPUT =
  "./uptac-official-website-matches.json";

const REVIEW_OUTPUT =
  "./uptac-official-website-review.json";

const UNRESOLVED_OUTPUT =
  "./uptac-official-website-unresolved.json";

const REPORT_OUTPUT =
  "./uptac-official-website-resolution-report.json";

/*
|--------------------------------------------------------------------------
| OFFICIAL UPTAC SOURCES
|--------------------------------------------------------------------------
*/

const UPTAC_2026 =
  "https://uptac.samarth.edu.in/";

const UPTAC_LEGACY_INSTITUTES =
  "https://uptac.admissions.nic.in/institutes/";

/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const TIMEOUT = 12000;

const CHECKPOINT_EVERY = 10;

const VERIFY_THRESHOLD = 0.55;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36",

  Accept:
    "text/html,application/xhtml+xml,*/*"
};

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

function normalize(value) {
  return clean(value)
    .toLowerCase()

    .replace(/&/g, " and ")

    .replace(/\bengg\b/g, " engineering ")
    .replace(/\btech\b/g, " technology ")
    .replace(/\binstt\b/g, " institute ")
    .replace(/\binst\b/g, " institute ")
    .replace(/\bmgmt\b/g, " management ")
    .replace(/\buniv\b/g, " university ")
    .replace(/\bcoll\b/g, " college ")

    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function rootUrl(value) {
  try {
    const url =
      new URL(value);

    return `${url.protocol}//${url.host}/`;
  } catch {
    return null;
  }
}

function hostname(value) {
  try {
    return new URL(value)
      .hostname
      .toLowerCase()
      .replace(/^www\./, "");
  } catch {
    return null;
  }
}

function unique(values) {
  return [
    ...new Set(
      values.filter(Boolean)
    )
  ];
}

/*
|--------------------------------------------------------------------------
| TOKENS / SIMILARITY
|--------------------------------------------------------------------------
*/

const STOP_WORDS =
  new Set([
    "of",
    "and",
    "the",
    "for",
    "in",
    "at",
    "college",
    "institute",
    "engineering",
    "technology",
    "management",
    "group",
    "faculty",
    "school",
    "campus"
  ]);

function tokens(value) {
  return normalize(value)
    .split(" ")
    .filter(
      token =>
        token.length >= 3 &&
        !STOP_WORDS.has(token)
    );
}

function similarity(a, b) {
  const A =
    new Set(
      tokens(a)
    );

  const B =
    new Set(
      tokens(b)
    );

  if (
    A.size === 0 ||
    B.size === 0
  ) {
    return 0;
  }

  let matches = 0;

  for (
    const token
    of A
  ) {
    if (
      B.has(token)
    ) {
      matches++;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Compare against DB college token count.
  | This works better with large website bodies.
  |--------------------------------------------------------------------------
  */

  return (
    matches /
    A.size
  );
}

/*
|--------------------------------------------------------------------------
| ACRONYM
|--------------------------------------------------------------------------
*/

function acronym(value) {
  return normalize(value)
    .split(" ")
    .filter(Boolean)
    .filter(
      word =>
        ![
          "of",
          "and",
          "the",
          "for",
          "in",
          "at"
        ].includes(word)
    )
    .map(
      word =>
        word[0]
    )
    .join("");
}

/*
|--------------------------------------------------------------------------
| VERIFIED OFFICIAL OVERRIDES
|--------------------------------------------------------------------------
|
| IMPORTANT IMPROVEMENT:
|
| Do NOT manually write normalized keys.
| We normalize source names automatically below.
|--------------------------------------------------------------------------
*/

const VERIFIED_RAW = [

  [
    "ABSS INSTITUTE OF TECHNOLOGY, MEERUT,MEERUT",
    "https://www.abss.edu.in/"
  ],

  [
    "ACCURATE INSTITUTE OF MANAGEMENT & TECHNOLOGY,GAUTAM BUDDH NAGAR",
    "https://www.accurate.in/"
  ],

  [
    "AJAY KUMAR GARG ENGG. COLLEGE,GHAZIABAD",
    "https://www.akgec.ac.in/"
  ],

  [
    "AMBALIKA INSTITUTE OF MANAGEMENT & TECHNOLOGY,LUCKNOW",
    "https://www.aimt.edu.in/"
  ],

  [
    "ASHOKA INSTITUTE OF TECHNOLOGY & MANAGEMENT,VARANASI",
    "https://ashokainstitute.com/"
  ],

  [
    "ABES ENGG.COLLEGE,GHAZIABAD",
    "https://abes.ac.in/"
  ],

  [
    "ABES INSTITUTE OF TECHNOLOGY,GHAZIABAD",
    "https://www.abesit.in/"
  ],

  [
    "G.L. BAJAJ INSTITUTE OF TECHNOLOGY & MANAGEMENT,GAUTAM BUDDH NAGAR",
    "https://www.glbitm.org/"
  ],

  [
    "I.M.S. ENGINEERING COLLEGE,GHAZIABAD",
    "https://imsec.ac.in/"
  ],

  [
    "J.S.S. ACADEMY OF TECHNICAL EDUCATION,GAUTAM BUDDH NAGAR",
    "https://jssaten.ac.in/"
  ],

  [
    "KANPUR INSTITUTE OF TECHNOLOGY,KANPUR",
    "https://kit.ac.in/"
  ],

  [
    "KIET GROUP OF INSTITUTIONS(KIET SCHOOL OF PHARMACY),GHAZIABAD",
    "https://www.kiet.edu/"
  ],

  [
    "MEERUT INSTITUTE OF ENGINEERING & TECHNOLOGY,MEERUT",
    "https://www.miet.ac.in/"
  ],

  [
    "MORADABAD INSTITUTE OF TECHNOLOGY,MORADABAD",
    "https://www.mitmoradabad.edu.in/"
  ],

  [
    "PRANVEER SINGH INSTITUTE OF TECHNOLOGY,KANPUR",
    "https://www.psit.ac.in/"
  ],

  [
    "SHRI RAMMURTI SMARAK COLLEGE OF ENGG AND TECHNOLOGY,BAREILLY",
    "https://www.srms.ac.in/cet/"
  ],

  [
    "UNITED COLLEGE OF ENGINEERING & RESEARCH,ALLAHABAD",
    "https://www.united.ac.in/"
  ],

  [
    "INSTITUTE OF ENGINEERING & TECHNOLOGY,LUCKNOW",
    "https://www.ietlucknow.ac.in/"
  ],

  [
    "BUNDELKHAND INSTITUTE OF ENGINEERING & TECHNOLOGY,JHANSI",
    "https://bietjhs.ac.in/"
  ],

  [
    "KAMLA NEHRU INSTITUTE OF TECHNOLOGY,SULTANPUR",
    "https://knit.ac.in/"
  ]
];

/*
|--------------------------------------------------------------------------
| Build normalized map automatically.
|--------------------------------------------------------------------------
*/

const VERIFIED =
  new Map(
    VERIFIED_RAW.map(
      (
        [
          name,
          website
        ]
      ) => [
        normalize(name),
        website
      ]
    )
  );

/*
|--------------------------------------------------------------------------
| FETCH
|--------------------------------------------------------------------------
*/

async function fetchHtml(url) {
  try {
    const response =
      await axios.get(
        url,
        {
          timeout:
            TIMEOUT,

          maxRedirects:
            6,

          headers:
            HEADERS,

          validateStatus:
            status =>
              status >= 200 &&
              status < 400
        }
      );

    const contentType =
      String(
        response.headers[
          "content-type"
        ] || ""
      ).toLowerCase();

    if (
      !contentType.includes(
        "html"
      )
    ) {
      return {
        ok:
          false,

        error:
          `Non-HTML response: ${contentType}`
      };
    }

    return {
      ok:
        true,

      html:
        String(
          response.data ?? ""
        ),

      final_url:
        response.request
          ?.res
          ?.responseUrl ||
        url
    };

  } catch (error) {
    return {
      ok:
        false,

      error:
        error.message
    };
  }
}

/*
|--------------------------------------------------------------------------
| HTTP FALLBACK
|--------------------------------------------------------------------------
*/

async function fetchWithFallback(url) {
  let result =
    await fetchHtml(url);

  if (
    result.ok
  ) {
    return result;
  }

  if (
    /^https:\/\//i.test(url)
  ) {
    const http =
      url.replace(
        /^https:\/\//i,
        "http://"
      );

    result =
      await fetchHtml(http);
  }

  return result;
}

/*
|--------------------------------------------------------------------------
| WEBSITE IDENTITY VERIFICATION
|--------------------------------------------------------------------------
*/

async function verifyWebsite(
  collegeName,
  website
) {
  const result =
    await fetchWithFallback(
      website
    );

  if (
    !result.ok
  ) {
    return {
      verified:
        false,

      score:
        0,

      error:
        result.error
    };
  }

  const $ =
    cheerio.load(
      result.html
    );

  $(
    "script,style,noscript,svg"
  ).remove();

  const title =
    clean(
      $("title").text()
    );

  const headings =
    clean(
      $("h1,h2,h3").text()
    );

  const body =
    clean(
      $("body").text()
    )
      .slice(
        0,
        40000
      );

  const sample =
    `${title} ${headings} ${body}`;

  const score =
    similarity(
      collegeName,
      sample
    );

  const institutional =
    /admission|academic|courses|department|faculty|placement|campus|programme|program|student/i.test(
      sample
    );

  /*
  |--------------------------------------------------------------------------
  | Domain evidence bonus
  |--------------------------------------------------------------------------
  */

  const collegeTokens =
    tokens(
      collegeName
    );

  const domain =
    hostname(
      result.final_url
    ) || "";

  const compactDomain =
    domain.replace(
      /[^a-z0-9]/g,
      ""
    );

  const domainHits =
    collegeTokens.filter(
      token =>
        compactDomain.includes(
          token
        )
    ).length;

  const verified =
    (
      score >= VERIFY_THRESHOLD &&
      institutional
    ) ||
    (
      score >= 0.45 &&
      institutional &&
      domainHits >= 1
    );

  return {
    verified,

    score:
      Number(
        score.toFixed(3)
      ),

    domain_hits:
      domainHits,

    final_url:
      rootUrl(
        result.final_url
      ) ||
      website,

    title,

    error:
      null
  };
}

/*
|--------------------------------------------------------------------------
| CANDIDATE GENERATION
|--------------------------------------------------------------------------
*/

function buildCandidates(row) {
  const collegeName =
    row.college_name;

  const normalized =
    normalize(
      collegeName
    );

  const ac =
    acronym(
      collegeName
    );

  const words =
    tokens(
      collegeName
    );

  const first =
    words[0] || "";

  const second =
    words[1] || "";

  const firstTwo =
    `${first}${second}`;

  const firstThree =
    words
      .slice(
        0,
        3
      )
      .join("");

  const candidates = [];

  /*
  |--------------------------------------------------------------------------
  | Acronym-style
  |--------------------------------------------------------------------------
  */

  if (
    ac.length >= 3 &&
    ac.length <= 14
  ) {
    candidates.push(
      `https://www.${ac}.ac.in/`,
      `https://${ac}.ac.in/`,

      `https://www.${ac}.edu.in/`,
      `https://${ac}.edu.in/`,

      `https://www.${ac}.org/`,
      `https://www.${ac}.in/`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | First tokens
  |--------------------------------------------------------------------------
  */

  if (
    firstTwo.length >= 5 &&
    firstTwo.length <= 24
  ) {
    candidates.push(
      `https://www.${firstTwo}.ac.in/`,
      `https://${firstTwo}.ac.in/`,

      `https://www.${firstTwo}.edu.in/`,
      `https://${firstTwo}.edu.in/`,

      `https://www.${firstTwo}.in/`
    );
  }

  if (
    firstThree.length >= 6 &&
    firstThree.length <= 28
  ) {
    candidates.push(
      `https://www.${firstThree}.ac.in/`,
      `https://www.${firstThree}.edu.in/`,
      `https://www.${firstThree}.in/`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Known institutional patterns
  |--------------------------------------------------------------------------
  */

  if (
    /rajkiya engineering college/i.test(
      normalized
    )
  ) {
    const location =
      words[
        words.length - 1
      ];

    if (location) {
      candidates.push(
        `https://www.rec${location}.ac.in/`,
        `https://rec${location}.ac.in/`
      );
    }
  }

  return unique(
    candidates
  ).slice(
    0,
    20
  );
}

/*
|--------------------------------------------------------------------------
| PROCESS ONE UPTAC COLLEGE
|--------------------------------------------------------------------------
*/

async function processRow(row) {
  if (
    row.source_family !==
    "UPTAC"
  ) {
    return row;
  }

  /*
  |--------------------------------------------------------------------------
  | Existing website MUST be preserved.
  |
  | This protects JoSAA enrichment and any previous verified data.
  |--------------------------------------------------------------------------
  */

  if (
    row.official_website
  ) {
    return {
      ...row,

      uptac_website_status:
        "EXISTING",

      uptac_portal:
        UPTAC_2026
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Verified override
  |--------------------------------------------------------------------------
  */

  const key =
    normalize(
      row.college_name
    );

  const known =
    VERIFIED.get(
      key
    );

  if (
    known
  ) {
    /*
    |--------------------------------------------------------------------------
    | Known mappings are already curated.
    | Still fetch once for availability.
    |--------------------------------------------------------------------------
    */

    const check =
      await fetchWithFallback(
        known
      );

    return {
      ...row,

      official_website:
        check.ok
          ? (
              rootUrl(
                check.final_url
              ) ||
              known
            )
          : known,

      official_website_source:
        "VERIFIED_OVERRIDE",

      uptac_portal:
        UPTAC_2026,

      uptac_website_status:
        check.ok
          ? "OFFICIAL_WEBSITE_RESOLVED"
          : "OFFICIAL_WEBSITE_KNOWN_FETCH_FAILED",

      website_match_confidence:
        100,

      website_fetch_status:
        check.ok
          ? "AVAILABLE"
          : "FAILED",

      website_fetch_error:
        check.ok
          ? null
          : check.error
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Candidate probing
  |--------------------------------------------------------------------------
  */

  const candidates =
    buildCandidates(
      row
    );

  const checked = [];

  let best = null;

  for (
    const candidate
    of candidates
  ) {
    const verification =
      await verifyWebsite(
        row.college_name,
        candidate
      );

    checked.push({
      candidate,

      verified:
        verification.verified,

      score:
        verification.score,

      domain_hits:
        verification.domain_hits ||
        0,

      title:
        verification.title ||
        "",

      error:
        verification.error ||
        null
    });

    if (
      verification.verified
    ) {
      if (
        !best ||
        verification.score >
          best.score
      ) {
        best = {
          ...verification,

          candidate
        };
      }
    }

    /*
    |--------------------------------------------------------------------------
    | Very strong hit — no need to probe all candidates.
    |--------------------------------------------------------------------------
    */

    if (
      verification.verified &&
      verification.score >= 0.85
    ) {
      break;
    }
  }

  if (
    best
  ) {
    return {
      ...row,

      official_website:
        best.final_url,

      official_website_source:
        "UPTAC_API_FREE_VERIFIED",

      uptac_portal:
        UPTAC_2026,

      uptac_website_status:
        "OFFICIAL_WEBSITE_RESOLVED",

      website_match_confidence:
        Math.round(
          best.score *
          100
        ),

      website_candidates_checked:
        checked
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Safe unresolved.
  |--------------------------------------------------------------------------
  */

  return {
    ...row,

    uptac_portal:
      UPTAC_2026,

    uptac_legacy_institutes:
      UPTAC_LEGACY_INSTITUTES,

    uptac_website_status:
      "OFFICIAL_WEBSITE_UNRESOLVED",

    website_candidates_checked:
      checked
  };
}

/*
|--------------------------------------------------------------------------
| CHECKPOINT
|--------------------------------------------------------------------------
*/

async function saveCheckpoint(rows) {
  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      rows,
      null,
      2
    ),

    "utf8"
  );
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
    "UPTAC OFFICIAL WEBSITE BULK POPULATOR - IMPROVED"
  );

  console.log(
    "======================================="
  );

  console.log("");

  /*
  |--------------------------------------------------------------------------
  | Load JoSAA-enriched input
  |--------------------------------------------------------------------------
  */

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
      "Input JSON must be an array."
    );
  }

  if (
    rows.length !== 363
  ) {
    console.log(
      "WARNING: expected 363 DB rows, found",
      rows.length
    );
  }

  const initialWebsiteCount =
    rows.filter(
      row =>
        row.official_website
    ).length;

  const josaaWebsiteCount =
    rows.filter(
      row =>
        row
          .official_website_source ===
        "JOSAA_2026_OFFICIAL_DIRECTORY"
    ).length;

  const uptacRows =
    rows.filter(
      row =>
        row.source_family ===
        "UPTAC"
    );

  console.log(
    "Input:",
    INPUT
  );

  console.log(
    "Total DB colleges:",
    rows.length
  );

  console.log(
    "UPTAC-family colleges:",
    uptacRows.length
  );

  console.log(
    "Websites already present:",
    initialWebsiteCount
  );

  console.log(
    "JoSAA websites being preserved:",
    josaaWebsiteCount
  );

  /*
  |--------------------------------------------------------------------------
  | SAFETY CHECK
  |--------------------------------------------------------------------------
  |
  | Your JoSAA run resolved 112 websites.
  | If this falls drastically, input was probably overwritten.
  |--------------------------------------------------------------------------
  */

  if (
    initialWebsiteCount < 100
  ) {
    throw new Error(
      `SAFETY STOP: enriched input has only ${initialWebsiteCount} websites. Expected approximately 112 after JoSAA enrichment. Re-run populate-josaa-official-websites.js first.`
    );
  }

  console.log("");

  /*
  |--------------------------------------------------------------------------
  | UPTAC portal
  |--------------------------------------------------------------------------
  */

  const portal =
    await fetchWithFallback(
      UPTAC_2026
    );

  console.log(
    "UPTAC 2026 portal:",
    portal.ok
      ? "AVAILABLE"
      : "FAILED"
  );

  console.log("");

  /*
  |--------------------------------------------------------------------------
  | Process
  |--------------------------------------------------------------------------
  */

  const output = [];

  let processedUptac = 0;

  for (
    let i = 0;
    i < rows.length;
    i++
  ) {
    const row =
      rows[i];

    if (
      row.source_family !==
      "UPTAC"
    ) {
      output.push(
        row
      );

      continue;
    }

    processedUptac++;

    console.log(
      `[UPTAC ${processedUptac}/${uptacRows.length}] ${row.college_name}`
    );

    try {
      const updated =
        await processRow(
          row
        );

      output.push(
        updated
      );

      console.log(
        " ->",
        updated
          .uptac_website_status
      );

    } catch (error) {
      output.push({
        ...row,

        uptac_portal:
          UPTAC_2026,

        uptac_website_status:
          "ERROR",

        website_error:
          error.message
      });

      console.log(
        " -> ERROR:",
        error.message
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Checkpoint
    |--------------------------------------------------------------------------
    */

    if (
      processedUptac %
        CHECKPOINT_EVERY ===
      0
    ) {
      /*
      Need to preserve rows not processed yet.
      So write current + untouched remainder.
      */

      const processedIds =
        new Set(
          output.map(
            item =>
              item.college_id
          )
        );

      const remainder =
        rows.filter(
          item =>
            !processedIds.has(
              item.college_id
            )
        );

      await saveCheckpoint([
        ...output,
        ...remainder
      ]);

      console.log(
        `   checkpoint saved ${processedUptac}/${uptacRows.length}`
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Sanity check
  |--------------------------------------------------------------------------
  */

  if (
    output.length !==
    rows.length
  ) {
    throw new Error(
      `Output row mismatch: expected ${rows.length}, got ${output.length}`
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Groups
  |--------------------------------------------------------------------------
  */

  const uptacOutput =
    output.filter(
      row =>
        row.source_family ===
        "UPTAC"
    );

  const resolved =
    uptacOutput.filter(
      row =>
        Boolean(
          row.official_website
        )
    );

  const newlyResolved =
    uptacOutput.filter(
      row =>
        [
          "VERIFIED_OVERRIDE",
          "UPTAC_API_FREE_VERIFIED"
        ].includes(
          row
            .official_website_source
        )
    );

  const existing =
    uptacOutput.filter(
      row =>
        row
          .uptac_website_status ===
        "EXISTING"
    );

  const unresolved =
    uptacOutput.filter(
      row =>
        !row.official_website
    );

  const errors =
    uptacOutput.filter(
      row =>
        row
          .uptac_website_status ===
        "ERROR"
    );

  const allWithWebsite =
    output.filter(
      row =>
        row.official_website
    ).length;

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
    MATCH_OUTPUT,

    JSON.stringify(
      resolved,
      null,
      2
    ),

    "utf8"
  );

  await fs.writeFile(
    REVIEW_OUTPUT,

    JSON.stringify(
      [
        ...unresolved,
        ...errors
      ],
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

  const report = {
    generated_at:
      new Date()
        .toISOString(),

    total_db_colleges:
      rows.length,

    uptac_colleges:
      uptacRows.length,

    input_websites:
      initialWebsiteCount,

    preserved_josaa_websites:
      josaaWebsiteCount,

    uptac_with_website:
      resolved.length,

    uptac_existing:
      existing.length,

    uptac_newly_resolved:
      newlyResolved.length,

    uptac_unresolved:
      unresolved.length,

    errors:
      errors.length,

    all_colleges_with_website_after_merge:
      allWithWebsite,

    database_modified:
      false
  };

  await fs.writeFile(
    REPORT_OUTPUT,

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

  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "UPTAC WEBSITE RESOLUTION SUMMARY"
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
        "UPTAC-family",

      count:
        uptacRows.length
    },

    {
      metric:
        "Input websites",

      count:
        initialWebsiteCount
    },

    {
      metric:
        "JoSAA websites preserved",

      count:
        josaaWebsiteCount
    },

    {
      metric:
        "UPTAC with website",

      count:
        resolved.length
    },

    {
      metric:
        "UPTAC existing",

      count:
        existing.length
    },

    {
      metric:
        "UPTAC newly resolved",

      count:
        newlyResolved.length
    },

    {
      metric:
        "UPTAC unresolved",

      count:
        unresolved.length
    },

    {
      metric:
        "Errors",

      count:
        errors.length
    },

    {
      metric:
        "ALL DB colleges with website",

      count:
        allWithWebsite
    }
  ]);

  console.log("");

  console.log(
    "NEWLY RESOLVED SAMPLE"
  );

  console.table(
    newlyResolved
      .slice(
        0,
        30
      )
      .map(
        row => ({
          college:
            row.college_name,

          source:
            row
              .official_website_source,

          confidence:
            row
              .website_match_confidence,

          website:
            row
              .official_website
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
    MATCH_OUTPUT
  );

  console.log(
    "Saved:",
    REVIEW_OUTPUT
  );

  console.log(
    "Saved:",
    UNRESOLVED_OUTPUT
  );

  console.log(
    "Saved:",
    REPORT_OUTPUT
  );

  console.log("");

  console.log(
    "SAFETY:"
  );

  console.log(
    "- Existing JoSAA websites preserved."
  );

  console.log(
    "- Verified override keys normalized automatically."
  );

  console.log(
    "- Guessed domains accepted only after identity verification."
  );

  console.log(
    "- No fee data has been imported."
  );

  console.log(
    "- DATABASE HAS NOT BEEN MODIFIED."
  );
}

main().catch(
  error => {
    console.error("");

    console.error(
      "FAILED:",
      error.message
    );

    process.exitCode =
      1;
  }
);