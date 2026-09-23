import { pool } from "./src/db/pool.js";

import {
  getCollegeReviewIntelligenceV3,
} from "./src/services/reviewScoringServiceV3.js";


const COLLEGES = [
  "manit-bhopal",
  "national-institute-of-technology-warangal",
  "sardar-vallabhbhai-national-institute-of-technology-surat",
];


const BRANCH =
  "Computer Science and Engineering";


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


function extract(
  result,
  aspect
) {
  const data =
    result
      ?.aspects
      ?.[aspect];


  return {
    reviews:
      Number(
        data
          ?.effectiveReviewCount ??
        0
      ),

    sources:
      Number(
        data
          ?.effectiveSourceCount ??
        0
      ),

    scope:
      data
        ?.scopeUsed ??
      null,

    score:
      data
        ?.score ??
      null,
  };
}


try {
  for (
    const collegeId
    of COLLEGES
  ) {
    const collegeWide =
      await getCollegeReviewIntelligenceV3(
        pool,
        {
          collegeId,
          branch:
            null,
        }
      );


    const branchSpecific =
      await getCollegeReviewIntelligenceV3(
        pool,
        {
          collegeId,
          branch:
            BRANCH,
        }
      );


    console.log(
      "\n======================================================"
    );

    console.log(
      collegeId
    );

    console.log(
      "======================================================"
    );


    console.table(
      ASPECTS.map(
        aspect => {
          const c =
            extract(
              collegeWide,
              aspect
            );


          const b =
            extract(
              branchSpecific,
              aspect
            );


          return {
            aspect,

            collegeReviews:
              c.reviews,

            branchReviews:
              b.reviews,

            collegeSources:
              c.sources,

            branchSources:
              b.sources,

            collegeScope:
              c.scope,

            branchScope:
              b.scope,

            delta:
              b.reviews -
              c.reviews,
          };
        }
      )
    );
  }
}
finally {
  await pool.end();
}
