import fs from "node:fs";

const file =
  "./src/routes/counselling.js";

let code =
  fs.readFileSync(file, "utf8");

function replaceOnce(
  search,
  replacement,
  label
) {
  if (!code.includes(search)) {
    console.error(
      `PATCH FAILED: ${label}`
    );
    process.exit(1);
  }

  code = code.replace(
    search,
    replacement
  );

  console.log(
    `PATCHED: ${label}`
  );
}

/*
|--------------------------------------------------------------------------
| 1. STUDENT ANNUAL BUDGET INPUT
|--------------------------------------------------------------------------
*/

replaceOnce(
`      const homeState =
        req.query.homeState
          ? String(
              req.query.homeState
            ).trim()
          : null;`,
`      const homeState =
        req.query.homeState
          ? String(
              req.query.homeState
            ).trim()
          : null;


      /*
      |--------------------------------------------------------------------------
      | STUDENT ANNUAL BUDGET
      |--------------------------------------------------------------------------
      |
      | Preferred frontend parameter:
      |
      |   annualBudget=300000
      |
      | Legacy/fallback:
      |
      |   budget=300000
      |
      */

      const annualBudgetRaw =
        req.query.annualBudget ??
        req.query.budget ??
        null;

      const annualBudget =
        annualBudgetRaw === null ||
        annualBudgetRaw === undefined ||
        annualBudgetRaw === ''
          ? null
          : Number(annualBudgetRaw);`,
"annual budget input"
);


/*
|--------------------------------------------------------------------------
| 2. VALIDATE BUDGET
|--------------------------------------------------------------------------
*/

replaceOnce(
`      if (
        !Number.isInteger(year)
      ) {
        return res.status(400).json({
          error:
            'Valid year is required',
        });
      }`,
`      if (
        !Number.isInteger(year)
      ) {
        return res.status(400).json({
          error:
            'Valid year is required',
        });
      }

      if (
        annualBudget !== null &&
        (
          !Number.isFinite(annualBudget) ||
          annualBudget <= 0
        )
      ) {
        return res.status(400).json({
          error:
            'annualBudget must be a positive number',
        });
      }`,
"annual budget validation"
);


/*
|--------------------------------------------------------------------------
| 3. ADD FEE FIELDS TO SELECT
|--------------------------------------------------------------------------
*/

replaceOnce(
`          co.source_url AS "sourceUrl",
          co.retrieved_at AS "retrievedAt",

          /*
          |--------------------------------------------------------------------------
          | REVIEW + SENTIMENT SUMMARY`,
`          co.source_url AS "sourceUrl",
          co.retrieved_at AS "retrievedAt",

          /*
          |--------------------------------------------------------------------------
          | OFFICIAL FEE PROFILE
          |--------------------------------------------------------------------------
          */

          cfp.fee_year AS "feeYear",

          cfp.tuition_fee_per_semester
            AS "tuitionFeePerSemester",

          cfp.academic_fee_per_semester
            AS "academicFeePerSemester",

          cfp.first_semester_fee
            AS "firstSemesterFee",

          cfp.mess_fee_per_semester
            AS "messFeePerSemester",

          cfp.annual_academic_fee
            AS "annualAcademicFee",

          cfp.confidence_score
            AS "feeConfidence",

          cfp.verification_status
            AS "feeVerificationStatus",

          cfp.source_url
            AS "feeSourceUrl",

          /*
          |--------------------------------------------------------------------------
          | REVIEW + SENTIMENT SUMMARY`,
"fee fields in SELECT"
);


/*
|--------------------------------------------------------------------------
| 4. JOIN BEST AVAILABLE FEE PROFILE
|--------------------------------------------------------------------------
*/

replaceOnce(
`        LEFT JOIN college_sentiment_summary css
          ON css.college_id = c.id::text

        WHERE`,
`        LEFT JOIN college_sentiment_summary css
          ON css.college_id = c.id::text

        /*
        |--------------------------------------------------------------------------
        | BEST AVAILABLE OFFICIAL FEE PROFILE
        |--------------------------------------------------------------------------
        |
        | One fee record only.
        |
        | Priority:
        |
        |   verified
        |   high_confidence
        |   review_recommended
        |
        | Then highest confidence + latest year.
        |
        */

        LEFT JOIN LATERAL (
          SELECT
            fp.fee_year,

            fp.tuition_fee_per_semester,
            fp.academic_fee_per_semester,
            fp.first_semester_fee,
            fp.mess_fee_per_semester,
            fp.annual_academic_fee,

            fp.confidence_score,
            fp.verification_status,
            fp.source_url

          FROM college_fee_profiles fp

          WHERE
            fp.college_id = c.id::text

            AND fp.verification_status IN (
              'verified',
              'high_confidence',
              'review_recommended'
            )

          ORDER BY

            CASE
              WHEN fp.verification_status = 'verified'
                THEN 3

              WHEN fp.verification_status = 'high_confidence'
                THEN 2

              WHEN fp.verification_status = 'review_recommended'
                THEN 1

              ELSE 0
            END DESC,

            fp.confidence_score DESC,

            fp.fee_year DESC

          LIMIT 1

        ) cfp ON TRUE

        WHERE`,
"college fee lateral join"
);


/*
|--------------------------------------------------------------------------
| 5. LOG BUDGET
|--------------------------------------------------------------------------
*/

replaceOnce(
`          homeState,
        }`,
`          homeState,
          annualBudget,
        }`,
"budget in counselling log"
);


/*
|--------------------------------------------------------------------------
| 6. NORMALIZE FEE NUMBERS
|--------------------------------------------------------------------------
*/

replaceOnce(
`            reviewScore:
              numberOrNull(row.reviewScore),`,
`            /*
            | Fee data
            */

            feeYear:
              numberOrNull(row.feeYear),

            tuitionFeePerSemester:
              numberOrNull(
                row.tuitionFeePerSemester
              ),

            academicFeePerSemester:
              numberOrNull(
                row.academicFeePerSemester
              ),

            firstSemesterFee:
              numberOrNull(
                row.firstSemesterFee
              ),

            messFeePerSemester:
              numberOrNull(
                row.messFeePerSemester
              ),

            annualAcademicFee:
              numberOrNull(
                row.annualAcademicFee
              ),

            feeConfidence:
              numberOrNull(
                row.feeConfidence
              ),

            reviewScore:
              numberOrNull(row.reviewScore),`,
"fee number normalization"
);


/*
|--------------------------------------------------------------------------
| 7. BUDGET SCORE ENGINE
|--------------------------------------------------------------------------
*/

const responseMarker =
`      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */`;

if (!code.includes(responseMarker)) {
  console.error(
    "PATCH FAILED: response marker"
  );
  process.exit(1);
}

const budgetEngine =
`
      /*
      |--------------------------------------------------------------------------
      | BUDGET SCORE
      |--------------------------------------------------------------------------
      |
      | Premium weight = 7%
      |
      | Important:
      |
      | Missing fee != bad college.
      |
      | If fee or student budget is unavailable:
      |
      |   budgetScore = null
      |   weightedBudgetScore = null
      |
      | Therefore missing fee data does NOT create
      | an unfair zero score.
      |
      |--------------------------------------------------------------------------
      */

      function calculateBudgetScore(
        studentAnnualBudget,
        estimatedAnnualFee
      ) {

        if (
          studentAnnualBudget === null ||
          estimatedAnnualFee === null ||
          !Number.isFinite(studentAnnualBudget) ||
          !Number.isFinite(estimatedAnnualFee) ||
          studentAnnualBudget <= 0 ||
          estimatedAnnualFee <= 0
        ) {
          return null;
        }

        const ratio =
          estimatedAnnualFee /
          studentAnnualBudget;

        /*
        | Fee <= budget
        */
        if (ratio <= 1) {
          return 100;
        }

        /*
        | Up to 10% above budget
        */
        if (ratio <= 1.10) {
          return 80;
        }

        /*
        | Up to 25% above budget
        */
        if (ratio <= 1.25) {
          return 55;
        }

        /*
        | Significantly above budget
        */
        return 20;
      }


      finalRows =
        finalRows.map((row) => {

          /*
          |--------------------------------------------------------------------------
          | SAFE ANNUAL FEE ESTIMATE
          |--------------------------------------------------------------------------
          |
          | We currently trust:
          |
          |   annual academic fee
          |   +
          |   2 semesters of mess fee
          |
          | Hostel is intentionally NOT added yet because
          | accommodation/campus variants are not normalized
          | strongly enough across all colleges.
          |
          */

          let estimatedAnnualBudgetFee =
            null;

          let feeCoverage =
            null;

          if (
            row.annualAcademicFee !== null
          ) {

            estimatedAnnualBudgetFee =
              row.annualAcademicFee;

            feeCoverage =
              'academic_only';

            if (
              row.messFeePerSemester !== null
            ) {

              estimatedAnnualBudgetFee +=
                row.messFeePerSemester * 2;

              feeCoverage =
                'academic_plus_mess';
            }
          }


          const budgetScore =
            calculateBudgetScore(
              annualBudget,
              estimatedAnnualBudgetFee
            );


          const weightedBudgetScore =
            budgetScore === null
              ? null
              : Number(
                  (
                    budgetScore * 0.07
                  ).toFixed(2)
                );


          const budgetDifference =
            (
              annualBudget !== null &&
              estimatedAnnualBudgetFee !== null
            )
              ? Math.round(
                  annualBudget -
                  estimatedAnnualBudgetFee
                )
              : null;


          const budgetStatus =
            budgetScore === null
              ? 'unavailable'

              : budgetScore === 100
                ? 'within_budget'

              : budgetScore === 80
                ? 'slightly_above_budget'

              : budgetScore === 55
                ? 'above_budget'

              : 'well_above_budget';


          return {
            ...row,

            estimatedAnnualBudgetFee,

            feeCoverage,

            studentAnnualBudget:
              annualBudget,

            budgetScore,

            weightedBudgetScore,

            budgetWeight:
              7,

            budgetDifference,

            budgetStatus,
          };
        });


`;

code = code.replace(
  responseMarker,
  budgetEngine + responseMarker
);


/*
|--------------------------------------------------------------------------
| 8. BUDGET META
|--------------------------------------------------------------------------
*/

replaceOnce(
`          homeState,

          count:
            finalRows.length,`,
`          homeState,

          annualBudget,

          budgetWeight: 7,

          count:
            finalRows.length,`,
"budget response meta"
);


/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  file,
  code,
  "utf8"
);

console.log("");
console.log(
  "========================================"
);
console.log(
  " BUDGET 7% PATCH COMPLETE"
);
console.log(
  "========================================"
);
console.log(file);
