import { pool } from "./src/db/pool.js";
import {
  REVIEW_COLLEGE_MAP,
} from "./src/db/reviewCollegeMap.js";

import {
  getCollegeReviewIntelligenceV3,
} from "./src/services/reviewScoringServiceV3.js";


const client =
  await pool.connect();


try {
  const entries =
    Object.entries(
      REVIEW_COLLEGE_MAP
    );

  const unique =
    new Map();

  for (
    const [file, collegeId]
    of entries
  ) {
    if (!collegeId) {
      continue;
    }

    if (
      !unique.has(
        collegeId
      )
    ) {
      unique.set(
        collegeId,
        []
      );
    }

    unique
      .get(collegeId)
      .push(file);
  }


  console.log("");
  console.log(
    "=============================================="
  );

  console.log(
    "CANONICAL NIT JSON REVIEW AUDIT"
  );

  console.log(
    "=============================================="
  );

  console.log(
    "Mapped JSON files:",
    entries.filter(
      ([, id]) =>
        Boolean(id)
    ).length
  );

  console.log(
    "Unique mapped colleges:",
    unique.size
  );


  let collegesWithReview =
    0;

  let collegesWithoutReview =
    0;


  for (
    const [
      collegeId,
      files,
    ]
    of unique
  ) {
    const db =
      await client.query(
        `
        SELECT
          id,
          name
        FROM colleges
        WHERE id = $1
        LIMIT 1
        `,
        [collegeId]
      );

    const college =
      db.rows[0];

    if (!college) {
      console.log(
        "",
        "MISSING COLLEGE:",
        collegeId,
        files
      );

      continue;
    }


    const cse =
      await getCollegeReviewIntelligenceV3(
        client,
        {
          collegeId,
          branch:
            "Computer Science and Engineering",
        }
      );


    const architecture =
      await getCollegeReviewIntelligenceV3(
        client,
        {
          collegeId,
          branch:
            "Architecture",
        }
      );


    const hasReview =
      cse?.score !== null ||
      architecture?.score !== null;


    if (hasReview) {
      collegesWithReview++;
    } else {
      collegesWithoutReview++;
    }


    console.log("");
    console.log(
      college.name
    );

    console.log(
      "  JSON:",
      files.join(", ")
    );

    console.log(
      "  CSE:",
      {
        score:
          cse?.score ??
          null,

        reviews:
          cse?.evidence
            ?.usableReviews ??
          0,

        sources:
          cse?.evidence
            ?.independentSources ??
          0,
      }
    );

    console.log(
      "  Architecture:",
      {
        score:
          architecture?.score ??
          null,

        reviews:
          architecture?.evidence
            ?.usableReviews ??
          0,

        sources:
          architecture?.evidence
            ?.independentSources ??
          0,
      }
    );
  }


  console.log("");
  console.log(
    "=============================================="
  );

  console.log(
    "SUMMARY"
  );

  console.log(
    "=============================================="
  );

  console.log(
    "Canonical colleges with review:",
    collegesWithReview
  );

  console.log(
    "Canonical colleges without review:",
    collegesWithoutReview
  );

} finally {
  client.release();

  await pool.end();
}
