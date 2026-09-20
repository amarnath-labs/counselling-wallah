import fs from "fs";

const FILE =
  "./src/routes/counselling.js";

const BACKUP =
  "./src/routes/counselling.before-review-v3.js";

let lines =
  fs.readFileSync(
    FILE,
    "utf8"
  ).split(/\r?\n/);

/*
|--------------------------------------------------------------------------
| ALREADY PATCHED?
|--------------------------------------------------------------------------
*/

if (
  lines.some(
    line =>
      line.includes(
        'css.review_score AS "reviewScore"'
      )
  )
) {
  console.log(
    "Review integration already exists."
  );
  process.exit(0);
}

/*
|--------------------------------------------------------------------------
| BACKUP
|--------------------------------------------------------------------------
*/

fs.copyFileSync(
  FILE,
  BACKUP
);

console.log(
  "Backup created:",
  BACKUP
);

/*
|--------------------------------------------------------------------------
| FIND CURRENT REAL ANCHORS
|--------------------------------------------------------------------------
*/

const retrievedAtIndex =
  lines.findIndex(
    line =>
      line.includes(
        'co.retrieved_at AS "retrievedAt"'
      )
  );

const collegeJoinIndex =
  lines.findIndex(
    line =>
      line.includes(
        "ON c.id = b.college_id"
      )
  );

const responseIndex =
  lines.findIndex(
    line =>
      line.includes(
        "| RESPONSE"
      )
  );

console.log(
  "retrievedAtIndex:",
  retrievedAtIndex
);

console.log(
  "collegeJoinIndex:",
  collegeJoinIndex
);

console.log(
  "responseIndex:",
  responseIndex
);

if (
  retrievedAtIndex === -1 ||
  collegeJoinIndex === -1 ||
  responseIndex === -1
) {
  console.error(
    "Required anchor not found."
  );
  process.exit(1);
}

/*
|--------------------------------------------------------------------------
| 1. ADD COMMA AFTER retrievedAt
|--------------------------------------------------------------------------
*/

if (
  !lines[
    retrievedAtIndex
  ].trim().endsWith(",")
) {
  lines[
    retrievedAtIndex
  ] += ",";
}

/*
|--------------------------------------------------------------------------
| 2. ADD REVIEW FIELDS
|--------------------------------------------------------------------------
*/

const reviewFields = [
  "",
  "          /*",
  "          |--------------------------------------------------------------------------",
  "          | REVIEW + SENTIMENT SUMMARY",
  "          |--------------------------------------------------------------------------",
  "          */",
  "",
  '          css.review_score AS "reviewScore",',
  '          css.analyzed_reviews AS "analyzedReviews",',
  '          css.confidence_score AS "reviewConfidence",',
  "",
  '          css.overall_sentiment AS "overallSentiment",',
  "",
  '          css.google_rating AS "googleRating",',
  '          css.google_review_count AS "googleReviewCount",',
  '          css.google_sentiment AS "googleSentiment",',
  "",
  '          css.reddit_sentiment AS "redditSentiment",',
  '          css.quora_sentiment AS "quoraSentiment",',
  "",
  '          css.placement_sentiment AS "placementSentiment",',
  '          css.faculty_sentiment AS "facultySentiment",',
  '          css.campus_sentiment AS "campusSentiment",',
  '          css.hostel_sentiment AS "hostelSentiment",',
  '          css.infrastructure_sentiment AS "infrastructureSentiment",',
  '          css.fee_roi_sentiment AS "feeRoiSentiment"',
];

lines.splice(
  retrievedAtIndex + 1,
  0,
  ...reviewFields
);

/*
|--------------------------------------------------------------------------
| 3. ADD LEFT JOIN
|--------------------------------------------------------------------------
*/

const updatedCollegeJoinIndex =
  lines.findIndex(
    line =>
      line.includes(
        "ON c.id = b.college_id"
      )
  );

const reviewJoin = [
  "",
  "        /*",
  "        |--------------------------------------------------------------------------",
  "        | REVIEW + SENTIMENT JOIN",
  "        |--------------------------------------------------------------------------",
  "        */",
  "",
  "        LEFT JOIN college_sentiment_summary css",
  "          ON css.college_id = c.id::text",
];

lines.splice(
  updatedCollegeJoinIndex + 1,
  0,
  ...reviewJoin
);

/*
|--------------------------------------------------------------------------
| 4. FIND RESPONSE AGAIN
|--------------------------------------------------------------------------
*/

const updatedResponseIndex =
  lines.findIndex(
    line =>
      line.includes(
        "| RESPONSE"
      )
  );

let responseCommentStart =
  updatedResponseIndex;

while (
  responseCommentStart > 0 &&
  !lines[
    responseCommentStart
  ].trim().startsWith("/*")
) {
  responseCommentStart--;
}

/*
|--------------------------------------------------------------------------
| 5. NORMALIZE NUMERIC REVIEW VALUES
|--------------------------------------------------------------------------
*/

const normalizationBlock = [
  "",
  "      /*",
  "      |--------------------------------------------------------------------------",
  "      | REVIEW + SENTIMENT NORMALIZATION",
  "      |--------------------------------------------------------------------------",
  "      | Missing values remain NULL.",
  "      */",
  "",
  "      const numberOrNull =",
  "        (value) => {",
  "",
  "          if (",
  "            value === null ||",
  "            value === undefined ||",
  "            value === ''",
  "          ) {",
  "            return null;",
  "          }",
  "",
  "          const number =",
  "            Number(value);",
  "",
  "          return Number.isFinite(number)",
  "            ? number",
  "            : null;",
  "        };",
  "",
  "      finalRows =",
  "        finalRows.map(",
  "          (row) => ({",
  "            ...row,",
  "",
  "            reviewScore:",
  "              numberOrNull(row.reviewScore),",
  "",
  "            analyzedReviews:",
  "              numberOrNull(row.analyzedReviews),",
  "",
  "            reviewConfidence:",
  "              numberOrNull(row.reviewConfidence),",
  "",
  "            overallSentiment:",
  "              numberOrNull(row.overallSentiment),",
  "",
  "            googleRating:",
  "              numberOrNull(row.googleRating),",
  "",
  "            googleReviewCount:",
  "              numberOrNull(row.googleReviewCount),",
  "",
  "            googleSentiment:",
  "              numberOrNull(row.googleSentiment),",
  "",
  "            redditSentiment:",
  "              numberOrNull(row.redditSentiment),",
  "",
  "            quoraSentiment:",
  "              numberOrNull(row.quoraSentiment),",
  "",
  "            placementSentiment:",
  "              numberOrNull(row.placementSentiment),",
  "",
  "            facultySentiment:",
  "              numberOrNull(row.facultySentiment),",
  "",
  "            campusSentiment:",
  "              numberOrNull(row.campusSentiment),",
  "",
  "            hostelSentiment:",
  "              numberOrNull(row.hostelSentiment),",
  "",
  "            infrastructureSentiment:",
  "              numberOrNull(row.infrastructureSentiment),",
  "",
  "            feeRoiSentiment:",
  "              numberOrNull(row.feeRoiSentiment),",
  "          })",
  "        );",
  "",
];

lines.splice(
  responseCommentStart,
  0,
  ...normalizationBlock
);

/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

const finalCode =
  lines.join("\n");

fs.writeFileSync(
  FILE,
  finalCode,
  "utf8"
);

/*
|--------------------------------------------------------------------------
| FINAL VERIFY
|--------------------------------------------------------------------------
*/

const required = [
  'css.review_score AS "reviewScore"',
  'css.analyzed_reviews AS "analyzedReviews"',
  'css.confidence_score AS "reviewConfidence"',
  "LEFT JOIN college_sentiment_summary css",
  "ON css.college_id = c.id::text",
  "numberOrNull",
];

for (
  const marker of required
) {
  if (
    !finalCode.includes(
      marker
    )
  ) {
    console.error(
      "FAILED:",
      marker
    );

    fs.copyFileSync(
      BACKUP,
      FILE
    );

    process.exit(1);
  }
}

console.log("");
console.log(
  "==============================================="
);

console.log(
  "REVIEW API PATCH V3 COMPLETE"
);

console.log(
  "==============================================="
);

console.log(
  "reviewScore: ADDED"
);

console.log(
  "analyzedReviews: ADDED"
);

console.log(
  "reviewConfidence: ADDED"
);

console.log(
  "sentiments: ADDED"
);

console.log(
  "LEFT JOIN: ADDED"
);

console.log(
  "missing reviews remain NULL"
);

console.log(
  "==============================================="
);