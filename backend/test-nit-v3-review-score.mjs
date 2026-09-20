import { pool } from "./src/db/pool.js";

import {
  getCollegeReviewScore
} from "./src/services/reviewScoringService.js";

const tests = [
  {
    collegeId:
      "national-institute-of-technology-rourkela",
    branch:
      "Computer Science and Engineering"
  },
  {
    collegeId:
      "national-institute-of-technology-silchar",
    branch:
      "Computer Science and Engineering"
  }
];

for (const test of tests) {

  console.log("\n========================================");
  console.log(test.collegeId);
  console.log(test.branch);
  console.log("========================================");

  const counts = await pool.query(
    `
    SELECT

      (
        SELECT COUNT(*)::int
        FROM college_review_items cri
        WHERE cri.college_id = $1
      ) AS review_items,

      (
        SELECT COUNT(*)::int
        FROM review_aspect_sentiments ras
        JOIN college_review_items cri
          ON cri.id = ras.review_item_id
        WHERE cri.college_id = $1
      ) AS aspect_sentiments,

      (
        SELECT COUNT(*)::int
        FROM review_aggregate_snapshots ras
        WHERE ras.college_id = $1
      ) AS aggregate_snapshots
    `,
    [
      test.collegeId
    ]
  );

  console.log(
    "\nTABLE COUNTS:"
  );

  console.table(
    counts.rows
  );

  const score =
    await getCollegeReviewScore(
      pool,
      {
        collegeId:
          test.collegeId,

        branch:
          test.branch
      }
    );

  console.log(
    "\nV3 REVIEW SCORE:"
  );

  console.dir(
    score,
    {
      depth: null,
      colors: true
    }
  );
}

await pool.end();
