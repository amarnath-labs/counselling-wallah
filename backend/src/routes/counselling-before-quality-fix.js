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

function numberOrNull(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
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

  if (ratio <= 1) {
    return 100;
  }

  if (ratio <= 1.10) {
    return 80;
  }

  if (ratio <= 1.25) {
    return 55;
  }

  return 20;
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
      | Frontend may send:
      |
      |   round=1
      |
      | UPTAC DB stores:
      |
      |   Round 1
      |
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

            annualBudget,

            count: 0,

            message:
              `${examId} data is not available yet.`,
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

          /*
          |--------------------------------------------------------------------------
          | COLLEGE QUALITY METRICS
          |--------------------------------------------------------------------------
          */

          cqm.nirf_rank AS "nirfRank",
          cqm.nirf_score AS "nirfScore",
          cqm.accreditation AS accreditation,
          cqm.median_package AS "qualityMedianPackage",
          cqm.average_package AS "qualityAveragePackage",
          cqm.highest_package AS "qualityHighestPackage",
          cqm.placement_rate AS "qualityPlacementRate",
          cqm.academic_year AS "qualityAcademicYear",
          cqm.source_label AS "qualitySourceLabel",
          cqm.source_url AS "qualitySourceUrl",
          cqm.verification_status AS "qualityVerificationStatus",

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
          co.counselling_type AS "counsellingType",

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
          css.fee_roi_sentiment AS "feeRoiSentiment",

          /*
          |--------------------------------------------------------------------------
          | FEE DATA
          |--------------------------------------------------------------------------
          |
          | Priority:
          |
          | 1. college_fee_profiles
          | 2. branch_fees
          |
          */

          COALESCE(
            cfp.fee_year,
            bf.academic_year
          ) AS "feeYear",

          COALESCE(
            cfp.tuition_fee_per_semester,
            bf.tuition_fee
          ) AS "tuitionFeePerSemester",

          cfp.academic_fee_per_semester
            AS "academicFeePerSemester",

          cfp.first_semester_fee
            AS "firstSemesterFee",

          cfp.hostel_fee_per_semester
            AS "collegeHostelFeePerSemester",

          cfp.mess_fee_per_semester
            AS "messFeePerSemester",

          COALESCE(
            cfp.annual_academic_fee,
            bf.total_annual_fee
          ) AS "annualAcademicFee",

          cfp.annual_total_fee
            AS "collegeAnnualTotalFee",

          cfp.total_course_fee
            AS "totalCourseFee",

          COALESCE(
            cfp.confidence_score,
            CASE
              WHEN LOWER(
                COALESCE(
                  bf.verification_status,
                  ''
                )
              ) = 'verified'
                THEN 100
              ELSE NULL
            END
          ) AS "feeConfidence",

          COALESCE(
            cfp.verification_status,
            bf.verification_status
          ) AS "feeVerificationStatus",

          COALESCE(
            cfp.source_url,
            bf.source_url
          ) AS "feeSourceUrl",

          COALESCE(
            c
            bf.source_label
          ) AS "feeSourceLabel",

          bf.hostel_fee
            AS "hostelFee",

          bf.other_fee
            AS "otherFee",

          bf.total_annual_fee
            AS "totalAnnualFee"

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
        | VERIFIED COLLEGE QUALITY
        |--------------------------------------------------------------------------
        |
        | Canonical IDs are preferred. Legacy short NIT IDs are mapped only
        | as a compatibility fallback.
        |
        */

        LEFT JOIN LATERAL (

          SELECT
            qm.nirf_rank,
            qm.nirf_score,
            qm.accreditation,
            qm.median_package,
            qm.average_package,
            qm.highest_package,
            qm.placement_rate,
            qm.academic_year,
            qm.source_label,
            qm.source_url,
            qm.verification_status,
            qm.retrieved_at

          FROM college_quality_metrics qm

          WHERE
            qm.college_id =
              CASE
                WHEN c.id = 'nit-surathkal'
                  THEN 'national-institute-of-technology-karnataka-surathkal'
                WHEN c.id = 'nit-warangal'
                  THEN 'national-institute-of-technology-warangal'
                ELSE c.id::text
              END

          ORDER BY
            CASE
              WHEN LOWER(COALESCE(qm.verification_status, '')) = 'verified'
                THEN 3
              WHEN LOWER(COALESCE(qm.verification_status, '')) = 'high_confidence'
                THEN 2
              ELSE 1
            END DESC,
            qm.academic_year DESC NULLS LAST,
            qm.retrieved_at DESC NULLS LAST,
            qm.id DESC

          LIMIT 1

        ) cqm ON TRUE

        /*
        |--------------------------------------------------------------------------
        | BEST AVAILABLE COLLEGE FEE PROFILE
        |--------------------------------------------------------------------------
        */

        LEFT JOIN LATERAL (

          SELECT
            fp.fee_year,

            fp.tuition_fee_per_semester,
            fp.academic_fee_per_semester,
            fp.first_semester_fee,
            fp.hostel_fee_per_semester,
            fp.mess_fee_per_semester,

            fp.annual_academic_fee,
            fp.annual_total_fee,
            fp.total_course_fee,

            fp.confidence_score,
            fp.verification_status,
            fp.source_url,
            fp.source_label

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

            fp.fee_year DESC,

            fp.updated_at DESC NULLS LAST,

            fp.id DESC

          LIMIT 1

        ) cfp ON TRUE


        /*
        |--------------------------------------------------------------------------
        | BRANCH / PROGRAM FEE FALLBACK
        |--------------------------------------------------------------------------
        */

        LEFT JOIN LATERAL (

          SELECT
            bf2.academic_year,
            bf2.tuition_fee,
            bf2.hostel_fee,
            bf2.other_fee,
            bf2.total_annual_fee,

            bf2.verification_status,
            bf2.source_url,
            bf2.source_label,
            bf2.fee_scope,

            bf2.updated_at

          FROM branch_fees bf2

          WHERE
            bf2.college_id = c.id::text

            AND (
              bf2.branch_id IS NULL

              OR bf2.branch_id::text =
                 b.id::text
            )

          ORDER BY

            CASE

              WHEN LOWER(
                COALESCE(
                  bf2.verification_status,
                  ''
                )
              ) = 'verified'
                THEN 4

              WHEN LOWER(
                COALESCE(
                  bf2.verification_status,
                  ''
                )
              ) = 'high_confidence'
                THEN 3

              WHEN LOWER(
                COALESCE(
                  bf2.verification_status,
                  ''
                )
              ) = 'review_recommended'
                THEN 2

              WHEN LOWER(
                COALESCE(
                  bf2.verification_status,
                  ''
                )
              ) = 'pending_review'
                THEN 1

              ELSE 0

            END DESC,

            CASE
              WHEN bf2.branch_id IS NOT NULL
                THEN 1
              ELSE 0
            END DESC,

            bf2.academic_year DESC,

            bf2.updated_at DESC

          LIMIT 1

        ) bf ON TRUE


        WHERE
          co.year = $2

          AND co.round = $3

          AND co.category = $4

          /*
          | Do not require opening_rank <= student rank.
          | Closing rank is the historical eligibility boundary.
          */

          AND co.closing_rank >= $1
      `;


      /*
      |--------------------------------------------------------------------------
      | JEE MAIN
      |--------------------------------------------------------------------------
      */

      if (
        examId === 'jee-main'
      ) {

        query += `
          AND co.counselling_type IN (
            'JOSAA',
            'CSAB_SPECIAL',
            'CSAB_SUPERNUMERARY',
            'CSAB_NEUT'
          )

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
      */

      if (
        examId === 'jee-advanced'
      ) {

        query += `
          AND co.counselling_type IN (
            'JOSAA',
            'CSAB_SPECIAL',
            'CSAB_SUPERNUMERARY',
            'CSAB_NEUT'
          )

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
              AND LOWER(TRIM(co.gender)) =
                'both male and female seats'
            `;

          }

        } else {

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
      | EXECUTE
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
              row.counsellingType,
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
      | NORMALIZE FEE VALUES
      |--------------------------------------------------------------------------
      */

      finalRows =
        finalRows.map(
          (row) => ({
            ...row,

            feeYear:
              numberOrNull(
                row.feeYear
              ),

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

            collegeHostelFeePerSemester:
              numberOrNull(
                row.collegeHostelFeePerSemester
              ),

            messFeePerSemester:
              numberOrNull(
                row.messFeePerSemester
              ),

            annualAcademicFee:
              numberOrNull(
                row.annualAcademicFee
              ),

            collegeAnnualTotalFee:
              numberOrNull(
                row.collegeAnnualTotalFee
              ),

            totalCourseFee:
              numberOrNull(
                row.totalCourseFee
              ),

            hostelFee:
              numberOrNull(
                row.hostelFee
              ),

            otherFee:
              numberOrNull(
                row.otherFee
              ),

            totalAnnualFee:
              numberOrNull(
                row.totalAnnualFee
              ),

            feeConfidence:
              numberOrNull(
                row.feeConfidence
              ),
          })
        );


      /*
      |--------------------------------------------------------------------------
      | DISPLAY FEE + BUDGET FEE
      |--------------------------------------------------------------------------
      |
      | displayFee:
      |   Best fee value for frontend display.
      |
      | estimatedAnnualBudgetFee:
      |   Annualized value used for budget scoring.
      |
      */

      finalRows =
        finalRows.map(
          (row) => {

            let displayFee =
              null;

            let displayFeePeriod =
              null;

            let estimatedAnnualBudgetFee =
              null;

            let feeCoverage =
              null;


            /*
            | 1. Exact annual total from college profile
            */

            if (
              row.collegeAnnualTotalFee !== null
            ) {

              displayFee =
                row.collegeAnnualTotalFee;

              displayFeePeriod =
                'annual';

              estimatedAnnualBudgetFee =
                row.collegeAnnualTotalFee;

              feeCoverage =
                'annual_total';
            }


            /*
            | 2. Exact annual total from branch fee
            */

            else if (
              row.totalAnnualFee !== null
            ) {

              displayFee =
                row.totalAnnualFee;

              displayFeePeriod =
                'annual';

              estimatedAnnualBudgetFee =
                row.totalAnnualFee;

              feeCoverage =
                'annual_total';
            }


            /*
            | 3. Annual academic amount
            */

            else if (
              row.annualAcademicFee !== null
            ) {

              displayFee =
                row.annualAcademicFee;

              displayFeePeriod =
                'annual';

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


            /*
            | 4. Total course fee
            |
            | Keep the exact source value for display.
            | Only annualize it for budget calculation.
            |
            | Current imported records are B.Tech.
            | 4-year annualization is therefore only
            | a budget estimate, not a source-reported fee.
            */

            else if (
              row.totalCourseFee !== null
            ) {

              displayFee =
                row.totalCourseFee;

              displayFeePeriod =
                'course_total';

              estimatedAnnualBudgetFee =
                Math.round(
                  row.totalCourseFee / 4
                );

              feeCoverage =
                'course_total_estimated_annual';
            }


            /*
            | 5. First-semester fallback
            */

            else if (
              row.firstSemesterFee !== null
            ) {

              displayFee =
                row.firstSemesterFee;

              displayFeePeriod =
                'first_semester';

              estimatedAnnualBudgetFee =
                row.firstSemesterFee * 2;

              feeCoverage =
                'first_semester_estimated_annual';
            }


            /*
            | 6. Semester academic/tuition fallback
            */

            else if (
              row.academicFeePerSemester !== null
            ) {

              displayFee =
                row.academicFeePerSemester;

              displayFeePeriod =
                'semester';

              estimatedAnnualBudgetFee =
                row.academicFeePerSemester * 2;

              feeCoverage =
                'semester_academic_estimated_annual';
            }

            else if (
              row.tuitionFeePerSemester !== null
            ) {

              displayFee =
                row.tuitionFeePerSemester;

              displayFeePeriod =
                'semester';

              estimatedAnnualBudgetFee =
                row.tuitionFeePerSemester * 2;

              feeCoverage =
                'semester_tuition_estimated_annual';
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

              /*
              | FRONTEND-SAFE FEE FIELDS
              */

              displayFee,
              displayFeePeriod,

              estimatedAnnualBudgetFee,
              feeCoverage,

              hasFeeData:
                displayFee !== null,

              studentAnnualBudget:
                annualBudget,

              budgetScore,

              weightedBudgetScore,

              budgetWeight:
                7,

              budgetDifference,

              budgetStatus,
            };
          }
        );


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

          budgetWeight:
            7,

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

