import "dotenv/config";
import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";

const INPUT = "./safe-363-fee-source-ready.json";

const OUTPUT_VALID =
  "./safe-50-fee-extracted.json";

const OUTPUT_REJECTED =
  "./safe-50-fee-source-rejected.json";

const OUTPUT_FAILED =
  "./safe-50-fee-fetch-failed.json";

const TIMEOUT = 25000;

function clean(text) {
  return String(text || "")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n+/g, "\n")
    .trim();
}

function normalizeLine(text) {
  return clean(text)
    .replace(/\s+/g, " ")
    .trim();
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function extractAmounts(text) {
  const matches = String(text || "").match(
    /(?:₹|Rs\.?|INR)?\s*(\d{1,3}(?:,\d{2,3})+|\d{4,7})(?:\/-)?/gi
  ) || [];

  return unique(
    matches
      .map(value =>
        Number(
          value
            .replace(/[^\d]/g, "")
        )
      )
      .filter(value =>
        Number.isFinite(value) &&
        value >= 100 &&
        value <= 5000000
      )
  );
}

function extractYears(text) {
  const matches = String(text || "")
    .match(/\b20(?:2[4-9]|3[0-2])(?:\s*[-–]\s*(?:20)?\d{2})?\b/g)
    || [];

  return unique(matches);
}

function scorePage({
  title,
  url,
  text,
  lines,
  tables
}) {
  const haystack =
    `${title}\n${url}\n${text}`
      .toLowerCase();

  let score = 0;
  const reasons = [];
  const rejects = [];

  if (
    /\bb\.?\s*tech\b|bachelor of technology/.test(
      haystack
    )
  ) {
    score += 25;
    reasons.push("BTECH_PRESENT");
  }

  if (
    /\bfee\b|fees|fee structure|tuition/.test(
      haystack
    )
  ) {
    score += 25;
    reasons.push("FEE_PRESENT");
  }

  if (
    /2026\s*[-–]\s*27|2026-27|academic year 2026|session 2026/.test(
      haystack
    )
  ) {
    score += 25;
    reasons.push("YEAR_2026_PRESENT");
  }

  if (
    /\btuition\b/.test(haystack)
  ) {
    score += 10;
    reasons.push("TUITION_LABEL");
  }

  if (
    /\bsemester\b|\bsem\b/.test(
      haystack
    )
  ) {
    score += 8;
    reasons.push("SEMESTER_LABEL");
  }

  if (
    /\bannual\b|\bper year\b|\byearly\b/.test(
      haystack
    )
  ) {
    score += 6;
    reasons.push("ANNUAL_LABEL");
  }

  if (
    /\bhostel\b|\bhosteller\b/.test(
      haystack
    )
  ) {
    score += 5;
    reasons.push("HOSTEL_LABEL");
  }

  if (
    /\bmess\b/.test(haystack)
  ) {
    score += 4;
    reasons.push("MESS_LABEL");
  }

  if (
    /\bsc\b|\bst\b|\bobc\b|\bews\b|\bpwd\b|income/.test(
      haystack
    )
  ) {
    score += 5;
    reasons.push("CATEGORY_OR_INCOME");
  }

  const amounts =
    extractAmounts(text);

  if (amounts.length >= 2) {
    score += 15;
    reasons.push("MULTIPLE_AMOUNTS");
  } else if (amounts.length === 1) {
    score += 5;
    reasons.push("ONE_AMOUNT");
  }

  if (tables.length > 0) {
    score += 12;
    reasons.push("TABLE_PRESENT");
  }

  /*
   * Strong negative signals.
   *
   * A URL containing PG/M.Tech/PhD is not automatically
   * rejected if the actual page contains a clear B.Tech
   * 2026 fee structure.
   */

  if (
    /phd|ph\.d/.test(
      String(url).toLowerCase()
    )
  ) {
    score -= 30;
    rejects.push("URL_LOOKS_PHD");
  }

  if (
    /\/pg(?:\/|$)|postgraduate/.test(
      String(url).toLowerCase()
    )
  ) {
    score -= 25;
    rejects.push("URL_LOOKS_PG");
  }

  if (
    /mtech|m\.tech/.test(
      String(url).toLowerCase()
    )
  ) {
    score -= 25;
    rejects.push("URL_LOOKS_MTECH");
  }

  if (
    /stakeholder-feedback/.test(
      String(url).toLowerCase()
    )
  ) {
    score -= 40;
    rejects.push("URL_LOOKS_FEEDBACK");
  }

  if (
    /hostels?\.php|\/hostels?(?:\/|$)/.test(
      String(url).toLowerCase()
    )
  ) {
    score -= 25;
    rejects.push("URL_LOOKS_HOSTEL_ONLY");
  }

  return {
    score,
    reasons,
    rejects,
    amounts,
    years: extractYears(text),
    line_count: lines.length,
    table_count: tables.length
  };
}

function extractTables($) {
  const tables = [];

  $("table").each((tableIndex, table) => {
    const rows = [];

    $(table)
      .find("tr")
      .each((rowIndex, tr) => {
        const cells = [];

        $(tr)
          .find("th,td")
          .each((cellIndex, cell) => {
            const value =
              normalizeLine(
                $(cell).text()
              );

            if (value) {
              cells.push(value);
            }
          });

        if (cells.length) {
          rows.push(cells);
        }
      });

    if (rows.length) {
      tables.push({
        table_index: tableIndex,
        rows
      });
    }
  });

  return tables;
}

function relevantLines(lines) {
  const regex =
    /b\.?\s*tech|bachelor of technology|fee|tuition|semester|hostel|mess|admission fee|institute fee|caution|development|registration|income|sc\/st|sc\b|st\b|obc|ews|pwd|2026|2027|₹|rs\.?|inr/i;

  const indexes = [];

  lines.forEach((line, index) => {
    if (regex.test(line)) {
      indexes.push(index);
    }
  });

  const selected =
    new Set();

  for (const index of indexes) {
    for (
      let i = Math.max(0, index - 2);
      i <= Math.min(
        lines.length - 1,
        index + 3
      );
      i++
    ) {
      selected.add(i);
    }
  }

  return [...selected]
    .sort((a, b) => a - b)
    .map(index => ({
      index,
      text: lines[index]
    }))
    .slice(0, 500);
}

async function fetchHtml(url) {
  const response =
    await axios.get(url, {
      timeout: TIMEOUT,
      maxRedirects: 8,

      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CounsellingWallahFeeResearch/1.0)",

        Accept:
          "text/html,application/xhtml+xml"
      },

      validateStatus(status) {
        return (
          status >= 200 &&
          status < 400
        );
      }
    });

  const contentType =
    String(
      response.headers[
        "content-type"
      ] || ""
    ).toLowerCase();

  return {
    final_url:
      response.request?.res
        ?.responseUrl || url,

    content_type:
      contentType,

    html:
      String(response.data || "")
  };
}

async function main() {
  console.log(
    "\n======================================="
  );
  console.log(
    "SAFE 50 B.TECH FEE SOURCE EXTRACTOR"
  );
  console.log(
    "=======================================\n"
  );

  const raw =
    await fs.readFile(
      INPUT,
      "utf8"
    );

  const input =
    JSON.parse(
      raw.replace(/^\uFEFF/, "")
    );

  console.log(
    `Input colleges: ${input.length}`
  );

  const valid = [];
  const rejected = [];
  const failed = [];

  let index = 0;

  for (const item of input) {
    index++;

    const college =
      item.college_name;

    const source =
      item.selected_source || {};

    const url =
      source.source_url;

    console.log(
      `\n[${index}/${input.length}] ${college}`
    );

    console.log(
      ` -> ${url || "NO URL"}`
    );

    if (!url) {
      rejected.push({
        ...item,
        extraction_status:
          "NO_SOURCE_URL"
      });

      console.log(
        " -> REJECT: NO_SOURCE_URL"
      );

      continue;
    }

    try {
      const fetched =
        await fetchHtml(url);

      /*
       * Do not silently parse a PDF/binary response
       * as HTML.
       */
      if (
        fetched.content_type.includes(
          "application/pdf"
        ) ||
        fetched.final_url
          .toLowerCase()
          .includes(".pdf")
      ) {
        rejected.push({
          ...item,

          extraction_status:
            "PDF_DISCOVERED",

          fetched_url:
            fetched.final_url,

          content_type:
            fetched.content_type
        });

        console.log(
          " -> REVIEW: PDF_DISCOVERED"
        );

        continue;
      }

      const $ =
        cheerio.load(
          fetched.html
        );

      $(
        "script,style,noscript,svg"
      ).remove();

      const title =
        normalizeLine(
          $("title").first().text()
        );

      const bodyText =
        clean(
          $("body").text()
        );

      const lines =
        bodyText
          .split(/\r?\n/)
          .map(normalizeLine)
          .filter(Boolean);

      const tables =
        extractTables($);

      const evaluation =
        scorePage({
          title,
          url:
            fetched.final_url,
          text:
            bodyText,
          lines,
          tables
        });

      const record = {
        college_id:
          item.college_id,

        college_name:
          college,

        target_year:
          item.target_year,

        source_family:
          source.source_family,

        original_source_url:
          url,

        fetched_url:
          fetched.final_url,

        source_label:
          source.source_label,

        page_title:
          title,

        content_type:
          fetched.content_type,

        validation_score:
          evaluation.score,

        validation_reasons:
          evaluation.reasons,

        negative_signals:
          evaluation.rejects,

        detected_years:
          evaluation.years,

        detected_amounts:
          evaluation.amounts,

        line_count:
          evaluation.line_count,

        table_count:
          evaluation.table_count,

        relevant_lines:
          relevantLines(lines),

        tables,

        retrieved_at:
          new Date().toISOString()
      };

      /*
       * Strict gate:
       *
       * Must have:
       * - B.Tech signal
       * - fee signal
       * - >= 2 amounts
       *
       * Score alone is not enough.
       */
      const reasonSet =
        new Set(
          evaluation.reasons
        );

      const structuralPass =
        reasonSet.has(
          "BTECH_PRESENT"
        ) &&
        reasonSet.has(
          "FEE_PRESENT"
        ) &&
        reasonSet.has(
          "MULTIPLE_AMOUNTS"
        );

      const currentYearPass =
        reasonSet.has(
          "YEAR_2026_PRESENT"
        );

      if (
        structuralPass &&
        currentYearPass &&
        evaluation.score >= 75
      ) {
        record.extraction_status =
          "VALID_CURRENT_BTECH_FEE_SOURCE";

        valid.push(record);

        console.log(
          ` -> VALID (${evaluation.score})`
        );
      } else {
        record.extraction_status =
          "SOURCE_REVIEW_REQUIRED";

        rejected.push(record);

        console.log(
          ` -> REVIEW (${evaluation.score})`
        );
      }
    } catch (error) {
      failed.push({
        college_id:
          item.college_id,

        college_name:
          college,

        source_url:
          url,

        error:
          error.message,

        status_code:
          error.response?.status ||
          null
      });

      console.log(
        ` -> FETCH FAILED: ${error.message}`
      );
    }

    /*
     * Be polite to official institute servers.
     */
    await new Promise(
      resolve =>
        setTimeout(resolve, 350)
    );
  }

  await fs.writeFile(
    OUTPUT_VALID,
    JSON.stringify(
      valid,
      null,
      2
    )
  );

  await fs.writeFile(
    OUTPUT_REJECTED,
    JSON.stringify(
      rejected,
      null,
      2
    )
  );

  await fs.writeFile(
    OUTPUT_FAILED,
    JSON.stringify(
      failed,
      null,
      2
    )
  );

  console.log(
    "\n======================================="
  );
  console.log(
    "EXTRACTION SUMMARY"
  );
  console.log(
    "=======================================\n"
  );

  console.log(
    "Input          :",
    input.length
  );

  console.log(
    "Valid current :",
    valid.length
  );

  console.log(
    "Review/PDF    :",
    rejected.length
  );

  console.log(
    "Fetch failed  :",
    failed.length
  );

  console.log(
    "Accounted     :",
    valid.length +
      rejected.length +
      failed.length
  );

  console.log(
    "\nSaved:"
  );

  console.log(
    OUTPUT_VALID
  );

  console.log(
    OUTPUT_REJECTED
  );

  console.log(
    OUTPUT_FAILED
  );

  console.log(
    "\nDATABASE HAS NOT BEEN MODIFIED."
  );
}

main().catch(error => {
  console.error(
    "\nFATAL:",
    error
  );

  process.exitCode = 1;
});