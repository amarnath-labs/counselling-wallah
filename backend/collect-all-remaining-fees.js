import fs from "node:fs";
import pg from "pg";
import dotenv from "dotenv";
import axios from "axios";
import * as cheerio from "cheerio";

dotenv.config();

const { Pool } = pg;

const DB =
  process.env.DATABASE_URL ||
  process.env.DB_URL ||
  process.env.POSTGRES_URL;

if (!DB) {
  throw new Error("DATABASE_URL / DB_URL missing");
}

const pool = new Pool({
  connectionString: DB
});

const QUEUE =
  "./fee-completion-work-queue.json";

const READY =
  "./fee-all-remaining-auto-ready.json";

const REVIEW =
  "./fee-all-remaining-review.json";

const REPORT =
  "./fee-all-remaining-report.json";

const CONCURRENCY = 5;
const TIMEOUT = 12000;

const MONEY_RE =
  /(?:₹|rs\.?|inr)\s*([0-9][0-9,]*(?:\.[0-9]+)?)/gi;

const FEE_WORDS = [
  "fee",
  "fees",
  "fee structure",
  "tuition",
  "b.tech fee",
  "btech fee",
  "academic fee",
  "hostel fee"
];

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function cleanJson(s) {
  return s.replace(/^\uFEFF/, "");
}

function money(v) {
  if (!v) return null;

  const n =
    Number(
      String(v)
        .replace(/,/g, "")
        .trim()
    );

  return Number.isFinite(n)
    ? n
    : null;
}

function normalizeUrl(url) {
  if (!url) return null;

  let u = String(url).trim();

  if (!u) return null;

  if (!/^https?:\/\//i.test(u)) {
    u = "https://" + u;
  }

  return u;
}

function sameHost(base, target) {
  try {
    return (
      new URL(base).hostname.replace(/^www\./, "") ===
      new URL(target).hostname.replace(/^www\./, "")
    );
  } catch {
    return false;
  }
}

function absolute(base, href) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function extractMoneyCandidates(text) {
  const out = [];

  for (const m of text.matchAll(MONEY_RE)) {
    const value = money(m[1]);

    if (
      value !== null &&
      value >= 1000 &&
      value <= 10000000
    ) {
      out.push(value);
    }
  }

  return [...new Set(out)];
}

function contextAround(text, needleIndex, radius = 160) {
  return text
    .slice(
      Math.max(0, needleIndex - radius),
      needleIndex + radius
    )
    .replace(/\s+/g, " ")
    .trim();
}

function feeEvidence(text) {
  const lower =
    text.toLowerCase();

  const evidence = [];

  const patterns = [
    {
      field: "tuition_fee_per_semester",
      words: [
        "tuition fee per semester",
        "semester tuition fee",
        "tuition fee/semester"
      ]
    },
    {
      field: "academic_fee_per_semester",
      words: [
        "academic fee per semester",
        "semester fee"
      ]
    },
    {
      field: "hostel_fee_per_semester",
      words: [
        "hostel fee per semester",
        "hostel fee/semester"
      ]
    },
    {
      field: "mess_fee_per_semester",
      words: [
        "mess fee per semester",
        "mess charge per semester"
      ]
    },
    {
      field: "first_semester_fee",
      words: [
        "first semester fee",
        "1st semester fee",
        "semester i fee"
      ]
    },
    {
      field: "first_year_fee",
      words: [
        "first year fee",
        "1st year fee",
        "first-year fee"
      ]
    },
    {
      field: "annual_academic_fee",
      words: [
        "annual academic fee",
        "academic fee per year",
        "tuition fee per annum",
        "annual tuition fee"
      ]
    },
    {
      field: "annual_total_fee",
      words: [
        "annual total fee",
        "total annual fee",
        "annual fee"
      ]
    },
    {
      field: "total_course_fee",
      words: [
        "total course fee",
        "total b.tech fee",
        "total btech fee",
        "four year fee",
        "4 year fee"
      ]
    }
  ];

  for (const p of patterns) {

    for (const word of p.words) {

      let start = 0;

      while (true) {

        const idx =
          lower.indexOf(
            word,
            start
          );

        if (idx === -1)
          break;

        const ctx =
          contextAround(
            text,
            idx
          );

        const nums =
          extractMoneyCandidates(ctx);

        evidence.push({
          field: p.field,
          keyword: word,
          values: nums,
          context: ctx
        });

        start =
          idx + word.length;
      }
    }
  }

  return evidence;
}

function chooseValue(evidence, field) {

  const rows =
    evidence.filter(
      x =>
        x.field === field &&
        x.values.length === 1
    );

  if (!rows.length)
    return null;

  const values =
    rows.map(
      x => x.values[0]
    );

  const counts =
    new Map();

  for (const v of values) {
    counts.set(
      v,
      (counts.get(v) || 0) + 1
    );
  }

  const sorted =
    [...counts.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1]
      );

  if (!sorted.length)
    return null;

  /*
    Require at least one clean,
    single-value semantic context.
  */
  return sorted[0][0];
}

async function fetchHtml(url) {

  const response =
    await axios.get(
      url,
      {
        timeout: TIMEOUT,
        maxRedirects: 5,

        headers: {
          "User-Agent":
            "Mozilla/5.0 FeeResearchBot/1.0"
        },

        validateStatus:
          status =>
            status >= 200 &&
            status < 400
      }
    );

  const type =
    String(
      response.headers[
        "content-type"
      ] || ""
    ).toLowerCase();

  if (
    !type.includes("text/html")
  ) {
    return null;
  }

  return String(
    response.data || ""
  );
}

function pageText(html) {

  const $ =
    cheerio.load(html);

  $("script,style,noscript,svg")
    .remove();

  return $("body")
    .text()
    .replace(/\s+/g, " ")
    .trim();
}

function findFeeLinks(baseUrl, html) {

  const $ =
    cheerio.load(html);

  const links = [];

  $("a[href]").each(
    (_, el) => {

      const href =
        $(el).attr("href");

      const label =
        (
          $(el).text() +
          " " +
          (href || "")
        )
          .toLowerCase();

      if (
        !FEE_WORDS.some(
          word =>
            label.includes(word)
        )
      ) {
        return;
      }

      const url =
        absolute(
          baseUrl,
          href
        );

      if (
        url &&
        sameHost(
          baseUrl,
          url
        )
      ) {
        links.push(url);
      }
    }
  );

  return [
    ...new Set(links)
  ].slice(0, 8);
}

async function researchOfficial(
  college
) {

  const root =
    normalizeUrl(
      college.website
    );

  if (!root) {
    return {
      status:
        "NO_OFFICIAL_WEBSITE",
      urls: [],
      evidence: []
    };
  }

  const urls =
    [root];

  let homeHtml;

  try {

    homeHtml =
      await fetchHtml(root);

  } catch (err) {

    return {
      status:
        "OFFICIAL_UNREACHABLE",
      urls: [root],
      error:
        err.message,
      evidence: []
    };
  }

  if (!homeHtml) {

    return {
      status:
        "NON_HTML_OFFICIAL",
      urls: [root],
      evidence: []
    };
  }

  const links =
    findFeeLinks(
      root,
      homeHtml
    );

  urls.push(...links);

  /*
    common official fee paths
  */

  const common = [
    "/fee-structure",
    "/fees",
    "/admission/fee-structure",
    "/admissions/fee-structure",
    "/admission/fees",
    "/admissions/fees"
  ];

  for (const path of common) {
    try {
      urls.push(
        new URL(
          path,
          root
        ).href
      );
    } catch {}
  }

  const finalUrls =
    [...new Set(urls)]
      .slice(0, 12);

  const allEvidence = [];

  const successful = [];

  for (const url of finalUrls) {

    try {

      const html =
        url === root
          ? homeHtml
          : await fetchHtml(url);

      if (!html)
        continue;

      const text =
        pageText(html);

      if (
        !text
          .toLowerCase()
          .includes("fee")
      ) {
        continue;
      }

      const evidence =
        feeEvidence(text);

      if (evidence.length) {

        successful.push(url);

        allEvidence.push(
          ...evidence.map(
            x => ({
              ...x,
              url
            })
          )
        );
      }

    } catch {}

    await sleep(150);
  }

  return {
    status:
      allEvidence.length
        ? "EVIDENCE_FOUND"
        : "NO_CLEAR_FEE_EVIDENCE",

    urls:
      successful,

    evidence:
      allEvidence
  };
}

function buildRecord(
  college,
  research
) {

  const e =
    research.evidence;

  const record = {

    college_id:
      college.college_id,

    college_name:
      college.college_name,

    program:
      "B.Tech",

    academic_year:
      2026,

    tuition_fee_per_semester:
      chooseValue(
        e,
        "tuition_fee_per_semester"
      ),

    academic_fee_per_semester:
      chooseValue(
        e,
        "academic_fee_per_semester"
      ),

    hostel_fee_per_semester:
      chooseValue(
        e,
        "hostel_fee_per_semester"
      ),

    mess_fee_per_semester:
      chooseValue(
        e,
        "mess_fee_per_semester"
      ),

    first_semester_fee:
      chooseValue(
        e,
        "first_semester_fee"
      ),

    first_year_fee:
      chooseValue(
        e,
        "first_year_fee"
      ),

    annual_academic_fee:
      chooseValue(
        e,
        "annual_academic_fee"
      ),

    annual_total_fee:
      chooseValue(
        e,
        "annual_total_fee"
      ),

    total_course_fee:
      chooseValue(
        e,
        "total_course_fee"
      ),

    one_time_fee:
      null,

    security_deposit:
      null,

    source_kind:
      "official",

    source_label:
      `${college.college_name} official fee source`,

    source_url:
      research.urls[0] ||
      normalizeUrl(
        college.website
      ),

    source_priority:
      100,

    confidence_score:
      75,

    verification_status:
      "review_recommended",

    extraction_method:
      "automatic",

    notes:
      `Automatically extracted from official institute website. Evidence contexts=${e.length}. Values are retained only where a single clear amount was found near a semantic fee label.`
  };

  const numericFields = [
    "tuition_fee_per_semester",
    "academic_fee_per_semester",
    "hostel_fee_per_semester",
    "mess_fee_per_semester",
    "first_semester_fee",
    "first_year_fee",
    "annual_academic_fee",
    "annual_total_fee",
    "total_course_fee"
  ];

  const count =
    numericFields.filter(
      f =>
        record[f] !== null
    ).length;

  return {
    record,
    numericCount:
      count
  };
}

async function worker(
  rows,
  results,
  indexRef
) {

  while (true) {

    const i =
      indexRef.value++;

    if (i >= rows.length)
      return;

    const college =
      rows[i];

    console.log(
      `[${i + 1}/${rows.length}] ${college.college_name}`
    );

    try {

      const research =
        await researchOfficial(
          college
        );

      const built =
        buildRecord(
          college,
          research
        );

      results[i] = {
        college,
        research,
        ...built
      };

      console.log(
        `   ${research.status} | numeric=${built.numericCount}`
      );

    } catch (err) {

      results[i] = {
        college,
        error:
          err.message,
        numericCount: 0
      };

      console.log(
        `   ERROR: ${err.message}`
      );
    }
  }
}

try {

  if (
    !fs.existsSync(QUEUE)
  ) {
    throw new Error(
      `${QUEUE} not found`
    );
  }

  const queue =
    JSON.parse(
      cleanJson(
        fs.readFileSync(
          QUEUE,
          "utf8"
        )
      )
    );

  /*
    ONLY completely empty colleges.
  */

  const noFee =
    queue.filter(
      row =>
        row.status ===
        "NO_FEE_DATA"
    );

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "ALL REMAINING FEE COLLECTOR"
  );
  console.log(
    "========================================"
  );

  console.log(
    "NO_FEE_DATA:",
    noFee.length
  );

  /*
    Pull official website from colleges table.
  */

  const ids =
    noFee.map(
      x => x.college_id
    );

  const dbResult =
    await pool.query(
      `
      SELECT
        id::text AS college_id,
        name AS college_name,
        website
      FROM colleges
      WHERE id::text = ANY($1::text[])
      `,
      [ids]
    );

  const websiteMap =
    new Map(
      dbResult.rows.map(
        x => [
          x.college_id,
          x
        ]
      )
    );

  const rows =
    noFee.map(
      x => ({
        ...x,
        website:
          websiteMap.get(
            x.college_id
          )?.website || null
      })
    );

  const results =
    new Array(
      rows.length
    );

  const indexRef = {
    value: 0
  };

  await Promise.all(
    Array.from(
      {
        length:
          Math.min(
            CONCURRENCY,
            rows.length
          )
      },
      () =>
        worker(
          rows,
          results,
          indexRef
        )
    )
  );

  const ready = [];

  const review = [];

  for (
    const result
    of results
  ) {

    if (!result)
      continue;

    /*
      Auto-ready:
      at least one numeric fee
      AND real official URL.
    */

    if (
      result.numericCount > 0 &&
      result.record?.source_url &&
      /^https?:\/\//i.test(
        result.record.source_url
      )
    ) {
      ready.push(
        result.record
      );
    } else {
      review.push(
        result
      );
    }
  }

  fs.writeFileSync(
    READY,
    JSON.stringify(
      ready,
      null,
      2
    ),
    "utf8"
  );

  fs.writeFileSync(
    REVIEW,
    JSON.stringify(
      review,
      null,
      2
    ),
    "utf8"
  );

  fs.writeFileSync(
    REPORT,
    JSON.stringify(
      results,
      null,
      2
    ),
    "utf8"
  );

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "COLLECTION COMPLETE"
  );
  console.log(
    "========================================"
  );

  console.log(
    "Processed:",
    rows.length
  );

  console.log(
    "Auto-ready:",
    ready.length
  );

  console.log(
    "Manual/fallback review:",
    review.length
  );

  console.log("");
  console.log(
    "Ready file:",
    READY
  );

  console.log(
    "Review file:",
    REVIEW
  );

  console.log(
    "Full report:",
    REPORT
  );

} finally {

  await pool.end();

}
