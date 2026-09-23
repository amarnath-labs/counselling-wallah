import "dotenv/config";
import fs from "node:fs";
import { pool } from "./src/db/pool.js";

const MIN_REVIEWS = 50;
const MIN_SOURCES = 3;
const MAX_SOURCE_SHARE = 0.60;

function canonicalSourceFamily(name) {
  const s =
    String(name || "")
      .trim()
      .toLowerCase();

  if (!s) return "Unknown";

  if (s.includes("shiksha"))
    return "Shiksha";

  if (s.includes("collegedunia"))
    return "Collegedunia";

  if (s.includes("careers360"))
    return "Careers360";

  if (s.includes("quora"))
    return "Quora";

  if (s.includes("getmyuni"))
    return "GetMyUni";

  if (s.includes("collegebatch"))
    return "CollegeBatch";

  if (s.includes("collegedekho"))
    return "CollegeDekho";

  if (s.includes("zollege"))
    return "Zollege";

  if (s.includes("universitykart"))
    return "UniversityKart";

  if (s.includes("collegesearch"))
    return "CollegeSearch";

  if (s.includes("findmycollege"))
    return "FindMyCollege";

  if (s.includes("glassdoor"))
    return "Glassdoor";

  if (s.includes("justdial"))
    return "JustDial";

  if (s.includes("worldorgs"))
    return "WorldOrgs";

  if (s.includes("jeecounselling"))
    return "JEECounselling.in";

  return String(name).trim();
}

function usableReview(row) {
  if (row.duplicate_of != null) {
    return false;
  }

  const status =
    String(
      row.duplicate_status || ""
    )
      .trim()
      .toLowerCase();

  if (
    status === "duplicate" ||
    status === "confirmed_duplicate" ||
    status === "probable_duplicate"
  ) {
    return false;
  }

  return true;
}

try {
  console.log(
    "\n========================================"
  );
  console.log(
    "TRUMARG 50 REVIEWS PER COLLEGE AUDIT"
  );
  console.log(
    "========================================\n"
  );

  const result =
    await pool.query(`
      SELECT
        c.id AS college_id,
        c.name AS college_name,

        cri.id AS review_item_id,
        cri.source_id,
        cri.duplicate_status,
        cri.duplicate_of,

        rs.name AS source_name

      FROM colleges c

      LEFT JOIN college_review_items cri
        ON cri.college_id =
           c.id

      LEFT JOIN review_sources rs
        ON rs.id =
           cri.source_id

      ORDER BY
        c.name,
        cri.id
    `);

  const collegeMap =
    new Map();

  for (
    const row
    of result.rows
  ) {
    if (
      !collegeMap.has(
        row.college_id
      )
    ) {
      collegeMap.set(
        row.college_id,
        {
          college_id:
            row.college_id,
          college:
            row.college_name,
          reviews:
            new Map(),
        }
      );
    }

    if (
      row.review_item_id ==
      null
    ) {
      continue;
    }

    if (
      !usableReview(
        row
      )
    ) {
      continue;
    }

    const college =
      collegeMap.get(
        row.college_id
      );

    if (
      !college.reviews.has(
        String(
          row.review_item_id
        )
      )
    ) {
      college.reviews.set(
        String(
          row.review_item_id
        ),
        {
          id:
            row.review_item_id,

          source:
            canonicalSourceFamily(
              row.source_name
            ),
        }
      );
    }
  }

  const rows = [];

  for (
    const college
    of collegeMap.values()
  ) {
    const reviews =
      [...college.reviews.values()];

    const sourceCounts =
      new Map();

    for (
      const review
      of reviews
    ) {
      const source =
        review.source ||
        "Unknown";

      sourceCounts.set(
        source,
        (
          sourceCounts.get(
            source
          ) ||
          0
        ) + 1
      );
    }

    const knownSources =
      [...sourceCounts.entries()]
        .filter(
          ([name]) =>
            name !==
            "Unknown"
        );

    let dominantSource =
      null;

    let dominantCount =
      0;

    for (
      const [
        name,
        count,
      ]
      of knownSources
    ) {
      if (
        count >
        dominantCount
      ) {
        dominantSource =
          name;

        dominantCount =
          count;
      }
    }

    const reviewCount =
      reviews.length;

    const sourceCount =
      knownSources.length;

    const maxSourceShare =
      reviewCount > 0
        ? dominantCount /
          reviewCount
        : null;

    const ready =
      reviewCount >=
        MIN_REVIEWS &&
      sourceCount >=
        MIN_SOURCES &&
      maxSourceShare !==
        null &&
      maxSourceShare <=
        MAX_SOURCE_SHARE;

    rows.push({
      college_id:
        college.college_id,

      college:
        college.college,

      reviews:
        reviewCount,

      reviews_needed:
        Math.max(
          0,
          MIN_REVIEWS -
            reviewCount
        ),

      canonical_sources:
        sourceCount,

      sources_needed:
        Math.max(
          0,
          MIN_SOURCES -
            sourceCount
        ),

      dominant_source:
        dominantSource,

      dominant_source_reviews:
        dominantCount,

      max_source_share:
        maxSourceShare ===
        null
          ? null
          : Number(
              (
                maxSourceShare *
                100
              ).toFixed(
                1
              )
            ),

      ready,

      source_distribution:
        Object.fromEntries(
          [...sourceCounts.entries()]
            .sort(
              (a, b) =>
                b[1] -
                a[1]
            )
        ),
    });
  }

  rows.sort(
    (a, b) => {
      if (
        b.reviews_needed !==
        a.reviews_needed
      ) {
        return (
          b.reviews_needed -
          a.reviews_needed
        );
      }

      return (
        String(
          a.college
        ).localeCompare(
          String(
            b.college
          )
        )
      );
    }
  );

  const ready =
    rows.filter(
      row =>
        row.ready
    );

  const incomplete =
    rows.filter(
      row =>
        !row.ready
    );

  console.log(
    "Total colleges:",
    rows.length
  );

  console.log(
    "50+ review ready:",
    ready.length
  );

  console.log(
    "Need enrichment:",
    incomplete.length
  );

  console.log(
    "\n===== COLLEGE REVIEW STATUS ====="
  );

  console.table(
    rows.map(
      row => ({
        college:
          row.college,

        reviews:
          `${row.reviews}/50`,

        need:
          row.reviews_needed,

        sources:
          row.canonical_sources,

        max_source:
          row.max_source_share ==
          null
            ? "N/A"
            : `${row.max_source_share}%`,

        ready:
          row.ready,
      })
    )
  );

  fs.writeFileSync(
    "./review-50-per-college-targets.json",
    JSON.stringify(
      {
        generatedAt:
          new Date()
            .toISOString(),

        standard: {
          minimumReviews:
            MIN_REVIEWS,

          minimumCanonicalSources:
            MIN_SOURCES,

          maximumSingleSourceShare:
            MAX_SOURCE_SHARE,
        },

        totalColleges:
          rows.length,

        readyColleges:
          ready.length,

        incompleteColleges:
          incomplete.length,

        colleges:
          rows,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(
    "\nSaved:"
  );

  console.log(
    "./review-50-per-college-targets.json"
  );
}
finally {
  await pool.end();
}
