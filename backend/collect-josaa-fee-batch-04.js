import fs from "node:fs";
import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";

dotenv.config();

const SERPER_API_KEY =
  process.env.SERPER_API_KEY;

if (!SERPER_API_KEY) {
  throw new Error(
    "SERPER_API_KEY missing in .env"
  );
}

const INPUT =
  "./josaa-2026-fee-priority-queue.json";

const READY =
  "./josaa-fee-batch-04-ready.json";

const REVIEW =
  "./josaa-fee-batch-04-review.json";

const REPORT =
  "./josaa-fee-batch-04-report.json";

const BATCH_SIZE = 25;
const TIMEOUT = 25000;

const SOURCE_CONFIG = [
  {
    domain: null,
    source_kind: "official",
    priority: 100,
    mode: "official"
  },
  {
    domain: "shiksha.com",
    source_kind: "shiksha",
    priority: 70,
    mode: "secondary"
  },
  {
    domain: "careers360.com",
    source_kind: "careers360",
    priority: 65,
    mode: "secondary"
  }
];

const FIELDS = [
  {
    field: "tuition_fee_per_semester",
    phrases: [
      "tuition fee per semester",
      "semester tuition fee"
    ]
  },
  {
    field: "academic_fee_per_semester",
    phrases: [
      "academic fee per semester",
      "semester academic fee"
    ]
  },
  {
    field: "hostel_fee_per_semester",
    phrases: [
      "hostel fee per semester",
      "hostel charges per semester"
    ]
  },
  {
    field: "mess_fee_per_semester",
    phrases: [
      "mess fee per semester",
      "mess charges per semester"
    ]
  },
  {
    field: "first_semester_fee",
    phrases: [
      "first semester fee",
      "1st semester fee",
      "semester i fee"
    ]
  },
  {
    field: "annual_academic_fee",
    phrases: [
      "annual academic fee",
      "annual tuition fee",
      "tuition fee per annum",
      "tuition fee per year"
    ]
  },
  {
    field: "annual_total_fee",
    phrases: [
      "annual total fee",
      "total annual fee"
    ]
  },
  {
    field: "total_course_fee",
    phrases: [
      "total course fee",
      "total b.tech fee",
      "total btech fee",
      "4 year fee",
      "four year fee"
    ]
  }
];

function cleanJson(s) {
  return s.replace(/^\uFEFF/, "");
}

function normMoney(raw) {
  if (!raw) return null;

  const text =
    String(raw)
      .replace(/,/g, "")
      .trim();

  const lakh =
    text.match(
      /([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lac)/i
    );

  if (lakh) {
    return Math.round(
      Number(lakh[1]) * 100000
    );
  }

  const match =
    text.match(
      /(?:₹|rs\.?|inr)?\s*([0-9]+(?:\.[0-9]+)?)/i
    );

  if (!match) return null;

  const n =
    Number(match[1]);

  if (!Number.isFinite(n)) {
    return null;
  }

  return Math.round(n);
}

function extractMoney(text) {
  const patterns = [
    /₹\s*[0-9,]+(?:\.[0-9]+)?/gi,
    /INR\s*[0-9,]+(?:\.[0-9]+)?/gi,
    /Rs\.?\s*[0-9,]+(?:\.[0-9]+)?/gi,
    /[0-9]+(?:\.[0-9]+)?\s*(?:lakh|lac)/gi
  ];

  const values = [];

  for (const regex of patterns) {
    for (const m of text.match(regex) || []) {
      const n = normMoney(m);

      if (
        n !== null &&
        n >= 1000 &&
        n <= 10000000
      ) {
        values.push(n);
      }
    }
  }

  return [...new Set(values)];
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

function findField(text, phrases) {
  const lower =
    text.toLowerCase();

  const candidates = [];

  for (const phrase of phrases) {
    let start = 0;

    while (true) {
      const idx =
        lower.indexOf(
          phrase.toLowerCase(),
          start
        );

      if (idx === -1) break;

      const ctx =
        text.slice(
          Math.max(0, idx - 100),
          idx + phrase.length + 220
        );

      const nums =
        extractMoney(ctx);

      if (nums.length === 1) {
        candidates.push({
          value: nums[0],
          context:
            ctx.replace(/\s+/g, " ").trim()
        });
      }

      start =
        idx + phrase.length;
    }
  }

  if (!candidates.length) {
    return null;
  }

  const counts =
    new Map();

  for (const c of candidates) {
    counts.set(
      c.value,
      (counts.get(c.value) || 0) + 1
    );
  }

  const winner =
    [...counts.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1]
      )[0][0];

  return {
    value: winner,
    context:
      candidates.find(
        x => x.value === winner
      )?.context || null
  };
}

function extractFields(text) {
  const fields = {};
  const evidence = {};

  for (const config of FIELDS) {

    const found =
      findField(
        text,
        config.phrases
      );

    fields[config.field] =
      found?.value ?? null;

    if (found) {
      evidence[config.field] =
        found.context;
    }
  }

  /*
    Fallback:
    exact semantic fields failed,
    but page clearly reports an overall B.Tech/course fee.
  */

  if (
    fields.total_course_fee == null
  ) {

    const overall =
      extractOverallBtechFee(text);

    if (overall) {

      fields.total_course_fee =
        overall.value;

      evidence.total_course_fee = {
        extraction:
          "overall_btech_fee_fallback",
        phrase:
          overall.phrase,
        context:
          overall.context
      };
    }
  }

  return {
    fields,
    evidence
  };
}

function numericCount(fields) {
  return Object.values(fields)
    .filter(
      x =>
        typeof x === "number"
    )
    .length;
}

function extractOverallBtechFee(text) {
  const lower = text.toLowerCase();

  const phrases = [
    "b.tech total fee",
    "btech total fee",
    "total b.tech fee",
    "total btech fee",
    "b.tech fees",
    "btech fees",
    "course fee",
    "total course fee",
    "total fees"
  ];

  const candidates = [];

  for (const phrase of phrases) {

    let start = 0;

    while (true) {

      const idx =
        lower.indexOf(
          phrase.toLowerCase(),
          start
        );

      if (idx === -1) {
        break;
      }

      const context =
        text.slice(
          Math.max(0, idx - 120),
          idx + phrase.length + 260
        );

      const values =
        extractMoney(context);

      for (const value of values) {

        /*
          Overall B.Tech/course fee normally
          should be larger than a small semester charge.
        */

        if (
          value >= 50000 &&
          value <= 10000000
        ) {
          candidates.push({
            value,
            phrase,
            context:
              context
                .replace(/\s+/g, " ")
                .trim()
          });
        }
      }

      start =
        idx + phrase.length;
    }
  }

  if (!candidates.length) {
    return null;
  }

  /*
    Prefer highest repeated value.
    For total-course context, larger number is
    usually safer than picking exam/application fee.
  */

  const counts = new Map();

  for (const row of candidates) {

    counts.set(
      row.value,
      (counts.get(row.value) || 0) + 1
    );
  }

  const ranked =
    [...counts.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1] ||
          b[0] - a[0]
      );

  const winner =
    ranked[0][0];

  const evidence =
    candidates.find(
      x => x.value === winner
    );

  return {
    value: winner,
    phrase:
      evidence?.phrase || null,
    context:
      evidence?.context || null
  };
}

async function googleSearch(query) {
  const res =
    await axios.post(
      "https://google.serper.dev/search",
      {
        q: query,
        num: 8
      },
      {
        timeout: TIMEOUT,
        headers: {
          "X-API-KEY":
            SERPER_API_KEY,
          "Content-Type":
            "application/json"
        }
      }
    );

  return res.data?.organic || [];
}

async function fetchHtml(url) {
  const res =
    await axios.get(
      url,
      {
        timeout: TIMEOUT,
        maxRedirects: 5,
        headers: {
          "User-Agent":
            "Mozilla/5.0"
        },
        validateStatus:
          s =>
            s >= 200 &&
            s < 400
      }
    );

  const type =
    String(
      res.headers[
        "content-type"
      ] || ""
    ).toLowerCase();

  if (!type.includes("text/html")) {
    return null;
  }

  return String(
    res.data || ""
  );
}

function officialHost(url, website) {
  try {
    const a =
      new URL(url)
        .hostname
        .replace(/^www\./, "");

    const b =
      new URL(website)
        .hostname
        .replace(/^www\./, "");

    return (
      a === b ||
      a.endsWith("." + b)
    );
  } catch {
    return false;
  }
}

function scoreResult(result, website) {
  const url =
    String(result.link || "")
      .toLowerCase();

  const title =
    String(result.title || "")
      .toLowerCase();

  const snippet =
    String(result.snippet || "")
      .toLowerCase();

  let score = 0;

  if (
    website &&
    officialHost(
      result.link,
      website
    )
  ) {
    score += 150;
  }

  if (url.includes(".ac.in")) {
    score += 100;
  }

  if (url.includes(".edu.in")) {
    score += 90;
  }

  if (url.includes(".gov.in")) {
    score += 90;
  }

  if (url.includes("fee")) {
    score += 40;
  }

  if (title.includes("fee")) {
    score += 30;
  }

  if (snippet.includes("fee")) {
    score += 20;
  }

  if (
    url.includes("cutoff") ||
    url.includes("placement") ||
    url.includes("question")
  ) {
    score -= 100;
  }

  return score;
}

async function researchOfficial(college) {
  const queries = [
    `"${college.josaa_name}" fee structure 2026`,
    `"${college.josaa_name}" B.Tech fees 2026`,
    `"${college.josaa_name}" semester fee 2026`
  ];

  const combined = [];

  for (const q of queries) {
    try {
      const results =
        await googleSearch(q);

      combined.push(...results);
    } catch {}
  }

  const unique =
    [
      ...new Map(
        combined
          .filter(x => x.link)
          .map(x => [
            x.link,
            x
          ])
      ).values()
    ];

  unique.sort(
    (a, b) =>
      scoreResult(
        b,
        college.website
      ) -
      scoreResult(
        a,
        college.website
      )
  );

  for (
    const result
    of unique.slice(0, 10)
  ) {
    try {
      const isOfficial =
        college.website &&
        officialHost(
          result.link,
          college.website
        );

      const isAcademic =
        /\.(ac|edu)\.in\//i.test(
          result.link
        );

      if (
        !isOfficial &&
        !isAcademic
      ) {
        continue;
      }

      const html =
        await fetchHtml(
          result.link
        );

      if (!html) continue;

      const extracted =
        extractFields(
          pageText(html)
        );

      const count =
        numericCount(
          extracted.fields
        );

      console.log(
        `    OFFICIAL ${result.link}`
      );

      console.log(
        `    numeric fields: ${count}`
      );

      if (count > 0) {
        return {
          fields:
            extracted.fields,
          evidence:
            extracted.evidence,
          source_url:
            result.link,
          source_kind:
            "official",
          source_priority:
            100,
          confidence_score:
            count >= 4 ? 90 : 80
        };
      }

    } catch (err) {
      console.log(
        `    official page failed: ${err.message}`
      );
    }
  }

  return null;
}

async function researchOpenWeb(
  college
) {
  const queries = [
    `"${college.josaa_name}" B.Tech total fee`,
    `"${college.josaa_name}" BTech fees`,
    `"${college.josaa_name}" fee structure`
  ];

  const combined = [];

  for (const q of queries) {

    try {

      const results =
        await googleSearch(q);

      combined.push(
        ...results
      );

    } catch {}
  }

  const unique =
    [
      ...new Map(
        combined
          .filter(
            x =>
              x?.link &&
              /^https?:\/\//i.test(
                x.link
              )
          )
          .map(
            x => [
              x.link,
              x
            ]
          )
      ).values()
    ];

  const blocked = [
    "youtube.com",
    "facebook.com",
    "instagram.com",
    "quora.com",
    "reddit.com"
  ];

  for (
    const result
    of unique.slice(0, 10)
  ) {

    const url =
      result.link;

    if (
      blocked.some(
        domain =>
          url.includes(domain)
      )
    ) {
      continue;
    }

    try {

      const html =
        await fetchHtml(url);

      if (!html) {
        continue;
      }

      const extracted =
        extractFields(
          pageText(html)
        );

      const count =
        numericCount(
          extracted.fields
        );

      console.log(
        `    OPENWEB ${url}`
      );

      console.log(
        `    numeric fields: ${count}`
      );

      if (count === 0) {
        continue;
      }

      const official =
        college.website &&
        officialHost(
          url,
          college.website
        );

      return {
        fields:
          extracted.fields,

        evidence:
          extracted.evidence,

        source_url:
          url,

        source_kind:
          official
            ? "official"
            : "other_secondary",

        source_priority:
          official
            ? 100
            : 55,

        confidence_score:
          official
            ? 85
            : 60
      };

    } catch {}
  }

  return null;
}

async function researchSecondary(
  college
) {
  for (
    const source
    of SOURCE_CONFIG.filter(
      x =>
        x.mode === "secondary"
    )
  ) {
    const query =
      `"${college.josaa_name}" B.Tech fees 2026 site:${source.domain}`;

    let results = [];

    try {
      results =
        await googleSearch(query);
    } catch {
      continue;
    }

    for (
      const result
      of results.slice(0, 5)
    ) {
      if (
        !result.link?.includes(
          source.domain
        )
      ) {
        continue;
      }

      try {
        const html =
          await fetchHtml(
            result.link
          );

        if (!html) continue;

        const extracted =
          extractFields(
            pageText(html)
          );

        const count =
          numericCount(
            extracted.fields
          );

        console.log(
          `    ${source.domain} ${result.link}`
        );

        console.log(
          `    numeric fields: ${count}`
        );

        if (count > 0) {
          return {
            fields:
              extracted.fields,
            evidence:
              extracted.evidence,
            source_url:
              result.link,
            source_kind:
              source.source_kind,
            source_priority:
              source.priority,
            confidence_score:
              count >= 3 ? 75 : 65
          };
        }
      } catch {}
    }
  }

  return null;
}

function buildRecord(
  college,
  found
) {
  return {
    college_id:
      college.college_id,

    college_name:
      college.college_name,

    program:
      "B.Tech",

    academic_year:
      2026,

    tuition_fee_per_semester:
      found.fields
        .tuition_fee_per_semester,

    academic_fee_per_semester:
      found.fields
        .academic_fee_per_semester,

    hostel_fee_per_semester:
      found.fields
        .hostel_fee_per_semester,

    mess_fee_per_semester:
      found.fields
        .mess_fee_per_semester,

    first_semester_fee:
      found.fields
        .first_semester_fee,

    annual_academic_fee:
      found.fields
        .annual_academic_fee,

    annual_total_fee:
      found.fields
        .annual_total_fee,

    total_course_fee:
      found.fields
        .total_course_fee,

    one_time_fee:
      null,

    security_deposit:
      null,

    source_kind:
      found.source_kind,

    source_label:
      `${college.josaa_name} fee source`,

    source_url:
      found.source_url,

    source_priority:
      found.source_priority,

    confidence_score:
      found.confidence_score,

    verification_status:
      found.source_kind === "official"
        ? "high_confidence"
        : "review_recommended",

    extraction_method:
      "automatic",

    notes:
      `JoSAA 2026 mapped institute. Explicit fee values extracted only; missing fields left null.`
  };
}

const queue =
  JSON.parse(
    cleanJson(
      fs.readFileSync(
        INPUT,
        "utf8"
      )
    )
  )
  .filter(
    x =>
      x.status ===
      "NO_FEE_DATA"
  )
  .slice(
    0,
    BATCH_SIZE
  );

console.log("");
console.log(
  "========================================"
);
console.log(
  "JOSAA FEE BATCH 04"
);
console.log(
  "========================================"
);

console.log(
  "Colleges:",
  queue.length
);

const ready = [];
const review = [];
const report = [];

for (
  let i = 0;
  i < queue.length;
  i++
) {
  const college =
    queue[i];

  console.log("");
  console.log(
    `[${i + 1}/${queue.length}] ${college.josaa_name}`
  );

  let found =
    await researchOfficial(
      college
    );

  if (!found) {
    console.log(
      "    official clear fee not found → secondary"
    );

    found =
      await researchSecondary(
        college
      );
  }

  if (!found) {

    console.log(
      "    secondary clear fee not found → open web"
    );

    found =
      await researchOpenWeb(
        college
      );
  }

  if (found) {
    ready.push(
      buildRecord(
        college,
        found
      )
    );

    report.push({
      college,
      found
    });

    console.log(
      `  ✅ ${found.source_kind} data found`
    );
  } else {
    review.push(
      college
    );

    console.log(
      "  ❌ no safe fee data"
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
    report,
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
  "BATCH COMPLETE"
);
console.log(
  "========================================"
);

console.log(
  "Ready:",
  ready.length
);

console.log(
  "Review:",
  review.length
);

console.log(
  "Saved:",
  READY
);









