import { pool } from "./src/db/pool.js";

const collegeId =
  "manit-bhopal";

const requestedBranch =
  "Computer Science and Engineering";

const aspects = [
  "placements",
  "faculty",
  "academics",
  "internships",
];


const normalize = value =>
  String(
    value ?? ""
  )
    .trim()
    .toLowerCase();


const canonical = value =>
  normalize(
    value
  )
    .replace(
      /&/g,
      "and"
    )
    .replace(
      /[^a-z0-9]+/g,
      "_"
    )
    .replace(
      /^_+|_+$/g,
      ""
    );


const requestedCanonical =
  canonical(
    requestedBranch
  );


try {
  const result =
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
        aspects,
      ]
    );


  const rows =
    result.rows.map(
      row => {
        const target =
          canonical(
            row.target_branch
          );


        const item =
          canonical(
            row.branch_text
          );


        let expectedOutcome;


        if (
          target &&
          target ===
            requestedCanonical
        ) {
          expectedOutcome =
            "USE_TARGET_BRANCH";
        }
        else if (
          target &&
          target !==
            requestedCanonical
        ) {
          expectedOutcome =
            "DROP_DIFFERENT_TARGET";
        }
        else if (
          row.branch_verified &&
          item &&
          item ===
            requestedCanonical
        ) {
          expectedOutcome =
            "USE_VERIFIED_ITEM_BRANCH";
        }
        else if (
          row.branch_verified &&
          item &&
          item !==
            requestedCanonical
        ) {
          expectedOutcome =
            "DROP_DIFFERENT_ITEM_BRANCH";
        }
        else if (
          !target &&
          !item
        ) {
          expectedOutcome =
            "DROP_NO_BRANCH_EVIDENCE";
        }
        else {
          expectedOutcome =
            "REVIEW_MANUALLY";
        }


        return {
          aspect:
            row.aspect,

          reviewId:
            row.review_item_id,

          targetBranch:
            row.target_branch,

          itemBranch:
            row.branch_text,

          branchVerified:
            row.branch_verified,

          source:
            row.source_name,

          expectedOutcome,
        };
      }
    );


  console.table(
    rows
  );


  const counts = {};


  for (
    const row
    of rows
  ) {
    counts[
      row.expectedOutcome
    ] =
      (
        counts[
          row.expectedOutcome
        ] ??
        0
      ) +
      1;
  }


  console.log(
    "\n========================================"
  );

  console.log(
    "EXPECTED NULL-SCOPE OUTCOMES"
  );

  console.log(
    "========================================"
  );

  console.table(
    Object.entries(
      counts
    ).map(
      (
        [
          outcome,
          count,
        ]
      ) => ({
        outcome,
        count,
      })
    )
  );
}
finally {
  await pool.end();
}
