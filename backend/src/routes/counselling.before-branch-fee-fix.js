import { Router } from 'express';
import { pool } from '../db/pool.js';

const router = Router();

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function normalize(value) {
  return String(value || '')
    .trim()
    .toLowerCase();
}

function isJeeMainInstitute(
  collegeName,
  collegeType
) {
  const name = normalize(collegeName);
  const type = normalize(collegeType);

  // IIT must NEVER appear in JEE Main.
  if (
    type === 'iit' ||
    name.includes(
      'indian institute of technology'
    ) ||
    name.startsWith('iit ')
  ) {
    return false;
  }

  return (
    type === 'nit' ||
    type === 'iiit' ||
    type === 'gfti' ||
    type === 'gftis' ||

    name.startsWith(
      'national institute of technology'
    ) ||

    name.includes(
      'indian institute of information technology'
    )
  );
}


/*
|--------------------------------------------------------------------------
| COUNSELLING EVENTS
|--------------------------------------------------------------------------
*/

router.get(
  '/events',
  async (req, res, next) => {
    try {
      const params = [];

      let query = `
        SELECT
          name,
          event_date_text AS date,
          status,
          is_demo AS "isDemo"
        FROM counselling_events
      `;

      if (req.query.examId) {
        params.push(
          String(
            req.query.examId
          ).trim()
        );

        query += `
          WHERE exam_id = $1::text
        `;
      }

      query += `
        ORDER BY id
      `;

      const { rows } =
        await pool.query(
          query,
          params
        );

      res.json({
        data: rows,
      });

    } catch (error) {

      console.error(
        'COUNSELLING EVENTS ERROR:',
        error
      );

      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| COUNSELLING RESULTS
|--------------------------------------------------------------------------
*/

router.get(
  '/results',
  async (req, res, next) => {

    try {

      /*
      |--------------------------------------------------------------------------
      | EXAM
      |--------------------------------------------------------------------------
      */

      const examId =
        normalize(
          req.query.examId ||
          'jee-main'
        );


      /*
      |--------------------------------------------------------------------------
      | INPUTS
      |--------------------------------------------------------------------------
      */

      const rank =
        Number(
          req.query.rank
        );

      const category =
        String(
          req.query.category ||
          'OPEN'
        ).trim();

      const year =
        Number(
          req.query.year ||
          (
            examId === 'uptac'
              ? 2025
              : 2026
          )
        );


      /*
      |--------------------------------------------------------------------------
      | ROUND
      |--------------------------------------------------------------------------
      |
      | Frontend sends:
      |
      |   round=1
      |
      | UPTAC database stores:
      |
      |   Round 1
      |
      | Therefore normalize UPTAC rounds here.
      |--------------------------------------------------------------------------
      */

      let round =
        String(
          req.query.round ||
          '1'
        ).trim();

      if (examId === 'uptac') {

        const roundNumber =
          round
            .replace(
              /^round\s*/i,
              ''
            )
            .trim();

        if (
          /^\d+$/.test(
            roundNumber
          )
        ) {
          round =
            `Round ${roundNumber}`;
        }
      }


      /*
      |--------------------------------------------------------------------------
      | OPTIONAL FILTERS
      |--------------------------------------------------------------------------
      */

      const requestedQuota =
        req.query.quota
          ? String(
              req.query.quota
            ).trim()
          : null;

      const requestedGender =
        req.query.gender
          ? String(
              req.query.gender
            ).trim()
          : null;

      const homeState =
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
          : Number(annualBudgetRaw);


      /*
      |--------------------------------------------------------------------------
      | VALIDATION
      |--------------------------------------------------------------------------
      */

      if (
        !Number.isInteger(rank) ||
        rank <= 0
      ) {
        return res.status(400).json({
          error:
            'Valid rank is required',
        });
      }

      if (
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
      }


      /*
      |--------------------------------------------------------------------------
      | SUPPORTED EXAMS
      |--------------------------------------------------------------------------
      */

      const SUPPORTED_COUNSELLING_EXAMS = [
        'jee-main',
        'jee-advanced',
        'uptac',
      ];


      /*
      |--------------------------------------------------------------------------
      | BLOCK UNSUPPORTED EXAMS
      |--------------------------------------------------------------------------
      */

      if (
        !SUPPORTED_COUNSELLING_EXAMS.includes(
          examId
        )
      ) {

        return res.json({
          data: [],

          meta: {
            examId,
            rank,
            year,
            round,
            category,

            quota:
              requestedQuota,

            gender:
              requestedGender,

            homeState,

            count: 0,

            message:
              `${examId} data is not available yet. ` +
              `JoSAA data will not be used for this exam.`,
          },
        });
      }


      /*
      |--------------------------------------------------------------------------
      | SQL PARAMETERS
      |--------------------------------------------------------------------------
      */

      const params = [
        rank,       // $1
        year,       // $2
        round,      // $3
        category,   // $4
      ];

      let paramIndex = 5;


      /*
      |--------------------------------------------------------------------------
      | BASE QUERY
      |--------------------------------------------------------------------------
      */

      let query = `
        SELECT
          c.id AS college_id,
          c.name AS college_name,
          c.city,
          c.state,
          c.type,

          b.id AS branch_id,
          b.name AS branch_name,

          co.year,
          co.round,
          co.category,
          co.quota,
          co.gender,

          co.opening_rank AS "openingRank",
          co.closing_rank AS "closingRank",

          co.source_label AS source,
          co.is_verified AS "isVerified",
          co.verification_status AS "verificationStatus",
          co.source_url AS "sourceUrl",
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

        FROM cutoffs co

        INNER JOIN branches b
          ON b.id = co.branch_id

        INNER JOIN colleges c
          ON c.id = b.college_id

        /*
        |--------------------------------------------------------------------------
        | REVIEW + SENTIMENT JOIN
        |--------------------------------------------------------------------------
        */

        LEFT JOIN college_sentiment_summary css
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

        WHERE
          co.year = $2

          AND co.round = $3

          AND co.category = $4

          /*
          |--------------------------------------------------------------------------
          | IMPORTANT:
          |
          | Do NOT require:
          |
          |   opening_rank <= user rank
          |
          | A student with rank 3000 can be eligible
          | for a historical cutoff that opened at 32326
          | and closed at 50510.
          |
          | We therefore use closing rank as the
          | minimum historical eligibility boundary.
          |--------------------------------------------------------------------------
          */

          AND co.closing_rank >= $1
      `;


      /*
      |--------------------------------------------------------------------------
      | JEE MAIN
      |--------------------------------------------------------------------------
      |
      | JEE Main:
      |
      | NIT   ✅
      | IIIT  ✅
      | GFTI  ✅
      | IIT   ❌
      |
      */

      if (
        examId === 'jee-main'
      ) {

        query += `
          AND (
            LOWER(c.type) IN (
              'nit',
              'iiit',
              'gfti',
              'gftis'
            )

            OR LOWER(c.name) LIKE
              'national institute of technology%'

            OR LOWER(c.name) LIKE
              '%indian institute of information technology%'
          )

          AND LOWER(c.type) <> 'iit'

          AND LOWER(c.name) NOT LIKE
            'indian institute of technology%'

          AND LOWER(c.name) NOT LIKE
            'iit %'
        `;
      }


      /*
      |--------------------------------------------------------------------------
      | JEE ADVANCED
      |--------------------------------------------------------------------------
      |
      | JEE Advanced:
      |
      | IIT ✅
      |
      */

      if (
        examId === 'jee-advanced'
      ) {

        query += `
          AND (
            LOWER(c.type) = 'iit'

            OR LOWER(c.name) LIKE
              'indian institute of technology%'

            OR LOWER(c.name) LIKE
              'iit %'
          )
        `;
      }


      /*
      |--------------------------------------------------------------------------
      | UPTAC
      |--------------------------------------------------------------------------
      */

      if (
        examId === 'uptac'
      ) {

        query += `
          AND co.counselling_type = 'UPTAC'

          AND co.verification_status = 'VERIFIED'

          AND co.is_verified = true
        `;
      }


      /*
      |--------------------------------------------------------------------------
      | GENDER
      |--------------------------------------------------------------------------
      */

      if (
        requestedGender
      ) {

        const gender =
          normalize(
            requestedGender
          );


        /*
        |--------------------------------------------------------------------------
        | UPTAC GENDER
        |--------------------------------------------------------------------------
        */

        if (
          examId === 'uptac'
        ) {

          if (
            gender.includes(
              'female'
            )
          ) {

            query += `
              AND (
                LOWER(co.gender) LIKE '%female%'

                OR LOWER(co.gender)
                  LIKE '%both male and female%'
              )
            `;

          } else if (
            gender.includes(
              'male'
            )
          ) {

            query += `
              AND (
                LOWER(TRIM(co.gender)) =
                  'both male and female seats'
              )
            `;

          } else {

            query += `
              AND (
                LOWER(TRIM(co.gender)) =
                  'female'

                OR LOWER(TRIM(co.gender)) =
                  'both male and female seats'
              )
            `;
          }

        } else {

          /*
          |--------------------------------------------------------------------------
          | EXISTING JEE GENDER LOGIC
          |--------------------------------------------------------------------------
          */

          if (
            gender.includes(
              'female'
            )
          ) {

            query += `
              AND co.gender IN (
                'Female-only (including Supernumerary)',
                'Gender-Neutral'
              )
            `;

          } else {

            query += `
              AND co.gender =
                'Gender-Neutral'
            `;
          }
        }
      }


      /*
      |--------------------------------------------------------------------------
      | QUOTA
      |--------------------------------------------------------------------------
      */

      if (
        requestedQuota
      ) {

        params.push(
          requestedQuota
        );

        const quotaParam =
          `$${paramIndex++}`;

        query += `
          AND co.quota =
            ${quotaParam}
        `;
      }


      /*
      |--------------------------------------------------------------------------
      | ORDER
      |--------------------------------------------------------------------------
      */

      query += `
        ORDER BY
          co.closing_rank ASC,
          c.name ASC,
          b.name ASC
      `;


      /*
      |--------------------------------------------------------------------------
      | EXECUTE QUERY
      |--------------------------------------------------------------------------
      */

      console.log(
        '[COUNSELLING] Query params:',
        {
          examId,
          rank,
          year,
          round,
          category,
          quota:
            requestedQuota,
          gender:
            requestedGender,
          homeState,
          annualBudget,
        }
      );

      const { rows } =
        await pool.query(
          query,
          params
        );


      console.log(
        '[COUNSELLING] DB rows:',
        rows.length
      );


      /*
      |--------------------------------------------------------------------------
      | REMOVE DUPLICATES
      |--------------------------------------------------------------------------
      */

      const seen =
        new Set();

      const uniqueRows =
        rows.filter(
          (row) => {

            const key = [
              row.college_id,
              row.branch_id,
              row.year,
              row.round,
              row.category,
              row.quota,
              row.gender,
            ].join('|');

            if (
              seen.has(key)
            ) {
              return false;
            }

            seen.add(key);

            return true;
          }
        );


      /*
      |--------------------------------------------------------------------------
      | FINAL JEE MAIN SAFETY FILTER
      |--------------------------------------------------------------------------
      |
      | IIT can NEVER appear in JEE Main.
      |
      */

      let finalRows =
        uniqueRows;

      if (
        examId === 'jee-main'
      ) {

        finalRows =
          uniqueRows.filter(
            (row) =>
              isJeeMainInstitute(
                row.college_name,
                row.type
              )
          );
      }



      /*
      |--------------------------------------------------------------------------
      | REVIEW + SENTIMENT NORMALIZATION
      |--------------------------------------------------------------------------
      | Missing values remain NULL.
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

            /*
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
              numberOrNull(row.reviewScore),

            analyzedReviews:
              numberOrNull(row.analyzedReviews),

            reviewConfidence:
              numberOrNull(row.reviewConfidence),

            overallSentiment:
              numberOrNull(row.overallSentiment),

            googleRating:
              numberOrNull(row.googleRating),

            googleReviewCount:
              numberOrNull(row.googleReviewCount),

            googleSentiment:
              numberOrNull(row.googleSentiment),

            redditSentiment:
              numberOrNull(row.redditSentiment),

            quoraSentiment:
              numberOrNull(row.quoraSentiment),

            placementSentiment:
              numberOrNull(row.placementSentiment),

            facultySentiment:
              numberOrNull(row.facultySentiment),

            campusSentiment:
              numberOrNull(row.campusSentiment),

            hostelSentiment:
              numberOrNull(row.hostelSentiment),

            infrastructureSentiment:
              numberOrNull(row.infrastructureSentiment),

            feeRoiSentiment:
              numberOrNull(row.feeRoiSentiment),
          })
        );


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


      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */

      res.json({

        data:
          finalRows,

        meta: {

          examId,

          rank,

          year,

          round,

          category,

          quota:
            requestedQuota,

          gender:
            requestedGender,

          homeState,

          annualBudget,

          budgetWeight: 7,

          count:
            finalRows.length,
        },

      });

    } catch (error) {

      console.error(
        'COUNSELLING RESULTS ERROR:',
        error
      );

      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

export default router;