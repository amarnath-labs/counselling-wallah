import { pool } from "./src/db/pool.js";

import {
  getCollegeReviewIntelligenceV3,
} from "./src/services/reviewScoringServiceV3.js";


const REQUIRED = [
  "placements",
  "faculty",
  "hostel",
  "infrastructure",
  "academics",
  "campus_life",
  "administration",
  "internships",
  "value_for_money",
  "location",
];


const top = await pool.query(`
  SELECT
    college_id,
    COUNT(*)::int AS reviews
  FROM college_review_items
  WHERE college_id IS NOT NULL
  GROUP BY college_id
  ORDER BY reviews DESC
  LIMIT 100
`);


const summary = [];


for (
  const row
  of top.rows
) {
  const result =
    await getCollegeReviewIntelligenceV3(
      pool,
      {
        collegeId:
          row.college_id,

        branch:
          null,
      }
    );


  let ready50 = 0;
  let ready25 = 0;
  let ready15 = 0;


  for (
    const aspect
    of REQUIRED
  ) {
    const data =
      result
        ?.aspects
        ?.[aspect];


    const reviews =
      Number(
        data
          ?.effectiveReviewCount ??
        0
      );


    const sources =
      Number(
        data
          ?.effectiveSourceCount ??
        0
      );


    const share =
      Number(
        data
          ?.maxSourceShare
      );


    const diversityPass =
      sources >= 3 &&
      Number.isFinite(
        share
      ) &&
      share <= 0.600001;


    if (
      reviews >= 50 &&
      diversityPass
    ) {
      ready50++;
    }


    if (
      reviews >= 25 &&
      diversityPass
    ) {
      ready25++;
    }


    if (
      reviews >= 15 &&
      diversityPass
    ) {
      ready15++;
    }
  }


  summary.push({
    collegeId:
      row.college_id,

    rawReviews:
      row.reviews,

    usableReviews:
      result
        ?.evidence
        ?.usableReviews ??
      0,

    sources:
      result
        ?.evidence
        ?.independentSources ??
      0,

    aspects50:
      ready50,

    aspects25:
      ready25,

    aspects15:
      ready15,
  });
}


console.table(
  summary
);


function countFull(
  key
) {
  return summary.filter(
    row =>
      row[key] === 10
  ).length;
}


console.log(
  "\n========================================"
);

console.log(
  "TOP 100 COVERAGE SUMMARY"
);

console.log(
  "========================================"
);

console.log(
  "50 reviews/aspect:",
  countFull(
    "aspects50"
  ),
  "/",
  summary.length
);

console.log(
  "25 reviews/aspect:",
  countFull(
    "aspects25"
  ),
  "/",
  summary.length
);

console.log(
  "15 reviews/aspect:",
  countFull(
    "aspects15"
  ),
  "/",
  summary.length
);


await pool.end();
