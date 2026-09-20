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
  "./fee-all-remaining-review.json";

const READY =
  "./fee-secondary-fallback-ready.json";

const STILL_REVIEW =
  "./fee-secondary-still-review.json";

const TIMEOUT = 25000;

const DOMAINS = [
  {
    domain: "shiksha.com",
    source_kind: "shiksha",
    priority: 70
  },
  {
    domain: "collegedunia.com",
    source_kind: "collegedunia",
    priority: 75
  },
  {
    domain: "careers360.com",
    source_kind: "careers360",
    priority: 70
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
      "academic fee per semester"
    ]
  },
  {
    field: "hostel_fee_per_semester",
    phrases: [
      "hostel fee per semester"
    ]
  },
  {
    field: "mess_fee_per_semester",
    phrases: [
      "mess fee per semester"
    ]
  },
  {
    field: "first_semester_fee",
    phrases: [
      "first semester fee",
      "1st semester fee"
    ]
  },
  {
    field: "first_year_fee",
    phrases: [
      "first year fee",
      "1st year fee",
      "first-year fee"
    ]
  },
  {
    field: "annual_academic_fee",
    phrases: [
      "annual academic fee",
      "annual tuition fee",
      "tuition fee per year",
      "tuition fee per annum"
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
      "total fees"
    ]
  }
];

function cleanJson(text) {
  return text.replace(/^\uFEFF/, "");
}

function normalizeMoney(raw) {

  if (!raw)
    return null;

  let value =
    String(raw)
      .replace(/₹/g, "")
      .replace(/INR/gi, "")
      .replace(/Rs\.?/gi, "")
      .replace(/,/g, "")
      .trim();

  /*
    Handle lakh values:
    2.45 lakh
  */

  const lakh =
    value.match(
      /([0-9]+(?:\.[0-9]+)?)\s*(?:lakh|lac)/i
    );

  if (lakh) {
    return Math.round(
      Number(lakh[1]) *
      100000
    );
  }

  const number =
    value.match(
      /[0-9]+(?:\.[0-9]+)?/
    );

  if (!number)
    return null;

  const n =
    Number(number[0]);

  if (!Number.isFinite(n))
    return null;

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

    const matches =
      text.match(regex) || [];

    for (const m of matches) {

      const n =
        normalizeMoney(m);

      if (
        n !== null &&
        n >= 1000 &&
        n <= 10000000
      ) {
        values.push(n);
      }
    }
  }

  return [
    ...new Set(values)
  ];
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

function findValueNearPhrase(
  text,
  phrase
) {

  const lower =
    text.toLowerCase();

  const needle =
    phrase.toLowerCase();

  let start = 0;

  const found = [];

  while (true) {

    const index =
      lower.indexOf(
        needle,
        start
      );

    if (index === -1)
      break;

    const context =
      text.slice(
        Math.max(
          0,
          index - 100
        ),
        index +
        needle.length +
        180
      );

    const values =
      extractMoney(context);

    /*
      Strict:
      exact semantic context should
      contain only one plausible amount.
    */

    if (values.length === 1) {

      found.push({
        value: values[0],
        context:
          context
            .replace(/\s+/g, " ")
            .trim()
      });
    }

    start =
      index +
      needle.length;
  }

  if (!found.length)
    return null;

  /*
    Most frequently repeated value wins.
  */

  const counts =
    new Map();

  for (const row of found) {

    counts.set(
      row.value,
      (counts.get(row.value) || 0) + 1
    );
  }

  const winner =
    [...counts.entries()]
      .sort(
        (a, b) =>
          b[1] - a[1]
      )[0];

  return {
    value: winner[0],

    contexts:
      found
        .filter(
          x =>
            x.value === winner[0]
        )
        .map(
          x =>
            x.context
        )
        .slice(0, 3)
  };
}

function extractFields(text) {

  const result = {};
  const evidence = {};

  for (const config of FIELDS) {

    result[
      config.field
    ] = null;

    for (
      const phrase
      of config.phrases
    ) {

      const found =
        findValueNearPhrase(
          text,
          phrase
        );

      if (!found)
        continue;

      result[
        config.field
      ] =
        found.value;

      evidence[
        config.field
      ] = {
        phrase,
        contexts:
          found.contexts
      };

      break;
    }
  }

  return {
    fields: result,
    evidence
  };
}

async function searchSerper(
  collegeName,
  domain
) {

  const query =
    `"${collegeName}" ("B.Tech fees" OR "fee structure" OR "courses fees") 2026 site:${domain}`;

  const response =
    await axios.post(
      "https://google.serper.dev/search",

      {
        q: query,
        num: 5
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

  const organic =
    response.data?.organic ||
    [];

  return organic
    .map(
      x => ({
        title: x.title,
        link: x.link,
        snippet:
          x.snippet || ""
      })
    )
    .filter(
      x =>
        x.link &&
        x.link.includes(domain)
    );
}

async function fetchPage(url) {

  const response =
    await axios.get(
      url,
      {
        timeout: TIMEOUT,

        maxRedirects: 5,

        headers: {
          "User-Agent":
            "Mozilla/5.0"
        }
      }
    );

  return pageText(
    String(
      response.data || ""
    )
  );
}

function numericCount(fields) {

  return Object.values(
    fields
  ).filter(
    x =>
      typeof x === "number"
  ).length;
}

async function researchCollege(
  college
) {

  console.log("");
  console.log(
    `Researching: ${college.college_name}`
  );

  for (const source of DOMAINS) {

    console.log(
      `  → ${source.domain}`
    );

    let searchResults;

    try {

      searchResults =
        await searchSerper(
          college.college_name,
          source.domain
        );

    } catch (error) {

      console.log(
        `    search failed: ${error.message}`
      );

      continue;
    }

    for (
      const result
      of searchResults.slice(0, 3)
    ) {

      try {

        const text =
          await fetchPage(
            result.link
          );

        const extracted =
          extractFields(
            text
          );

        const count =
          numericCount(
            extracted.fields
          );

        console.log(
          `    ${result.link}`
        );

        console.log(
          `    numeric fields: ${count}`
        );

        if (count === 0)
          continue;

        /*
          Important semantic safety:
          Never derive missing fields here.
          Only source-explicit values.
        */

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
            extracted.fields
              .tuition_fee_per_semester,

          academic_fee_per_semester:
            extracted.fields
              .academic_fee_per_semester,

          hostel_fee_per_semester:
            extracted.fields
              .hostel_fee_per_semester,

          mess_fee_per_semester:
            extracted.fields
              .mess_fee_per_semester,

          first_semester_fee:
            extracted.fields
              .first_semester_fee,

          first_year_fee:
            extracted.fields
              .first_year_fee,

          annual_academic_fee:
            extracted.fields
              .annual_academic_fee,

          annual_total_fee:
            extracted.fields
              .annual_total_fee,

          total_course_fee:
            extracted.fields
              .total_course_fee,

          one_time_fee:
            null,

          security_deposit:
            null,

          source_kind:
            source.source_kind,

          source_label:
            `${source.domain} B.Tech fee fallback`,

          source_url:
            result.link,

          source_priority:
            source.priority,

          confidence_score:
            count >= 4
              ? 82
              : count >= 2
                ? 75
                : 68,

          verification_status:
            "review_recommended",

          extraction_method:
            "automatic",

          notes:
            `Official source did not provide clear numeric fee data. Automatic fallback to ${source.domain}. Explicit semantic fee values extracted=${count}. No missing value was mathematically guessed.`,

          _evidence:
            extracted.evidence
        };

      } catch (error) {

        console.log(
          `    page failed: ${error.message}`
        );
      }
    }
  }

  return null;
}

if (!fs.existsSync(INPUT)) {

  throw new Error(
    `${INPUT} not found. Run collect-all-remaining-fees.js first.`
  );
}

const input =
  JSON.parse(
    cleanJson(
      fs.readFileSync(
        INPUT,
        "utf8"
      )
    )
  );

/*
  Review JSON produced by previous collector
  stores original college inside .college.
*/

const colleges =
  input
    .map(
      row =>
        row.college || row
    )
    .filter(
      row =>
        row?.college_id &&
        row?.college_name
    )
    .slice(0, 25);

console.log(
  "========================================"
);

console.log(
  "SECONDARY SOURCE FALLBACK"
);

console.log(
  "========================================"
);

console.log(
  "Colleges:",
  colleges.length
);

const ready = [];
const stillReview = [];

for (
  let i = 0;
  i < colleges.length;
  i++
) {

  const college =
    colleges[i];

  console.log("");
  console.log(
    `[${i + 1}/${colleges.length}] ${college.college_name}`
  );

  try {

    const record =
      await researchCollege(
        college
      );

    if (record) {

      /*
        Remove internal evidence before
        strict importer.
      */

      const evidence =
        record._evidence;

      delete record._evidence;

      ready.push(record);

      console.log(
        "  ✅ fallback data found"
      );

    } else {

      stillReview.push(
        college
      );

      console.log(
        "  ❌ no safe secondary data"
      );
    }

  } catch (error) {

    stillReview.push({
      ...college,
      error:
        error.message
    });

    console.log(
      `  ERROR: ${error.message}`
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
  STILL_REVIEW,
  JSON.stringify(
    stillReview,
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
  "FALLBACK COMPLETE"
);

console.log(
  "========================================"
);

console.log(
  "Secondary ready:",
  ready.length
);

console.log(
  "Still review:",
  stillReview.length
);

console.log(
  "Ready file:",
  READY
);

console.log(
  "Review file:",
  STILL_REVIEW
);




