import fs from "node:fs";
import path from "node:path";

import {
  fetchAndIngestReddit,
  ingestReviews,
  getReviewEnrichmentStatus,
} from "./reviewEnrichmentService.js";


const SOURCE_ORDER = [
  "Google Places",
  "Shiksha",
  "Collegedunia",
  "Careers360",
  "Quora",
  "GetMyUni",
  "Zollege",
  "CollegeBatch",
  "CollegeDekho",
];


const MAX_SINGLE_SOURCE_SHARE =
  0.60;


function normalizeSource(
  value
) {
  return String(
    value || ""
  )
    .trim()
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-|-$/g,
      ""
    );
}


function loadImportFile(
  source,
  collegeId
) {
  const sourceKey =
    normalizeSource(
      source
    );

  const candidates = [
    path.resolve(
      process.cwd(),
      "review-imports",
      sourceKey,
      `${collegeId}.json`
    ),

    path.resolve(
      process.cwd(),
      "review-imports",
      `${sourceKey}-${collegeId}.json`
    ),
  ];


  for (
    const file
    of candidates
  ) {
    if (
      !fs.existsSync(
        file
      )
    ) {
      continue;
    }


    const parsed =
      JSON.parse(
        fs.readFileSync(
          file,
          "utf8"
        )
      );


    if (
      Array.isArray(
        parsed
      )
    ) {
      return {
        file,
        reviews:
          parsed,
      };
    }


    if (
      Array.isArray(
        parsed?.reviews
      )
    ) {
      return {
        file,
        reviews:
          parsed.reviews,
      };
    }
  }


  return {
    file: null,
    reviews: [],
  };
}


function sourceShare(
  status,
  source
) {
  const standard =
    status?.standard ||
    {};

  const total =
    Number(
      standard
        .usableReviews ||
      0
    );


  if (
    total <= 0
  ) {
    return 0;
  }


  const row =
    (
      standard
        .sourceDistribution ||
      []
    )
      .find(
        item =>
          String(
            item?.source ||
            ""
          )
            .toLowerCase() ===
          String(
            source ||
            ""
          )
            .toLowerCase()
      );


  return (
    Number(
      row?.count ||
      0
    ) /
    total
  );
}


function maximumNewRowsForSource(
  status,
  source,
  hardLimit
) {
  const standard =
    status?.standard ||
    {};

  const currentTotal =
    Number(
      standard
        .usableReviews ||
      0
    );


  const currentSource =
    Number(
      (
        standard
          .sourceDistribution ||
        []
      )
        .find(
          row =>
            String(
              row?.source ||
              ""
            )
              .toLowerCase() ===
            String(
              source ||
              ""
            )
              .toLowerCase()
        )
        ?.count ||
      0
    );


  let allowed =
    hardLimit;


  /*
  |--------------------------------------------------------------------------
  | Solve:
  |
  | (currentSource + x)
  | ------------------- <= 0.60
  | (currentTotal + x)
  |--------------------------------------------------------------------------
  */

  for (
    let x = 0;
    x <= hardLimit;
    x++
  ) {
    const denominator =
      currentTotal +
      x;

    if (
      denominator === 0
    ) {
      continue;
    }


    const share =
      (
        currentSource +
        x
      ) /
      denominator;


    if (
      share >
      MAX_SINGLE_SOURCE_SHARE
    ) {
      allowed =
        Math.max(
          0,
          x - 1
        );

      break;
    }
  }


  return allowed;
}


export async function
fillCollegeReviewsTo100({
  collegeId,
}) {
  const report = {
    collegeId,

    startedAt:
      new Date()
        .toISOString(),

    steps: [],
  };


  let status =
    await getReviewEnrichmentStatus(
      collegeId
    );


  report.before =
    status;


  /*
  |--------------------------------------------------------------------------
  | 1. REDDIT ONLINE FETCH
  |--------------------------------------------------------------------------
  */

  if (
    !status
      ?.standard
      ?.ready
  ) {
    const need =
      Number(
        status
          ?.standard
          ?.reviewsNeeded ||
        0
      );


    if (
      need > 0
    ) {
      const allowedReddit =
        maximumNewRowsForSource(
          status,
          "Reddit",
          Math.min(
            40,
            need
          )
        );


      if (
        allowedReddit >
        0
      ) {
        try {
          const redditResult =
            await fetchAndIngestReddit({
              collegeId,
              maxReviews:
                allowedReddit,
            });


          report.steps.push({
            source:
              "Reddit",

            mode:
              "online-api",

            requested:
              allowedReddit,

            result:
              redditResult,
          });
        }
        catch (
          error
        ) {
          report.steps.push({
            source:
              "Reddit",

            mode:
              "online-api",

            error:
              error?.message ||
              String(
                error
              ),
          });
        }


        status =
          await getReviewEnrichmentStatus(
            collegeId
          );
      }
    }
  }


  /*
  |--------------------------------------------------------------------------
  | 2. AUTHORIZED MULTI-SOURCE IMPORTS
  |--------------------------------------------------------------------------
  */

  for (
    const source
    of SOURCE_ORDER
  ) {
    if (
      status
        ?.standard
        ?.ready
    ) {
      break;
    }


    const need =
      Number(
        status
          ?.standard
          ?.reviewsNeeded ||
        0
      );


    if (
      need <= 0
    ) {
      break;
    }


    const input =
      loadImportFile(
        source,
        collegeId
      );


    if (
      input.reviews.length ===
      0
    ) {
      report.steps.push({
        source,

        mode:
          "authorized-import",

        status:
          "NO_IMPORT_FILE",
      });

      continue;
    }


    const allowed =
      maximumNewRowsForSource(
        status,
        source,
        Math.min(
          need,
          input
            .reviews
            .length
        )
      );


    if (
      allowed <= 0
    ) {
      report.steps.push({
        source,

        mode:
          "authorized-import",

        status:
          "SOURCE_SHARE_LIMIT",
      });

      continue;
    }


    const batch =
      input
        .reviews
        .slice(
          0,
          allowed
        );


    const result =
      await ingestReviews({
        collegeId,

        source,

        sourceType:
          source ===
          "Quora"
            ? "discussion"
            : "rating_platform",

        baseUrl:
          null,

        reviews:
          batch,
      });


    report.steps.push({
      source,

      mode:
        "authorized-import",

      file:
        input.file,

      requested:
        batch.length,

      result,
    });


    status =
      await getReviewEnrichmentStatus(
        collegeId
      );
  }


  /*
  |--------------------------------------------------------------------------
  | FINAL
  |--------------------------------------------------------------------------
  */

  report.after =
    await getReviewEnrichmentStatus(
      collegeId
    );


  report.completed =
    Boolean(
      report.after
        ?.standard
        ?.ready
    );


  report.finishedAt =
    new Date()
      .toISOString();


  return report;
}
