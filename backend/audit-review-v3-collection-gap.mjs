import { pool } from "./src/db/pool.js";

import {
  getCollegeReviewIntelligenceV3,
} from "./src/services/reviewScoringServiceV3.js";


const ASPECTS = [
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


const colleges =
  await pool.query(`
    SELECT
      college_id,
      COUNT(*)::int AS raw_reviews
    FROM college_review_items
    WHERE college_id IS NOT NULL
    GROUP BY college_id
    ORDER BY raw_reviews DESC
  `);


const aspectStats =
  Object.fromEntries(
    ASPECTS.map(
      aspect => [
        aspect,
        {
          maxReviews: 0,
          maxSources: 0,
          colleges50: 0,
          colleges25: 0,
          colleges15: 0,
          collegesWithAny: 0,
          bestCollege: null,
        },
      ]
    )
  );


const collegeGaps = [];


for (
  const college
  of colleges.rows
) {
  const result =
    await getCollegeReviewIntelligenceV3(
      pool,
      {
        collegeId:
          college.college_id,

        branch:
          null,
      }
    );


  const gaps = {};


  for (
    const aspect
    of ASPECTS
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


    const stats =
      aspectStats[
        aspect
      ];


    if (
      reviews >
      0
    ) {
      stats
        .collegesWithAny++;
    }


    if (
      reviews >
      stats.maxReviews
    ) {
      stats.maxReviews =
        reviews;

      stats.maxSources =
        sources;

      stats.bestCollege =
        college.college_id;
    }


    const diversity =
      sources >= 3 &&
      Number.isFinite(
        share
      ) &&
      share <=
        0.600001;


    if (
      reviews >= 50 &&
      diversity
    ) {
      stats.colleges50++;
    }


    if (
      reviews >= 25 &&
      diversity
    ) {
      stats.colleges25++;
    }


    if (
      reviews >= 15 &&
      diversity
    ) {
      stats.colleges15++;
    }


    gaps[
      aspect
    ] =
      Math.max(
        0,
        50 -
        reviews
      );
  }


  collegeGaps.push({
    collegeId:
      college.college_id,

    rawReviews:
      college.raw_reviews,

    ...Object.fromEntries(
      ASPECTS.map(
        aspect => [
          `${aspect}_gap`,
          gaps[
            aspect
          ],
        ]
      )
    ),
  });
}


console.log(
  "\n========================================"
);

console.log(
  "PER-ASPECT DATABASE COVERAGE"
);

console.log(
  "========================================"
);


console.table(
  ASPECTS.map(
    aspect => ({
      aspect,

      collegesWithAny:
        aspectStats[
          aspect
        ].collegesWithAny,

      maxEffectiveReviews:
        aspectStats[
          aspect
        ].maxReviews,

      maxSourcesAtBest:
        aspectStats[
          aspect
        ].maxSources,

      bestCollege:
        aspectStats[
          aspect
        ].bestCollege,

      pass15:
        aspectStats[
          aspect
        ].colleges15,

      pass25:
        aspectStats[
          aspect
        ].colleges25,

      pass50:
        aspectStats[
          aspect
        ].colleges50,
    })
  )
);


console.log(
  "\n========================================"
);

console.log(
  "TOP 10 MOST DATA-RICH COLLEGES — GAP TO 50"
);

console.log(
  "========================================"
);


console.table(
  collegeGaps
    .slice(
      0,
      10
    )
);


await pool.end();
