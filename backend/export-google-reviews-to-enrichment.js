import fs from "node:fs";
import path from "node:path";
import { pool } from "./src/db/pool.js";

const OUTPUT_ROOT =
  path.resolve(
    process.cwd(),
    "review-imports",
    "google-places"
  );

async function main() {
  const result =
    await pool.query(`
      SELECT
        cr.college_id,
        c.name AS college_name,
        cr.external_review_id,
        cr.author_name,
        cr.rating,
        cr.review_text,
        cr.language,
        cr.source_url
      FROM college_reviews cr
      JOIN colleges c
        ON c.id = cr.college_id
      WHERE
        cr.source = 'GOOGLE_PLACES'
        AND cr.review_text IS NOT NULL
        AND LENGTH(TRIM(cr.review_text)) > 0
        AND (
          LOWER(COALESCE(c.type,'')) IN (
            'iit',
            'nit',
            'iiit',
            'gfti',
            'gftis'
          )
          OR LOWER(c.name)
            LIKE 'indian institute of technology%'
          OR LOWER(c.name)
            LIKE 'national institute of technology%'
          OR LOWER(c.name)
            LIKE '%indian institute of information technology%'
        )
      ORDER BY
        c.name,
        cr.id
    `);

  fs.mkdirSync(
    OUTPUT_ROOT,
    {
      recursive: true,
    }
  );

  const grouped =
    new Map();

  for (const row of result.rows) {
    if (
      !grouped.has(
        row.college_id
      )
    ) {
      grouped.set(
        row.college_id,
        {
          collegeName:
            row.college_name,
          reviews: [],
        }
      );
    }

    grouped
      .get(row.college_id)
      .reviews
      .push({
        sourceReviewId:
          row.external_review_id ||
          null,

        sourceUrl:
          row.source_url ||
          null,

        author:
          row.author_name ||
          null,

        reviewDate:
          null,

        text:
          row.review_text,

        rating:
          row.rating === null
            ? null
            : Number(
                row.rating
              ),

        ratingScale:
          5,

        branch:
          null,

        branchVerified:
          false,

        provenance:
          "Google Places API",

        raw: {
          language:
            row.language ||
            null,
        },
      });
  }

  let totalReviews = 0;

  for (
    const [
      collegeId,
      data,
    ] of grouped
  ) {
    const file =
      path.join(
        OUTPUT_ROOT,
        `${collegeId}.json`
      );

    fs.writeFileSync(
      file,
      JSON.stringify(
        data.reviews,
        null,
        2
      ),
      "utf8"
    );

    totalReviews +=
      data.reviews.length;

    console.log(
      `${data.collegeName}: ${data.reviews.length}`
    );
  }

  console.log("");
  console.log(
    "=============================================="
  );
  console.log(
    "GOOGLE -> REVIEW ENRICHMENT EXPORT COMPLETE"
  );
  console.log(
    "=============================================="
  );
  console.log(
    "JoSAA colleges:",
    grouped.size
  );
  console.log(
    "Google review rows:",
    totalReviews
  );
  console.log(
    "Output:",
    OUTPUT_ROOT
  );
}

main()
  .catch(
    error => {
      console.error(
        "FAILED:",
        error
      );
      process.exitCode = 1;
    }
  )
  .finally(
    async () => {
      await pool.end();
    }
  );
