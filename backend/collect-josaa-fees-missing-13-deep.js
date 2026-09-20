import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";
import dotenv from "dotenv";
import { createRequire } from "module";

dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require("pdf-parse");

const INPUT =
  "./josaa-fee-missing-13-targets.json";

const READY =
  "./josaa-fee-missing-13-deep-ready.json";

const REVIEW =
  "./josaa-fee-missing-13-deep-review.json";

const REPORT =
  "./josaa-fee-missing-13-deep-report.json";

const TIMEOUT = 30000;

const SERPER_API_KEY =
  process.env.SERPER_API_KEY;

if (!SERPER_API_KEY) {
  console.error(
    "ERROR: SERPER_API_KEY missing from .env"
  );
  process.exit(1);
}

function sleep(ms) {
  return new Promise(resolve =>
    setTimeout(resolve, ms)
  );
}

function cleanText(value = "") {
  return String(value)
    .replace(/\u00a0/g, " ")
    .replace(/[₹]/g, " Rs ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value = "") {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getDomain(url) {
  try {
    return new URL(url).hostname
      .replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function getRootDomain(url) {
  const domain = getDomain(url);

  if (!domain) {
    return "";
  }

  return domain;
}

function isSameOfficialDomain(
  candidateUrl,
  officialUrl
) {
  const candidate =
    getDomain(candidateUrl);

  const official =
    getDomain(officialUrl);

  if (!candidate || !official) {
    return false;
  }

  return (
    candidate === official ||
    candidate.endsWith("." + official) ||
    official.endsWith("." + candidate)
  );
}

async function googleSearch(query) {

  const response =
    await axios.post(
      "https://google.serper.dev/search",
      {
        q: query,
        num: 10
      },
      {
        timeout: TIMEOUT,
        headers: {
          "X-API-KEY": SERPER_API_KEY,
          "Content-Type":
            "application/json"
        }
      }
    );

  return response.data?.organic || [];
}

function inferAcademicYear(text) {

  const t = cleanText(text);

  let match =
    t.match(/\b2026\s*[-–\/]\s*27\b/i);

  if (match) {
    return {
      academic_year: 2026,
      academic_session: "2026-27"
    };
  }

  match =
    t.match(/\b2025\s*[-–\/]\s*26\b/i);

  if (match) {
    return {
      academic_year: 2025,
      academic_session: "2025-26"
    };
  }

  match =
    t.match(/\b2024\s*[-–\/]\s*25\b/i);

  if (match) {
    return {
      academic_year: 2024,
      academic_session: "2024-25"
    };
  }

  match =
    t.match(/\b2023\s*[-–\/]\s*24\b/i);

  if (match) {
    return {
      academic_year: 2023,
      academic_session: "2023-24"
    };
  }

  return {
    academic_year: null,
    academic_session: null
  };
}

function moneyNumber(raw) {

  if (!raw) {
    return null;
  }

  let value =
    String(raw)
      .replace(/,/g, "")
      .replace(/[₹]/g, "")
      .replace(/\s/g, "")
      .trim();

  const number =
    Number(value);

  if (
    !Number.isFinite(number) ||
    number < 500 ||
    number > 10000000
  ) {
    return null;
  }

  return Math.round(number);
}

function firstMoneyMatch(
  text,
  patterns
) {

  for (const pattern of patterns) {

    const match =
      text.match(pattern);

    if (match?.[1]) {

      const value =
        moneyNumber(match[1]);

      if (value) {
        return value;
      }
    }
  }

  return null;
}

function extractFees(text) {

  const t =
    cleanText(text);

  const tuition =
    firstMoneyMatch(
      t,
      [
        /tuition\s*fee[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{2,})/i,
        /tuition[^0-9₹]{0,60}₹?\s*([0-9][0-9,]{2,})/i
      ]
    );

  const academic =
    firstMoneyMatch(
      t,
      [
        /academic\s*fee[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{2,})/i,
        /institute\s*fee[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{2,})/i
      ]
    );

  const hostel =
    firstMoneyMatch(
      t,
      [
        /hostel\s*(?:seat\s*)?fee[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{2,})/i,
        /hostel\s*charges?[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{2,})/i
      ]
    );

  const mess =
    firstMoneyMatch(
      t,
      [
        /mess\s*(?:fee|charges?)[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{2,})/i
      ]
    );

  const security =
    firstMoneyMatch(
      t,
      [
        /(?:security|caution)\s*(?:deposit|money|fee)?[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{2,})/i
      ]
    );

  const oneTime =
    firstMoneyMatch(
      t,
      [
        /one[\s-]*time\s*(?:fee|charges?)?[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{2,})/i,
        /admission\s*fee[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{2,})/i
      ]
    );

  const firstSemester =
    firstMoneyMatch(
      t,
      [
        /first\s*semester[^0-9₹]{0,120}(?:total|fee|amount)?[^0-9₹]{0,40}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{3,})/i,
        /semester\s*[- ]?1[^0-9₹]{0,120}(?:total|fee|amount)?[^0-9₹]{0,40}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{3,})/i
      ]
    );

  const annualAcademic =
    firstMoneyMatch(
      t,
      [
        /annual\s*academic\s*fee[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{3,})/i,
        /annual\s*tuition\s*fee[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{3,})/i
      ]
    );

  const annualTotal =
    firstMoneyMatch(
      t,
      [
        /annual\s*(?:total\s*)?fee[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{3,})/i,
        /fee\s*per\s*annum[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{3,})/i
      ]
    );

  const totalCourse =
    firstMoneyMatch(
      t,
      [
        /total\s*(?:course|programme|program)\s*fee[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{4,})/i,
        /total\s*fee[^0-9₹]{0,80}(?:rs\.?|inr|₹)?\s*([0-9][0-9,]{4,})/i
      ]
    );

  const fields = {
    tuition_fee_per_semester:
      tuition,

    academic_fee_per_semester:
      academic,

    hostel_fee_per_semester:
      hostel,

    mess_fee_per_semester:
      mess,

    first_semester_fee:
      firstSemester,

    annual_academic_fee:
      annualAcademic,

    annual_total_fee:
      annualTotal,

    total_course_fee:
      totalCourse,

    one_time_fee:
      oneTime,

    security_deposit:
      security
  };

  const numericCount =
    Object.values(fields)
      .filter(
        value =>
          Number.isFinite(value) &&
          value > 0
      )
      .length;

  return {
    ...fields,
    numeric_count:
      numericCount
  };
}

function hasFeeLanguage(text) {

  const t =
    normalize(text);

  return (
    t.includes("fee structure") ||
    t.includes("tuition fee") ||
    t.includes("academic fee") ||
    t.includes("semester fee") ||
    t.includes("hostel fee") ||
    t.includes("admission fee") ||
    t.includes("course fee")
  );
}

function pageLooksRelevant(
  college,
  url,
  title,
  text
) {

  if (
    !isSameOfficialDomain(
      url,
      college.official_website ||
      college.website
    )
  ) {
    return false;
  }

  const combined =
    normalize(
      `${url} ${title} ${text}`
    );

  /*
    Extra centre protection for NIELIT.
  */

  if (
    normalize(college.college_name)
      .includes(
        "national institute of electronics"
      )
  ) {

    const locations = [
      "ajmer",
      "gorakhpur",
      "imphal",
      "kohima",
      "patna",
      "ropar",
      "srinagar"
    ];

    const expected =
      locations.find(
        city =>
          normalize(
            college.college_name
          ).includes(city)
      );

    if (
      expected &&
      !combined.includes(expected) &&
      !normalize(url)
        .includes(expected)
    ) {
      return false;
    }
  }

  /*
    Prevent IIIT vs IIT mismatch.
  */

  const collegeNorm =
    normalize(college.college_name);

  if (
    collegeNorm.includes(
      "indian institute of information technology"
    ) ||
    collegeNorm.includes("iiit")
  ) {

    if (
      combined.includes(
        "indian institute of technology"
      ) &&
      !combined.includes(
        "indian institute of information technology"
      ) &&
      !combined.includes("iiit")
    ) {
      return false;
    }
  }

  return true;
}

async function fetchPage(url) {

  try {

    const response =
      await axios.get(
        url,
        {
          timeout: TIMEOUT,
          maxRedirects: 5,
          responseType:
            "arraybuffer",

          headers: {
            "User-Agent":
              "Mozilla/5.0 CounsellingWallahFeeResearch/1.0",
            "Accept":
              "text/html,application/xhtml+xml,application/pdf,*/*"
          },

          validateStatus:
            status =>
              status >= 200 &&
              status < 400
        }
      );

    const contentType =
      String(
        response.headers[
          "content-type"
        ] || ""
      ).toLowerCase();

    const buffer =
      Buffer.from(
        response.data
      );

    const looksPdf =
      contentType.includes(
        "application/pdf"
      ) ||
      /\.pdf(?:$|\?)/i.test(url);

    if (looksPdf) {

      try {

        const parsed =
          await pdfParse(buffer);

        return {
          ok: true,
          type: "pdf",
          title: "",
          text:
            cleanText(
              parsed.text || ""
            )
        };

      } catch (error) {

        return {
          ok: false,
          reason:
            "PDF_PARSE_FAILED",
          error:
            error.message
        };
      }
    }

    const html =
      buffer.toString("utf8");

    const $ =
      cheerio.load(html);

    $("script,style,noscript,svg")
      .remove();

    const title =
      cleanText(
        $("title").text()
      );

    const text =
      cleanText(
        $("body").text()
      );

    return {
      ok: true,
      type: "html",
      title,
      text
    };

  } catch (error) {

    return {
      ok: false,
      reason:
        "FETCH_FAILED",
      error:
        error.message
    };
  }
}

function scoreCandidate(
  result,
  page,
  college
) {

  let score = 0;

  const url =
    result.link || "";

  const combined =
    `${result.title || ""} ${
      result.snippet || ""
    } ${
      page?.text || ""
    }`;

  if (
    isSameOfficialDomain(
      url,
      college.official_website ||
      college.website
    )
  ) {
    score += 50;
  }

  if (
    /\.pdf(?:$|\?)/i.test(url) ||
    page?.type === "pdf"
  ) {
    score += 15;
  }

  if (
    hasFeeLanguage(combined)
  ) {
    score += 20;
  }

  const year =
    inferAcademicYear(
      combined
    );

  if (
    year.academic_year === 2026
  ) {
    score += 20;
  }
  else if (
    year.academic_year === 2025
  ) {
    score += 15;
  }
  else if (
    year.academic_year === 2024
  ) {
    score += 8;
  }

  const fees =
    extractFees(combined);

  score +=
    Math.min(
      fees.numeric_count * 8,
      32
    );

  return score;
}

async function researchCollege(
  college
) {

  const official =
    college.official_website ||
    college.website;

  if (!official) {

    return {
      found: null,
      attempts: [],
      reason:
        "NO_OFFICIAL_WEBSITE"
    };
  }

  const domain =
    getRootDomain(
      official
    );

  const name =
    college.college_name ||
    college.josaa_name;

  const queries = [

    `site:${domain} "${name}" "fee structure" B.Tech 2026`,

    `site:${domain} "${name}" "fee structure" 2026-27`,

    `site:${domain} "${name}" "B.Tech" fees PDF`,

    `site:${domain} "fee structure" "B.Tech" PDF`,

    `site:${domain} "B.Tech" "2025-26" fee`,

    `site:${domain} "B.Tech" "2024-25" fee`,

    `site:${domain} admission fee B.Tech`,

    `site:${domain} tuition fee hostel mess B.Tech`
  ];

  const candidates =
    new Map();

  const attempts = [];

  for (const query of queries) {

    console.log(
      `      search: ${query}`
    );

    try {

      const results =
        await googleSearch(query);

      attempts.push({
        query,
        results:
          results.length
      });

      for (
        const result
        of results.slice(0, 8)
      ) {

        const url =
          result.link;

        if (!url) {
          continue;
        }

        if (
          !isSameOfficialDomain(
            url,
            official
          )
        ) {
          continue;
        }

        if (
          !candidates.has(url)
        ) {
          candidates.set(
            url,
            result
          );
        }
      }

    } catch (error) {

      attempts.push({
        query,
        error:
          error.message
      });
    }

    await sleep(250);
  }

  console.log(
    `      official candidates: ${
      candidates.size
    }`
  );

  let best = null;

  for (
    const [url, result]
    of candidates.entries()
  ) {

    console.log(
      `      inspect: ${url}`
    );

    const page =
      await fetchPage(url);

    if (!page.ok) {
      continue;
    }

    if (
      !pageLooksRelevant(
        college,
        url,
        page.title,
        page.text
      )
    ) {
      continue;
    }

    const combined =
      cleanText(
        `${
          result.title || ""
        } ${
          result.snippet || ""
        } ${
          page.text || ""
        }`
      );

    if (
      !hasFeeLanguage(
        combined
      )
    ) {
      continue;
    }

    const fees =
      extractFees(
        combined
      );

    if (
      fees.numeric_count === 0
    ) {
      continue;
    }

    const year =
      inferAcademicYear(
        combined
      );

    const score =
      scoreCandidate(
        result,
        page,
        college
      );

    const candidate = {
      url,
      title:
        page.title ||
        result.title ||
        "",
      page_type:
        page.type,
      academic_year:
        year.academic_year,
      academic_session:
        year.academic_session,
      fees,
      score
    };

    if (
      !best ||
      candidate.score >
        best.score
    ) {
      best = candidate;
    }

    await sleep(150);
  }

  if (!best) {

    return {
      found: null,
      attempts,
      reason:
        "NO_OFFICIAL_FEE_PAGE_WITH_CLEAR_NUMERIC_DATA"
    };
  }

  /*
    We accept official records, but
    current-year confidence is higher.
  */

  let confidence = 88;

  if (
    best.academic_year === 2026
  ) {
    confidence = 98;
  }
  else if (
    best.academic_year === 2025
  ) {
    confidence = 95;
  }
  else if (
    best.academic_year === 2024
  ) {
    confidence = 90;
  }

  return {
    found: {
      ...best,
      confidence_score:
        confidence
    },
    attempts,
    reason: null
  };
}

function buildRecord(
  college,
  research
) {

  const found =
    research.found;

  const actualYear =
    found.academic_year;

  const currentEnough =
    actualYear === 2026 ||
    actualYear === 2025;

  return {

    college_id:
      college.college_id,

    college_name:
      college.college_name,

    josaa_name:
      college.josaa_name,

    program:
      college.program ||
      "B.Tech",

    /*
      IMPORTANT:
      actual source year,
      not forced 2026.
    */

    academic_year:
      actualYear,

    academic_session:
      found.academic_session,

    tuition_fee_per_semester:
      found.fees
        .tuition_fee_per_semester,

    academic_fee_per_semester:
      found.fees
        .academic_fee_per_semester,

    hostel_fee_per_semester:
      found.fees
        .hostel_fee_per_semester,

    mess_fee_per_semester:
      found.fees
        .mess_fee_per_semester,

    first_semester_fee:
      found.fees
        .first_semester_fee,

    annual_academic_fee:
      found.fees
        .annual_academic_fee,

    annual_total_fee:
      found.fees
        .annual_total_fee,

    total_course_fee:
      found.fees
        .total_course_fee,

    one_time_fee:
      found.fees
        .one_time_fee,

    security_deposit:
      found.fees
        .security_deposit,

    source_kind:
      "official",

    source_url:
      found.url,

    source_title:
      found.title,

    source_type:
      found.page_type,

    numeric_count:
      found.fees.numeric_count,

    confidence_score:
      found.confidence_score,

    verification_status:
      currentEnough
        ? "high_confidence"
        : "official_older_year",

    audit_safe:
      true,

    extraction_method:
      "official_domain_deep_search",

    collected_at:
      new Date().toISOString()
  };
}

async function main() {

  const colleges =
    JSON.parse(fs.readFileSync(INPUT, "utf8").replace(/^\uFEFF/, ""));

  console.log("");
  console.log(
    "========================================"
  );
  console.log(
    "JOSAA MISSING 13 - OFFICIAL DEEP SEARCH"
  );
  console.log(
    "========================================"
  );
  console.log(
    "Colleges:",
    colleges.length
  );
  console.log("");

  const ready = [];
  const review = [];
  const report = [];

  for (
    let i = 0;
    i < colleges.length;
    i++
  ) {

    const college =
      colleges[i];

    console.log(
      `[${i + 1}/${
        colleges.length
      }] ${
        college.college_name
      }`
    );

    console.log(
      `    official: ${
        college.official_website ||
        college.website
      }`
    );

    try {

      const research =
        await researchCollege(
          college
        );

      if (research.found) {

        const record =
          buildRecord(
            college,
            research
          );

        ready.push(record);

        report.push({
          college_name:
            college.college_name,
          status:
            "FOUND",
          academic_year:
            record.academic_year,
          academic_session:
            record.academic_session,
          numeric_count:
            record.numeric_count,
          source_url:
            record.source_url,
          confidence_score:
            record.confidence_score
        });

        console.log(
          `    ✅ official fee found | year=${
            record.academic_session ||
            "unknown"
          } | numeric=${
            record.numeric_count
          }`
        );

        console.log(
          `    ${record.source_url}`
        );

      } else {

        const failure = {
          ...college,

          failure_reason:
            research.reason,

          attempts:
            research.attempts
        };

        review.push(
          failure
        );

        report.push({
          college_name:
            college.college_name,
          status:
            "REVIEW",
          reason:
            research.reason
        });

        console.log(
          "    ❌ no sufficiently clear official fee page"
        );
      }

    } catch (error) {

      review.push({
        ...college,
        failure_reason:
          "UNHANDLED_ERROR",
        error:
          error.message
      });

      report.push({
        college_name:
          college.college_name,
        status:
          "ERROR",
        error:
          error.message
      });

      console.log(
        `    ❌ ERROR: ${
          error.message
        }`
      );
    }

    console.log("");

    await sleep(400);
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

  console.log(
    "========================================"
  );
  console.log(
    "DEEP SEARCH COMPLETE"
  );
  console.log(
    "========================================"
  );

  console.log(
    "Ready :",
    ready.length
  );

  console.log(
    "Review:",
    review.length
  );

  console.log(
    "Report:",
    report.length
  );

  console.log("");
  console.log(
    "Saved:",
    READY
  );

  console.log(
    "Review:",
    REVIEW
  );

  console.log(
    "Report:",
    REPORT
  );
}

main().catch(error => {

  console.error(
    "FATAL:",
    error
  );

  process.exit(1);
});
