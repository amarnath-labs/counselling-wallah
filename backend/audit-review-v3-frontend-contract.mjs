import { pool } from "./src/db/pool.js";

import {
  getCollegeReviewIntelligenceV3,
} from "./src/services/reviewScoringServiceV3.js";


const result =
  await getCollegeReviewIntelligenceV3(
    pool,
    {
      collegeId:
        "manit-bhopal",

      branch:
        "Computer Science and Engineering",
    }
  );


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


console.log(
  "\n===== REVIEW V3 FRONTEND CONTRACT ====="
);


let pass =
  true;


for (
  const aspect
  of REQUIRED
) {
  const data =
    result
      ?.aspects
      ?.[aspect];


  const checks = {
    score:
      data?.score ?? null,

    effectiveReviewCount:
      data?.effectiveReviewCount ?? null,

    effectiveSourceCount:
      data?.effectiveSourceCount ?? null,

    maxSourceShare:
      data?.maxSourceShare ?? null,

    sourceDominancePass:
      data?.sourceDominancePass ?? null,

    sourceDistribution:
      Array.isArray(
        data?.sourceDistribution
      ),
  };


  console.log(
    "\n",
    aspect,
    checks
  );


  const metadataPresent =
    typeof data?.effectiveReviewCount ===
      "number" &&
    typeof data?.effectiveSourceCount ===
      "number" &&
    (
      data?.maxSourceShare === null ||
      typeof data?.maxSourceShare ===
        "number"
    ) &&
    typeof data?.sourceDominancePass ===
      "boolean" &&
    Array.isArray(
      data?.sourceDistribution
    );


  if (
    !metadataPresent
  ) {
    pass = false;

    console.log(
      "FAIL metadata contract"
    );
  }
  else {
    console.log(
      "PASS metadata contract"
    );
  }
}


console.log(
  "\n========================================"
);

console.log(
  "OVERALL CONTRACT:",
  pass
    ? "PASS"
    : "FAIL"
);

console.log(
  "========================================"
);


await pool.end();


if (!pass) {
  process.exitCode =
    1;
}
