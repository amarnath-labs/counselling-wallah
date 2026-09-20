import fs from "node:fs/promises";
import axios from "axios";
import * as cheerio from "cheerio";

const INPUT = "./safe-26-fee-evidence-pack.json";

const OUT_READY =
  "./safe-fee-child-links-ready.json";

const OUT_REVIEW =
  "./safe-fee-child-links-review.json";

const OUT_ALL =
  "./safe-fee-child-links-all.json";

const TIMEOUT = 25000;

function clean(v) {
  return String(v || "")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(href, base) {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

function scoreLink({
  text,
  href,
  context
}) {
  const s =
    `${text} ${href} ${context}`
      .toLowerCase();

  let score = 0;
  const reasons = [];

  if (
    /b\.?\s*tech|btech|undergraduate|\bug\b/.test(s)
  ) {
    score += 30;
    reasons.push("BTECH_OR_UG");
  }

  if (
    /fee structure|fee details|institute fee|academic fee|fees/.test(s)
  ) {
    score += 35;
    reasons.push("FEE");
  }

  if (
    /2026\s*[-–]\s*(?:27|2027)|2026-2027|ay\s*2026/.test(s)
  ) {
    score += 35;
    reasons.push("CURRENT_2026_27");
  }

  if (
    /new entrant|new student|first year|joining/.test(s)
  ) {
    score += 15;
    reasons.push("NEW_ENTRANT");
  }

  if (
    /hostel|mess|boarding|lodging/.test(s)
  ) {
    score += 12;
    reasons.push("HOSTEL_OR_MESS");
  }

  if (
    /\.pdf(?:$|\?)/i.test(href)
  ) {
    score += 10;
    reasons.push("PDF");
  }

  // Negative programme signals
  if (
    /\bph\.?d\b|doctoral/.test(s) &&
    !/b\.?\s*tech|btech/.test(s)
  ) {
    score -= 80;
    reasons.push("OTHER_PROGRAMME_PHD");
  }

  if (
    /\bm\.?\s*tech\b|mtech/.test(s) &&
    !/b\.?\s*tech|btech/.test(s)
  ) {
    score -= 60;
    reasons.push("OTHER_PROGRAMME_MTECH");
  }

  if (
    /\bmba\b|\bm\.sc\b|\bmsc\b/.test(s) &&
    !/b\.?\s*tech|btech|\bug\b/.test(s)
  ) {
    score -= 40;
    reasons.push("OTHER_PROGRAMME");
  }

  if (
    /2025\s*[-–]\s*26|2024\s*[-–]\s*25|2023\s*[-–]\s*24/.test(s) &&
    !/2026\s*[-–]\s*(?:27|2027)/.test(s)
  ) {
    score -= 25;
    reasons.push("OLD_YEAR");
  }

  return {
    score,
    reasons
  };
}

async function fetchPage(url) {
  return axios.get(url, {
    timeout: TIMEOUT,
    maxRedirects: 8,

    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CounsellingWallahFeeResearch/1.0)",
      Accept:
        "text/html,application/xhtml+xml"
    },

    validateStatus(status) {
      return status >= 200 && status < 400;
    }
  });
}

async function main() {
  console.log(
    "\n======================================="
  );
  console.log(
    "B.TECH FEE CHILD-LINK RESOLVER"
  );
  console.log(
    "=======================================\n"
  );

  const input =
    JSON.parse(
      (
        await fs.readFile(INPUT, "utf8")
      ).replace(/^\uFEFF/, "")
    );

  const all = [];
  const ready = [];
  const review = [];

  for (
    let i = 0;
    i < input.length;
    i++
  ) {
    const college = input[i];

    console.log(
      `[${i + 1}/${input.length}] ${college.college_name}`
    );

    try {
      const response =
        await fetchPage(
          college.source_url
        );

      const contentType =
        String(
          response.headers["content-type"] || ""
        ).toLowerCase();

      if (
        contentType.includes(
          "application/pdf"
        )
      ) {
        review.push({
          college_id:
            college.college_id,

          college_name:
            college.college_name,

          parent_url:
            college.source_url,

          status:
            "PARENT_IS_PDF"
        });

        console.log(
          " -> parent PDF"
        );

        continue;
      }

      const $ =
        cheerio.load(
          String(response.data || "")
        );

      const candidates = [];

      $("a[href]").each(
        (index, element) => {
          const hrefRaw =
            $(element).attr("href");

          if (!hrefRaw) return;

          if (
            /^(javascript:|mailto:|tel:|#)/i.test(
              hrefRaw
            )
          ) {
            return;
          }

          const href =
            absoluteUrl(
              hrefRaw,
              college.source_url
            );

          if (!href) return;

          const anchorText =
            clean(
              $(element).text()
            );

          const parentText =
            clean(
              $(element)
                .parent()
                .text()
            );

          const rowText =
            clean(
              $(element)
                .closest("tr")
                .text()
            );

          const context =
            clean(
              `${rowText} ${parentText}`
            );

          const evaluation =
            scoreLink({
              text:
                anchorText,
              href,
              context
            });

          if (
            evaluation.score >= 20
          ) {
            candidates.push({
              anchor_text:
                anchorText,

              url:
                href,

              context,

              score:
                evaluation.score,

              reasons:
                evaluation.reasons
            });
          }
        }
      );

      // Deduplicate same URL, keep best score.
      const byUrl =
        new Map();

      for (
        const candidate of candidates
      ) {
        const previous =
          byUrl.get(
            candidate.url
          );

        if (
          !previous ||
          candidate.score >
            previous.score
        ) {
          byUrl.set(
            candidate.url,
            candidate
          );
        }
      }

      const sorted =
        [...byUrl.values()]
          .sort(
            (a, b) =>
              b.score - a.score
          );

      /*
       * Keep multiple links because academic fee and
       * hostel/mess may legitimately be separate.
       */
      const selected =
        sorted.filter(
          x => x.score >= 60
        );

      const record = {
        college_id:
          college.college_id,

        college_name:
          college.college_name,

        source_family:
          college.source_family,

        parent_url:
          college.source_url,

        candidates:
          sorted,

        selected_links:
          selected,

        selected_count:
          selected.length
      };

      all.push(record);

      if (
        selected.length > 0
      ) {
        ready.push(record);

        console.log(
          ` -> READY: ${selected.length} child link(s)`
        );

        for (
          const link of
          selected.slice(0, 5)
        ) {
          console.log(
            `    ${link.score} | ${link.anchor_text || "(no text)"}`
          );

          console.log(
            `    ${link.url}`
          );
        }
      } else {
        review.push({
          ...record,
          status:
            "NO_STRONG_CHILD_LINK"
        });

        console.log(
          " -> REVIEW: no strong child link"
        );
      }
    } catch (error) {
      review.push({
        college_id:
          college.college_id,

        college_name:
          college.college_name,

        parent_url:
          college.source_url,

        status:
          "FETCH_FAILED",

        error:
          error.message
      });

      console.log(
        ` -> FAILED: ${error.message}`
      );
    }

    await new Promise(
      resolve =>
        setTimeout(
          resolve,
          300
        )
    );
  }

  await fs.writeFile(
    OUT_ALL,
    JSON.stringify(
      all,
      null,
      2
    )
  );

  await fs.writeFile(
    OUT_READY,
    JSON.stringify(
      ready,
      null,
      2
    )
  );

  await fs.writeFile(
    OUT_REVIEW,
    JSON.stringify(
      review,
      null,
      2
    )
  );

  console.log(
    "\n======================================="
  );

  console.log(
    "CHILD-LINK SUMMARY"
  );

  console.log(
    "=======================================\n"
  );

  console.log(
    "Input colleges :",
    input.length
  );

  console.log(
    "Child-link ready:",
    ready.length
  );

  console.log(
    "Review/failed   :",
    review.length
  );

  console.log(
    "\nDATABASE HAS NOT BEEN MODIFIED."
  );
}

main().catch(error => {
  console.error(
    "FATAL:",
    error
  );

  process.exitCode = 1;
});