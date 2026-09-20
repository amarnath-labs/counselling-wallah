import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";
import https from "node:https";

const INPUT =
  "./all-colleges-fee-source-crawl.json";

const OUTPUT =
  "./all-363-fee-source-recovered.json";

const RECOVERED_OUTPUT =
  "./all-363-fee-source-newly-recovered.json";

const STILL_FAILED_OUTPUT =
  "./all-363-fee-source-still-failed.json";

const TARGET_YEAR = 2026;

const httpsAgent =
  new https.Agent({
    rejectUnauthorized: false
  });

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36",

  Accept:
    "text/html,application/xhtml+xml,application/pdf,*/*",

  "Accept-Language":
    "en-US,en;q=0.9"
};

function clean(value) {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function sleep(ms) {
  return new Promise(
    resolve =>
      setTimeout(resolve, ms)
  );
}

function unique(values) {
  return [
    ...new Set(
      values.filter(Boolean)
    )
  ];
}

function buildWebsiteVariants(url) {
  try {
    const parsed =
      new URL(url);

    const hostname =
      parsed.hostname
        .replace(/^www\./i, "");

    return unique([
      url,

      `https://${hostname}/`,
      `https://www.${hostname}/`,

      `http://${hostname}/`,
      `http://www.${hostname}/`
    ]);
  } catch {
    return [url];
  }
}

async function request(url) {
  const attempts = [
    {
      timeout: 15000,
      insecure: false
    },

    {
      timeout: 25000,
      insecure: false
    },

    {
      timeout: 25000,
      insecure: true
    }
  ];

  let lastError = null;

  for (
    const attempt
    of attempts
  ) {
    try {
      const response =
        await axios.get(
          url,
          {
            timeout:
              attempt.timeout,

            maxRedirects:
              10,

            responseType:
              "arraybuffer",

            headers:
              HEADERS,

            httpsAgent:
              attempt.insecure
                ? httpsAgent
                : undefined,

            validateStatus:
              status =>
                status >= 200 &&
                status < 400
          }
        );

      return {
        ok: true,

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

    } catch (error) {
      lastError =
        error.message;

      await sleep(700);
    }
  }

  return {
    ok: false,
    error: lastError
  };
}

function parseHtml(buffer) {
  const html =
    buffer.toString("utf8");

  const $ =
    cheerio.load(html);

  $("script,style,noscript")
    .remove();

  const text =
    $("body")
      .text()
      .replace(/\s+/g, " ")
      .trim();

  const links = [];

  $("a[href]").each(
    (_, element) => {

      links.push({
        href:
          clean(
            $(element)
              .attr("href")
          ),

        label:
          clean(
            $(element)
              .text()
          )
      });

    }
  );

  return {
    text,
    links
  };
}

function isFeeLink(
  label,
  href
) {
  const text =
    `${label} ${href}`
      .toLowerCase();

  return (
    /fee|fees|fee-structure|fee_structure|tuition|admission|prospectus|brochure|academic-fee/.test(
      text
    )
  );
}

function rankLink(
  label,
  href
) {
  const text =
    `${label} ${href}`
      .toLowerCase();

  let score = 0;

  if (
    /fee structure/.test(text)
  ) score += 100;

  if (
    /2026|2026-27|2026_27/.test(text)
  ) score += 80;

  if (
    /btech|b\.tech|b-tech/.test(text)
  ) score += 60;

  if (
    /tuition/.test(text)
  ) score += 40;

  if (
    /fee|fees/.test(text)
  ) score += 35;

  if (
    /admission/.test(text)
  ) score += 20;

  if (
    /prospectus|brochure/.test(text)
  ) score += 20;

  if (
    /\.pdf(?:$|\?)/i.test(href)
  ) score += 30;

  return score;
}

function extractAmounts(text) {
  const amounts = [];

  const lines =
    String(text)
      .split(
        /[\n\r]|(?<=\.)\s+/
      );

  for (
    const line
    of lines
  ) {
    if (
      !/fee|tuition|registration|admission|development|exam|security|caution|hostel|mess|total/i.test(
        line
      )
    ) {
      continue;
    }

    const matches =
      line.match(
        /(?:₹|rs\.?|inr)?\s*(\d{1,3}(?:,\d{2,3})+|\d{3,7})(?:\.\d+)?/gi
      ) || [];

    for (
      const match
      of matches
    ) {
      const number =
        Number(
          match
            .replace(
              /₹|rs\.?|inr/gi,
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

      // Remove years.
      if (
        number >= 2000 &&
        number <= 2100
      ) {
        continue;
      }

      if (
        number < 100 ||
        number > 3000000
      ) {
        continue;
      }

      amounts.push(number);
    }
  }

  return unique(
    amounts
  ).sort(
    (a, b) =>
      a - b
  );
}

function analysePage(text) {
  const lower =
    String(text)
      .toLowerCase();

  return {
    year2026:
      /2026\s*[-–]\s*27|2026\s*[-–]\s*2027|\b2026\b/.test(
        lower
      ),

    btech:
      /b\.?\s*tech|b-tech|btech|bachelor of technology/.test(
        lower
      ),

    fee:
      /\bfees?\b|tuition fee/.test(
        lower
      ),

    hostel:
      /\bhostel\b/.test(
        lower
      ),

    fw:
      /fee\s*waiver|\btfw\b|tuition fee waiver/.test(
        lower
      )
  };
}

function buildDirectPaths(base) {
  try {
    const root =
      new URL(
        "/",
        base
      ).href;

    const paths = [
      "fees",
      "fee",
      "fee-structure",
      "fee_structure",
      "admission/fees",
      "admissions/fees",
      "admission/fee-structure",
      "admissions/fee-structure",
      "admission",
      "admissions",
      "prospectus",
      "academics/fees",
      "academic/fees"
    ];

    return paths.map(
      path =>
        new URL(
          path,
          root
        ).href
    );

  } catch {
    return [];
  }
}

async function inspectCandidate(url) {
  const response =
    await request(url);

  if (!response.ok) {
    return {
      url,
      status:
        "FETCH_FAILED",

      error:
        response.error
    };
  }

  if (
    response.contentType.includes(
      "pdf"
    ) ||
    /\.pdf(?:$|\?)/i.test(
      response.finalUrl
    )
  ) {
    return {
      url,
      final_url:
        response.finalUrl,

      source_type:
        "official_pdf",

      status:
        "OFFICIAL_PDF_FEE_CANDIDATE",

      year_hint:
        /2026|2026[-_]?27/i.test(
          response.finalUrl
        )
    };
  }

  if (
    !response.contentType.includes(
      "html"
    )
  ) {
    return {
      url,
      status:
        "NON_HTML"
    };
  }

  const page =
    parseHtml(
      response.buffer
    );

  const signals =
    analysePage(
      page.text
    );

  const amounts =
    extractAmounts(
      page.text
    );

  let status =
    "OFFICIAL_FEE_PAGE_REVIEW";

  if (
    signals.year2026 &&
    signals.btech &&
    signals.fee &&
    amounts.length > 0
  ) {
    status =
      "CURRENT_OFFICIAL_BTECH_FEE_SOURCE";
  }

  return {
    url,

    final_url:
      response.finalUrl,

    source_type:
      "official_html",

    status,

    signals,

    amounts,

    amounts_count:
      amounts.length,

    links:
      page.links
  };
}

async function recoverCollege(row) {
  /*
  |--------------------------------------------------------------------------
  | Already verified - NEVER downgrade it.
  |--------------------------------------------------------------------------
  */

  if (
    row.crawl_status ===
    "CURRENT_OFFICIAL_BTECH_FEE_SOURCE"
  ) {
    return {
      ...row,

      recovery_status:
        "PRESERVED_VERIFIED"
    };
  }

  /*
  |--------------------------------------------------------------------------
  | No website - cannot recover here.
  |--------------------------------------------------------------------------
  */

  if (
    !row.official_website
  ) {
    return {
      ...row,

      recovery_status:
        "NO_OFFICIAL_WEBSITE"
    };
  }

  const websiteVariants =
    buildWebsiteVariants(
      row.official_website
    );

  let home = null;

  /*
  |--------------------------------------------------------------------------
  | Recover root website
  |--------------------------------------------------------------------------
  */

  for (
    const candidate
    of websiteVariants
  ) {
    const response =
      await request(
        candidate
      );

    if (
      response.ok &&
      response.contentType.includes(
        "html"
      )
    ) {
      home = {
        candidate,
        response
      };

      break;
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Even if homepage fails, try common fee paths.
  |--------------------------------------------------------------------------
  */

  const candidateUrls = [];

  if (home) {
    const page =
      parseHtml(
        home.response.buffer
      );

    for (
      const link
      of page.links
    ) {
      if (
        !isFeeLink(
          link.label,
          link.href
        )
      ) {
        continue;
      }

      try {
        const absolute =
          new URL(
            link.href,
            home.response.finalUrl
          ).href;

        candidateUrls.push({
          url:
            absolute,

          score:
            rankLink(
              link.label,
              absolute
            )
        });

      } catch {
        // ignore
      }
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Direct common paths for every variant.
  |--------------------------------------------------------------------------
  */

  for (
    const variant
    of websiteVariants
  ) {
    for (
      const direct
      of buildDirectPaths(
        variant
      )
    ) {
      candidateUrls.push({
        url:
          direct,

        score:
          rankLink(
            "",
            direct
          )
      });
    }
  }

  const uniqueCandidates =
    [
      ...new Map(
        candidateUrls.map(
          item => [
            item.url,
            item
          ]
        )
      ).values()
    ]
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        25
      );

  const inspected = [];

  for (
    const candidate
    of uniqueCandidates
  ) {
    const result =
      await inspectCandidate(
        candidate.url
      );

    inspected.push(
      result
    );

    /*
    |--------------------------------------------------------------------------
    | Stop immediately on verified current official source.
    |--------------------------------------------------------------------------
    */

    if (
      result.status ===
      "CURRENT_OFFICIAL_BTECH_FEE_SOURCE"
    ) {
      return {
        ...row,

        official_website:
          home
            ?.response
            ?.finalUrl ||
          row.official_website,

        academic_year:
          TARGET_YEAR,

        source_url:
          result.final_url,

        fee_source_url:
          result.final_url,

        source_type:
          "official_html",

        queue_status:
          "SOURCE_READY",

        crawl_status:
          "CURRENT_OFFICIAL_BTECH_FEE_SOURCE",

        recovery_status:
          "RECOVERED_CURRENT_OFFICIAL_BTECH_FEE",

        fee_source_signals:
          result.signals,

        fee_source_amounts:
          result.amounts,

        recovery_candidates:
          inspected
      };
    }

    await sleep(150);
  }

  /*
  |--------------------------------------------------------------------------
  | Preserve official PDF candidate.
  |--------------------------------------------------------------------------
  */

  const pdf =
    inspected.find(
      result =>
        result.status ===
        "OFFICIAL_PDF_FEE_CANDIDATE"
    );

  if (pdf) {
    return {
      ...row,

      official_website:
        home
          ?.response
          ?.finalUrl ||
        row.official_website,

      source_url:
        pdf.final_url,

      fee_source_url:
        pdf.final_url,

      source_type:
        "official_pdf",

      queue_status:
        "SOURCE_EXTRACTION_REQUIRED",

      crawl_status:
        "OFFICIAL_PDF_FEE_CANDIDATE",

      recovery_status:
        "RECOVERED_OFFICIAL_PDF",

      recovery_candidates:
        inspected
    };
  }

  /*
  |--------------------------------------------------------------------------
  | Homepage recovered but no verified fee.
  |--------------------------------------------------------------------------
  */

  if (home) {
    return {
      ...row,

      official_website:
        home.response.finalUrl,

      recovery_status:
        "OFFICIAL_WEBSITE_RECOVERED_NO_VERIFIED_FEE",

      recovery_candidates:
        inspected
    };
  }

  return {
    ...row,

    recovery_status:
      "STILL_FETCH_FAILED",

    recovery_candidates:
      inspected
  };
}

async function main() {
  console.log("");
  console.log(
    "======================================="
  );
  console.log(
    "ALL 363 OFFICIAL FEE SOURCE RECOVERY"
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
    !Array.isArray(rows)
  ) {
    throw new Error(
      "Input must be JSON array."
    );
  }

  if (
    rows.length !== 363
  ) {
    throw new Error(
      `Expected 363 colleges, found ${rows.length}.`
    );
  }

  console.log(
    "Total colleges:",
    rows.length
  );

  console.log(
    "Existing verified:",
    rows.filter(
      row =>
        row.crawl_status ===
        "CURRENT_OFFICIAL_BTECH_FEE_SOURCE"
    ).length
  );

  console.log(
    "Fetch failed:",
    rows.filter(
      row =>
        row.crawl_status ===
        "OFFICIAL_WEBSITE_FETCH_FAILED"
    ).length
  );

  console.log("");

  const output = [];

  for (
    let i = 0;
    i < rows.length;
    i++
  ) {
    const row =
      rows[i];

    /*
    |--------------------------------------------------------------------------
    | Only recovery-relevant rows need expensive network work.
    |--------------------------------------------------------------------------
    */

    const shouldRecover =
      row.official_website &&
      row.crawl_status !==
        "CURRENT_OFFICIAL_BTECH_FEE_SOURCE";

    if (!shouldRecover) {
      output.push({
        ...row,

        recovery_status:
          row.crawl_status ===
          "CURRENT_OFFICIAL_BTECH_FEE_SOURCE"
            ? "PRESERVED_VERIFIED"
            : "NO_RECOVERY_REQUIRED"
      });

      continue;
    }

    console.log(
      `[${i + 1}/363] ${row.college_name}`
    );

    try {
      const result =
        await recoverCollege(
          row
        );

      output.push(
        result
      );

      console.log(
        " ->",
        result.recovery_status
      );

    } catch (error) {
      output.push({
        ...row,

        recovery_status:
          "RECOVERY_ERROR",

        recovery_error:
          error.message
      });

      console.log(
        " -> RECOVERY_ERROR:",
        error.message
      );
    }

    /*
    |--------------------------------------------------------------------------
    | Checkpoint every 10 processed records.
    |--------------------------------------------------------------------------
    */

    if (
      output.length % 10 ===
      0
    ) {
      await fs.writeFile(
        OUTPUT,

        JSON.stringify(
          output,
          null,
          2
        ),

        "utf8"
      );

      console.log(
        `   checkpoint saved ${output.length}/363`
      );
    }
  }

  /*
  |--------------------------------------------------------------------------
  | Safety check
  |--------------------------------------------------------------------------
  */

  if (
    output.length !== 363
  ) {
    throw new Error(
      `Output safety failure: expected 363 rows, got ${output.length}.`
    );
  }

  const recovered =
    output.filter(
      row =>
        [
          "RECOVERED_CURRENT_OFFICIAL_BTECH_FEE",
          "RECOVERED_OFFICIAL_PDF",
          "OFFICIAL_WEBSITE_RECOVERED_NO_VERIFIED_FEE"
        ].includes(
          row.recovery_status
        )
    );

  const stillFailed =
    output.filter(
      row =>
        [
          "STILL_FETCH_FAILED",
          "RECOVERY_ERROR"
        ].includes(
          row.recovery_status
        )
    );

  const verified =
    output.filter(
      row =>
        row.crawl_status ===
        "CURRENT_OFFICIAL_BTECH_FEE_SOURCE"
    );

  const pdfs =
    output.filter(
      row =>
        row.crawl_status ===
        "OFFICIAL_PDF_FEE_CANDIDATE"
    );

  const statusCounts = {};

  for (
    const row
    of output
  ) {
    const key =
      row.recovery_status ||
      "UNKNOWN";

    statusCounts[key] =
      (
        statusCounts[key] ||
        0
      ) + 1;
  }

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
    RECOVERED_OUTPUT,

    JSON.stringify(
      recovered,
      null,
      2
    ),

    "utf8"
  );

  await fs.writeFile(
    STILL_FAILED_OUTPUT,

    JSON.stringify(
      stillFailed,
      null,
      2
    ),

    "utf8"
  );

  console.log("");
  console.log(
    "======================================="
  );
  console.log(
    "RECOVERY SUMMARY"
  );
  console.log(
    "======================================="
  );

  console.table(
    Object.entries(
      statusCounts
    )
      .sort(
        (a, b) =>
          b[1] - a[1]
      )
      .map(
        ([status, count]) => ({
          status,
          count
        })
      )
  );

  console.log("");

  console.log(
    "TOTAL:",
    output.length
  );

  console.log(
    "CURRENT OFFICIAL B.TECH READY:",
    verified.length
  );

  console.log(
    "OFFICIAL PDF CANDIDATES:",
    pdfs.length
  );

  console.log(
    "NEWLY RECOVERED:",
    recovered.length
  );

  console.log(
    "STILL FETCH FAILED:",
    stillFailed.length
  );

  console.log("");

  console.log(
    "Saved:",
    OUTPUT
  );

  console.log(
    "Saved:",
    RECOVERED_OUTPUT
  );

  console.log(
    "Saved:",
    STILL_FAILED_OUTPUT
  );

  console.log("");

  console.log(
    "SAFETY:"
  );

  console.log(
    "- Existing verified fee sources preserved."
  );

  console.log(
    "- No guessed fee amount generated."
  );

  console.log(
    "- PDF candidates are NOT treated as verified until extracted."
  );

  console.log(
    "- FW fees have NOT been inferred."
  );

  console.log(
    "- Missing hostel fee remains unknown/NULL."
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

    console.error(
      "DATABASE HAS NOT BEEN MODIFIED."
    );

    process.exitCode = 1;
  }
);