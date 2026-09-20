import "dotenv/config";

import { pool } from "./src/db/pool.js";

import {
  buildReviewIntelligenceV4,
} from "./src/services/reviewIntelligenceV4Service.js";

let client;

try {
  client =
    await pool.connect();

  const top =
    await client.query(`
      SELECT
        college_id,
        COUNT(*)::int AS reviews
      FROM college_review_items
      WHERE college_id IS NOT NULL
      GROUP BY college_id
      ORDER BY reviews DESC
      LIMIT 1
    `);

  const collegeId =
    top.rows[0]?.college_id;

  console.log(
    "Testing college:",
    collegeId
  );

  if (!collegeId) {
    throw new Error(
      "No review-bearing college found."
    );
  }

  const result =
    await buildReviewIntelligenceV4(
      client,
      {
        collegeId,
        branch: null,
      }
    );

  console.log(
    JSON.stringify(
      {
        version:
          result.version,

        mode:
          result.mode,

        reviewScore:
          result.reviewScore,

        existingReviewComponent:
          result.existingReviewComponent,

        scoringPolicy:
          result.scoringPolicy,

        evidenceConfidence:
          result.evidenceConfidence,

        coverage:
          result.coverage,

        recency:
          result.recency,

        scope:
          result.scope,

        sourceQuality:
          result.sourceQuality,

        accessQuality:
          result.accessQuality,

        strengths:
          result.strengths,

        concerns:
          result.concerns,

        missingAspects:
          result.missingAspects,

        improvementTriggers:
          result.improvementTriggers,
      },
      null,
      2
    )
  );
}
finally {
  if (client) {
    client.release();
  }

  await pool.end();
}
