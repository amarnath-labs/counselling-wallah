import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";

const INPUT = "./all-colleges-fee-source-family.json";

const OUTPUT_ALL =
  "./all-colleges-official-domain-discovery.json";

const OUTPUT_READY =
  "./all-colleges-official-domain-ready.json";

const OUTPUT_DISCOVERY =
  "./all-colleges-official-domain-unresolved.json";

const TARGET_YEAR = 2026;

const TIMEOUT = 15000;

/*
|--------------------------------------------------------------------------
| SAFETY POLICY
|--------------------------------------------------------------------------
|
| 1. Never fabricate an official website.
| 2. Never mark a guessed domain as verified merely because it responds.
| 3. Only promote a URL when college identity is strongly supported.
| 4. Fee source itself is NOT automatically trusted just because website
|    is official.
| 5. Database is never modified by this script.
|
*/

function clean(value) {
  return String(value ?? "")
    .replace(/\uFEFF/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalize(value) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\bengg\b/g, "engineering")
    .replace(/\btech\b/g, "technology")
    .replace(/\binstt\b/g, "institute")
    .replace(/\binst\b/g, "institute")
    .replace(/\buniv\b/g, "university")
    .replace(/\bmgmt\b/g, "management")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(value) {
  const stop = new Set([
    "of",
    "and",
    "the",
    "for",
    "in",
    "at",
    "a",
    "an",
    "college",
    "institute",
    "institution",
    "engineering",
    "technology",
    "management",
    "university"
  ]);

  return normalize(value)
    .split(" ")
    .filter(
      token =>
        token.length >= 3 &&
        !stop.has(token)
    );
}

function identityScore(collegeName, pageText) {
  const collegeTokens =
    [...new Set(tokens(collegeName))];

  if (!collegeTokens.length) {
    return 0;
  }

  const page =
    normalize(pageText);

  let matched = 0;

  for (const token of collegeTokens) {
    if (
      page.includes(
        ` ${token} `
      ) ||
      page.startsWith(
        `${token} `
      ) ||
      page.endsWith(
        ` ${token}`
      ) ||
      page === token
    ) {
      matched++;
    }
  }

  return matched /
    collegeTokens.length;
}

function isOfficialLookingDomain(url) {
  try {
    const hostname =
      new URL(url)
        .hostname
        .toLowerCase()
        .replace(/^www\./, "");

    const blocked = [
      "shiksha.com",
      "collegedunia.com",
      "collegepravesh.com",
      "careers360.com",
      "getmyuni.com",
      "collegedekho.com",
      "educationdunia.com",
      "justdial.com",
      "facebook.com",
      "instagram.com",
      "linkedin.com",
      "youtube.com",
      "wikipedia.org"
    ];

    return !blocked.some(
      domain =>
        hostname === domain ||
        hostname.endsWith(
          `.${domain}`
        )
    );
  } catch {
    return false;
  }
}

function normalizeUrl(url) {
  if (!url) return null;

  let value =
    clean(url);

  if (!/^https?:\/\//i.test(value)) {
    value =
      `https://${value}`;
  }

  try {
    const parsed =
      new URL(value);

    parsed.hash = "";

    return parsed.toString();
  } catch {
    return null;
  }
}

async function fetchPage(url) {
  const response =
    await axios.get(
      url,
      {
        timeout: TIMEOUT,

        maxRedirects: 6,

        validateStatus:
          status =>
            status >= 200 &&
            status < 400,

        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/142 Safari/537.36",

          Accept:
            "text/html,application/xhtml+xml,application/pdf;q=0.9,*/*;q=0.8"
        }
      }
    );

  const contentType =
    String(
      response.headers[
        "content-type"
      ] || ""
    ).toLowerCase();

  const finalUrl =
    response.request
      ?.res
      ?.responseUrl ||
    url;

  return {
    data:
      response.data,

    contentType,

    finalUrl
  };
}

function htmlText(html) {
  const $ =
    cheerio.load(
      String(html ?? "")
    );

  $("script,style,noscript")
    .remove();

  return clean(
    [
      $("title").text(),
      $("h1").text(),
      $("h2").text(),
      $("body").text()
    ].join(" ")
  );
}

function extractCandidateLinks(
  html,
  baseUrl
) {
  const $ =
    cheerio.load(
      String(html ?? "")
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

      if (!href) return;

      const context =
        `${label} ${href}`
          .toLowerCase();

      if (
        !/fee|fees|admission|prospectus|brochure|b\.?tech|btech|academic/.test(
          context
        )
      ) {
        return;
      }

      try {
        const absolute =
          new URL(
            href,
            baseUrl
          ).toString();

        links.push({
          url:
            absolute,

          label
        });
      } catch {
        // ignore invalid link
      }
    }
  );

  const seen =
    new Set();

  return links.filter(
    item => {
      if (
        seen.has(item.url)
      ) {
        return false;
      }

      seen.add(item.url);

      return true;
    }
  );
}

function currentYearSignals(text) {
  const value =
    String(text ?? "");

  const patterns = [
    /2026\s*[-–]\s*27/i,
    /2026\s*[-–]\s*2027/i,
    /session\s*2026/i,
    /academic\s*(?:year|session)?\s*2026/i,
    /\b2026\b/i
  ];

  return patterns.some(
    pattern =>
      pattern.test(value)
  );
}

function feeSignals(text) {
  const lower =
    String(text ?? "")
      .toLowerCase();

  return {
    fee:
      /\bfees?\b/.test(lower),

    btech:
      /b\.?\s*tech|btech/.test(
        lower
      ),

    tuition:
      /tuition/.test(lower),

    hostel:
      /hostel/.test(lower),

    total:
      /total\s+(?:fee|fees)|grand\s+total/.test(
        lower
      )
  };
}

async function inspectOfficialWebsite(
  collegeName,
  website
) {
  const normalized =
    normalizeUrl(website);

  if (!normalized) {
    return {
      verified: false,
      reason:
        "Invalid official website URL."
    };
  }

  if (
    !isOfficialLookingDomain(
      normalized
    )
  ) {
    return {
      verified: false,
      reason:
        "Third-party/blocked domain."
    };
  }

  try {
    const fetched =
      await fetchPage(
        normalized
      );

    if (
      fetched.contentType.includes(
        "application/pdf"
      )
    ) {
      return {
        verified: false,
        reason:
          "Website candidate resolved directly to PDF; identity verification deferred."
      };
    }

    const text =
      htmlText(
        fetched.data
      );

    const score =
      identityScore(
        collegeName,
        text
      );

    /*
    Strong threshold because this script
    must not silently accept unrelated sites.
    */

    const verified =
      score >= 0.55;

    return {
      verified,

      identity_score:
        Number(
          score.toFixed(3)
        ),

      final_url:
        fetched.finalUrl,

      page_text:
        text,

      html:
        String(
          fetched.data ?? ""
        ),

      reason:
        verified
          ? "College identity matched official website candidate."
          : "College identity could not be verified strongly enough."
    };

  } catch (error) {
    return {
      verified: false,

      reason:
        error.message
    };
  }
}

async function inspectFeeCandidates(
  collegeName,
  websiteResult
) {
  if (
    !websiteResult.verified
  ) {
    return [];
  }

  const candidates =
    extractCandidateLinks(
      websiteResult.html,
      websiteResult.final_url
    );

  const results = [];

  /*
  Avoid hammering sites.
  Inspect strongest first batch only.
  */

  for (
    const candidate
    of candidates.slice(0, 20)
  ) {
    const url =
      candidate.url;

    if (
      !isOfficialLookingDomain(
        url
      )
    ) {
      continue;
    }

    const lower =
      `${candidate.label} ${url}`
        .toLowerCase();

    let score = 0;

    if (/fee|fees/.test(lower))
      score += 4;

    if (/btech|b\.tech/.test(lower))
      score += 3;

    if (/2026|2026-27|2026_27/.test(lower))
      score += 4;

    if (/prospectus/.test(lower))
      score += 2;

    if (/admission/.test(lower))
      score += 1;

    if (/\.pdf(?:$|\?)/i.test(url))
      score += 2;

    results.push({
      url,
      label:
        candidate.label,
      discovery_score:
        score
    });
  }

  return results.sort(
    (a, b) =>
      b.discovery_score -
      a.discovery_score
  );
}

async function verifyHtmlFeeCandidate(
  collegeName,
  candidate
) {
  try {
    const fetched =
      await fetchPage(
        candidate.url
      );

    if (
      fetched.contentType.includes(
        "application/pdf"
      ) ||
      /\.pdf(?:$|\?)/i.test(
        candidate.url
      )
    ) {
      /*
      PDF requires PDF parser in the
      extraction stage. Keep it as an
      official candidate instead of
      pretending its contents were verified.
      */

      return {
        ...candidate,

        final_url:
          fetched.finalUrl,

        source_type:
          "official_pdf",

        current_year_verified:
          /2026|2026[-_]?27/i.test(
            candidate.url +
            " " +
            candidate.label
          ),

        btech_fee_verified:
          false,

        verification_status:
          "PDF_REQUIRES_EXTRACTION"
      };
    }

    const text =
      htmlText(
        fetched.data
      );

    const identity =
      identityScore(
        collegeName,
        text
      );

    const signals =
      feeSignals(text);

    const year =
      currentYearSignals(
        text
      );

    const currentAndClear =
      identity >= 0.45 &&
      year &&
      signals.fee &&
      signals.btech;

    return {
      ...candidate,

      final_url:
        fetched.finalUrl,

      source_type:
        "official_html",

      identity_score:
        Number(
          identity.toFixed(3)
        ),

      current_year_verified:
        year,

      btech_fee_verified:
        signals.fee &&
        signals.btech,

      signals,

      verification_status:
        currentAndClear
          ? "CURRENT_OFFICIAL_BTECH_FEE_CANDIDATE"
          : "OFFICIAL_CANDIDATE_REVIEW"
    };

  } catch (error) {
    return {
      ...candidate,

      verification_status:
        "FETCH_FAILED",

      error:
        error.message
    };
  }
}

async function processCollege(
  row,
  index,
  total
) {
  console.log(
    `[${index + 1}/${total}] ${row.college_name}`
  );

  /*
  ----------------------------------------------------------
  Already known official URLs
  ----------------------------------------------------------
  */

  const storedWebsite =
    row.official_website ||
    null;

  const storedSource =
    row.fee_source_url ||
    row.source_url ||
    null;

  /*
  If an existing fee source exists, preserve it.
  We don't throw known information away.
  */

  if (storedSource) {
    console.log(
      " -> STORED_SOURCE_PRESENT"
    );

    return {
      ...row,

      discovery_status:
        "STORED_SOURCE_PRESENT",

      discovered_official_website:
        storedWebsite,

      discovered_fee_source:
        storedSource,

      database_modified:
        false
    };
  }

  /*
  ----------------------------------------------------------
  No stored website
  ----------------------------------------------------------
  */

  if (!storedWebsite) {
    console.log(
      " -> DISCOVERY_REQUIRED"
    );

    return {
      ...row,

      discovery_status:
        "DISCOVERY_REQUIRED",

      discovery_reason:
        "No official website is stored. API-free mode will not guess an official domain.",

      discovered_official_website:
        null,

      discovered_fee_source:
        null,

      database_modified:
        false
    };
  }

  /*
  ----------------------------------------------------------
  Verify stored official website
  ----------------------------------------------------------
  */

  const website =
    await inspectOfficialWebsite(
      row.college_name,
      storedWebsite
    );

  if (!website.verified) {
    console.log(
      " -> WEBSITE_REVIEW_REQUIRED"
    );

    return {
      ...row,

      discovery_status:
        "WEBSITE_REVIEW_REQUIRED",

      discovery_reason:
        website.reason,

      website_verification:
        {
          identity_score:
            website.identity_score ??
            null,

          reason:
            website.reason
        },

      discovered_official_website:
        null,

      discovered_fee_source:
        null,

      database_modified:
        false
    };
  }

  console.log(
    ` -> OFFICIAL WEBSITE VERIFIED (${website.identity_score})`
  );

  const candidates =
    await inspectFeeCandidates(
      row.college_name,
      website
    );

  if (!candidates.length) {
    console.log(
      " -> FEE_SOURCE_DISCOVERY_REQUIRED"
    );

    return {
      ...row,

      discovery_status:
        "FEE_SOURCE_DISCOVERY_REQUIRED",

      discovered_official_website:
        website.final_url,

      discovered_fee_source:
        null,

      fee_candidates:
        [],

      database_modified:
        false
    };
  }

  const verifiedCandidates = [];

  for (
    const candidate
    of candidates.slice(0, 8)
  ) {
    const checked =
      await verifyHtmlFeeCandidate(
        row.college_name,
        candidate
      );

    verifiedCandidates.push(
      checked
    );
  }

  const currentHtml =
    verifiedCandidates.find(
      item =>
        item.verification_status ===
        "CURRENT_OFFICIAL_BTECH_FEE_CANDIDATE"
    );

  const pdf =
    verifiedCandidates.find(
      item =>
        item.verification_status ===
        "PDF_REQUIRES_EXTRACTION"
    );

  if (currentHtml) {
    console.log(
      " -> CURRENT OFFICIAL B.TECH FEE SOURCE FOUND"
    );

    return {
      ...row,

      academic_year:
        TARGET_YEAR,

      official_website:
        website.final_url,

      source_url:
        currentHtml.final_url,

      fee_source_url:
        currentHtml.final_url,

      source_type:
        "official_html",

      queue_status:
        "SOURCE_READY",

      discovery_status:
        "CURRENT_OFFICIAL_SOURCE_FOUND",

      discovered_official_website:
        website.final_url,

      discovered_fee_source:
        currentHtml.final_url,

      fee_candidates:
        verifiedCandidates,

      database_modified:
        false
    };
  }

  if (pdf) {
    console.log(
      " -> OFFICIAL PDF CANDIDATE FOUND"
    );

    return {
      ...row,

      official_website:
        website.final_url,

      source_url:
        pdf.final_url,

      fee_source_url:
        pdf.final_url,

      source_type:
        "official_pdf",

      /*
      Don't declare SOURCE_READY until
      PDF extraction confirms year + B.Tech.
      */

      queue_status:
        "SOURCE_EXTRACTION_REQUIRED",

      discovery_status:
        "OFFICIAL_PDF_CANDIDATE_FOUND",

      discovered_official_website:
        website.final_url,

      discovered_fee_source:
        pdf.final_url,

      fee_candidates:
        verifiedCandidates,

      database_modified:
        false
    };
  }

  console.log(
    " -> OFFICIAL SITE FOUND; FEE SOURCE REVIEW"
  );

  return {
    ...row,

    official_website:
      website.final_url,

    discovery_status:
      "FEE_SOURCE_REVIEW_REQUIRED",

    discovered_official_website:
      website.final_url,

    discovered_fee_source:
      null,

    fee_candidates:
      verifiedCandidates,

    database_modified:
      false
  };
}

async function main() {
  console.log("");
  console.log(
    "======================================="
  );
  console.log(
    "ALL COLLEGES OFFICIAL DOMAIN DISCOVERY"
  );
  console.log(
    "MODE: API-FREE"
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

  if (!Array.isArray(rows)) {
    throw new Error(
      "Input JSON must be an array."
    );
  }

  console.log(
    "Input:",
    INPUT
  );

  console.log(
    "Colleges:",
    rows.length
  );

  console.log(
    "Target year:",
    TARGET_YEAR
  );

  console.log("");

  const results = [];

  for (
    let i = 0;
    i < rows.length;
    i++
  ) {
    try {
      const result =
        await processCollege(
          rows[i],
          i,
          rows.length
        );

      results.push(
        result
      );

    } catch (error) {
      console.log(
        " -> ERROR:",
        error.message
      );

      results.push({
        ...rows[i],

        discovery_status:
          "ERROR",

        discovery_reason:
          error.message,

        database_modified:
          false
      });
    }
  }

  const ready =
    results.filter(
      row =>
        [
          "CURRENT_OFFICIAL_SOURCE_FOUND",
          "OFFICIAL_PDF_CANDIDATE_FOUND",
          "STORED_SOURCE_PRESENT"
        ].includes(
          row.discovery_status
        )
    );

  const unresolved =
    results.filter(
      row =>
        ![
          "CURRENT_OFFICIAL_SOURCE_FOUND",
          "OFFICIAL_PDF_CANDIDATE_FOUND",
          "STORED_SOURCE_PRESENT"
        ].includes(
          row.discovery_status
        )
    );

  await fs.writeFile(
    OUTPUT_ALL,
    JSON.stringify(
      results,
      null,
      2
    ),
    "utf8"
  );

  await fs.writeFile(
    OUTPUT_READY,
    JSON.stringify(
      ready,
      null,
      2
    ),
    "utf8"
  );

  await fs.writeFile(
    OUTPUT_DISCOVERY,
    JSON.stringify(
      unresolved,
      null,
      2
    ),
    "utf8"
  );

  const counts = {};

  for (const row of results) {
    const key =
      row.discovery_status ||
      "UNKNOWN";

    counts[key] =
      (counts[key] || 0) +
      1;
  }

  console.log("");
  console.log(
    "======================================="
  );
  console.log(
    "DISCOVERY SUMMARY"
  );
  console.log(
    "======================================="
  );

  console.table(
    Object.entries(
      counts
    )
      .map(
        ([status, count]) => ({
          status,
          count
        })
      )
      .sort(
        (a, b) =>
          b.count -
          a.count
      )
  );

  console.log(
    ""
  );

  console.log(
    "TOTAL:",
    results.length
  );

  console.log(
    "SOURCE/CANDIDATE READY:",
    ready.length
  );

  console.log(
    "UNRESOLVED:",
    unresolved.length
  );

  console.log("");

  console.log(
    "Saved:",
    OUTPUT_ALL
  );

  console.log(
    "Saved:",
    OUTPUT_READY
  );

  console.log(
    "Saved:",
    OUTPUT_DISCOVERY
  );

  console.log("");

  console.log(
    "POLICY:"
  );

  console.log(
    "- No guessed domain is treated as official."
  );

  console.log(
    "- Third-party sources are not promoted."
  );

  console.log(
    "- PDF candidates require extraction before normalization."
  );

  console.log(
    "- Current official HTML + B.Tech + 2026 => SOURCE_READY."
  );

  console.log(
    "- Hostel missing => remains NULL."
  );

  console.log(
    "- FW fee missing => FW remains HOLD."
  );

  console.log("");

  console.log(
    "DATABASE HAS NOT BEEN MODIFIED."
  );
}

main().catch(
  error => {
    console.error(
      ""
    );

    console.error(
      "FAILED:",
      error.message
    );

    process.exitCode = 1;
  }
);