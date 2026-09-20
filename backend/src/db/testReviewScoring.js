import pg from "pg";
import "dotenv/config";
import {
  getCollegeReviewScore,
  getReviewComponent,
} from "../services/reviewScoringService.js";

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

const TEST_COLLEGES = [
  {
    collegeId: "manit-bhopal",
    branch: "Computer Science and Engineering",
  },
  {
    collegeId:
      "national-institute-of-technology-tiruchirappalli",
    branch: "Computer Science and Engineering",
  },
  {
    collegeId:
      "national-institute-of-technology-warangal",
    branch: "Computer Science and Engineering",
  },
];

async function main() {
  const client = await pool.connect();

  try {
    console.log("");
    console.log("========================================");
    console.log("REVIEW SCORING ENGINE TEST");
    console.log("========================================");

    for (const test of TEST_COLLEGES) {
      const collegeResult = await client.query(
        `
        SELECT id, name
        FROM colleges
        WHERE id = $1
        LIMIT 1
        `,
        [test.collegeId]
      );

      const college = collegeResult.rows[0];

      if (!college) {
        console.log("");
        console.log(
          `❌ College not found: ${test.collegeId}`
        );
        continue;
      }

      const result = await getCollegeReviewScore(
        client,
        {
          collegeId: test.collegeId,
          branch: test.branch,
        }
      );

      const component =
        getReviewComponent(
          result.reviewScore,
          10
        );

      console.log("");
      console.log("----------------------------------------");
      console.log(`COLLEGE: ${college.name}`);
      console.log(`DB ID: ${college.id}`);
      console.log(`BRANCH: ${test.branch}`);
      console.log("");

      console.log(
        `Review Score       : ${
          result.reviewScore ?? "NO DATA"
        } / 100`
      );

      console.log(
        `Sentiment Score    : ${
          result.sentimentScore ?? "NO DATA"
        } / 100`
      );

      console.log(
        `Aggregate Score    : ${
          result.aggregateScore ?? "NO DATA"
        } / 100`
      );

      console.log(
        `Confidence         : ${result.confidence}%`
      );

      console.log(
        `Recommendation 10% : ${
          component ?? "NO DATA"
        } / 10`
      );

      console.log("");
      console.log(
        `Sentiment Evidence : ${result.evidence.sentimentEvidence}`
      );

      console.log(
        `Aggregate Evidence : ${result.evidence.aggregateEvidence}`
      );

      console.log(
        `Sentiment Sources  : ${result.evidence.sentimentSources}`
      );

      console.log(
        `Aggregate Sources  : ${result.evidence.aggregateSources}`
      );

      console.log("");
      console.log(
        "Sentiment Breakdown:"
      );

      console.table(
        result.evidence.sentimentBreakdown
      );
    }

    console.log("");
    console.log("========================================");
    console.log("TEST COMPLETE");
    console.log("========================================");
  } catch (error) {
    console.error("");
    console.error("TEST FAILED:");
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();