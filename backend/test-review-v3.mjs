import { pool } from "./src/db/pool.js";
import {
  getCollegeReviewIntelligenceV3,
} from "./src/services/reviewScoringServiceV3.js";

const tests = [
  {
    collegeId: "manit-bhopal",
    branch: "Computer Science and Engineering",
  },
  {
    collegeId: "national-institute-of-technology-warangal",
    branch: "Computer Science and Engineering",
  },
  {
    collegeId: "sardar-vallabhbhai-national-institute-of-technology-surat",
    branch: "Computer Science and Engineering",
  },
];

try {
  for (const test of tests) {
    console.log("");
    console.log("========================================");
    console.log(`${test.collegeId} :: ${test.branch}`);
    console.log("========================================");

    const result =
      await getCollegeReviewIntelligenceV3(
        pool,
        test
      );

    console.dir(
      {
        version: result.version,
        score: result.score,
        component: result.component,
        canonicalBranch: result.canonicalBranch,

        strengths: result.strengths,
        concerns: result.concerns,
        mixedAspects: result.mixedAspects,
        missingAspects: result.missingAspects,
        warnings: result.warnings,

        evidence: result.evidence,

        aggregate: result.aggregate,

        aspectSummary:
          Object.fromEntries(
            Object.entries(
              result.aspects
            ).map(
              ([aspect, value]) => [
                aspect,
                {
                  score: value.score,
                  scopeUsed:
                    value.scopeUsed,
                  sourceCount:
                    value.sourceCount,
                  reviewCount:
                    value.reviewCount,
                  evidenceCount:
                    value.evidenceCount,
                  channelsUsed:
                    value.channelsUsed,
                },
              ]
            )
          ),

        placementsEvidence:
          result.aspects
            ?.placements
            ?.representativePositiveSentences,

        hostelPositive:
          result.aspects
            ?.hostel
            ?.representativePositiveSentences,

        hostelNegative:
          result.aspects
            ?.hostel
            ?.representativeNegativeSentences,
      },
      {
        depth: 8,
        colors: true,
      }
    );
  }
} catch (error) {
  console.error("");
  console.error("V3 TEST FAILED");
  console.error(error);
} finally {
  await pool.end();
}