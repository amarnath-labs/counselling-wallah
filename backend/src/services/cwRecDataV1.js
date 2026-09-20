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
    [
      'uptac',
      'csab',
    ].includes(
      examId
    )
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


function numberOrNull(value) {
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
}


function buildHistoricalAdmissionFit({
  studentRank,
  r1OpeningRank,
  lastRoundClosingRank,
}) {
  const rank =
    numberOrNull(studentRank);


  const opening =
    numberOrNull(r1OpeningRank);


  const closing =
    numberOrNull(lastRoundClosingRank);


  if (
    rank === null ||
    closing === null
  ) {
    return {
      bucket: 'target',
      label: 'Target',
      position: null,
      r1OpeningRank:
        opening,
      lastRoundClosingRank:
        closing,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | FINAL ADMISSION BUCKET
  |--------------------------------------------------------------------------
  |
  | Single source of truth:
  |
  |   Round-1 opening rank
  |           +
  |   last-round closing rank
  |
  | Smaller rank is better.
  |--------------------------------------------------------------------------
  */

  if (
    opening !== null &&
    closing > opening
  ) {
    const position =
      (rank - opening) /
      (closing - opening);


    if (position <= 0) {
      return {
        bucket: 'backup',
        label: 'Backup',
        position,
        r1OpeningRank:
          opening,
        lastRoundClosingRank:
          closing,
      };
    }


    if (position <= 0.60) {
      return {
        bucket: 'safe',
        label: 'Safe',
        position,
        r1OpeningRank:
          opening,
        lastRoundClosingRank:
          closing,
      };
    }


    if (position <= 1) {
      return {
        bucket: 'target',
        label: 'Target',
        position,
        r1OpeningRank:
          opening,
        lastRoundClosingRank:
          closing,
      };
    }


    return {
      bucket: 'dream',
      label: 'Dream',
      position,
      r1OpeningRank:
        opening,
      lastRoundClosingRank:
        closing,
    };
  }


  /*
  |--------------------------------------------------------------------------
  | FALLBACK
  |--------------------------------------------------------------------------
  | Used only when a valid R1 opening rank is not available.
  |--------------------------------------------------------------------------
  */

  const ratio =
    rank / closing;


  if (ratio <= 0.60) {
    return {
      bucket: 'backup',
      label: 'Backup',
      position: null,
      r1OpeningRank:
        opening,
      lastRoundClosingRank:
        closing,
    };
  }


  if (ratio <= 0.85) {
    return {
      bucket: 'safe',
      label: 'Safe',
      position: null,
      r1OpeningRank:
        opening,
      lastRoundClosingRank:
        closing,
    };
  }


  if (ratio <= 1) {
    return {
      bucket: 'target',
      label: 'Target',
      position: null,
      r1OpeningRank:
        opening,
      lastRoundClosingRank:
        closing,
    };
  }


  return {
    bucket: 'dream',
    label: 'Dream',
    position: null,
    r1OpeningRank:
      opening,
    lastRoundClosingRank:
      closing,
  };
}


const REVIEW_ENRICHMENT_CONCURRENCY =
  12;


async function mapWithConcurrency(
  items,
  concurrency,
  worker
) {
  const safeConcurrency =
    Math.max(
      1,
      Math.min(
        Number(concurrency) || 1,
        items.length || 1
      )
    );


  let nextIndex =
    0;


  const runners =
    Array.from(
      {
        length:
          safeConcurrency,
      },
      async () => {
        while (true) {
          const index =
            nextIndex++;


          if (index >= items.length) {
            return;
          }


          await worker(
            items[index],
            index
          );
        }
      }
    );


  await Promise.all(
    runners
  );
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
  homeState = null,
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
      'csab',
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


      history_data.r1_opening_rank
        AS "r1OpeningRank",

      history_data.last_round_closing_rank
        AS "lastRoundClosingRank",

      history_data.last_round_number
        AS "lastRoundNumber",


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

      quality_data.nirf_rank
        AS "nirfRank",

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
    | HISTORICAL ADMISSION RANGE
    |--------------------------------------------------------------------------
    |
    | R1 opening + final available round closing for the same seat pool.
    | This is the canonical source used by Dream/Target/Safe/Backup.
    |--------------------------------------------------------------------------
    */

    LEFT JOIN LATERAL (

      SELECT

        MIN(
          CASE
            WHEN
              NULLIF(
                REGEXP_REPLACE(
                  LOWER(
                    COALESCE(
                      h.round::text,
                      ''
                    )
                  ),
                  '[^0-9]',
                  '',
                  'g'
                ),
                ''
              )::int = 1

            THEN
              h.opening_rank

            ELSE NULL
          END
        )
          AS r1_opening_rank,


        (
          ARRAY_AGG(
            h.closing_rank

            ORDER BY
              NULLIF(
                REGEXP_REPLACE(
                  LOWER(
                    COALESCE(
                      h.round::text,
                      ''
                    )
                  ),
                  '[^0-9]',
                  '',
                  'g'
                ),
                ''
              )::int DESC NULLS LAST
          )
          FILTER (
            WHERE
              h.closing_rank
                IS NOT NULL
          )
        )[1]
          AS last_round_closing_rank,


        MAX(
          NULLIF(
            REGEXP_REPLACE(
              LOWER(
                COALESCE(
                  h.round::text,
                  ''
                )
              ),
              '[^0-9]',
              '',
              'g'
            ),
            ''
          )::int
        )
          AS last_round_number


      FROM ${cutoffTable} h


      WHERE
        h.branch_id =
          co.branch_id

        AND h.year =
          co.year

        AND h.category =
          co.category

        AND COALESCE(
          h.quota,
          ''
        ) =
        COALESCE(
          co.quota,
          ''
        )

        AND COALESCE(
          h.gender,
          ''
        ) =
        COALESCE(
          co.gender,
          ''
        )

        AND COALESCE(
          h.counselling_type,
          ''
        ) =
        COALESCE(
          co.counselling_type,
          ''
        )

        AND COALESCE(
          h.is_verified,
          true
        ) = true

    ) history_data
      ON TRUE


    /*
    |--------------------------------------------------------------------------
    | VERIFIED COLLEGE QUALITY
    |--------------------------------------------------------------------------
    */

    LEFT JOIN LATERAL (

      SELECT

        qm.nirf_rank,

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

  `;


  /* =======================================================
     JEE MAIN
  ======================================================= */

  if (
    normalizedExam ===
    'jee-main'
  ) {
    query += `

      AND co.counselling_type =
        'JOSAA'

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

      AND co.counselling_type =
        'JOSAA'

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


  /*
=======================================================
     CSAB SPECIAL
======================================================= */

  if (
    normalizedExam ===
    'csab'
  ) {
    query += `

      AND co.counselling_type =
        'CSAB_SPECIAL'

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

    `;
  }


  /*
=======================================================
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
     UPTAC HOME-STATE QUOTA ELIGIBILITY
  ======================================================= */

  let effectiveQuota =
    quota
      ? String(quota).trim()
      : null;


  if (
    normalizedExam === 'uptac' &&
    !effectiveQuota &&
    homeState
  ) {
    const normalizedHomeState =
      normalize(
        homeState
      );


    const isUttarPradesh =
      normalizedHomeState === 'uttar pradesh' ||
      normalizedHomeState === 'up' ||
      normalizedHomeState === 'u p';


    effectiveQuota =
      isUttarPradesh
        ? 'Home State'
        : 'All India';
  }


  /* =======================================================
     JOSAA HOME-STATE QUOTA ELIGIBILITY
  ======================================================= */

  if (
    [
      'jee-main',
      'jee-advanced',
    ].includes(
      normalizedExam
    ) &&
    !effectiveQuota &&
    homeState
  ) {
    params.push(
      String(homeState).trim()
    );


    const homeStateParam =
      `$${paramIndex++}`;


    query += `

      AND (

        co.quota = 'AI'

        OR (
          co.quota = 'HS'
          AND LOWER(TRIM(c.state::text)) =
              LOWER(TRIM(${homeStateParam}::text))
        )

        OR (
          co.quota = 'OS'
          AND LOWER(TRIM(c.state::text)) <>
              LOWER(TRIM(${homeStateParam}::text))
        )

      )

    `;
  }


  /*
=======================================================
     CSAB HOME-STATE QUOTA ELIGIBILITY
======================================================= */

  if (
    normalizedExam === 'csab' &&
    !effectiveQuota &&
    homeState
  ) {
    params.push(
      String(homeState).trim()
    );


    const csabHomeStateParam =
      `$${paramIndex++}`;


    query += `

      AND (

        co.quota =
          'All India'


        OR (

          co.quota =
            'Home State'

          AND LOWER(
            TRIM(
              c.state::text
            )
          ) =
          LOWER(
            TRIM(
              ${csabHomeStateParam}::text
            )
          )

        )


        OR (

          co.quota =
            'Other State'

          AND LOWER(
            TRIM(
              c.state::text
            )
          ) <>
          LOWER(
            TRIM(
              ${csabHomeStateParam}::text
            )
          )

        )


        OR (

          co.quota =
            'Home State for Goa'

          AND LOWER(
            TRIM(
              ${csabHomeStateParam}::text
            )
          ) =
            'goa'

        )


        OR (

          co.quota =
            'Jammu & Kashmir (UT)'

          AND LOWER(
            TRIM(
              ${csabHomeStateParam}::text
            )
          ) IN (
            'jammu and kashmir',
            'jammu & kashmir',
            'j&k',
            'jk'
          )

        )


        OR (

          co.quota =
            'Ladakh (UT)'

          AND LOWER(
            TRIM(
              ${csabHomeStateParam}::text
            )
          ) =
            'ladakh'

        )

      )

    `;
  }


  /*
=======================================================
     OPTIONAL QUOTA
======================================================= */

  if (
    effectiveQuota
  ) {
    params.push(
      effectiveQuota
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

      ABS(
        COALESCE(
          history_data.last_round_closing_rank,
          co.closing_rank,
          $1
        ) - $1
      ) ASC,

      COALESCE(
        history_data.last_round_closing_rank,
        co.closing_rank
      ) DESC NULLS LAST,

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
     CANONICAL ADMISSION BUCKET
  ======================================================= */

  for (
    const row of unique
  ) {
    const historicalFit =
      buildHistoricalAdmissionFit({
        studentRank,

        r1OpeningRank:
          row.r1OpeningRank,

        lastRoundClosingRank:
          row.lastRoundClosingRank ??
          row.closingRank,
      });


    /*
    |--------------------------------------------------------------------------
    | SINGLE SOURCE OF TRUTH
    |--------------------------------------------------------------------------
    | Every downstream UI/service can consume the same bucket.
    |--------------------------------------------------------------------------
    */

    row.bucket =
      historicalFit.bucket;


    row.admissionBucket = {
      key:
        historicalFit.bucket,

      label:
        historicalFit.label,
    };


    row.admission = {
      ...(row.admission || {}),

      bucket:
        historicalFit.bucket,

      label:
        historicalFit.label,

      r1OpeningRank:
        historicalFit.r1OpeningRank,

      lastRoundClosingRank:
        historicalFit.lastRoundClosingRank,

      lastRoundNumber:
        numberOrNull(
          row.lastRoundNumber
        ),

      historicalPosition:
        historicalFit.position,
    };


    row.historicalFit = {
      bucket:
        historicalFit.bucket,

      label:
        historicalFit.label,

      r1OpeningRank:
        historicalFit.r1OpeningRank,

      lastRoundClosingRank:
        historicalFit.lastRoundClosingRank,

      lastRoundNumber:
        numberOrNull(
          row.lastRoundNumber
        ),

      position:
        historicalFit.position,
    };
  }


  /* =======================================================
     V3 REVIEW INTELLIGENCE ENRICHMENT
  ======================================================= */

  const reviewCache =
    new Map();


  const aspectCache =
    new Map();


  await mapWithConcurrency(
    unique.slice(
      0,
      60
    ),
    REVIEW_ENRICHMENT_CONCURRENCY,
    async (row) => {
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


      let reviewPromise =
        reviewCache.get(
          cacheKey
        );


      if (!reviewPromise) {
        reviewPromise =
          getCollegeReviewScore(
            pool,
            {
              collegeId:
                reviewCollegeId,

              branch:
                requestedBranch,
            }
          )
            .catch(
              (error) => {
                console.error(
                  '[CW-REC REVIEW V3]',
                  reviewCollegeId,
                  requestedBranch,
                  error.message
                );


                return null;
              }
            );


        reviewCache.set(
          cacheKey,
          reviewPromise
        );
      }


      const reviewV3 =
        await reviewPromise;


      if (
        reviewV3?.reviewScore === null ||
        reviewV3?.reviewScore === undefined
      ) {
        return;
      }


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
      | Does not change review score, CW-REC weights, bucket or ordering.
      |--------------------------------------------------------------------------
      */

      let aspectPromise =
        aspectCache.get(
          cacheKey
        );


      if (!aspectPromise) {
        aspectPromise =
          Promise.resolve(
            null
          );


        aspectCache.set(
          cacheKey,
          aspectPromise
        );
      }


      const aspectInsights =
        await aspectPromise;


      if (aspectInsights) {
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
    }
  );

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

        admissionBasis:
          'round_1_opening_plus_last_round_closing',

        canonicalBucket:
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














