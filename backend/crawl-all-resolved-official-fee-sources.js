import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";

const INPUT =
  "./all-colleges-fee-source-family-enriched-uptac.json";

const OUTPUT =
  "./all-colleges-fee-source-crawl.json";

const READY_OUTPUT =
  "./all-colleges-fee-source-ready-after-crawl.json";

const REVIEW_OUTPUT =
  "./all-colleges-fee-source-review-after-crawl.json";

const NO_FEE_OUTPUT =
  "./all-colleges-no-fee-source-after-crawl.json";

const TARGET_YEAR = 2026;

const TIMEOUT = 15000;

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36",

  Accept:
    "text/html,application/xhtml+xml,application/pdf,*/*"
};

function clean(value) {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function rootUrl(value) {
  try {
    const u = new URL(value);
    return `${u.protocol}//${u.host}/`;
  } catch {
    return null;
  }
}

function sameDomain(a, b) {
  try {
    const A = new URL(a)
      .hostname
      .replace(/^www\./, "")
      .toLowerCase();

    const B = new URL(b)
      .hostname
      .replace(/^www\./, "")
      .toLowerCase();

    return (
      A === B ||
      A.endsWith(`.${B}`) ||
      B.endsWith(`.${A}`)
    );
  } catch {
    return false;
  }
}

function detectSignals(text) {
  const lower =
    String(text ?? "")
      .toLowerCase();

  return {
    btech:
      /b\.?\s*tech|btech/.test(lower),

    fee:
      /\bfees?\b/.test(lower),

    tuition:
      /tuition/.test(lower),

    admission:
      /admission/.test(lower),

    total:
      /total\s+fee|total\s+fees|grand\s+total/.test(lower),

    hostel:
      /hostel/.test(lower),

    mess:
      /mess/.test(lower),

    feeWaiver:
      /fee\s*waiver|\btfw\b|\bfw\b/.test(lower),

    year2026:
      /2026\s*[-–]\s*27|2026\s*[-–]\s*2027|\bsession\s*2026\b|\b2026\b/.test(
        lower
      )
  };
}

function extractAmounts(text) {
  const lines =
    String(text ?? "")
      .split(/\r?\n/);

  const amounts = [];

  for (
    const line
    of lines
  ) {
    if (
      !/fee|tuition|hostel|admission|registration|exam|development|security|caution|total/i.test(
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
      const value =
        Number(
          match
            .replace(/₹|rs\.?|inr/gi, "")
            .replace(/,/g, "")
            .trim()
        );

      if (
        !Number.isFinite(value)
      ) {
        continue;
      }

      if (
        value >= 2000 &&
        value <= 2100
      ) {
        continue;
      }

      if (
        value < 100 ||
        value > 3000000
      ) {
        continue;
      }

      amounts.push(value);
    }
  }

  return [
    ...new Set(amounts)
  ].sort(
    (a, b) =>
      a - b
  );
}

async function fetchResource(url) {
  try {
    const response =
      await axios.get(
        url,
        {
          timeout:
            TIMEOUT,

          maxRedirects:
            6,

          responseType:
            "arraybuffer",

          headers:
            HEADERS,

          validateStatus:
            status =>
              status >= 200 &&
              status < 400
        }
      );

    return {
      ok:
        true,

      buffer:
        Buffer.from(
          response.data
        ),

      content_type:
        String(
          response.headers[
            "content-type"
          ] || ""
        ).toLowerCase(),

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

function parseHtml(buffer) {
  const html =
    buffer.toString("utf8");

  const $ =
    cheerio.load(html);

  $("script,style,noscript")
    .remove();

  const text =
    clean(
      $("body").text()
    );

  const links = [];

  $("a[href]").each(
    (_, element) => {
      const href =
        clean(
          $(element)
            .attr("href")
        );

      const label =
        clean(
          $(element)
            .text()
        );

      if (
        href
      ) {
        links.push({
          href,
          label
        });
      }
    }
  );

  return {
    html,
    text,
    links
  };
}

function rankCandidate(
  link
) {
  const context =
    `${link.label} ${link.href}`
      .toLowerCase();

  let score = 0;

  if (
    /fee structure/.test(
      context
    )
  ) {
    score += 100;
  }

  if (
    /b\.?tech|btech/.test(
      context
    )
  ) {
    score += 50;
  }

  if (
    /2026|2026-27|2026_27/.test(
      context
    )
  ) {
    score += 50;
  }

  if (
    /fee|fees|tuition/.test(
      context
    )
  ) {
    score += 30;
  }

  if (
    /admission/.test(
      context
    )
  ) {
    score += 20;
  }

  if (
    /prospectus|brochure/.test(
      context
    )
  ) {
    score += 15;
  }

  if (
    /\.pdf(?:$|\?)/i.test(
      link.href
    )
  ) {
    score += 20;
  }

  return score;
}

async function crawlCollege(row) {
  const website =
    row.official_website;

  if (
    !website
  ) {
    return {
      ...row,

      crawl_status:
        "NO_OFFICIAL_WEBSITE"
    };
  }

  const home =
    await fetchResource(
      website
    );

  if (
    !home.ok
  ) {
    return {
      ...row,

      crawl_status:
        "OFFICIAL_WEBSITE_FETCH_FAILED",

      crawl_error:
        home.error
    };
  }

  if (
    !home.content_type.includes(
      "html"
    )
  ) {
    return {
      ...row,

      crawl_status:
        "OFFICIAL_WEBSITE_NOT_HTML"
    };
  }

  const parsed =
    parseHtml(
      home.buffer
    );

  const candidates = [];

  for (
    const link
    of parsed.links
  ) {
    const score =
      rankCandidate(
        link
      );

    if (
      score <= 0
    ) {
      continue;
    }

    let absolute;

    try {
      absolute =
        new URL(
          link.href,
          home.final_url
        ).href;
    } catch {
      continue;
    }

    if (
      !sameDomain(
        absolute,
        home.final_url
      )
    ) {
      continue;
    }

    candidates.push({
      url:
        absolute,

      label:
        link.label,

      score
    });
  }

  const unique =
    new Map();

  for (
    const candidate
    of candidates
  ) {
    const old =
      unique.get(
        candidate.url
      );

    if (
      !old ||
      candidate.score >
      old.score
    ) {
      unique.set(
        candidate.url,
        candidate
      );
    }
  }

  const ranked =
    [
      ...unique.values()
    ]
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .slice(
        0,
        15
      );

  const checked = [];

  for (
    const candidate
    of ranked
  ) {
    const resource =
      await fetchResource(
        candidate.url
      );

    if (
      !resource.ok
    ) {
      checked.push({
        ...candidate,

        status:
          "FETCH_FAILED",

        error:
          resource.error
      });

      continue;
    }

    if (
      resource.content_type.includes(
        "pdf"
      ) ||
      /\.pdf(?:$|\?)/i.test(
        resource.final_url
      )
    ) {
      checked.push({
        ...candidate,

        final_url:
          resource.final_url,

        source_type:
          "official_pdf",

        status:
          "PDF_EXTRACTION_REQUIRED",

        current_year_hint:
          /2026|2026[-_]?27/i.test(
            `${candidate.label} ${candidate.url}`
          )
      });

      continue;
    }

    if (
      !resource.content_type.includes(
        "html"
      )
    ) {
      continue;
    }

    const candidateParsed =
      parseHtml(
        resource.buffer
      );

    const signals =
      detectSignals(
        candidateParsed.text
      );

    const amounts =
      extractAmounts(
        candidateParsed.text
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

    checked.push({
      ...candidate,

      final_url:
        resource.final_url,

      source_type:
        "official_html",

      status,

      signals,

      amounts,

      amounts_count:
        amounts.length
    });
  }

  const current =
    checked.find(
      item =>
        item.status ===
        "CURRENT_OFFICIAL_BTECH_FEE_SOURCE"
    );

  if (
    current
  ) {
    return {
      ...row,

      academic_year:
        TARGET_YEAR,

      fee_source_url:
        current.final_url,

      source_url:
        current.final_url,

      source_type:
        current.source_type,

      queue_status:
        "SOURCE_READY",

      crawl_status:
        "CURRENT_OFFICIAL_BTECH_FEE_SOURCE",

      fee_source_signals:
        current.signals,

      fee_source_amounts:
        current.amounts,

      fee_candidates:
        checked
    };
  }

  const pdf =
    checked.find(
      item =>
        item.status ===
        "PDF_EXTRACTION_REQUIRED"
    );

  if (
    pdf
  ) {
    return {
      ...row,

      fee_source_url:
        pdf.final_url,

      source_url:
        pdf.final_url,

      source_type:
        "official_pdf",

      queue_status:
        "SOURCE_EXTRACTION_REQUIRED",

      crawl_status:
        "OFFICIAL_PDF_FEE_CANDIDATE",

      fee_candidates:
        checked
    };
  }

  return {
    ...row,

    crawl_status:
      checked.length > 0
        ? "OFFICIAL_FEE_CANDIDATES_REVIEW"
        : "NO_FEE_LINK_FOUND",

    fee_candidates:
      checked
  };
}

async function main() {
  console.log("");

  console.log(
    "======================================="
  );

  console.log(
    "ALL RESOLVED OFFICIAL WEBSITE FEE CRAWLER"
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

  const targets =
    rows.filter(
      row =>
        row.official_website
    );

  console.log(
    "Total DB colleges:",
    rows.length
  );

  console.log(
    "Resolved official websites:",
    targets.length
  );

  console.log(
    "Target fee year:",
    TARGET_YEAR
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

    if (
      !row.official_website
    ) {
      output.push({
        ...row,

        crawl_status:
          "NO_OFFICIAL_WEBSITE"
      });

      continue;
    }

    console.log(
      `[${i + 1}/${rows.length}] ${row.college_name}`
    );

    try {
      const result =
        await crawlCollege(
          row
        );

      output.push(
        result
      );

      console.log(
        " ->",
        result
          .crawl_status
      );

    } catch (error) {
      output.push({
        ...row,

        crawl_status:
          "CRAWL_ERROR",

        crawl_error:
          error.message
      });

      console.log(
        " -> ERROR:",
        error.message
      );
    }

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
    }
  }

  const ready =
    output.filter(
      row =>
        row.crawl_status ===
        "CURRENT_OFFICIAL_BTECH_FEE_SOURCE"
    );

  const review =
    output.filter(
      row =>
        [
          "OFFICIAL_PDF_FEE_CANDIDATE",
          "OFFICIAL_FEE_CANDIDATES_REVIEW",
          "OFFICIAL_WEBSITE_FETCH_FAILED",
          "CRAWL_ERROR"
        ].includes(
          row.crawl_status
        )
    );

  const noFee =
    output.filter(
      row =>
        [
          "NO_FEE_LINK_FOUND",
          "NO_OFFICIAL_WEBSITE"
        ].includes(
          row.crawl_status
        )
    );

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
    NO_FEE_OUTPUT,

    JSON.stringify(
      noFee,
      null,
      2
    ),

    "utf8"
  );

  const counts = {};

  for (
    const row
    of output
  ) {
    const status =
      row.crawl_status;

    counts[
      status
    ] =
      (
        counts[
          status
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
    "FEE SOURCE CRAWL SUMMARY"
  );

  console.log(
    "======================================="
  );

  console.table(
    Object.entries(
      counts
    )
      .sort(
        (a, b) =>
          b[1] -
          a[1]
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
    "CURRENT OFFICIAL B.TECH READY:",
    ready.length
  );

  console.log(
    "REVIEW / PDF:",
    review.length
  );

  console.log(
    "NO FEE SOURCE:",
    noFee.length
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
    NO_FEE_OUTPUT
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