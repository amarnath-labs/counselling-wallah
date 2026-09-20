import "dotenv/config";

import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";


/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const INPUT =
  "./fee-master-remaining-after-completed.json";

const OUTPUT =
  "./fee-all-remaining-master-report.json";

const READY_OUTPUT =
  "./fee-all-remaining-source-ready.json";

const REVIEW_OUTPUT =
  "./fee-all-remaining-review-required.json";

const DISCOVERY_OUTPUT =
  "./fee-all-remaining-source-discovery.json";


const TARGET_YEAR =
  2026;


/*
|--------------------------------------------------------------------------
| BASIC HELPERS
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


function normalizeName(value) {
  return String(
    value ?? ""
  )
    .toLowerCase()
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


function getSourceUrl(row) {
  return (
    row.fee_source_url ||
    row.source_url ||
    null
  );
}


function getOfficialWebsite(row) {
  return (
    row.official_website ||
    row.official_site ||
    null
  );
}


function isPdfUrl(url) {
  return /\.pdf(?:$|\?|#)/i.test(
    String(
      url || ""
    )
  );
}


function isBankLine(value) {
  return /a\/c\s*(?:no|number)|account\s*(?:no|number)|ifsc|bank\s*account|bank\s*name/i.test(
    String(
      value ?? ""
    )
  );
}


/*
|--------------------------------------------------------------------------
| YEAR DETECTION
|--------------------------------------------------------------------------
*/

function detectAcademicYears(text) {
  const value =
    String(
      text ?? ""
    );

  const found =
    new Set();


  /*
  |--------------------------------------------------------------------------
  | 2026-27 / 2026–27 / 2026/27
  |--------------------------------------------------------------------------
  */

  const sessionRegex =
    /\b(20\d{2})\s*[-–/]\s*(\d{2,4})\b/g;


  let match;


  while (
    (
      match =
        sessionRegex.exec(
          value
        )
    ) !== null
  ) {
    const start =
      Number(
        match[1]
      );


    if (
      start >= 2015 &&
      start <= 2035
    ) {
      found.add(
        start
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Standalone years
  |--------------------------------------------------------------------------
  */

  const yearRegex =
    /\b(20(?:1[5-9]|2\d|3[0-5]))\b/g;


  while (
    (
      match =
        yearRegex.exec(
          value
        )
    ) !== null
  ) {
    found.add(
      Number(
        match[1]
      )
    );
  }


  return [
    ...found
  ].sort(
    (
      a,
      b
    ) =>
      a - b
  );
}


function resolveSourceYear(
  row,
  text
) {
  const explicit =
    Number(
      row.academic_year
    );


  const years =
    detectAcademicYears(
      text
    );


  if (
    Number.isFinite(
      explicit
    ) &&
    explicit >= 2015
  ) {
    return {
      year:
        explicit,

      detected_years:
        years,

      method:
        "manifest"
    };
  }


  if (
    years.includes(
      TARGET_YEAR
    )
  ) {
    return {
      year:
        TARGET_YEAR,

      detected_years:
        years,

      method:
        "content_current_year"
    };
  }


  const realistic =
    years.filter(
      year =>
        year >= 2020 &&
        year <= TARGET_YEAR
    );


  if (
    realistic.length > 0
  ) {
    return {
      year:
        Math.max(
          ...realistic
        ),

      detected_years:
        years,

      method:
        "content_latest_year"
    };
  }


  return {
    year:
      null,

    detected_years:
      years,

    method:
      "unknown"
  };
}


/*
|--------------------------------------------------------------------------
| FEE SIGNALS
|--------------------------------------------------------------------------
*/

function detectSignals(text) {
  const lower =
    String(
      text ?? ""
    )
      .toLowerCase();


  return {
    btech:
      /b\.?\s*tech|btech|bachelor\s+of\s+technology/.test(
        lower
      ),

    fee:
      /\bfee\b|\bfees\b|charges/.test(
        lower
      ),

    tuition:
      /tuition/.test(
        lower
      ),

    total:
      /total\s+fee|total\s+fees|\bgrand\s+total\b|\btotal\b/.test(
        lower
      ),

    admission:
      /admission/.test(
        lower
      ),

    registration:
      /registration|enrollment|enrolment/.test(
        lower
      ),

    examination:
      /exam\s+fee|examination\s+fee/.test(
        lower
      ),

    hostel:
      /hostel/.test(
        lower
      ),

    mess:
      /mess/.test(
        lower
      ),

    caution:
      /caution|security\s+deposit|security\s+money/.test(
        lower
      ),

    fee_waiver:
      /fee\s*waiver|tfw|t\.?f\.?w\.?|\(fw\)|fw\s+scheme/.test(
        lower
      )
  };
}


/*
|--------------------------------------------------------------------------
| AMOUNT EXTRACTION
|--------------------------------------------------------------------------
*/

function extractAmounts(text) {
  const lines =
    String(
      text ?? ""
    )
      .split(
        /\r?\n/
      )
      .filter(
        Boolean
      );


  const values = [];


  for (
    const line
    of lines
  ) {
    if (
      isBankLine(
        line
      )
    ) {
      continue;
    }


    const lower =
      line.toLowerCase();


    const feeContext =
      /fee|fees|tuition|total|registration|admission|development|hostel|mess|caution|security|semester|annual|year|charges|deposit|exam/.test(
        lower
      );


    const moneyFormatted =
      /₹|rs\.?|inr|\d{1,3}(?:,\d{2,3})+/.test(
        lower
      );


    if (
      !feeContext &&
      !moneyFormatted
    ) {
      continue;
    }


    const matches =
      line.match(
        /(?:₹|Rs\.?|INR)?\s*(\d{1,3}(?:,\d{2,3})+|\d{3,7})(?:\.\d+)?(?:\/-)?/gi
      ) || [];


    for (
      const match
      of matches
    ) {
      const number =
        Number(
          match
            .replace(
              /₹|Rs\.?|INR/gi,
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


      if (
        !Number.isFinite(
          number
        )
      ) {
        continue;
      }


      /*
      |--------------------------------------------------------------------------
      | Ignore obvious years.
      |--------------------------------------------------------------------------
      */

      if (
        number >= 2000 &&
        number <= 2100
      ) {
        continue;
      }


      if (
        number < 100 ||
        number > 2000000
      ) {
        continue;
      }


      values.push(
        number
      );
    }
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
| HTTP FETCH
|--------------------------------------------------------------------------
*/

async function fetchSource(url) {
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

        validateStatus:
          status =>
            status >= 200 &&
            status < 400,

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36",

          Accept:
            "text/html,application/xhtml+xml,application/pdf,*/*"
        }
      }
    );


  return {
    buffer:
      Buffer.from(
        response.data
      ),

    content_type:
      String(
        response.headers[
          "content-type"
        ] || ""
      )
        .toLowerCase(),

    final_url:
      response.request
        ?.res
        ?.responseUrl ||
      url
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


    const lines =
      raw
        .split(
          /\r?\n/
        )
        .map(
          cleanText
        )
        .filter(
          Boolean
        );


    return {
      type:
        "official_pdf",

      text:
        raw
          .replace(
            /\r/g,
            ""
          )
          .trim(),

      clean_text:
        cleanText(
          raw
        ),

      lines,

      tables_count:
        0,

      pages:
        result.total ??
        result.numpages ??
        null
    };

  } finally {
    try {
      await parser.destroy();
    } catch {}
  }
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
    "script, style, noscript, svg"
  ).remove();


  const rawText =
    $("body")
      .text();


  const lines =
    rawText
      .split(
        /\r?\n/
      )
      .map(
        cleanText
      )
      .filter(
        Boolean
      );


  let tablesCount =
    0;


  $("table").each(
    () => {
      tablesCount++;
    }
  );


  return {
    type:
      "official_html",

    text:
      rawText,

    clean_text:
      cleanText(
        rawText
      ),

    lines,

    tables_count:
      tablesCount,

    pages:
      null
  };
}


/*
|--------------------------------------------------------------------------
| SOURCE EXTRACTION
|--------------------------------------------------------------------------
*/

async function extractSource(
  row,
  url
) {
  const fetched =
    await fetchSource(
      url
    );


  const pdf =
    fetched.content_type.includes(
      "application/pdf"
    ) ||
    isPdfUrl(
      fetched.final_url
    ) ||
    isPdfUrl(
      url
    );


  const extracted =
    pdf
      ? await extractPdf(
          fetched.buffer
        )
      : extractHtml(
          fetched.buffer
        );


  const signals =
    detectSignals(
      extracted.text
    );


  const amounts =
    extractAmounts(
      extracted.text
    );


  const year =
    resolveSourceYear(
      row,
      extracted.text
    );


  return {
    source_type:
      extracted.type,

    source_url:
      url,

    final_url:
      fetched.final_url,

    content_type:
      fetched.content_type,

    source_year:
      year.year,

    detected_years:
      year.detected_years,

    year_detection_method:
      year.method,

    text_characters:
      extracted.clean_text.length,

    lines_count:
      extracted.lines.length,

    tables_count:
      extracted.tables_count,

    pages:
      extracted.pages,

    amounts_count:
      amounts.length,

    amounts,

    signals,

    text:
      extracted.text,

    lines:
      extracted.lines
  };
}


/*
|--------------------------------------------------------------------------
| DISCOVERY QUERIES
|--------------------------------------------------------------------------
|
| This script does NOT scrape search engines.
| Missing-source institutes get high-quality search queries for next source
| discovery stage.
|--------------------------------------------------------------------------
*/

function buildDiscoveryQueries(
  row
) {
  const name =
    row.college_name;


  return [
    `"${name}" B.Tech fee structure 2026-27 official`,

    `"${name}" fees 2026 27 pdf`,

    `"${name}" B.Tech tuition hostel fee 2026`,

    `"${name}" fee structure site:.edu.in`,

    `"${name}" fee structure site:.ac.in`
  ];
}


/*
|--------------------------------------------------------------------------
| CLASSIFIER
|--------------------------------------------------------------------------
*/

function classifyExtracted(
  row,
  extracted
) {
  const reasons = [];


  if (
    extracted.text_characters <
    150
  ) {
    reasons.push(
      "Source text too sparse."
    );
  }


  if (
    !extracted.signals.btech
  ) {
    reasons.push(
      "B.Tech not clearly detected."
    );
  }


  if (
    !extracted.signals.fee
  ) {
    reasons.push(
      "Fee context not clearly detected."
    );
  }


  if (
    extracted.amounts_count <
    2
  ) {
    reasons.push(
      "Too few fee amounts."
    );
  }


  /*
  |--------------------------------------------------------------------------
  | Current 2026 source
  |--------------------------------------------------------------------------
  */

  if (
    extracted.source_year ===
    TARGET_YEAR
  ) {
    if (
      reasons.length === 0
    ) {
      return {
        status:
          "NORMALIZATION_READY",

        reasons
      };
    }


    return {
      status:
        "REVIEW_REQUIRED",

      reasons
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Older official source
  |--------------------------------------------------------------------------
  */

  if (
    Number.isFinite(
      extracted.source_year
    ) &&
    extracted.source_year <
      TARGET_YEAR
  ) {
    reasons.push(
      `Latest identified source year is ${extracted.source_year}, target is ${TARGET_YEAR}.`
    );


    return {
      status:
        "OUTDATED_SOURCE",

      reasons
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Unknown year
  |--------------------------------------------------------------------------
  */

  reasons.push(
    "Academic year could not be verified."
  );


  return {
    status:
      "REVIEW_YEAR_OR_SOURCE",

    reasons
  };
}


/*
|--------------------------------------------------------------------------
| PROCESS ONE COLLEGE
|--------------------------------------------------------------------------
*/

async function processCollege(
  row,
  index,
  total
) {
  console.log(
    `[${index}/${total}] ${row.college_name}`
  );


  const sourceUrl =
    getSourceUrl(
      row
    );


  /*
  |--------------------------------------------------------------------------
  | No fee source
  |--------------------------------------------------------------------------
  */

  if (
    !sourceUrl
  ) {
    console.log(
      " -> SOURCE_DISCOVERY_REQUIRED"
    );


    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      previous_status:
        row.queue_status ||
        row.discovery_status ||
        null,

      academic_year:
        row.academic_year ??
        null,

      official_website:
        getOfficialWebsite(
          row
        ),

      source_url:
        null,

      final_status:
        "SOURCE_DISCOVERY_REQUIRED",

      search_queries:
        buildDiscoveryQueries(
          row
        ),

      reasons: [
        "No verified fee source URL currently stored."
      ]
    };
  }


  /*
  |--------------------------------------------------------------------------
  | Existing source
  |--------------------------------------------------------------------------
  */

  try {
    const extracted =
      await extractSource(
        row,
        sourceUrl
      );


    const classification =
      classifyExtracted(
        row,
        extracted
      );


    console.log(
      " ->",
      classification.status,
      `(${extracted.source_type}, year=${extracted.source_year ?? "unknown"}, amounts=${extracted.amounts_count})`
    );


    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      previous_status:
        row.queue_status ||
        row.discovery_status ||
        null,

      academic_year:
        extracted.source_year,

      official_website:
        getOfficialWebsite(
          row
        ),

      source_url:
        extracted.source_url,

      final_url:
        extracted.final_url,

      source_type:
        extracted.source_type,

      final_status:
        classification.status,

      reasons:
        classification.reasons,

      extraction: {
        text_characters:
          extracted.text_characters,

        lines_count:
          extracted.lines_count,

        tables_count:
          extracted.tables_count,

        pages:
          extracted.pages,

        detected_years:
          extracted.detected_years,

        amounts_count:
          extracted.amounts_count,

        amounts:
          extracted.amounts,

        signals:
          extracted.signals
      },

      /*
      |--------------------------------------------------------------------------
      | Keep text for normalization-ready/review sources.
      |--------------------------------------------------------------------------
      */

      text:
        extracted.text,

      lines:
        extracted.lines
    };

  } catch (error) {
    console.log(
      " -> SOURCE_FETCH_FAILED"
    );


    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      previous_status:
        row.queue_status ||
        row.discovery_status ||
        null,

      academic_year:
        row.academic_year ??
        null,

      official_website:
        getOfficialWebsite(
          row
        ),

      source_url:
        sourceUrl,

      final_status:
        "SOURCE_FETCH_FAILED",

      reasons: [
        error.message
      ],

      search_queries:
        buildDiscoveryQueries(
          row
        )
    };
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
    "ALL REMAINING FEE MASTER PIPELINE"
  );

  console.log(
    "DRY RUN - DATABASE SAFE"
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
      "Input file must contain an array."
    );
  }


  console.log(
    "Total remaining institutes:",
    rows.length
  );


  console.log(
    "Target academic year:",
    TARGET_YEAR
  );


  console.log("");


  const results = [];


  /*
  |--------------------------------------------------------------------------
  | Sequential intentionally.
  |
  | Avoid hammering college websites and reduce timeout/rate-limit issues.
  |--------------------------------------------------------------------------
  */

  for (
    let i = 0;
    i < rows.length;
    i++
  ) {
    const result =
      await processCollege(
        rows[i],
        i + 1,
        rows.length
      );


    results.push(
      result
    );
  }


  /*
  |--------------------------------------------------------------------------
  | GROUP RESULTS
  |--------------------------------------------------------------------------
  */

  const ready =
    results.filter(
      row =>
        row.final_status ===
        "NORMALIZATION_READY"
    );


  const discovery =
    results.filter(
      row =>
        [
          "SOURCE_DISCOVERY_REQUIRED",
          "SOURCE_FETCH_FAILED"
        ].includes(
          row.final_status
        )
    );


  const review =
    results.filter(
      row =>
        ![
          "NORMALIZATION_READY",
          "SOURCE_DISCOVERY_REQUIRED",
          "SOURCE_FETCH_FAILED"
        ].includes(
          row.final_status
        )
    );


  /*
  |--------------------------------------------------------------------------
  | SAVE
  |--------------------------------------------------------------------------
  */

  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      results,
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
    REVIEW_OUTPUT,

    JSON.stringify(
      review,
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
  | SUMMARY
  |--------------------------------------------------------------------------
  */

  const counts = {};


  for (
    const row
    of results
  ) {
    counts[
      row.final_status
    ] =
      (
        counts[
          row.final_status
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
    "MASTER PIPELINE SUMMARY"
  );

  console.log(
    "======================================="
  );

  console.log("");


  console.table(
    Object.entries(
      counts
    )
      .sort(
        (
          a,
          b
        ) =>
          b[1] -
          a[1]
      )
      .map(
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


  console.log("");

  console.log(
    "NORMALIZATION READY"
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

        year:
          row.academic_year,

        type:
          row.source_type,

        amounts:
          row.extraction
            ?.amounts_count ??
          0
      })
    )
  );


  console.log("");

  console.log(
    "REVIEW REQUIRED"
  );


  console.table(
    review.map(
      (
        row,
        index
      ) => ({
        no:
          index + 1,

        college:
          row.college_name,

        year:
          row.academic_year,

        status:
          row.final_status,

        reason:
          (
            row.reasons ||
            []
          ).join(
            " | "
          )
      })
    )
  );


  console.log("");

  console.log(
    "SOURCE DISCOVERY / FETCH REQUIRED"
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

        status:
          row.final_status,

        website:
          row.official_website
            ? "yes"
            : "no"
      })
    )
  );


  console.log("");

  console.log(
    "Total scanned:",
    results.length
  );


  console.log(
    "Normalization ready:",
    ready.length
  );


  console.log(
    "Review / outdated:",
    review.length
  );


  console.log(
    "Discovery / fetch required:",
    discovery.length
  );


  console.log("");

  console.log(
    "Saved:",
    OUTPUT
  );

  console.log(
    "Saved:",
    READY_OUTPUT
  );

  console.log(
    "Saved:",
    REVIEW_OUTPUT
  );

  console.log(
    "Saved:",
    DISCOVERY_OUTPUT
  );


  console.log("");

  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
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