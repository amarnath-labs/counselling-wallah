import fs from "fs";

const FILE =
  "./src/routes/counselling.js";

const BACKUP =
  "./src/routes/counselling.before-review-v2.js";

if (!fs.existsSync(FILE)) {
  console.error("counselling.js not found");
  process.exit(1);
}

let lines =
  fs.readFileSync(
    FILE,
    "utf8"
  )
    .split(/\r?\n/);

/*
|--------------------------------------------------------------------------
| DO NOT RUN TWICE
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
    "Review integration already present."
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
| FIND ACTUAL LINES
|--------------------------------------------------------------------------
*/

const counsellingTypeIndex =
  lines.findIndex(
    line =>
      line.includes(
        'co.counselling_type AS "counsellingType"'
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
  "counsellingTypeIndex:",
  counsellingTypeIndex
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
  counsellingTypeIndex === -1
) {
  console.error(
    'Could not find counsellingType SELECT field.'
  );
  process.exit(1);
}

if (
  collegeJoinIndex === -1
) {
  console.error(
    "Could not find colleges JOIN."
  );
  process.exit(1);
}

if (
  responseIndex === -1
) {
  console.error(
    "Could not find RESPONSE section."
  );
  process.exit(1);
}

/*
|--------------------------------------------------------------------------
| 1. ADD COMMA TO counsellingType
|--------------------------------------------------------------------------
*/

if (
  !lines[
    counsellingTypeIndex
  ]
    .trim()
    .endsWith(",")
) {
  lines[
    counsellingTypeIndex
  ] =
    lines[
      counsellingTypeIndex
    ].replace(
      /"\s*$/,
      '",'
    );
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
  counsellingTypeIndex + 1,
  0,
  ...reviewFields
);

/*
|--------------------------------------------------------------------------
| RE-FIND JOIN AFTER INSERT
|--------------------------------------------------------------------------
*/

const updatedCollegeJoinIndex =
  lines.findIndex(
    line =>
      line.includes(
        "ON c.id = b.college_id"
      )
  );

/*
|--------------------------------------------------------------------------
| 3. ADD LEFT JOIN
|--------------------------------------------------------------------------
*/

const reviewJoin = [
  "",
  "        /*",
  "        |--------------------------------------------------------------------------",
  "        | REVIEW + SENTIMENT JOIN",
  "        |--------------------------------------------------------------------------",
  "        | LEFT JOIN keeps colleges without reviews in results.",
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
| RE-FIND RESPONSE SECTION
|--------------------------------------------------------------------------
*/

const updatedResponseIndex =
  lines.findIndex(
    line =>
      line.includes(
        "| RESPONSE"
      )
  );

/*
|--------------------------------------------------------------------------
| Find start of response comment
|--------------------------------------------------------------------------
*/

let responseCommentStart =
  updatedResponseIndex;

while (
  responseCommentStart > 0 &&
  !lines[
    responseCommentStart
  ]
    .trim()
    .startsWith("/*")
) {
  responseCommentStart--;
}

/*
|--------------------------------------------------------------------------
| 4. ADD NUMERIC NORMALIZATION
|--------------------------------------------------------------------------
*/

const normalizationBlock = [
  "",
  "      /*",
  "      |--------------------------------------------------------------------------",
  "      | REVIEW + SENTIMENT NORMALIZATION",
  "      |--------------------------------------------------------------------------",
  "      | PostgreSQL NUMERIC values may arrive as strings.",
  "      | Missing values remain null.",
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
  "              numberOrNull(",
  "                row.reviewScore",
  "              ),",
  "",
  "            analyzedReviews:",
  "              numberOrNull(",
  "                row.analyzedReviews",
  "              ),",
  "",
  "            reviewConfidence:",
  "              numberOrNull(",
  "                row.reviewConfidence",
  "              ),",
  "",
  "            overallSentiment:",
  "              numberOrNull(",
  "                row.overallSentiment",
  "              ),",
  "",
  "            googleRating:",
  "              numberOrNull(",
  "                row.googleRating",
  "              ),",
  "",
  "            googleReviewCount:",
  "              numberOrNull(",
  "                row.googleReviewCount",
  "              ),",
  "",
  "            googleSentiment:",
  "              numberOrNull(",
  "                row.googleSentiment",
  "              ),",
  "",
  "            redditSentiment:",
  "              numberOrNull(",
  "                row.redditSentiment",
  "              ),",
  "",
  "            quoraSentiment:",
  "              numberOrNull(",
  "                row.quoraSentiment",
  "              ),",
  "",
  "            placementSentiment:",
  "              numberOrNull(",
  "                row.placementSentiment",
  "              ),",
  "",
  "            facultySentiment:",
  "              numberOrNull(",
  "                row.facultySentiment",
  "              ),",
  "",
  "            campusSentiment:",
  "              numberOrNull(",
  "                row.campusSentiment",
  "              ),",
  "",
  "            hostelSentiment:",
  "              numberOrNull(",
  "                row.hostelSentiment",
  "              ),",
  "",
  "            infrastructureSentiment:",
  "              numberOrNull(",
  "                row.infrastructureSentiment",
  "              ),",
  "",
  "            feeRoiSentiment:",
  "              numberOrNull(",
  "                row.feeRoiSentiment",
  "              ),",
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
| FINAL SAFETY VERIFICATION
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
  const value of required
) {
  if (
    !finalCode.includes(
      value
    )
  ) {
    console.error(
      "FAILED:",
      value
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
  "REVIEW API PATCH V2 COMPLETE"
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
  "sentiment fields: ADDED"
);
console.log(
  "LEFT JOIN: ADDED"
);
console.log(
  "NULL preservation: ADDED"
);
console.log(
  "==============================================="
);