import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";
import { PDFParse } from "pdf-parse";

const INPUT =
  "./fee-master-priority-source-ready.json";

const OUTPUT =
  "./fee-master-batch-extraction.json";


function cleanText(value) {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}


function isBankLine(value) {
  return /a\/c\s*(?:no|number)|account\s*(?:no|number)|ifsc|bank\s*account|bank\s*name/i.test(
    String(value ?? "")
  );
}


function extractAmounts(value) {
  const lines =
    String(value ?? "")
      .split(/\r?\n/)
      .filter(Boolean);

  const values = [];

  for (
    const line
    of lines
  ) {
    if (
      isBankLine(line)
    ) {
      continue;
    }

    const lower =
      line.toLowerCase();

    const feeContext =
      /fee|tuition|total|registration|admission|development|hostel|mess|caution|security|semester|annual|course|charges|deposit/.test(
        lower
      );

    const formattedMoney =
      /\d{1,3}(?:,\d{2,3})+|₹|rs\.?|inr/i.test(
        line
      );

    if (
      !feeContext &&
      !formattedMoney
    ) {
      continue;
    }

    const matches =
      line.match(
        /(?:₹|Rs\.?|INR)?\s*(\d{1,3}(?:,\d{2,3})+|\d{3,7})(?:\.\d+)?\s*(?:\/-)?/gi
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
              /\/-/g,
              ""
            )
            .replace(
              /,/g,
              ""
            )
            .trim()
        );

      if (
        !Number.isFinite(number)
      ) {
        continue;
      }

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

      values.push(number);
    }
  }

  return [
    ...new Set(values)
  ].sort(
    (a, b) =>
      a - b
  );
}


function detectSignals(text) {
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

    total:
      /total\s+fee|total\s+fees|\btotal\b/.test(
        lower
      ),

    admission:
      /admission/.test(
        lower
      ),

    registration:
      /registration/.test(
        lower
      ),

    development:
      /development/.test(
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

    feeWaiver:
      /fee\s*waiver|t\.?f\.?w\.?|fw\b/.test(
        lower
      )
  };
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

    contentType:
      String(
        response.headers[
          "content-type"
        ] || ""
      ).toLowerCase(),

    finalUrl:
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

    const lines =
      rawText
        .split(/\r?\n/)
        .map(cleanText)
        .filter(Boolean);

    return {
      type:
        "pdf",

      text:
        cleanText(
          rawText
        ),

      raw_text:
        rawText,

      lines,

      tables:
        []
    };

  } finally {
    try {
      await parser.destroy();
    } catch {
      // ignore parser cleanup errors
    }
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

  $(
    "script,style,noscript"
  ).remove();

  const bodyText =
    $("body").text();

  const text =
    cleanText(
      bodyText
    );

  const lines =
    bodyText
      .split(/\r?\n/)
      .map(cleanText)
      .filter(Boolean);

  const tables = [];

  $("table").each(
    (
      tableIndex,
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
                      $(cell).text()
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
            tableIndex,

          rows
        });
      }
    }
  );

  return {
    type:
      "html",

    text,

    raw_text:
      html,

    lines,

    tables
  };
}


async function extractCollege(row) {
  const url =
    row.fee_source_url ||
    row.source_url;

  if (!url) {
    return {
      college_id:
        row.college_id,

      college_name:
        row.college_name,

      extraction_status:
        "FAILED",

      error:
        "Missing fee source URL."
    };
  }

  const fetched =
    await fetchSource(
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

  const signals =
    detectSignals(
      extracted.text
    );

  const amounts =
    extractAmounts(
      extracted.raw_text ||
      extracted.text
    );

  return {
    college_id:
      row.college_id,

    college_name:
      row.college_name,

    academic_year:
      row.academic_year,

    queue_status:
      row.queue_status,

    source_status:
      row.source_status,

    source_url:
      url,

    final_url:
      fetched.finalUrl,

    source_type:
      isPdf
        ? "official_pdf"
        : "official_html",

    content_type:
      fetched.contentType,

    text_characters:
      extracted.text.length,

    lines_count:
      extracted.lines.length,

    tables_count:
      extracted.tables.length,

    amounts_count:
      amounts.length,

    amounts,

    signals,

    text:
      extracted.text,

    raw_text:
      extracted.raw_text,

    lines:
      extracted.lines,

    tables:
      extracted.tables,

    extraction_status:
      extracted.text.length > 0
        ? "EXTRACTED"
        : "EMPTY_TEXT"
  };
}


async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "MASTER SOURCE-READY BATCH EXTRACTOR"
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
      "Input JSON must be an array."
    );
  }


  const targets =
    rows.filter(
      row => {
        const hasSource =
          Boolean(
            row.fee_source_url ||
            row.source_url
          );

        const sourceReady =
          row.queue_status ===
            "SOURCE_READY" ||
          row.source_status ===
            "CURRENT_OFFICIAL_SOURCE";

        return (
          sourceReady &&
          hasSource
        );
      }
    );


  console.log(
    "Input file:",
    INPUT
  );

  console.log(
    "Rows in input:",
    rows.length
  );

  console.log(
    "Source-ready colleges:",
    targets.length
  );

  console.log("");


  if (
    targets.length === 0
  ) {
    console.log(
      "No source-ready colleges found."
    );

    await fs.writeFile(
      OUTPUT,

      JSON.stringify(
        [],
        null,
        2
      ),

      "utf8"
    );

    console.log("");

    console.log(
      "Saved:",
      OUTPUT
    );

    console.log("");

    console.log(
      "DATABASE HAS NOT BEEN MODIFIED."
    );

    return;
  }


  const results = [];


  for (
    let i = 0;
    i < targets.length;
    i++
  ) {
    const row =
      targets[i];

    console.log(
      `[${i + 1}/${targets.length}] ${row.college_name}`
    );

    console.log(
      "Source:",
      row.fee_source_url ||
      row.source_url
    );

    try {
      const result =
        await extractCollege(
          row
        );

      results.push(
        result
      );

      console.log(
        "[OK]",
        result.source_type,
        "chars:",
        result.text_characters,
        "lines:",
        result.lines_count,
        "tables:",
        result.tables_count,
        "amounts:",
        result.amounts_count
      );

    } catch (error) {
      results.push({
        college_id:
          row.college_id,

        college_name:
          row.college_name,

        academic_year:
          row.academic_year,

        source_url:
          row.fee_source_url ||
          row.source_url,

        source_type:
          row.source_type ||
          null,

        extraction_status:
          "FAILED",

        error:
          error.message
      });

      console.log(
        "[FAILED]",
        error.message
      );
    }

    console.log("");
  }


  await fs.writeFile(
    OUTPUT,

    JSON.stringify(
      results,
      null,
      2
    ),

    "utf8"
  );


  console.log(
    "---------------------------------------"
  );

  console.log(
    "EXTRACTION SUMMARY"
  );

  console.log(
    "---------------------------------------"
  );


  console.table(
    results.map(
      row => ({
        college:
          row.college_name,

        year:
          row.academic_year,

        type:
          row.source_type,

        status:
          row.extraction_status,

        chars:
          row.text_characters || 0,

        lines:
          row.lines_count || 0,

        tables:
          row.tables_count || 0,

        amounts:
          row.amounts_count || 0,

        btech:
          row.signals?.btech ??
          null,

        tuition:
          row.signals?.tuition ??
          null,

        total:
          row.signals?.total ??
          null,

        hostel:
          row.signals?.hostel ??
          null,

        fee_waiver:
          row.signals?.feeWaiver ??
          null
      })
    )
  );


  console.log("");

  console.log(
    "Saved:",
    OUTPUT
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