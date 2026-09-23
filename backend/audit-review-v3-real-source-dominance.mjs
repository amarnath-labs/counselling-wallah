import { pool } from "./src/db/pool.js";

import {
  getCollegeReviewIntelligenceV3,
} from "./src/services/reviewScoringServiceV3.js";


const REQUIRED_ASPECTS = [
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


const tests = [
  {
    collegeId:
      "manit-bhopal",

    branch:
      "Computer Science and Engineering",
  },

  {
    collegeId:
      "national-institute-of-technology-warangal",

    branch:
      "Computer Science and Engineering",
  },

  {
    collegeId:
      "sardar-vallabhbhai-national-institute-of-technology-surat",

    branch:
      "Computer Science and Engineering",
  },
];


function pct(
  value
) {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }


  const number =
    Number(
      value
    );


  if (
    !Number.isFinite(
      number
    )
  ) {
    return null;
  }


  return (
    `${(
      number *
      100
    ).toFixed(
      1
    )}%`
  );
}


try {
  for (
    const test
    of tests
  ) {
    console.log(
      "\n============================================================"
    );

    console.log(
      `${test.collegeId} :: ${test.branch}`
    );

    console.log(
      "============================================================"
    );


    const result =
      await getCollegeReviewIntelligenceV3(
        pool,
        test
      );


    console.log(
      "\nREVIEW V3 SUMMARY"
    );

    console.log({
      version:
        result?.version,

      score:
        result?.score,

      component:
        result?.component,

      canonicalBranch:
        result?.canonicalBranch,

      usableReviews:
        result
          ?.evidence
          ?.usableReviews,

      independentSources:
        result
          ?.evidence
          ?.independentSources,

      missingAspects:
        result
          ?.missingAspects,

      warnings:
        result
          ?.warnings,
    });


    const rows = [];


    let readyCount =
      0;


    for (
      const aspect
      of REQUIRED_ASPECTS
    ) {
      const data =
        result
          ?.aspects
          ?.[aspect] ??
        null;


      const effectiveReviews =
        Number(
          data
            ?.effectiveReviewCount ??
          0
        );


      const effectiveSources =
        Number(
          data
            ?.effectiveSourceCount ??
          0
        );


      const maxSourceShare =
        data
          ?.maxSourceShare ??
        null;


      const sourceDominancePass =
        data
          ?.sourceDominancePass ===
        true;


      const score =
        data
          ?.score ??
        null;


      const pass =
        effectiveReviews >=
          50 &&
        effectiveSources >=
          3 &&
        maxSourceShare !==
          null &&
        Number(
          maxSourceShare
        ) <=
          0.60 &&
        sourceDominancePass &&
        score !==
          null;


      if (
        pass
      ) {
        readyCount++;
      }


      rows.push({
        aspect,

        score,

        effectiveReviews,

        effectiveSources,

        maxSourceShare:
          pct(
            maxSourceShare
          ),

        dominancePass:
          sourceDominancePass,

        strictGate:
          pass
            ? "PASS"
            : "FAIL",
      });
    }


    console.log(
      "\nSTRICT ASPECT AUDIT"
    );


    console.table(
      rows
    );


    console.log(
      "\nSTRICT REVIEW RESULT:"
    );

    console.log(
      `${readyCount}/${REQUIRED_ASPECTS.length} aspects ready`
    );


    console.log(
      "Student Experience available:",
      readyCount ===
        REQUIRED_ASPECTS.length
    );


    console.log(
      "\nSOURCE DISTRIBUTION"
    );


    for (
      const aspect
      of REQUIRED_ASPECTS
    ) {
      const data =
        result
          ?.aspects
          ?.[aspect];


      const distribution =
        Array.isArray(
          data
            ?.sourceDistribution
        )
          ? data
              .sourceDistribution
          : [];


      console.log(
        `\n${aspect}`
      );


      if (
        !distribution.length
      ) {
        console.log(
          "  no attributable source distribution"
        );

        continue;
      }


      console.table(
        distribution.map(
          source => ({
            source:
              source.source,

            effectiveCount:
              source.effectiveCount,

            share:
              pct(
                source.share
              ),
          })
        )
      );
    }
  }
}
catch (
  error
) {
  console.error(
    "\nREAL REVIEW V3 AUDIT FAILED"
  );

  console.error(
    error
  );

  process.exitCode =
    1;
}
finally {
  await pool.end();
}
