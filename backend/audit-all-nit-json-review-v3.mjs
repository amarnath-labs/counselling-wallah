import { pool } from "./src/db/pool.js";
import {
  getCollegeReviewIntelligenceV3,
} from "./src/services/reviewScoringServiceV3.js";

const branches = [
  "Computer Science and Engineering",
  "Architecture",
];

const client =
  await pool.connect();

try {
  const result =
    await client.query(`
      SELECT
        id,
        name
      FROM colleges
      WHERE
        name ILIKE '%National Institute of Technology%'
        OR name ILIKE '%NIT%'
      ORDER BY name
    `);

  console.log("");
  console.log(
    "=============================================="
  );
  console.log(
    "ALL NIT REVIEW V3 AUDIT"
  );
  console.log(
    "=============================================="
  );

  for (
    const college of
    result.rows
  ) {
    console.log("");
    console.log(
      college.name
    );

    for (
      const branch of
      branches
    ) {
      try {
        const intel =
          await getCollegeReviewIntelligenceV3(
            client,
            {
              collegeId:
                college.id,

              branch,
            }
          );

        console.log(
          `  ${branch}:`,
          {
            score:
              intel?.score ??
              null,

            usableReviews:
              intel?.evidence
                ?.usableReviews ??
              null,

            sources:
              intel?.evidence
                ?.independentSources ??
              null,

            requestedBranch:
              intel?.requestedBranch ??
              null,
          }
        );
      } catch (
        error
      ) {
        console.log(
          `  ${branch}: ERROR`,
          error.message
        );
      }
    }
  }
} finally {
  client.release();
  await pool.end();
}
