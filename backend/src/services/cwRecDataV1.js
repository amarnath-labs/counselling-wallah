import {
  pool,
} from '../db/pool.js';

import {
  getCollegeIdSqlCase,
} from './collegeIdentityResolver.js';

import {
  getCollegeReviewScore,
} from './reviewScoringService.js';

import {
  getReviewAspectInsights,
} from './reviewAspectInsightsService.js';


/* =========================================================
   HELPERS
========================================================= */

function normalize(value) {
  return String(
    value ?? ''
  )
    .trim()
    .toLowerCase();
}


function normalizeRound(
  examId,
  value
) {
  const raw =
    String(
      value ?? '1'
    )
      .trim();


  /*
  |--------------------------------------------------------------------------
  | UPTAC ROUND
  |--------------------------------------------------------------------------
  |
  | UPTAC database:
  |
  |   1
  |   2
  |   3
  |   4
  |   6
  |   7
  |
  | API may send:
  |
  |   1
  |   Round 1
  |
  | Recommendation-only normalization.
  |--------------------------------------------------------------------------
  */

  if (
    examId === 'uptac'
  ) {
    return raw
      .replace(
        /^round\s*/i,
        ''
      )
      .trim();
  }


  return raw;
}


/* =========================================================
   REAL RECOMMENDATION DATA
========================================================= */

export async function fetchCWRecRows({
  examId,
  rank,
  year,
  round,
  category = 'OPEN',
  quota = null,
  gender = null,
  limit = 250,
}) {
  const normalizedExam =
    normalize(
      examId
    );


  const studentRank =
    Number(
      rank
    );


  const targetYear =
    Number(
      year
    );


  const normalizedRound =
    normalizeRound(
      normalizedExam,
      round
    );


  const targetCategory =
    String(
      category ??
      'OPEN'
    )
      .trim();


  const parsedLimit =
    Number(
      limit
    );


  const safeLimit =
    Math.min(
      Math.max(
        Number.isFinite(
          parsedLimit
        )
          ? Math.trunc(
              parsedLimit
            )
          : 250,
        1
      ),
      1000
    );


  /* =======================================================
     VALIDATION
  ======================================================= */

  if (
    ![
      'jee-main',
      'jee-advanced',
      'uptac',
    ].includes(
      normalizedExam
    )
  ) {
    throw new Error(
      'Unsupported counselling exam'
    );
  }


  if (
    !Number.isInteger(
      studentRank
    ) ||
    studentRank <= 0
  ) {
    throw new Error(
      'Valid rank is required'
    );
  }


  if (
    !Number.isInteger(
      targetYear
    )
  ) {
    throw new Error(
      'Valid year is required'
    );
  }


  if (
    !normalizedRound
  ) {
    throw new Error(
      'Valid round is required'
    );
  }


  if (
    !targetCategory
  ) {
    throw new Error(
      'Valid category is required'
    );
  }


  /* =======================================================
     PARAMETERS
  ======================================================= */

  const params = [
    studentRank,
    targetYear,
    normalizedRound,
    targetCategory,
  ];


  let paramIndex =
    5;


  /* =======================================================
     BASE QUERY
  ======================================================= */
  const cutoffTable =
    normalizedExam === 'uptac'
      ? 'cw_rec_uptac_cutoffs_2025'
      : 'cutoffs';


  let query = `

    SELECT

      /*
      |--------------------------------------------------------------------------
      | COLLEGE
      |--------------------------------------------------------------------------
      */

      c.id
        AS college_id,

      c.name
        AS college_name,

      c.city,

      c.state,

      c.type,


      ${getCollegeIdSqlCase("c.id::text")}
        AS "reviewCollegeId",


      /*
      |--------------------------------------------------------------------------
      | BRANCH
      |--------------------------------------------------------------------------
      */

      b.id
        AS branch_id,

      b.name
        AS branch_name,


      /*
      |--------------------------------------------------------------------------
      | ADMISSION / CUTOFF
      |--------------------------------------------------------------------------
      */

      co.year,

      co.round,

      co.category,

      co.quota,

      co.gender,


      co.opening_rank
        AS "openingRank",

      co.closing_rank
        AS "closingRank",


      co.source_label
        AS source,

      co.is_verified
        AS "isVerified",

      co.verification_status
        AS "verificationStatus",

      co.source_url
        AS "sourceUrl",

      co.retrieved_at
        AS "retrievedAt",

      co.counselling_type
        AS "counsellingType",


      /*
      |--------------------------------------------------------------------------
      | QUALITY
      |--------------------------------------------------------------------------
      |
      | IMPORTANT:
      |
      | UPTAC direct quality college_id coverage = 0.
      |
      | Do NOT fake / force quality mapping.
      |
      | Quality alias mapping will be added separately.
      |--------------------------------------------------------------------------
      */

      quality_data.nirf_score
        AS "nirfScore",

      quality_data.placement_rate
        AS "placementScore",

      quality_data.median_package_score
        AS "medianPackageScore",

      quality_data.quality_confidence
        AS "qualityConfidence",


      /*
      |--------------------------------------------------------------------------
      | FEE
      |--------------------------------------------------------------------------
      */

      fee_data.fee_year
        AS "feeYear",

      fee_data.annual_cost
        AS "annualCost",

      fee_data.fee_confidence
        AS "budgetConfidence",

      fee_data.fee_verification_status
        AS "feeVerificationStatus",

      fee_data.fee_source_url
        AS "feeSourceUrl",

      fee_data.fee_source_label
        AS "feeSourceLabel",

      fee_data.fee_source_kind
        AS "feeSourceKind",


      /*
      |--------------------------------------------------------------------------
      | REVIEW
      |--------------------------------------------------------------------------
      */

      review_data.review_score
        AS "reviewScore",

      review_data.review_confidence
        AS "reviewConfidence",

      review_data.review_count
        AS "reviewCount",

      review_data.average_rating
        AS "reviewAverageRating",

      review_data.average_sentiment
        AS "reviewAverageSentiment",


      /*
      |--------------------------------------------------------------------------
      | LOCATION
      |--------------------------------------------------------------------------
      |
      | User mode determines whether location is scored.
      |--------------------------------------------------------------------------
      */

      NULL::numeric
        AS "locationScore",

      NULL::numeric
        AS "locationConfidence"


    FROM ${cutoffTable} co


    INNER JOIN branches b

      ON b.id =
         co.branch_id


    
INNER JOIN colleges c

      ON c.id =
         b.college_id


    /*
    |--------------------------------------------------------------------------
    | VERIFIED COLLEGE QUALITY
    |--------------------------------------------------------------------------
    */

    LEFT JOIN LATERAL (

      SELECT

        qm.nirf_score,

        qm.placement_rate,

        package_rank.median_package_score,

        (
          CASE
            WHEN qm.nirf_score IS NOT NULL
              THEN 60
            ELSE 0
          END

          +

          CASE
            WHEN qm.placement_rate IS NOT NULL
              THEN 20
            ELSE 0
          END

          +

          CASE
            WHEN package_rank.median_package_score IS NOT NULL
              THEN 20
            ELSE 0
          END
        )::numeric
          AS quality_confidence

      FROM
        college_quality_metrics qm


      LEFT JOIN (

        SELECT
          ranked.college_id,

          ROUND(
            (
              ranked.package_percentile *
              100.0
            )::numeric,
            2
          )
            AS median_package_score

        FROM (

          SELECT
            qm2.college_id,

            PERCENT_RANK()
              OVER (
                ORDER BY
                  qm2.median_package
              )
              AS package_percentile

          FROM
            college_quality_metrics qm2

          WHERE
            LOWER(
              COALESCE(
                qm2.verification_status,
                ''
              )
            ) =
              'verified'

            AND qm2.median_package
              IS NOT NULL

        ) ranked

      ) package_rank

        ON package_rank.college_id =
          qm.college_id


      WHERE
        qm.college_id =
          c.id

        AND LOWER(
          COALESCE(
            qm.verification_status,
            ''
          )
        ) =
          'verified'


      ORDER BY
        qm.academic_year
          DESC NULLS LAST,

        qm.retrieved_at
          DESC NULLS LAST,

        qm.id
          DESC

      LIMIT 1

    ) quality_data
      ON TRUE



    /*
    |--------------------------------------------------------------------------
    | BEST COLLEGE FEE PROFILE
    |--------------------------------------------------------------------------
    */

    LEFT JOIN LATERAL (

      SELECT

        fp.fee_year,


        COALESCE(

          fp.annual_total_fee,


          fp.annual_academic_fee,


          CASE

            WHEN
              fp.total_course_fee
                IS NOT NULL

            THEN
              ROUND(
                fp.total_course_fee /
                4.0
              )

            ELSE NULL

          END,


          CASE

            WHEN
              fp.first_semester_fee
                IS NOT NULL

            THEN
              fp.first_semester_fee *
              2

            ELSE NULL

          END,


          CASE

            WHEN
              fp.academic_fee_per_semester
                IS NOT NULL

            THEN
              fp.academic_fee_per_semester *
              2

            ELSE NULL

          END,


          CASE

            WHEN
              fp.tuition_fee_per_semester
                IS NOT NULL

            THEN
              fp.tuition_fee_per_semester *
              2

            ELSE NULL

          END

        )
          AS annual_cost,


        COALESCE(
          fp.confidence_score,
          0
        )
          AS fee_confidence,


        fp.verification_status
          AS fee_verification_status,


        fp.source_url
          AS fee_source_url,


        fp.source_kind
          AS fee_source_kind,


        NULL::text
          AS fee_source_label


      FROM
        college_fee_profiles fp


      WHERE

        fp.college_id =
        ${getCollegeIdSqlCase("c.id::text")}



        AND LOWER(
          COALESCE(
            fp.verification_status,
            ''
          )
        )
        IN (
          'verified',
          'high_confidence',
          'review_recommended'
        )


      ORDER BY

        CASE

          WHEN LOWER(
            COALESCE(
              fp.verification_status,
              ''
            )
          ) =
          'verified'
          THEN 3


          WHEN LOWER(
            COALESCE(
              fp.verification_status,
              ''
            )
          ) =
          'high_confidence'
          THEN 2


          WHEN LOWER(
            COALESCE(
              fp.verification_status,
              ''
            )
          ) =
          'review_recommended'
          THEN 1


          ELSE 0

        END DESC,


        fp.confidence_score
          DESC NULLS LAST,


        fp.fee_year
          DESC NULLS LAST,


        fp.updated_at
          DESC NULLS LAST,


        fp.id
          DESC


      LIMIT 1

    ) college_fee
      ON TRUE



    /*
    |--------------------------------------------------------------------------
    | BEST BRANCH FEE FALLBACK
    |--------------------------------------------------------------------------
    */

    LEFT JOIN LATERAL (

      SELECT

        bf.academic_year,


        bf.total_annual_fee,


        bf.tuition_fee,


        bf.hostel_fee,


        bf.other_fee,


        bf.verification_status,


        bf.source_url,


        bf.source_label


      FROM
        branch_fees bf


      WHERE

        bf.college_id =
          c.id::text


        AND (

          bf.branch_id
            IS NULL


          OR

          bf.branch_id::text =
            b.id::text

        )


      ORDER BY

        CASE

          WHEN LOWER(
            COALESCE(
              bf.verification_status,
              ''
            )
          ) =
          'verified'
          THEN 4


          WHEN LOWER(
            COALESCE(
              bf.verification_status,
              ''
            )
          ) =
          'high_confidence'
          THEN 3


          WHEN LOWER(
            COALESCE(
              bf.verification_status,
              ''
            )
          ) =
          'review_recommended'
          THEN 2


          WHEN LOWER(
            COALESCE(
              bf.verification_status,
              ''
            )
          ) =
          'pending_review'
          THEN 1


          ELSE 0

        END DESC,


        CASE

          WHEN
            bf.branch_id
              IS NOT NULL

          THEN 1

          ELSE 0

        END DESC,


        bf.academic_year
          DESC NULLS LAST,


        bf.updated_at
          DESC NULLS LAST,


        bf.id
          DESC


      LIMIT 1

    ) branch_fee
      ON TRUE



    /*
    |--------------------------------------------------------------------------
    | FINAL FEE RESOLUTION
    |--------------------------------------------------------------------------
    */

    LEFT JOIN LATERAL (

      SELECT

        COALESCE(
          college_fee.fee_year,
          branch_fee.academic_year
        )
          AS fee_year,


        COALESCE(

          college_fee.annual_cost,


          branch_fee.total_annual_fee,


          CASE

            WHEN
              branch_fee.tuition_fee
                IS NOT NULL

            THEN

              branch_fee.tuition_fee +

              COALESCE(
                branch_fee.hostel_fee,
                0
              ) +

              COALESCE(
                branch_fee.other_fee,
                0
              )

            ELSE NULL

          END

        )
          AS annual_cost,


        CASE

          WHEN
            college_fee.annual_cost
              IS NOT NULL

          THEN
            college_fee.fee_confidence


          WHEN
            branch_fee.total_annual_fee
              IS NOT NULL

          THEN
            CASE

              WHEN LOWER(
                COALESCE(
                  branch_fee.verification_status,
                  ''
                )
              ) =
              'verified'
              THEN 95


              WHEN LOWER(
                COALESCE(
                  branch_fee.verification_status,
                  ''
                )
              ) =
              'high_confidence'
              THEN 85


              WHEN LOWER(
                COALESCE(
                  branch_fee.verification_status,
                  ''
                )
              ) =
              'review_recommended'
              THEN 70


              ELSE 50

            END


          ELSE 0

        END
          AS fee_confidence,


        COALESCE(
          college_fee.fee_verification_status,
          branch_fee.verification_status
        )
          AS fee_verification_status,


        COALESCE(
          college_fee.fee_source_url,
          branch_fee.source_url
        )
          AS fee_source_url,


        branch_fee.source_label
          AS fee_source_label,


        CASE

          WHEN
            college_fee.annual_cost
              IS NOT NULL

          THEN
            'college_fee_profile'


          WHEN
            branch_fee.total_annual_fee
              IS NOT NULL

          THEN
            'branch_fee'


          ELSE NULL

        END
          AS fee_source_kind

    ) fee_data
      ON TRUE



    /*
    |--------------------------------------------------------------------------
    | REVIEW AGGREGATION
    |--------------------------------------------------------------------------
    |
    | Only real rows from college_reviews.
    |
    | No fabricated review score.
    |
    | Rating:
    |   0-5
    |
    | Converted score:
    |   rating / 5 * 100
    |--------------------------------------------------------------------------
    */

    LEFT JOIN LATERAL (

      SELECT

        CASE

          WHEN
            COUNT(*) FILTER (
              WHERE
                cr.rating
                  IS NOT NULL
            ) > 0

          THEN

            ROUND(
              (
                AVG(
                  cr.rating
                )
                FILTER (
                  WHERE
                    cr.rating
                      IS NOT NULL
                )
                /
                5.0
              )
              *
              100,
              2
            )

          ELSE NULL

        END
          AS review_score,


        /*
        --------------------------------------------------------
        Review confidence is evidence-based.

        We do NOT invent a star rating when missing.

        Confidence grows only with actual stored review count.
        --------------------------------------------------------
        */

        CASE

          WHEN
            COUNT(*) = 0
          THEN 0


          WHEN
            COUNT(*) >= 20
          THEN 90


          WHEN
            COUNT(*) >= 10
          THEN 80


          WHEN
            COUNT(*) >= 5
          THEN 70


          WHEN
            COUNT(*) >= 3
          THEN 60


          ELSE 45

        END
          AS review_confidence,


        COUNT(*)::int
          AS review_count,


        ROUND(
          AVG(
            cr.rating
          ),
          2
        )
          AS average_rating,


        ROUND(
          AVG(
            cr.sentiment_score
          ),
          4
        )
          AS average_sentiment


      FROM
        college_reviews cr


      WHERE

        cr.college_id =
          c.id::text


        AND cr.rating
          IS NOT NULL

    ) review_data
      ON TRUE



    /*
    |--------------------------------------------------------------------------
    | CUTOFF FILTER
    |--------------------------------------------------------------------------
    */

    WHERE

      co.year = $2


      AND co.round = $3


      AND co.category = $4


      AND co.closing_rank >= CEIL($1 * 0.85)

  `;


  /* =======================================================
     JEE MAIN
  ======================================================= */

  if (
    normalizedExam ===
    'jee-main'
  ) {
    query += `

      AND co.counselling_type
        IN (
          'JOSAA',
          'CSAB_SPECIAL',
          'CSAB_SUPERNUMERARY',
          'CSAB_NEUT'
        )

      AND co.verification_status =
        'VERIFIED'

      AND co.is_verified =
        true

      AND co.opening_rank
        IS NOT NULL

      AND co.closing_rank
        IS NOT NULL

      AND co.opening_rank <=
        co.closing_rank




      AND (

        LOWER(c.type)
          IN (
            'nit',
            'iiit',
            'gfti',
            'gftis'
          )


        OR LOWER(c.name)
          LIKE
          'national institute of technology%'


        OR LOWER(c.name)
          LIKE
          '%indian institute of information technology%'

      )


      AND LOWER(c.type)
        <> 'iit'


      AND LOWER(c.name)
        NOT LIKE
        'indian institute of technology%'


      AND LOWER(c.name)
        NOT LIKE
        'iit %'

    `;
  }


  /* =======================================================
     JEE ADVANCED
  ======================================================= */

  if (
    normalizedExam ===
    'jee-advanced'
  ) {
    query += `

      AND co.counselling_type
        IN (
          'JOSAA',
          'CSAB_SPECIAL',
          'CSAB_SUPERNUMERARY',
          'CSAB_NEUT'
        )

      AND co.verification_status =
        'VERIFIED'

      AND co.is_verified =
        true

      AND co.opening_rank
        IS NOT NULL

      AND co.closing_rank
        IS NOT NULL

      AND co.opening_rank <=
        co.closing_rank




      AND (

        LOWER(c.type) =
          'iit'


        OR LOWER(c.name)
          LIKE
          'indian institute of technology%'


        OR LOWER(c.name)
          LIKE
          'iit %'

      )

    `;
  }


  /* =======================================================
     UPTAC
  ======================================================= */

  if (
    normalizedExam ===
    'uptac'
  ) {
    query += `

      AND co.counselling_type =
        'UPTAC'


      AND co.verification_status =
        'VERIFIED'


      AND co.is_verified =
        true

    `;
  }


  /* =======================================================
     OPTIONAL QUOTA
  ======================================================= */

  if (
    quota
  ) {
    params.push(
      String(
        quota
      ).trim()
    );


    const quotaParam =
      `$${paramIndex++}`;


    query += `

      AND co.quota =
        ${quotaParam}

    `;
  }


  /* =======================================================
     OPTIONAL GENDER
  ======================================================= */

  if (
    gender
  ) {
    const requestedGender =
      normalize(
        gender
      );


    if (
      normalizedExam ===
      'uptac'
    ) {
      if (
        requestedGender
          .includes(
            'female'
          )
      ) {
        query += `

          AND (

            LOWER(
              COALESCE(
                co.gender,
                ''
              )
            )
              LIKE '%female%'


            OR


            LOWER(
              COALESCE(
                co.gender,
                ''
              )
            )
              LIKE
              '%both male and female%'

          )

        `;
      }


      else if (
        requestedGender
          .includes(
            'male'
          )
      ) {
        query += `

          AND LOWER(
            TRIM(
              COALESCE(
                co.gender,
                ''
              )
            )
          ) =
          'both male and female seats'

        `;
      }
    }


    else {
      if (
        requestedGender
          .includes(
            'female'
          )
      ) {
        query += `

          AND co.gender
            IN (
              'Female-only (including Supernumerary)',
              'Gender-Neutral'
            )

        `;
      }


      else {
        query += `

          AND co.gender =
            'Gender-Neutral'

        `;
      }
    }
  }


  /* =======================================================
     SORT + LIMIT
  ======================================================= */

  params.push(
    safeLimit
  );


  const limitParam =
    `$${paramIndex++}`;


  query += `

    ORDER BY

      co.closing_rank ASC,

      c.name ASC,

      b.name ASC


    LIMIT
      ${limitParam}

  `;


  /* =======================================================
     EXECUTE
  ======================================================= */

  const {
    rows,
  } =
    await pool.query(
      query,
      params
    );


  /* =======================================================
     DEDUPE
  ======================================================= */

  const seen =
    new Set();


  const unique =
    rows.filter(
      (row) => {
        const key =
          [
            row.college_id,
            row.branch_id,
            row.year,
            row.round,
            row.category,
            row.quota,
            row.gender,
            row.counsellingType,
          ].join(
            '|'
          );


        if (
          seen.has(
            key
          )
        ) {
          return false;
        }


        seen.add(
          key
        );


        return true;
      }
    );
  /* =======================================================
     V3 REVIEW INTELLIGENCE ENRICHMENT
  ======================================================= */

  const reviewCache =
    new Map();

  for (
    const row of unique
  ) {
    const reviewCollegeId =
      row.reviewCollegeId ||
      row.college_id;

    const requestedBranch =
      row.branch_name ||
      null;

    const cacheKey =
      [
        reviewCollegeId,
        requestedBranch ?? '',
      ].join('|');

    let reviewV3 =
      reviewCache.get(
        cacheKey
      );

    if (
      reviewV3 === undefined
    ) {
      try {
        reviewV3 =
          await getCollegeReviewScore(
            pool,
            {
              collegeId:
                reviewCollegeId,

              branch:
                requestedBranch,
            }
          );
      } catch (error) {
        console.error(
          '[CW-REC REVIEW V3]',
          reviewCollegeId,
          requestedBranch,
          error.message
        );

        reviewV3 =
          null;
      }

      reviewCache.set(
        cacheKey,
        reviewV3
      );
    }

    if (
      reviewV3?.reviewScore !== null &&
      reviewV3?.reviewScore !== undefined
    ) {
      row.reviewScore =
        reviewV3.reviewScore;

      row.reviewConfidence =
        reviewV3.confidence ?? 0;

      row.reviewCount =
        Number(
          reviewV3.evidence
            ?.sentimentEvidence || 0
        ) +
        Number(
          reviewV3.evidence
            ?.aggregateEvidence || 0
        );

      row.reviewAverageSentiment =
        reviewV3.sentimentScore ??
        null;

      row.reviewIntelligenceV3 = {
        version:
          '3',

        score:
          reviewV3.reviewScore,

        component:
          Math.round(
            (
              Number(
                reviewV3.reviewScore
              ) /
              100
            ) *
            10 *
            100
          ) /
          100,

        confidence:
          reviewV3.confidence ?? 0,

        sentimentScore:
          reviewV3.sentimentScore ??
          null,

        aggregateScore:
          reviewV3.aggregateScore ??
          null,

        requestedBranch:
          reviewV3.requestedBranch ??
          requestedBranch,

        evidence:
          reviewV3.evidence ??
          null,
      };

      /*
      |--------------------------------------------------------------------------
      | DISPLAY-ONLY REVIEW ASPECT INTELLIGENCE
      |--------------------------------------------------------------------------
      |
      | This DOES NOT alter:
      | - reviewScore
      | - CW-REC weighting
      | - overall match
      | - recommendation order
      |
      */

      try {
        const aspectInsights =
          await getReviewAspectInsights(
            pool,
            {
              collegeId:
                reviewCollegeId,

              branch:
                requestedBranch,
            }
          );

        if (
          aspectInsights
        ) {
          row.reviewIntelligenceV3 = {
            ...row.reviewIntelligenceV3,

            strengths:
              aspectInsights
                .strengths ??
              [],

            concerns:
              aspectInsights
                .concerns ??
              [],

            mixedAspects:
              aspectInsights
                .mixedAspects ??
              [],

            missingAspects:
              aspectInsights
                .missingAspects ??
              [],

            aspects:
              aspectInsights
                .aspects ??
              {},

            insightEvidence:
              aspectInsights
                .insightEvidence ??
              null,

            aspectInsightsApplied:
              true,
          };
        }
      } catch (aspectError) {
        console.error(
          '[CW-REC REVIEW ASPECT INSIGHTS]',
          reviewCollegeId,
          requestedBranch,
          aspectError.message
        );
      }
    }
  }


  /* =======================================================
     RESPONSE
  ======================================================= */

  return {
    rows:
      unique,


    meta: {
      examId:
        normalizedExam,


      rank:
        studentRank,


      year:
        targetYear,


      round:
        normalizedRound,


      category:
        targetCategory,


      quota:
        quota ??
        null,


      gender:
        gender ??
        null,


      count:
        unique.length,


      service:
        'CW-REC-1.0',


      recommendationOnly:
        true,


      enrichment: {
        admission:
          true,

        fees:
          true,

        reviews:
          true,

        quality:
          true,

        qualityReason:
          'Verified direct college quality mapping; missing colleges remain unavailable',
      },
    },
  };
}












