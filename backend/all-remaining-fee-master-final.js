import "dotenv/config";

import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";

import {
  pool
} from "./src/db/pool.js";


/*
|--------------------------------------------------------------------------
| MODE
|--------------------------------------------------------------------------
|
| Default:
|   node all-remaining-fee-master-final.js
|       => DRY RUN
|
| Import:
|   node all-remaining-fee-master-final.js --import
|
|--------------------------------------------------------------------------
*/

const IMPORT_MODE =
  process.argv.includes(
    "--import"
  );


/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const TARGET_YEAR =
  2026;

/*
|--------------------------------------------------------------------------
| IMPORTANT:
| ALL 363 DATABASE COLLEGES INPUT
|--------------------------------------------------------------------------
*/

const INPUT =
  "./all-db-colleges-fee-input.json";


const REPORT_OUTPUT =
  "./all-fees-final-report.json";

const READY_OUTPUT =
  "./all-fees-final-import-ready.json";

const HOLD_OUTPUT =
  "./all-fees-final-hold.json";

const DISCOVERY_OUTPUT =
  "./all-fees-final-discovery.json";

const PREVIEW_OUTPUT =
  "./all-fees-final-preview.json";


/*
|--------------------------------------------------------------------------
| COMPLETED COLLEGES
|--------------------------------------------------------------------------
|
| Already imported colleges must never be processed again.
|--------------------------------------------------------------------------
*/

const COMPLETED_COLLEGES =
  new Set([
    "uptac-ajay-kumar-garg-engg-college-ghaziabad",

    "uptac-abss-institute-of-technology-meerut-meerut",

    "uptac-ashoka-institute-of-technology-management-varanasi",

    "uptac-accurate-institute-of-management-technology-gautam-buddh-nagar"
  ]);


/*
|--------------------------------------------------------------------------
| VERIFIED OFFICIAL OVERRIDES
|--------------------------------------------------------------------------
|
| Add ONLY manually verified/current official sources here.
|
| Never put third-party sources here.
|--------------------------------------------------------------------------
*/

const OFFICIAL_OVERRIDES = {

  /*
  |--------------------------------------------------------------------------
  | Assam University
  |--------------------------------------------------------------------------
  */

  "assam university, silchar": {
    official_website:
      "https://www.aus.ac.in/",

    source_url:
      "https://www.ausexamination.ac.in/admission/",

    source_type:
      "official_html",

    academic_year:
      2026
  },


  /*
  |--------------------------------------------------------------------------
  | Ambalika
  |--------------------------------------------------------------------------
  */

  "ambalika institute of management & technology,lucknow": {
    official_website:
      "https://www.aimt.edu.in/",

    source_url:
      "https://www.profile.aimt.edu.in/aimt-fee-structure/",

    source_type:
      "official_html",

    academic_year:
      2026,

    known_fee: {
      mode:
        "annual_tuition",

      amount:
        89209
    }
  }
};


/*
|--------------------------------------------------------------------------
| TEXT HELPERS
|--------------------------------------------------------------------------
*/

function cleanText(value) {
  return String(
    value ?? ""
  )
    .replace(
      /\uFEFF/g,
      ""
    )
    .replace(
      /\r/g,
      ""
    )
    .replace(
      /[ \t]+/g,
      " "
    )
    .replace(
      /\n[ \t]+/g,
      "\n"
    )
    .replace(
      /\n{3,}/g,
      "\n\n"
    )
    .trim();
}


function normalizeCollegeName(value) {
  return String(
    value ?? ""
  )
    .toLowerCase()
    .replace(
      /\s+/g,
      " "
    )
    .trim();
}


function isFwBranch(name) {
  const value =
    String(
      name || ""
    );

  return (
    /\(\s*FW\s*\)/i.test(
      value
    ) ||
    /\bTFW\b/i.test(
      value
    ) ||
    /fee\s*waiver/i.test(
      value
    )
  );
}


/*
|--------------------------------------------------------------------------
| SOURCE OVERRIDE HELPERS
|--------------------------------------------------------------------------
*/

function getOverride(row) {
  const name =
    normalizeCollegeName(
      row.college_name
    );

  return (
    OFFICIAL_OVERRIDES[
      name
    ] ||
    null
  );
}


function mergeSourceInfo(row) {
  const override =
    getOverride(
      row
    );

  if (!override) {
    return row;
  }

  return {
    ...row,
    ...override
  };
}


/*
|--------------------------------------------------------------------------
| HTTP FETCH
|--------------------------------------------------------------------------
*/

async function fetchUrl(url) {
  const response =
    await axios.get(
      url,
      {
        timeout:
          45000,

        maxRedirects:
          8,

        responseType:
          "arraybuffer",

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36",

          Accept:
            "text/html,application/xhtml+xml,application/pdf,*/*"
        },

        validateStatus:
          status =>
            status >= 200 &&
            status < 400
      }
    );

  return {
    buffer:
      Buffer.from(
        response.data
      ),

    contentType:
      String(
        response.headers[
          "content-type"
        ] ||
        ""
      ).toLowerCase(),

    finalUrl:
      response.request
        ?.res
        ?.responseUrl ||
      url
  };
}


/*
|--------------------------------------------------------------------------
| HTML EXTRACTION
|--------------------------------------------------------------------------
*/

function extractHtml(buffer) {
  const html =
    buffer.toString(
      "utf8"
    );

  const $ =
    cheerio.load(
      html
    );

  $(
    "script,style,noscript,svg"
  ).remove();

  const bodyText =
    $("body").text();

  const text =
    cleanText(
      bodyText
    );

  const links = [];

  $("a[href]").each(
    (
      _,
      element
    ) => {
      const href =
        cleanText(
          $(element)
            .attr("href")
        );

      const label =
        cleanText(
          $(element).text()
        );

      if (href) {
        links.push({
          href,
          label
        });
      }
    }
  );

  return {
    type:
      "official_html",

    text,

    lines:
      bodyText
        .split(
          /\r?\n/
        )
        .map(
          cleanText
        )
        .filter(
          Boolean
        ),

    links
  };
}


/*
|--------------------------------------------------------------------------
| PDF EXTRACTION
|--------------------------------------------------------------------------
*/

async function extractPdf(buffer) {
  const parser =
    new PDFParse({
      data:
        buffer
    });

  try {
    const result =
      await parser.getText();

    const raw =
      String(
        result.text ||
        ""
      );

    return {
      type:
        "official_pdf",

      text:
        cleanText(
          raw
        ),

      lines:
        raw
          .split(
            /\r?\n/
          )
          .map(
            cleanText
          )
          .filter(
            Boolean
          ),

      links:
        []
    };

  } finally {
    try {
      await parser.destroy();
    } catch {}
  }
}


/*
|--------------------------------------------------------------------------
| SOURCE EXTRACTION
|--------------------------------------------------------------------------
*/

async function extractSource(url) {
  const fetched =
    await fetchUrl(
      url
    );

  const isPdf =
    fetched.contentType.includes(
      "application/pdf"
    ) ||
    /\.pdf(?:$|\?)/i.test(
      fetched.finalUrl
    ) ||
    /\.pdf(?:$|\?)/i.test(
      url
    );

  const extracted =
    isPdf
      ? await extractPdf(
          fetched.buffer
        )
      : extractHtml(
          fetched.buffer
        );

  return {
    ...extracted,

    final_url:
      fetched.finalUrl,

    content_type:
      fetched.contentType
  };
}


/*
|--------------------------------------------------------------------------
| YEAR DETECTION
|--------------------------------------------------------------------------
*/

function detectYears(text) {
  const sessions =
    String(
      text || ""
    ).match(
      /\b(20\d{2})\s*[-–/]\s*\d{2,4}\b/g
    ) || [];

  const standalone =
    String(
      text || ""
    ).match(
      /\b20\d{2}\b/g
    ) || [];

  const values = [];

  for (
    const value
    of sessions
  ) {
    const match =
      value.match(
        /20\d{2}/
      );

    if (match) {
      values.push(
        Number(
          match[0]
        )
      );
    }
  }

  for (
    const value
    of standalone
  ) {
    values.push(
      Number(
        value
      )
    );
  }

  return [
    ...new Set(
      values.filter(
        year =>
          year >= 2020 &&
          year <= 2035
      )
    )
  ].sort(
    (
      a,
      b
    ) =>
      a - b
  );
}


function hasTargetYear(
  row,
  text
) {
  if (
    Number(
      row.academic_year
    ) ===
    TARGET_YEAR
  ) {
    return true;
  }

  return detectYears(
    text
  ).includes(
    TARGET_YEAR
  );
}


/*
|--------------------------------------------------------------------------
| FEE SIGNAL DETECTION
|--------------------------------------------------------------------------
*/

function detectSignals(text) {
  const lower =
    String(
      text || ""
    )
      .toLowerCase();

  return {
    btech:
      /b\.?\s*tech|btech|bachelor\s+of\s+technology/.test(
        lower
      ),

    fee:
      /\bfee\b|\bfees\b|fee\s+structure|course\s+fee/.test(
        lower
      ),

    tuition:
      /tuition/.test(
        lower
      ),

    total:
      /total\s+fee|total\s+course\s+fee|grand\s+total/.test(
        lower
      ),

    hostel:
      /hostel\s+fee|hostel\s+fees|hostel\s+charges/.test(
        lower
      ),

    fw:
      /fee\s*waiver|\btfw\b|\(fw\)/.test(
        lower
      )
  };
}


/*
|--------------------------------------------------------------------------
| MONEY PARSER
|--------------------------------------------------------------------------
*/

function parseMoney(value) {
  const number =
    Number(
      String(
        value
      )
        .replace(
          /₹|rs\.?|inr/gi,
          ""
        )
        .replace(
          /,/g,
          ""
        )
        .replace(
          /\/-/g,
          ""
        )
        .trim()
    );

  return Number.isFinite(
    number
  )
    ? number
    : null;
}


function extractAmounts(text) {
  const matches =
    String(
      text || ""
    )
      .match(
        /(?:₹|Rs\.?|INR)?\s*\d{1,3}(?:,\d{2,3})+(?:\.\d+)?|(?:₹|Rs\.?|INR)\s*\d{4,7}/gi
      ) ||
    [];

  const values = [];

  for (
    const value
    of matches
  ) {
    const number =
      parseMoney(
        value
      );

    if (
      !number ||
      number < 100 ||
      number > 2000000
    ) {
      continue;
    }

    if (
      number >= 2000 &&
      number <= 2100
    ) {
      continue;
    }

    values.push(
      number
    );
  }

  return [
    ...new Set(
      values
    )
  ].sort(
    (
      a,
      b
    ) =>
      a - b
  );
}


/*
|--------------------------------------------------------------------------
| OFFICIAL WEBSITE CRAWLER
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This can only crawl a website if official_website is already known.
|
| It does NOT perform Google/Bing search.
|--------------------------------------------------------------------------
*/

async function discoverFromOfficialWebsite(
  row
) {
  if (
    !row.official_website
  ) {
    return null;
  }

  try {
    const home =
      await extractSource(
        row.official_website
      );

    const candidates =
      home.links
        .filter(
          link =>
            /fee|fees|fee structure|admission fee|admission/i.test(
              `${link.label} ${link.href}`
            )
        )
        .slice(
          0,
          15
        );

    for (
      const candidate
      of candidates
    ) {
      let candidateUrl;

      try {
        candidateUrl =
          new URL(
            candidate.href,
            row.official_website
          ).href;

      } catch {
        continue;
      }

      try {
        const result =
          await extractSource(
            candidateUrl
          );

        const signals =
          detectSignals(
            result.text
          );

        if (
          signals.btech &&
          signals.fee
        ) {
          return {
            url:
              candidateUrl,

            extracted:
              result
          };
        }

      } catch {}
    }

  } catch {}

  return null;
}


/*
|--------------------------------------------------------------------------
| NORMALIZATION OVERRIDE
|--------------------------------------------------------------------------
*/

function normalizeKnownOverride(row) {
  const override =
    getOverride(
      row
    );

  if (
    !override?.known_fee
  ) {
    return null;
  }

  if (
    override.known_fee.mode ===
    "annual_tuition"
  ) {
    const annual =
      Number(
        override.known_fee.amount
      );

    if (
      !Number.isFinite(
        annual
      ) ||
      annual <= 0
    ) {
      return null;
    }

    return {
      mode:
        "annual_tuition",

      years: [
        1,
        2,
        3,
        4
      ].map(
        year => ({
          year_of_study:
            year,

          session:
            `${TARGET_YEAR + year - 1}-${String(
              TARGET_YEAR + year
            ).slice(-2)}`,

          tuition_fee:
            annual,

          total_fee:
            annual
        })
      )
    };
  }

  return null;
}


/*
|--------------------------------------------------------------------------
| YEAR-WISE TOTAL PARSER
|--------------------------------------------------------------------------
*/

function parseYearWiseTotals(
  text
) {
  const patterns = [
    /1(?:st)?\s*(?:year|yr)?\.?\s*(?:₹|rs\.?)?\s*([\d,]{5,})/i,

    /2(?:nd)?\s*(?:year|yr)?\.?\s*(?:₹|rs\.?)?\s*([\d,]{5,})/i,

    /3(?:rd)?\s*(?:year|yr)?\.?\s*(?:₹|rs\.?)?\s*([\d,]{5,})/i,

    /4(?:th)?\s*(?:year|yr)?\.?\s*(?:₹|rs\.?)?\s*([\d,]{5,})/i
  ];

  const values = [];

  for (
    const pattern
    of patterns
  ) {
    const match =
      String(
        text || ""
      ).match(
        pattern
      );

    if (!match) {
      return null;
    }

    const amount =
      parseMoney(
        match[1]
      );

    if (
      !amount ||
      amount < 10000 ||
      amount > 1000000
    ) {
      return null;
    }

    values.push(
      amount
    );
  }

  return {
    mode:
      "year_wise_total",

    years:
      values.map(
        (
          amount,
          index
        ) => ({
          year_of_study:
            index + 1,

          session:
            `${TARGET_YEAR + index}-${String(
              TARGET_YEAR +
              index +
              1
            ).slice(-2)}`,

          tuition_fee:
            null,

          total_fee:
            amount
        })
      )
  };
}


/*
|--------------------------------------------------------------------------
| ANNUAL TUITION PARSER
|--------------------------------------------------------------------------
*/

function parseAnnualTuition(
  text
) {
  const patterns = [
    /tuition\s+fee[^₹\d]{0,40}(?:₹|rs\.?)?\s*([\d,]{4,7})\s*(?:per\s+annum|per\s+year|annually)/i,

    /b\.?\s*tech[^₹\d]{0,80}tuition[^₹\d]{0,20}(?:₹|rs\.?)?\s*([\d,]{4,7})/i
  ];

  for (
    const pattern
    of patterns
  ) {
    const match =
      String(
        text || ""
      ).match(
        pattern
      );

    if (!match) {
      continue;
    }

    const amount =
      parseMoney(
        match[1]
      );

    if (
      !amount ||
      amount < 10000 ||
      amount > 1000000
    ) {
      continue;
    }

    return {
      mode:
        "annual_tuition",

      years: [
        1,
        2,
        3,
        4
      ].map(
        year => ({
          year_of_study:
            year,

          session:
            `${TARGET_YEAR + year - 1}-${String(
              TARGET_YEAR + year
            ).slice(-2)}`,

          tuition_fee:
            amount,

          total_fee:
            amount
        })
      )
    };
  }

  return null;
}


/*
|--------------------------------------------------------------------------
| NORMALIZE
|--------------------------------------------------------------------------
*/

function normalizeFees(
  row,
  extracted
) {
  const override =
    normalizeKnownOverride(
      row
    );

  if (override) {
    return override;
  }

  const yearWise =
    parseYearWiseTotals(
      extracted.text
    );

  if (yearWise) {
    return yearWise;
  }

  const annual =
    parseAnnualTuition(
      extracted.text
    );

  if (annual) {
    return annual;
  }

  return null;
}


/*
|--------------------------------------------------------------------------
| LOAD BRANCHES
|--------------------------------------------------------------------------
*/

async function loadBranches(
  collegeId
) {
  const result =
    await pool.query(
      `
      SELECT
        id,
        name
      FROM branches
      WHERE college_id = $1
      ORDER BY name
      `,
      [
        collegeId
      ]
    );

  return result.rows;
}


/*
|--------------------------------------------------------------------------
| PREVIEW BUILDER
|--------------------------------------------------------------------------
*/

function buildPreview(
  row,
  sourceUrl,
  normalization,
  branches,
  signals
) {
  const normalBranches =
    branches.filter(
      branch =>
        !isFwBranch(
          branch.name
        )
    );

  const fwBranches =
    branches.filter(
      branch =>
        isFwBranch(
          branch.name
        )
    );

  const readyBranches =
    normalBranches.map(
      branch => ({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        branch_id:
          String(
            branch.id
          ),

        branch_name:
          branch.name,

        fee_scope:
          "branch_specific",

        academic_year:
          TARGET_YEAR,

        student_category:
          "GENERAL",

        source_url:
          sourceUrl,

        variants:
          normalization.years.map(
            year => ({
              year_of_study:
                year.year_of_study,

              session:
                year.session,

              fee_period:
                "annual",

              student_category:
                "GENERAL",

              residence_type:
                "day_scholar",

              tuition_fee:
                year.tuition_fee,

              hostel_fee:
                null,

              total_fee:
                year.total_fee,

              verification_status:
                "verified"
            })
          )
      })
    );

  return {
    ready_branches:
      readyBranches,

    fw_branches_held:
      fwBranches.map(
        branch => ({
          id:
            String(
              branch.id
            ),

          name:
            branch.name
        })
      ),

    fw_policy:
      signals.fw
        ? "SOURCE_PRESENT_REQUIRES_EXACT_FW_NORMALIZATION"
        : "HOLD_FW_NO_SPECIFIC_SOURCE",

    hostel_policy:
      signals.hostel
        ? "SOURCE_PRESENT_REQUIRES_EXACT_HOSTEL_NORMALIZATION"
        : "NULL"
  };
}


/*
|--------------------------------------------------------------------------
| PROCESS ONE COLLEGE
|--------------------------------------------------------------------------
*/

async function processCollege(
  originalRow
) {
  const row =
    mergeSourceInfo(
      originalRow
    );


  /*
  |--------------------------------------------------------------------------
  | Completed
  |--------------------------------------------------------------------------
  */

  if (
    COMPLETED_COLLEGES.has(
      row.college_id
    )
  ) {
    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      status:
        "ALREADY_COMPLETED"
    };
  }


  let sourceUrl =
    row.source_url ||
    row.fee_source_url ||
    null;

  let extracted =
    null;


  /*
  |--------------------------------------------------------------------------
  | Direct known source
  |--------------------------------------------------------------------------
  */

  if (sourceUrl) {
    try {
      extracted =
        await extractSource(
          sourceUrl
        );
    } catch {
      extracted =
        null;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Crawl known official website
  |--------------------------------------------------------------------------
  */

  if (!extracted) {
    const discovered =
      await discoverFromOfficialWebsite(
        row
      );

    if (discovered) {
      sourceUrl =
        discovered.url;

      extracted =
        discovered.extracted;
    }
  }


  /*
  |--------------------------------------------------------------------------
  | No source
  |--------------------------------------------------------------------------
  */

  if (!extracted) {
    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      status:
        "DISCOVERY_REQUIRED",

      reason:
        row.official_website
          ? "Official website available but current B.Tech fee source was not automatically resolved."
          : "Official website/source not currently stored."
    };
  }


  const signals =
    detectSignals(
      extracted.text
    );

  const amounts =
    extractAmounts(
      extracted.text
    );


  /*
  |--------------------------------------------------------------------------
  | Year gate
  |--------------------------------------------------------------------------
  */

  if (
    !hasTargetYear(
      row,
      extracted.text
    )
  ) {
    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      status:
        "HOLD_YEAR_UNVERIFIED",

      source_url:
        sourceUrl,

      detected_years:
        detectYears(
          extracted.text
        ),

      reason:
        "Current 2026 academic year could not be verified."
    };
  }


  /*
  |--------------------------------------------------------------------------
  | B.Tech evidence
  |--------------------------------------------------------------------------
  */

  if (
    !signals.btech ||
    !signals.fee
  ) {
    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      status:
        "HOLD_FEE_STRUCTURE_UNCLEAR",

      source_url:
        sourceUrl,

      reason:
        "Source does not clearly expose B.Tech fee information."
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Normalize exact fee
  |--------------------------------------------------------------------------
  */

  const normalization =
    normalizeFees(
      row,
      extracted
    );

  if (!normalization) {
    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      status:
        "HOLD_NORMALIZATION_FAILED",

      source_url:
        sourceUrl,

      amounts,

      reason:
        "Fee source found but exact safe annual/year-wise B.Tech fee could not be normalized."
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Validate 4 years
  |--------------------------------------------------------------------------
  */

  if (
    !Array.isArray(
      normalization.years
    ) ||
    normalization.years.length !== 4
  ) {
    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      status:
        "HOLD_NORMALIZATION_FAILED",

      reason:
        "Expected exactly four B.Tech academic years."
    };
  }


  const invalidFee =
    normalization.years.some(
      year =>
        !Number.isFinite(
          Number(
            year.total_fee
          )
        ) ||
        Number(
          year.total_fee
        ) <= 0
    );


  if (invalidFee) {
    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      status:
        "HOLD_NORMALIZATION_FAILED",

      reason:
        "Invalid normalized fee amount."
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Load DB branches
  |--------------------------------------------------------------------------
  */

  const branches =
    await loadBranches(
      row.college_id
    );

  if (
    branches.length === 0
  ) {
    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      status:
        "HOLD_NO_BRANCHES",

      source_url:
        sourceUrl,

      reason:
        "No branches found in database."
    };
  }


  const preview =
    buildPreview(
      row,
      sourceUrl,
      normalization,
      branches,
      signals
    );


  if (
    preview.ready_branches.length ===
    0
  ) {
    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      status:
        "HOLD_NO_NORMAL_BRANCHES",

      source_url:
        sourceUrl,

      reason:
        "Only FW/TFW branches found; generic fee cannot be imported."
    };
  }


  return {
    college_id:
      row.college_id,

    college_name:
      row.college_name,

    status:
      "IMPORT_READY",

    academic_year:
      TARGET_YEAR,

    source_url:
      sourceUrl,

    source_type:
      extracted.type,

    signals,

    amounts,

    normalization,

    branch_count:
      branches.length,

    ready_branch_count:
      preview.ready_branches.length,

    fw_held_count:
      preview.fw_branches_held.length,

    preview
  };
}


/*
|--------------------------------------------------------------------------
| DB SCHEMA CHECK
|--------------------------------------------------------------------------
*/

async function hasYearOfStudyColumn(
  client
) {
  const result =
    await client.query(
      `
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'fee_variants'
        AND column_name = 'year_of_study'
      `
    );

  return (
    result.rowCount > 0
  );
}


/*
|--------------------------------------------------------------------------
| INSERT VARIANT
|--------------------------------------------------------------------------
*/

async function insertVariant(
  client,
  {
    branchFeeId,
    variant,
    hasYearColumn
  }
) {
  if (hasYearColumn) {
    await client.query(
      `
      INSERT INTO fee_variants (
        branch_fee_id,
        semester,
        year_of_study,
        fee_period,
        student_category,
        income_min,
        income_max,
        residence_type,
        room_type,
        tuition_fee,
        admission_fee,
        institute_fee,
        hostel_fee,
        mess_fee,
        caution_deposit,
        other_fee,
        total_fee,
        is_one_time_included,
        verification_status
      )
      VALUES (
        $1,
        NULL,
        $2,
        'annual',
        'GENERAL',
        NULL,
        NULL,
        'day_scholar',
        NULL,
        $3,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        $4,
        FALSE,
        'verified'
      )
      `,
      [
        branchFeeId,
        variant.year_of_study,
        variant.tuition_fee,
        variant.total_fee
      ]
    );

    return;
  }


  /*
  |--------------------------------------------------------------------------
  | Current DB schema has no year_of_study column
  |--------------------------------------------------------------------------
  */

  await client.query(
    `
    INSERT INTO fee_variants (
      branch_fee_id,
      semester,
      fee_period,
      student_category,
      income_min,
      income_max,
      residence_type,
      room_type,
      tuition_fee,
      admission_fee,
      institute_fee,
      hostel_fee,
      mess_fee,
      caution_deposit,
      other_fee,
      total_fee,
      is_one_time_included,
      verification_status
    )
    VALUES (
      $1,
      NULL,
      'annual',
      'GENERAL',
      NULL,
      NULL,
      'day_scholar',
      NULL,
      $2,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      $3,
      FALSE,
      'verified'
    )
    `,
    [
      branchFeeId,
      variant.tuition_fee,
      variant.total_fee
    ]
  );
}


/*
|--------------------------------------------------------------------------
| IMPORT ONE COLLEGE
|--------------------------------------------------------------------------
*/

async function importCollege(
  result
) {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    const hasYearColumn =
      await hasYearOfStudyColumn(
        client
      );

    let mastersInserted =
      0;

    let variantsInserted =
      0;

    let mastersReplaced =
      0;


    for (
      const branch
      of result.preview
        .ready_branches
    ) {
      /*
      |--------------------------------------------------------------------------
      | Verify branch belongs to college
      |--------------------------------------------------------------------------
      */

      const branchCheck =
        await client.query(
          `
          SELECT
            id,
            name
          FROM branches
          WHERE id = $1
            AND college_id = $2
          `,
          [
            branch.branch_id,
            result.college_id
          ]
        );


      if (
        branchCheck.rowCount === 0
      ) {
        throw new Error(
          `Invalid branch ${branch.branch_id}`
        );
      }


      if (
        isFwBranch(
          branchCheck.rows[0].name
        )
      ) {
        throw new Error(
          `Safety failure: FW branch entered generic importer: ${branchCheck.rows[0].name}`
        );
      }


      /*
      |--------------------------------------------------------------------------
      | Replace only same college/branch/2026 fee master
      |--------------------------------------------------------------------------
      */

      const existing =
        await client.query(
          `
          SELECT id
          FROM branch_fees
          WHERE college_id = $1
            AND branch_id = $2
            AND program = 'B.Tech'
            AND fee_scope =
                'branch_specific'
            AND academic_year = $3
          `,
          [
            result.college_id,
            branch.branch_id,
            TARGET_YEAR
          ]
        );


      for (
        const old
        of existing.rows
      ) {
        await client.query(
          `
          DELETE FROM branch_fees
          WHERE id = $1
          `,
          [
            old.id
          ]
        );

        mastersReplaced++;
      }


      /*
      |--------------------------------------------------------------------------
      | Insert master
      |--------------------------------------------------------------------------
      */

      const master =
        await client.query(
          `
          INSERT INTO branch_fees (
            college_id,
            branch_id,
            program,
            fee_scope,
            academic_year,
            source_label,
            source_url,
            verification_status
          )
          VALUES (
            $1,
            $2,
            'B.Tech',
            'branch_specific',
            $3,
            $4,
            $5,
            'verified'
          )
          RETURNING id
          `,
          [
            result.college_id,
            branch.branch_id,
            TARGET_YEAR,
            "Official B.Tech Fee Structure 2026-27",
            result.source_url
          ]
        );


      const branchFeeId =
        master.rows[0].id;


      /*
      |--------------------------------------------------------------------------
      | Insert 4 variants
      |--------------------------------------------------------------------------
      */

      for (
        const variant
        of branch.variants
      ) {
        await insertVariant(
          client,
          {
            branchFeeId,
            variant,
            hasYearColumn
          }
        );

        variantsInserted++;
      }

      mastersInserted++;
    }


    /*
    |--------------------------------------------------------------------------
    | Post-insert verify
    |--------------------------------------------------------------------------
    */

    const verify =
      await client.query(
        `
        SELECT
          COUNT(DISTINCT bf.id)::int
            AS masters,

          COUNT(fv.id)::int
            AS variants

        FROM branch_fees bf

        LEFT JOIN fee_variants fv
          ON fv.branch_fee_id =
             bf.id

        WHERE bf.college_id = $1
          AND bf.academic_year = $2
          AND bf.program = 'B.Tech'
          AND bf.fee_scope =
              'branch_specific'
        `,
        [
          result.college_id,
          TARGET_YEAR
        ]
      );


    const expectedMasters =
      result.preview
        .ready_branches
        .length;

    const expectedVariants =
      expectedMasters *
      4;


    if (
      Number(
        verify.rows[0].masters
      ) !==
        expectedMasters ||
      Number(
        verify.rows[0].variants
      ) !==
        expectedVariants
    ) {
      throw new Error(
        `Verification mismatch: expected ${expectedMasters}/${expectedVariants}, got ${verify.rows[0].masters}/${verify.rows[0].variants}`
      );
    }


    await client.query(
      "COMMIT"
    );


    return {
      imported:
        true,

      masters:
        mastersInserted,

      replaced:
        mastersReplaced,

      variants:
        variantsInserted
    };


  } catch (error) {
    try {
      await client.query(
        "ROLLBACK"
      );
    } catch {}

    return {
      imported:
        false,

      error:
        error.message
    };

  } finally {
    client.release();
  }
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
    "ALL DATABASE COLLEGES FEE MASTER"
  );

  console.log(
    IMPORT_MODE
      ? "MODE: VERIFIED IMPORT"
      : "MODE: DRY RUN"
  );

  console.log(
    "======================================="
  );

  console.log("");

  console.log(
    "Input file:",
    INPUT
  );


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
    "Input colleges:",
    rows.length
  );


  console.log(
    "Target year:",
    TARGET_YEAR
  );


  console.log("");


  const results = [];


  /*
  |--------------------------------------------------------------------------
  | Sequential processing intentionally avoids hammering college websites.
  |--------------------------------------------------------------------------
  */

  for (
    let i = 0;
    i < rows.length;
    i++
  ) {
    const row =
      rows[i];


    console.log(
      `[${i + 1}/${rows.length}] ${row.college_name}`
    );


    try {
      const result =
        await processCollege(
          row
        );


      results.push(
        result
      );


      console.log(
        " ->",
        result.status
      );


    } catch (error) {
      results.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        status:
          "PIPELINE_FAILED",

        error:
          error.message
      });


      console.log(
        " -> PIPELINE_FAILED:",
        error.message
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | GROUPS
  |--------------------------------------------------------------------------
  */

  const ready =
    results.filter(
      row =>
        row.status ===
        "IMPORT_READY"
    );


  const discovery =
    results.filter(
      row =>
        row.status ===
        "DISCOVERY_REQUIRED"
    );


  const completed =
    results.filter(
      row =>
        row.status ===
        "ALREADY_COMPLETED"
    );


  const hold =
    results.filter(
      row =>
        ![
          "IMPORT_READY",
          "DISCOVERY_REQUIRED",
          "ALREADY_COMPLETED"
        ].includes(
          row.status
        )
    );


  /*
  |--------------------------------------------------------------------------
  | Save dry-run preview
  |--------------------------------------------------------------------------
  */

  await fs.writeFile(
    PREVIEW_OUTPUT,

    JSON.stringify(
      ready,
      null,
      2
    ),

    "utf8"
  );


  /*
  |--------------------------------------------------------------------------
  | IMPORT ONLY VERIFIED READY COLLEGES
  |--------------------------------------------------------------------------
  */

  const importResults = [];


  if (IMPORT_MODE) {
    console.log("");

    console.log(
      "======================================="
    );

    console.log(
      "IMPORTING VERIFIED COLLEGES"
    );

    console.log(
      "======================================="
    );


    for (
      const row
      of ready
    ) {
      console.log("");

      console.log(
        row.college_name
      );


      const result =
        await importCollege(
          row
        );


      importResults.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        ...result
      });


      console.log(
        result.imported
          ? ` -> IMPORTED (${result.masters} masters / ${result.variants} variants)`
          : ` -> FAILED: ${result.error}`
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | REPORT
  |--------------------------------------------------------------------------
  */

  const report = {
    generated_at:
      new Date()
        .toISOString(),

    target_year:
      TARGET_YEAR,

    input_file:
      INPUT,

    import_mode:
      IMPORT_MODE,

    counts: {
      input:
        rows.length,

      already_completed:
        completed.length,

      import_ready:
        ready.length,

      hold:
        hold.length,

      discovery:
        discovery.length
    },

    results,

    imports:
      importResults
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


  await fs.writeFile(
    READY_OUTPUT,

    JSON.stringify(
      ready,
      null,
      2
    ),

    "utf8"
  );


  await fs.writeFile(
    HOLD_OUTPUT,

    JSON.stringify(
      hold,
      null,
      2
    ),

    "utf8"
  );


  await fs.writeFile(
    DISCOVERY_OUTPUT,

    JSON.stringify(
      discovery,
      null,
      2
    ),

    "utf8"
  );


  /*
  |--------------------------------------------------------------------------
  | FINAL SUMMARY
  |--------------------------------------------------------------------------
  */

  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "FINAL FEE PIPELINE SUMMARY"
  );

  console.log(
    "======================================="
  );


  console.table([
    {
      status:
        "TOTAL_INPUT",

      count:
        rows.length
    },

    {
      status:
        "ALREADY_COMPLETED",

      count:
        completed.length
    },

    {
      status:
        "IMPORT_READY",

      count:
        ready.length
    },

    {
      status:
        "HOLD",

      count:
        hold.length
    },

    {
      status:
        "DISCOVERY_REQUIRED",

      count:
        discovery.length
    }
  ]);


  console.log("");

  console.log(
    "IMPORT READY"
  );


  console.table(
    ready.map(
      (
        row,
        index
      ) => ({
        no:
          index + 1,

        college:
          row.college_name,

        branches:
          row.ready_branch_count,

        fw_held:
          row.fw_held_count,

        mode:
          row.normalization
            ?.mode,

        hostel:
          row.preview
            ?.hostel_policy
      })
    )
  );


  console.log("");

  console.log(
    "HOLD"
  );


  console.table(
    hold.map(
      (
        row,
        index
      ) => ({
        no:
          index + 1,

        college:
          row.college_name,

        status:
          row.status,

        reason:
          row.reason ||
          row.error ||
          ""
      })
    )
  );


  console.log("");

  console.log(
    "DISCOVERY REQUIRED"
  );


  console.table(
    discovery.map(
      (
        row,
        index
      ) => ({
        no:
          index + 1,

        college:
          row.college_name,

        reason:
          row.reason ||
          ""
      })
    )
  );


  if (IMPORT_MODE) {
    console.log("");

    console.log(
      "IMPORT RESULTS"
    );


    console.table(
      importResults.map(
        row => ({
          college:
            row.college_name,

          imported:
            row.imported,

          masters:
            row.masters ||
            0,

          replaced:
            row.replaced ||
            0,

          variants:
            row.variants ||
            0,

          error:
            row.error ||
            ""
        })
      )
    );
  }


  console.log("");

  console.log(
    "Saved:",
    REPORT_OUTPUT
  );

  console.log(
    "Saved:",
    READY_OUTPUT
  );

  console.log(
    "Saved:",
    HOLD_OUTPUT
  );

  console.log(
    "Saved:",
    DISCOVERY_OUTPUT
  );

  console.log(
    "Saved:",
    PREVIEW_OUTPUT
  );


  console.log("");

  console.log(
    "POLICY:"
  );

  console.log(
    "Current official source + clear B.Tech fee => IMPORT_READY"
  );

  console.log(
    "Old/unverified source => HOLD"
  );

  console.log(
    "No source => DISCOVERY_REQUIRED"
  );

  console.log(
    "FW without explicit FW fee => HOLD FW"
  );

  console.log(
    "Hostel without explicit hostel fee => NULL"
  );


  console.log("");

  console.log(
    IMPORT_MODE
      ? "VERIFIED IMPORT MODE COMPLETE."
      : "DRY RUN COMPLETE. DATABASE HAS NOT BEEN MODIFIED."
  );


  await pool.end();
}


main().catch(
  async error => {
    console.error(
      "FAILED:",
      error.message
    );


    try {
      await pool.end();
    } catch {}


    process.exitCode =
      1;
  }
);