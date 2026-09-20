import fs from "fs";

const FILE =
  "./src/routes/counselling.js";

const BACKUP =
  "./src/routes/counselling.before-review-integration.js";

if (!fs.existsSync(FILE)) {
  console.error(`File not found: ${FILE}`);
  process.exit(1);
}

let code =
  fs.readFileSync(
    FILE,
    "utf8"
  );

/*
|--------------------------------------------------------------------------
| SAFETY
|--------------------------------------------------------------------------
*/

if (
  code.includes(
    'css.review_score AS "reviewScore"'
  ) ||
  code.includes(
    "LEFT JOIN college_sentiment_summary css"
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
  `Backup created: ${BACKUP}`
);

/*
|--------------------------------------------------------------------------
| 1. ADD REVIEW FIELDS AFTER counsellingType
|--------------------------------------------------------------------------
*/

const selectRegex =
  /co\.counselling_type\s+AS\s+"counsellingType"\s*\n\s*\n\s*FROM\s+cutoffs\s+co/i;

if (
  !selectRegex.test(code)
) {
  console.error(
    "ERROR: SELECT insertion point not found."
  );

  fs.copyFileSync(
    BACKUP,
    FILE
  );

  process.exit(1);
}

code =
  code.replace(
    selectRegex,
    `co.counselling_type AS "counsellingType",

          /*
          |--------------------------------------------------------------------------
          | REVIEW + SENTIMENT SUMMARY
          |--------------------------------------------------------------------------
          */

          css.review_score AS "reviewScore",
          css.analyzed_reviews AS "analyzedReviews",
          css.confidence_score AS "reviewConfidence",

          css.overall_sentiment AS "overallSentiment",

          css.google_rating AS "googleRating",
          css.google_review_count AS "googleReviewCount",
          css.google_sentiment AS "googleSentiment",

          css.reddit_sentiment AS "redditSentiment",
          css.quora_sentiment AS "quoraSentiment",

          css.placement_sentiment AS "placementSentiment",
          css.faculty_sentiment AS "facultySentiment",
          css.campus_sentiment AS "campusSentiment",
          css.hostel_sentiment AS "hostelSentiment",
          css.infrastructure_sentiment AS "infrastructureSentiment",
          css.fee_roi_sentiment AS "feeRoiSentiment"

        FROM cutoffs co`
  );

/*
|--------------------------------------------------------------------------
| 2. ADD LEFT JOIN AFTER colleges JOIN
|--------------------------------------------------------------------------
*/

const joinRegex =
  /INNER\s+JOIN\s+colleges\s+c\s*\n\s*ON\s+c\.id\s*=\s*b\.college_id\s*\n\s*\n\s*WHERE/i;

if (
  !joinRegex.test(code)
) {
  console.error(
    "ERROR: JOIN insertion point not found."
  );

  fs.copyFileSync(
    BACKUP,
    FILE
  );

  process.exit(1);
}

code =
  code.replace(
    joinRegex,
    `INNER JOIN colleges c
          ON c.id = b.college_id

        /*
        |--------------------------------------------------------------------------
        | REVIEW + SENTIMENT JOIN
        |--------------------------------------------------------------------------
        */

        LEFT JOIN college_sentiment_summary css
          ON css.college_id = c.id::text

        WHERE`
  );

/*
|--------------------------------------------------------------------------
| 3. ADD NUMBER NORMALIZATION BEFORE RESPONSE
|--------------------------------------------------------------------------
*/

const responseRegex =
  /\/\*\s*\n\s*\|[-]+\s*\n\s*\|\s*RESPONSE\s*\n[\s\S]*?\*\/\s*\n\s*res\.json\(\{/i;

if (
  !responseRegex.test(code)
) {
  console.error(
    "ERROR: RESPONSE insertion point not found."
  );

  fs.copyFileSync(
    BACKUP,
    FILE
  );

  process.exit(1);
}

code =
  code.replace(
    responseRegex,
    `/*
      |--------------------------------------------------------------------------
      | REVIEW + SENTIMENT NORMALIZATION
      |--------------------------------------------------------------------------
      */

      const numberOrNull =
        (value) => {

          if (
            value === null ||
            value === undefined ||
            value === ''
          ) {
            return null;
          }

          const number =
            Number(value);

          return Number.isFinite(number)
            ? number
            : null;
        };

      finalRows =
        finalRows.map(
          (row) => ({
            ...row,

            reviewScore:
              numberOrNull(
                row.reviewScore
              ),

            analyzedReviews:
              numberOrNull(
                row.analyzedReviews
              ),

            reviewConfidence:
              numberOrNull(
                row.reviewConfidence
              ),

            overallSentiment:
              numberOrNull(
                row.overallSentiment
              ),

            googleRating:
              numberOrNull(
                row.googleRating
              ),

            googleReviewCount:
              numberOrNull(
                row.googleReviewCount
              ),

            googleSentiment:
              numberOrNull(
                row.googleSentiment
              ),

            redditSentiment:
              numberOrNull(
                row.redditSentiment
              ),

            quoraSentiment:
              numberOrNull(
                row.quoraSentiment
              ),

            placementSentiment:
              numberOrNull(
                row.placementSentiment
              ),

            facultySentiment:
              numberOrNull(
                row.facultySentiment
              ),

            campusSentiment:
              numberOrNull(
                row.campusSentiment
              ),

            hostelSentiment:
              numberOrNull(
                row.hostelSentiment
              ),

            infrastructureSentiment:
              numberOrNull(
                row.infrastructureSentiment
              ),

            feeRoiSentiment:
              numberOrNull(
                row.feeRoiSentiment
              ),
          })
        );


      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */

      res.json({`
  );

/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  FILE,
  code,
  "utf8"
);

/*
|--------------------------------------------------------------------------
| FINAL CHECKS
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
    !code.includes(marker)
  ) {
    console.error(
      `SAFETY CHECK FAILED: ${marker}`
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
  "COUNSELLING REVIEW API INTEGRATION COMPLETE"
);

console.log(
  "==============================================="
);

console.log(
  "reviewScore added"
);

console.log(
  "analyzedReviews added"
);

console.log(
  "reviewConfidence added"
);

console.log(
  "sentiment fields added"
);

console.log(
  "LEFT JOIN added"
);

console.log(
  "missing review data remains NULL"
);

console.log(
  "==============================================="
);