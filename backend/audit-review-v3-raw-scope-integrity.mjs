import { pool } from "./src/db/pool.js";

const colleges = [
  "manit-bhopal",
  "national-institute-of-technology-warangal",
  "sardar-vallabhbhai-national-institute-of-technology-surat",
];

const branchSensitive = [
  "placements",
  "faculty",
  "academics",
  "internships",
];

try {
  for (const collegeId of colleges) {
    console.log(
      "\n========================================================"
    );

    console.log(collegeId);

    console.log(
      "========================================================"
    );


    const result =
      await pool.query(
        `
        SELECT
          ras.aspect,

          COALESCE(
            NULLIF(
              TRIM(
                LOWER(
                  ras.scope
                )
              ),
              ''
            ),
            'NULL'
          ) AS raw_scope,

          COUNT(*)::int AS rows,

          COUNT(
            DISTINCT ras.review_item_id
          )::int AS distinct_reviews,

          COUNT(*) FILTER (
            WHERE cri.branch_verified = TRUE
          )::int AS branch_verified_rows,

          COUNT(*) FILTER (
            WHERE NULLIF(
              TRIM(
                COALESCE(
                  cri.branch_text,
                  ''
                )
              ),
              ''
            ) IS NOT NULL
          )::int AS rows_with_branch_text,

          COUNT(*) FILTER (
            WHERE NULLIF(
              TRIM(
                COALESCE(
                  ras.target_branch,
                  ''
                )
              ),
              ''
            ) IS NOT NULL
          )::int AS rows_with_target_branch,

          COUNT(*) FILTER (
            WHERE cri.course_verified = TRUE
          )::int AS course_verified_rows,

          COUNT(*) FILTER (
            WHERE NULLIF(
              TRIM(
                COALESCE(
                  cri.programme_level,
                  ''
                )
              ),
              ''
            ) IS NOT NULL
          )::int AS rows_with_programme

        FROM review_aspect_sentiments ras

        INNER JOIN college_review_items cri
          ON cri.id =
             ras.review_item_id

        WHERE
          cri.college_id = $1
          AND ras.aspect = ANY($2::text[])

        GROUP BY
          ras.aspect,
          COALESCE(
            NULLIF(
              TRIM(
                LOWER(
                  ras.scope
                )
              ),
              ''
            ),
            'NULL'
          )

        ORDER BY
          ras.aspect,
          raw_scope
        `,
        [
          collegeId,
          branchSensitive,
        ]
      );


    console.table(
      result.rows
    );


    const suspicious =
      await pool.query(
        `
        SELECT
          ras.aspect,

          ras.review_item_id,

          ras.scope AS raw_scope,

          ras.target_branch,

          cri.branch_text,

          cri.branch_verified,

          cri.programme_level,

          cri.course,

          cri.course_verified,

          rs.name AS source_name

        FROM review_aspect_sentiments ras

        INNER JOIN college_review_items cri
          ON cri.id =
             ras.review_item_id

        LEFT JOIN review_sources rs
          ON rs.id =
             cri.source_id

        WHERE
          cri.college_id = $1

          AND ras.aspect =
              ANY($2::text[])

          AND (
            ras.scope IS NULL
            OR TRIM(
              ras.scope
            ) = ''
          )

        ORDER BY
          ras.aspect,
          ras.review_item_id
        `,
        [
          collegeId,
          branchSensitive,
        ]
      );


    console.log(
      "\nNULL-SCOPE BRANCH-SENSITIVE ROWS"
    );


    console.table(
      suspicious.rows
    );
  }
}
finally {
  await pool.end();
}
