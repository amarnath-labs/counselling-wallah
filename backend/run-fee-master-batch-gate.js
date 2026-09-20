import "dotenv/config";

import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";


const READY_INPUT =
  "./fee-pilot-source-priority-ready.json";

const DISCOVERY_INPUT =
  "./fee-pilot-source-priority-discovery.json";


const MANIFEST_OUTPUT =
  "./fee-master-batch-manifest.json";

const AUTO_READY_OUTPUT =
  "./fee-master-auto-ready-sources.json";

const REVIEW_OUTPUT =
  "./fee-master-review-required.json";

const DISCOVERY_OUTPUT =
  "./fee-master-source-discovery-required.json";


function stripBom(value) {
  return String(value ?? "")
    .replace(/^\uFEFF/, "");
}


async function readJsonSafe(
  file
) {
  try {
    const raw =
      await fs.readFile(
        file,
        "utf8"
      );

    const parsed =
      JSON.parse(
        stripBom(raw)
      );

    return Array.isArray(parsed)
      ? parsed
      : [];

  } catch (error) {
    if (
      error.code ===
      "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}


function cleanText(value) {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function detectYears(value) {
  const text =
    String(value ?? "");

  const matches =
    text.match(
      /\b20(?:2[0-9]|3[0-5])\b/g
    ) || [];

  return [
    ...new Set(
      matches.map(Number)
    )
  ].sort(
    (a, b) =>
      a - b
  );
}


function normalizeStatus(row) {
  return (
    row.discovery_status ||
    row.status ||
    "DISCOVERY_PENDING"
  );
}


function getCollegeId(row) {
  return (
    row.college_id ||
    row.id ||
    null
  );
}


function getCollegeName(row) {
  return (
    row.college_name ||
    row.college ||
    row.name ||
    null
  );
}


function getSourceUrl(row) {
  return (
    row.fee_source_url ||
    row.source_url ||
    null
  );
}


function getAcademicYear(row) {
  const value =
    row.academic_year ??
    row.year ??
    null;

  const number =
    Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}


function mergeRows(
  readyRows,
  discoveryRows
) {
  const map =
    new Map();


  for (
    const row
    of [
      ...discoveryRows,
      ...readyRows
    ]
  ) {
    const id =
      getCollegeId(row);

    if (!id) {
      continue;
    }


    const existing =
      map.get(id) ||
      {};


    map.set(
      id,
      {
        ...existing,
        ...row,

        college_id:
          id,

        college_name:
          getCollegeName(row) ||
          existing.college_name ||
          null
      }
    );
  }


  return [
    ...map.values()
  ];
}


async function fetchSource(url) {
  const response =
    await axios.get(
      url,
      {
        timeout:
          60000,

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
        ] ||
        ""
      ).toLowerCase(),

    final_url:
      response.request
        ?.res
        ?.responseUrl ||
      url
  };
}


async function extractPdf(buffer) {
  const parser =
    new PDFParse({
      data:
        buffer
    });


  try {
    const result =
      await parser.getText();

    const rawText =
      String(
        result.text ||
        ""
      );


    return {
      source_type:
        "official_pdf",

      text:
        cleanText(
          rawText
        ),

      raw_text:
        rawText,

      lines:
        rawText
          .split(/\r?\n/)
          .map(cleanText)
          .filter(Boolean)
    };

  } finally {
    await parser.destroy();
  }
}


function extractHtml(buffer) {
  const html =
    buffer.toString(
      "utf8"
    );

  const $ =
    cheerio.load(
      html
    );

  $("script,style,noscript")
    .remove();


  const text =
    cleanText(
      $("body")
        .text()
    );


  const tables = [];


  $("table").each(
    (
      index,
      table
    ) => {
      const rows = [];


      $(table)
        .find("tr")
        .each(
          (
            _,
            tr
          ) => {
            const cells =
              $(tr)
                .find(
                  "th,td"
                )
                .map(
                  (
                    __,
                    cell
                  ) =>
                    cleanText(
                      $(cell)
                        .text()
                    )
                )
                .get();


            if (
              cells.length > 0
            ) {
              rows.push(
                cells
              );
            }
          }
        );


      if (
        rows.length > 0
      ) {
        tables.push({
          table_index:
            index,

          rows
        });
      }
    }
  );


  return {
    source_type:
      "official_html",

    text,

    raw_text:
      html,

    lines:
      text
        ? [text]
        : [],

    tables
  };
}


function detectFeeSignals(text) {
  const lower =
    String(text ?? "")
      .toLowerCase();


  return {
    btech:
      /b\.?\s*tech|btech/.test(
        lower
      ),

    tuition:
      /tuition/.test(
        lower
      ),

    total_fee:
      /total\s+fee|total\s+fees/.test(
        lower
      ),

    registration:
      /registration\s+fee/.test(
        lower
      ),

    admission:
      /admission\s+fee/.test(
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
      /caution/.test(
        lower
      )
  };
}


function detectBranchSpecific(
  text
) {
  const lower =
    String(text ?? "")
      .toLowerCase();


  const patterns = [
    /cse.*(?:ai|artificial intelligence).*data science/,
    /computer science.*civil engineering/,
    /computer science.*mechanical engineering/,
    /branch.*tuition/,
    /course.*tuition.*total/,
    /programme.*fee/
  ];


  return patterns.some(
    regex =>
      regex.test(
        lower
      )
  );
}


function scoreSource({
  text,
  academicYear
}) {
  const signals =
    detectFeeSignals(
      text
    );


  let score = 0;


  if (
    signals.btech
  ) {
    score += 25;
  }


  if (
    signals.tuition
  ) {
    score += 20;
  }


  if (
    signals.total_fee
  ) {
    score += 20;
  }


  if (
    signals.registration ||
    signals.admission
  ) {
    score += 10;
  }


  if (
    signals.caution
  ) {
    score += 5;
  }


  const years =
    detectYears(
      text
    );


  if (
    academicYear &&
    years.includes(
      academicYear
    )
  ) {
    score += 20;
  }


  return {
    score,
    signals,
    years
  };
}


function classifyExtracted({
  row,
  extracted,
  source
}) {
  const academicYear =
    getAcademicYear(
      row
    );


  const analysis =
    scoreSource({
      text:
        extracted.text,

      academicYear
    });


  const branchSpecific =
    detectBranchSpecific(
      extracted.text
    );


  let batchStatus =
    "REVIEW_REQUIRED";

  const reasons = [];


  if (
    !analysis.signals.btech
  ) {
    reasons.push(
      "B.Tech not clearly detected in source."
    );
  }


  if (
    !analysis.signals.tuition &&
    !analysis.signals.total_fee
  ) {
    reasons.push(
      "Tuition/total fee not clearly detected."
    );
  }


  if (
    academicYear &&
    !analysis.years.includes(
      academicYear
    )
  ) {
    reasons.push(
      `Requested academic year ${academicYear} not detected in source.`
    );
  }


  if (
    analysis.score >= 75 &&
    reasons.length === 0
  ) {
    batchStatus =
      branchSpecific
        ? "BRANCH_MAPPING_REQUIRED"
        : "AUTO_READY_SOURCE";
  }


  return {
    college_id:
      getCollegeId(
        row
      ),

    college_name:
      getCollegeName(
        row
      ),

    academic_year:
      academicYear,

    original_status:
      normalizeStatus(
        row
      ),

    source_url:
      getSourceUrl(
        row
      ),

    final_url:
      source.final_url,

    source_type:
      extracted.source_type,

    content_type:
      source.content_type,

    source_score:
      analysis.score,

    detected_years:
      analysis.years,

    signals:
      analysis.signals,

    branch_specific_detected:
      branchSpecific,

    text_characters:
      extracted.text.length,

    line_count:
      extracted.lines?.length ||
      0,

    batch_status:
      batchStatus,

    review_reasons:
      reasons
  };
}


async function processKnownSource(
  row
) {
  const url =
    getSourceUrl(
      row
    );


  if (!url) {
    return {
      college_id:
        getCollegeId(
          row
        ),

      college_name:
        getCollegeName(
          row
        ),

      academic_year:
        getAcademicYear(
          row
        ),

      original_status:
        normalizeStatus(
          row
        ),

      source_url:
        null,

      batch_status:
        "SOURCE_DISCOVERY_REQUIRED",

      review_reasons: [
        "No fee_source_url available."
      ]
    };
  }


  try {
    const source =
      await fetchSource(
        url
      );


    const looksPdf =
      source.content_type
        .includes(
          "application/pdf"
        ) ||
      /\.pdf(?:$|\?)/i.test(
        url
      );


    const extracted =
      looksPdf
        ? await extractPdf(
            source.buffer
          )
        : extractHtml(
            source.buffer
          );


    const classification =
      classifyExtracted({
        row,
        extracted,
        source
      });


    return {
      ...classification,

      extracted: {
        text:
          extracted.text,

        raw_text:
          extracted.raw_text,

        lines:
          extracted.lines ||
          [],

        tables:
          extracted.tables ||
          []
      }
    };

  } catch (error) {
    return {
      college_id:
        getCollegeId(
          row
        ),

      college_name:
        getCollegeName(
          row
        ),

      academic_year:
        getAcademicYear(
          row
        ),

      original_status:
        normalizeStatus(
          row
        ),

      source_url:
        url,

      batch_status:
        "REVIEW_REQUIRED",

      review_reasons: [
        `Source fetch/extraction failed: ${error.message}`
      ]
    };
  }
}


async function main() {
  console.log("");
  console.log(
    "======================================="
  );
  console.log(
    "MASTER FEE BATCH GATE"
  );
  console.log(
    "======================================="
  );
  console.log("");


  const readyRows =
    await readJsonSafe(
      READY_INPUT
    );


  const discoveryRows =
    await readJsonSafe(
      DISCOVERY_INPUT
    );


  const rows =
    mergeRows(
      readyRows,
      discoveryRows
    );


  console.log(
    "Total batch colleges:",
    rows.length
  );

  console.log("");


  const results = [];


  for (
    let i = 0;
    i < rows.length;
    i++
  ) {
    const row =
      rows[i];


    console.log(
      `[${i + 1}/${rows.length}] ${getCollegeName(row)}`
    );


    const result =
      await processKnownSource(
        row
      );


    results.push(
      result
    );


    console.log(
      " ->",
      result.batch_status
    );
  }


  const autoReady =
    results.filter(
      row =>
        row.batch_status ===
        "AUTO_READY_SOURCE"
    );


  const branchMapping =
    results.filter(
      row =>
        row.batch_status ===
        "BRANCH_MAPPING_REQUIRED"
    );


  const discoveryRequired =
    results.filter(
      row =>
        row.batch_status ===
        "SOURCE_DISCOVERY_REQUIRED"
    );


  const review =
    results.filter(
      row =>
        row.batch_status ===
        "REVIEW_REQUIRED"
    );


  await fs.writeFile(
    MANIFEST_OUTPUT,

    JSON.stringify(
      results,
      null,
      2
    ),

    "utf8"
  );


  await fs.writeFile(
    AUTO_READY_OUTPUT,

    JSON.stringify(
      [
        ...autoReady,
        ...branchMapping
      ],
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
      discoveryRequired,
      null,
      2
    ),

    "utf8"
  );


  console.log("");
  console.log(
    "---------------------------------------"
  );
  console.log(
    "MASTER BATCH SUMMARY"
  );
  console.log(
    "---------------------------------------"
  );


  console.table([
    {
      status:
        "AUTO_READY_SOURCE",

      count:
        autoReady.length
    },

    {
      status:
        "BRANCH_MAPPING_REQUIRED",

      count:
        branchMapping.length
    },

    {
      status:
        "REVIEW_REQUIRED",

      count:
        review.length
    },

    {
      status:
        "SOURCE_DISCOVERY_REQUIRED",

      count:
        discoveryRequired.length
    },

    {
      status:
        "TOTAL",

      count:
        results.length
    }
  ]);


  console.log("");


  console.log(
    "AUTO / BRANCH-MAPPING CANDIDATES"
  );


  console.table(
    [
      ...autoReady,
      ...branchMapping
    ].map(
      row => ({
        college:
          row.college_name,

        year:
          row.academic_year,

        score:
          row.source_score,

        status:
          row.batch_status,

        type:
          row.source_type
      })
    )
  );


  console.log("");


  console.log(
    "SOURCE DISCOVERY REQUIRED"
  );


  console.table(
    discoveryRequired.map(
      (
        row,
        index
      ) => ({
        no:
          index + 1,

        college:
          row.college_name,

        previous_status:
          row.original_status
      })
    )
  );


  console.log("");


  console.log(
    "Saved:",
    MANIFEST_OUTPUT
  );

  console.log(
    "Saved:",
    AUTO_READY_OUTPUT
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
    console.error(
      "FAILED:",
      error.message
    );

    process.exitCode = 1;
  }
);
