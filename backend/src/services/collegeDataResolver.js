import { pool } from "../db/pool.js";

import {
  resolveCanonicalCollegeId,
} from "./collegeIdentityResolver.js";


/*
|--------------------------------------------------------------------------
| NUMBER HELPERS
|--------------------------------------------------------------------------
*/

function positiveNumber(value) {
  const num = Number(value);

  return Number.isFinite(num) && num > 0
    ? num
    : null;
}


/*
|--------------------------------------------------------------------------
| ANNUAL FEE RESOLUTION
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. annual_total_fee
| 2. annual_academic_fee
| 3. academic_fee_per_semester * 2
| 4. tuition_fee_per_semester * 2
| 5. first_semester_fee * 2
| 6. total_course_fee / 4
|
*/

function resolveAnnualFee(profile = {}) {
  const annualTotal =
    positiveNumber(
      profile.annual_total_fee
    );

  if (annualTotal) {
    return {
      value: annualTotal,
      derivedFrom:
        "annual_total_fee",
    };
  }


  const annualAcademic =
    positiveNumber(
      profile.annual_academic_fee
    );

  if (annualAcademic) {
    return {
      value: annualAcademic,
      derivedFrom:
        "annual_academic_fee",
    };
  }


  const academicSemester =
    positiveNumber(
      profile.academic_fee_per_semester
    );

  if (academicSemester) {
    return {
      value:
        academicSemester * 2,

      derivedFrom:
        "academic_fee_per_semester",
    };
  }


  const tuitionSemester =
    positiveNumber(
      profile.tuition_fee_per_semester
    );

  if (tuitionSemester) {
    return {
      value:
        tuitionSemester * 2,

      derivedFrom:
        "tuition_fee_per_semester",
    };
  }


  const firstSemester =
    positiveNumber(
      profile.first_semester_fee
    );

  if (firstSemester) {
    return {
      value:
        firstSemester * 2,

      derivedFrom:
        "first_semester_fee",
    };
  }


  const courseTotal =
    positiveNumber(
      profile.total_course_fee
    );

  if (courseTotal) {
    return {
      value:
        Math.round(
          courseTotal / 4
        ),

      derivedFrom:
        "total_course_fee",
    };
  }


  return {
    value: null,
    derivedFrom: null,
  };
}


/*
|--------------------------------------------------------------------------
| COLLEGE
|--------------------------------------------------------------------------
*/

async function fetchCollege(
  client,
  requestedCollegeId
) {
  const canonicalId =
    resolveCanonicalCollegeId(
      requestedCollegeId
    );


  const result =
    await client.query(
      `
        SELECT
          id,
          name,
          city,
          state,
          type,
          established,
          website,
          portal

        FROM colleges

        WHERE
          id::text = $1
          OR id::text = $2

        ORDER BY

          CASE

            WHEN id::text = $1
            THEN 0

            WHEN id::text = $2
            THEN 1

            ELSE 2

          END

        LIMIT 1
      `,
      [
        requestedCollegeId,
        canonicalId,
      ]
    );


  return (
    result.rows[0] ??
    null
  );
}


/*
|--------------------------------------------------------------------------
| BRANCHES
|--------------------------------------------------------------------------
*/

async function fetchBranches(
  client,
  collegeId
) {
  const result =
    await client.query(
      `
        SELECT
          id,
          college_id,
          name,
          fees,
          median_package,
          average_package,
          highest_package,
          placement_rate

        FROM branches

        WHERE
          college_id::text = $1

        ORDER BY
          name
      `,
      [
        collegeId,
      ]
    );


  return result.rows;
}


/*
|--------------------------------------------------------------------------
| BEST FEE PROFILE
|--------------------------------------------------------------------------
*/

async function fetchFeeProfile(
  client,
  requestedCollegeId
) {
  const canonicalId =
    resolveCanonicalCollegeId(
      requestedCollegeId
    );


  const result =
    await client.query(
      `
        SELECT
          id,
          college_id,
          college_name_raw,
          fee_year,
          tuition_fee_per_semester,
          academic_fee_per_semester,
          first_semester_fee,
          hostel_fee_per_semester,
          mess_fee_per_semester,
          annual_academic_fee,
          annual_total_fee,
          total_course_fee,
          confidence_score,
          verification_status,
          source_kind,
          source_url,
          updated_at

        FROM college_fee_profiles

        WHERE
          college_id::text = $1

        ORDER BY

          CASE

            WHEN LOWER(
              TRIM(
                COALESCE(
                  verification_status,
                  ''
                )
              )
            ) = 'verified'
            THEN 50


            WHEN LOWER(
              TRIM(
                COALESCE(
                  verification_status,
                  ''
                )
              )
            ) = 'high_confidence'
            THEN 40


            WHEN LOWER(
              TRIM(
                COALESCE(
                  verification_status,
                  ''
                )
              )
            ) = 'review_recommended'
            THEN 30


            WHEN LOWER(
              TRIM(
                COALESCE(
                  verification_status,
                  ''
                )
              )
            ) = 'pending_review'
            THEN 20


            ELSE 10

          END DESC,


          CASE

            WHEN
              annual_total_fee IS NOT NULL
              AND annual_total_fee > 0
            THEN 80


            WHEN
              annual_academic_fee IS NOT NULL
              AND annual_academic_fee > 0
            THEN 70


            WHEN
              academic_fee_per_semester IS NOT NULL
              AND academic_fee_per_semester > 0
            THEN 60


            WHEN
              tuition_fee_per_semester IS NOT NULL
              AND tuition_fee_per_semester > 0
            THEN 50


            WHEN
              first_semester_fee IS NOT NULL
              AND first_semester_fee > 0
            THEN 40


            WHEN
              total_course_fee IS NOT NULL
              AND total_course_fee > 0
            THEN 30


            ELSE 0

          END DESC,


          confidence_score
            DESC NULLS LAST,


          fee_year
            DESC NULLS LAST,


          updated_at
            DESC NULLS LAST,


          id
            DESC

        LIMIT 1
      `,
      [
        canonicalId,
      ]
    );


  return (
    result.rows[0] ??
    null
  );
}


/*
|--------------------------------------------------------------------------
| CUTOFFS
|--------------------------------------------------------------------------
*/

async function fetchCutoffs(
  client,
  collegeId
) {
  const result =
    await client.query(
      `
        SELECT

          b.id
            AS branch_id,

          b.name
            AS branch_name,

          co.year,

          co.round,

          co.category,

          co.quota,

          co.gender,

          co.opening_rank
            AS opening_rank,

          co.closing_rank
            AS closing_rank,

          co.source_label,

          co.source_url,

          co.is_verified,

          co.verification_status,

          co.counselling_type,

          co.retrieved_at

        FROM branches b

        JOIN cutoffs co
          ON co.branch_id =
             b.id

        WHERE
          b.college_id::text =
            $1

        ORDER BY

          co.year
            DESC,


          b.name,


          CASE

            WHEN
              co.round ~ '^[0-9]+$'

            THEN
              CAST(
                co.round
                AS INTEGER
              )

            ELSE
              999

          END,


          co.round,


          co.category,


          co.quota,


          co.gender
      `,
      [
        collegeId,
      ]
    );


  return result.rows;
}


/*
|--------------------------------------------------------------------------
| QUALITY
|--------------------------------------------------------------------------
|
| Important:
|
| Some historical datasets use the short catalog college ID.
| Others use the canonical college ID.
|
| Check BOTH identities.
|
*/

async function fetchQuality(
  client,
  catalogCollegeId,
  canonicalCollegeId
) {
  const result =
    await client.query(
      `
        SELECT *

        FROM college_quality_metrics

        WHERE
          college_id::text = $1
          OR college_id::text = $2

        ORDER BY

          CASE

            WHEN LOWER(
              TRIM(
                COALESCE(
                  verification_status,
                  ''
                )
              )
            ) = 'verified'
            THEN 100


            WHEN LOWER(
              TRIM(
                COALESCE(
                  verification_status,
                  ''
                )
              )
            ) = 'high_confidence'
            THEN 80


            WHEN LOWER(
              TRIM(
                COALESCE(
                  verification_status,
                  ''
                )
              )
            ) = 'review_recommended'
            THEN 60


            WHEN LOWER(
              TRIM(
                COALESCE(
                  verification_status,
                  ''
                )
              )
            ) = 'pending_review'
            THEN 40


            ELSE 0

          END DESC,


          CASE

            WHEN
              college_id::text = $1
            THEN 20


            WHEN
              college_id::text = $2
            THEN 10


            ELSE 0

          END DESC,


          academic_year
            DESC NULLS LAST,


          retrieved_at
            DESC NULLS LAST,


          id
            DESC

        LIMIT 1
      `,
      [
        catalogCollegeId,
        canonicalCollegeId,
      ]
    );


  return (
    result.rows[0] ??
    null
  );
}


/*
|--------------------------------------------------------------------------
| REVIEW AGGREGATION FOR ONE ID
|--------------------------------------------------------------------------
*/

async function fetchReviewsForId(
  client,
  collegeId
) {
  const result =
    await client.query(
      `
        SELECT

          COUNT(*)::int
            AS review_count,


          ROUND(
            AVG(rating),
            2
          )
            AS average_rating,


          ROUND(
            AVG(sentiment_score),
            4
          )
            AS average_sentiment

        FROM college_reviews

        WHERE
          college_id::text = $1

          AND rating
            IS NOT NULL
      `,
      [
        collegeId,
      ]
    );


  return (
    result.rows[0] ?? {
      review_count: 0,
      average_rating: null,
      average_sentiment: null,
    }
  );
}


/*
|--------------------------------------------------------------------------
| REVIEW ID FALLBACK
|--------------------------------------------------------------------------
|
| Priority:
|
| 1. catalog ID
| 2. canonical ID
|
| We do not combine both automatically because that could double-count
| duplicated reviews stored under both IDs.
|
*/

async function fetchReviews(
  client,
  catalogCollegeId,
  canonicalCollegeId
) {
  const direct =
    await fetchReviewsForId(
      client,
      catalogCollegeId
    );


  if (
    Number(
      direct.review_count
    ) > 0
  ) {
    return {
      ...direct,

      resolvedCollegeId:
        catalogCollegeId,

      resolution:
        "catalog_id",
    };
  }


  if (
    canonicalCollegeId &&
    canonicalCollegeId !==
      catalogCollegeId
  ) {
    const canonical =
      await fetchReviewsForId(
        client,
        canonicalCollegeId
      );


    if (
      Number(
        canonical.review_count
      ) > 0
    ) {
      return {
        ...canonical,

        resolvedCollegeId:
          canonicalCollegeId,

        resolution:
          "canonical_id",
      };
    }
  }


  return {
    ...direct,

    resolvedCollegeId:
      catalogCollegeId,

    resolution:
      "catalog_id",
  };
}


/*
|--------------------------------------------------------------------------
| UNIFIED COLLEGE DATA RESOLVER
|--------------------------------------------------------------------------
*/

async function resolveCollegeDataUncached(
  requestedCollegeId
) {
  const client =
    await pool.connect();


  try {

    /*
    |--------------------------------------------------------------------------
    | IDENTITY
    |--------------------------------------------------------------------------
    */

    const canonicalId =
      resolveCanonicalCollegeId(
        requestedCollegeId
      );


    /*
    |--------------------------------------------------------------------------
    | COLLEGE
    |--------------------------------------------------------------------------
    */

    const college =
      await fetchCollege(
        client,
        requestedCollegeId
      );


    if (!college) {
      return null;
    }


    const effectiveCollegeId =
      String(
        college.id
      );


    /*
    |--------------------------------------------------------------------------
    | SEQUENTIAL DATABASE QUERIES
    |--------------------------------------------------------------------------
    |
    | Important:
    |
    | Do NOT Promise.all() these using the same pg client.
    |
    | pg warns when client.query() is started while the same client
    | is already executing another query.
    |
    */


    /*
    |--------------------------------------------------------------------------
    | BRANCHES
    |--------------------------------------------------------------------------
    */

    const branches =
      await fetchBranches(
        client,
        effectiveCollegeId
      );


    /*
    |--------------------------------------------------------------------------
    | FEES
    |--------------------------------------------------------------------------
    |
    | Fee profiles use canonical IDs where an alias exists.
    |
    */

    const feeProfile =
      await fetchFeeProfile(
        client,
        canonicalId
      );


    /*
    |--------------------------------------------------------------------------
    | CUTOFFS
    |--------------------------------------------------------------------------
    |
    | Branches/cutoffs remain tied to the actual catalog college ID.
    |
    */

    const cutoffs =
      await fetchCutoffs(
        client,
        effectiveCollegeId
      );


    /*
    |--------------------------------------------------------------------------
    | QUALITY
    |--------------------------------------------------------------------------
    |
    | Search both:
    |
    | - catalog ID
    | - canonical ID
    |
    */

    const quality =
      await fetchQuality(
        client,
        effectiveCollegeId,
        canonicalId
      );


    /*
    |--------------------------------------------------------------------------
    | REVIEWS
    |--------------------------------------------------------------------------
    |
    | Catalog ID first.
    | Canonical ID fallback.
    |
    */

    const reviews =
      await fetchReviews(
        client,
        effectiveCollegeId,
        canonicalId
      );


    /*
    |--------------------------------------------------------------------------
    | RESOLVE ANNUAL FEE
    |--------------------------------------------------------------------------
    */

    const annualFee =
      resolveAnnualFee(
        feeProfile || {}
      );


    /*
    |--------------------------------------------------------------------------
    | RESPONSE
    |--------------------------------------------------------------------------
    */

    return {

      /*
      |--------------------------------------------------------------------------
      | IDENTITY
      |--------------------------------------------------------------------------
      */

      identity: {

        requestedId:
          requestedCollegeId,

        canonicalId,

        catalogId:
          effectiveCollegeId,

        hasAlias:
          canonicalId !==
          requestedCollegeId,
      },


      /*
      |--------------------------------------------------------------------------
      | COLLEGE
      |--------------------------------------------------------------------------
      */

      college,


      /*
      |--------------------------------------------------------------------------
      | BRANCHES
      |--------------------------------------------------------------------------
      */

      branches,


      /*
      |--------------------------------------------------------------------------
      | FEES
      |--------------------------------------------------------------------------
      */

      fees:
        feeProfile
          ? {

              collegeId:
                feeProfile
                  .college_id,


              collegeName:
                feeProfile
                  .college_name_raw,


              feeYear:
                feeProfile
                  .fee_year,


              tuitionFeePerSemester:
                positiveNumber(
                  feeProfile
                    .tuition_fee_per_semester
                ),


              academicFeePerSemester:
                positiveNumber(
                  feeProfile
                    .academic_fee_per_semester
                ),


              firstSemesterFee:
                positiveNumber(
                  feeProfile
                    .first_semester_fee
                ),


              hostelFeePerSemester:
                positiveNumber(
                  feeProfile
                    .hostel_fee_per_semester
                ),


              messFeePerSemester:
                positiveNumber(
                  feeProfile
                    .mess_fee_per_semester
                ),


              annualAcademicFee:
                positiveNumber(
                  feeProfile
                    .annual_academic_fee
                ),


              annualTotalFee:
                positiveNumber(
                  feeProfile
                    .annual_total_fee
                ),


              totalCourseFee:
                positiveNumber(
                  feeProfile
                    .total_course_fee
                ),


              resolvedAnnualFee:
                annualFee.value,


              resolvedAnnualFeeFrom:
                annualFee.derivedFrom,


              confidence:
                positiveNumber(
                  feeProfile
                    .confidence_score
                ),


              verificationStatus:
                feeProfile
                  .verification_status ??
                null,


              sourceKind:
                feeProfile
                  .source_kind ??
                null,


              sourceUrl:
                feeProfile
                  .source_url ??
                null,


              updatedAt:
                feeProfile
                  .updated_at ??
                null,


              hasFeeData:
                annualFee.value !== null ||

                positiveNumber(
                  feeProfile
                    .hostel_fee_per_semester
                ) !== null ||

                positiveNumber(
                  feeProfile
                    .mess_fee_per_semester
                ) !== null,

            }

          : null,


      /*
      |--------------------------------------------------------------------------
      | CUTOFFS
      |--------------------------------------------------------------------------
      */

      cutoffs,


      /*
      |--------------------------------------------------------------------------
      | QUALITY
      |--------------------------------------------------------------------------
      */

      quality,


      /*
      |--------------------------------------------------------------------------
      | REVIEWS
      |--------------------------------------------------------------------------
      */

      reviews,
    };
  }

  finally {

    client.release();

  }
}

/*
|--------------------------------------------------------------------------
| COLLEGE DETAIL CAPACITY CACHE
|--------------------------------------------------------------------------
|
| Performance layer only.
|
| Does NOT change:
| - college identity rules
| - branch data
| - fees
| - cutoffs
| - quality
| - reviews
| - response shape
|
| Benefits:
| - repeated college detail requests avoid DB work
| - simultaneous requests for the same college share one DB request
| - bounded cache prevents unlimited memory growth
|
*/

const COLLEGE_DETAIL_CACHE_TTL_MS =
  Math.max(
    30_000,
    Number(
      process.env.COLLEGE_DETAIL_CACHE_TTL_MS ??
      5 * 60 * 1000
    )
  );

const COLLEGE_DETAIL_CACHE_MAX_ENTRIES =
  Math.max(
    50,
    Number(
      process.env.COLLEGE_DETAIL_CACHE_MAX_ENTRIES ??
      500
    )
  );

const collegeDetailCache =
  new Map();

const collegeDetailInFlight =
  new Map();


function normalizeCacheKey(
  requestedCollegeId
) {
  return String(
    requestedCollegeId ?? ""
  ).trim();
}


function pruneCollegeDetailCache() {
  const now =
    Date.now();

  /*
  |--------------------------------------------------------------------------
  | Remove expired entries first
  |--------------------------------------------------------------------------
  */

  for (
    const [
      key,
      entry
    ] of collegeDetailCache
  ) {
    if (
      !entry ||
      entry.expiresAt <= now
    ) {
      collegeDetailCache.delete(
        key
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | Enforce bounded cache
  |--------------------------------------------------------------------------
  |
  | Map insertion order gives us a simple LRU-style eviction policy.
  |
  */

  while (
    collegeDetailCache.size >
    COLLEGE_DETAIL_CACHE_MAX_ENTRIES
  ) {
    const oldestKey =
      collegeDetailCache
        .keys()
        .next()
        .value;

    if (
      oldestKey === undefined
    ) {
      break;
    }

    collegeDetailCache.delete(
      oldestKey
    );
  }
}


function getCachedCollegeDetail(
  key
) {
  const entry =
    collegeDetailCache.get(
      key
    );

  if (!entry) {
    return null;
  }

  if (
    entry.expiresAt <= Date.now()
  ) {
    collegeDetailCache.delete(
      key
    );

    return null;
  }

  /*
  |--------------------------------------------------------------------------
  | Refresh insertion position
  |--------------------------------------------------------------------------
  |
  | Makes Map behave like a lightweight LRU cache.
  |
  */

  collegeDetailCache.delete(
    key
  );

  collegeDetailCache.set(
    key,
    entry
  );

  return entry.value;
}


function setCachedCollegeDetail(
  key,
  value
) {
  collegeDetailCache.delete(
    key
  );

  collegeDetailCache.set(
    key,
    {
      value,

      expiresAt:
        Date.now() +
        COLLEGE_DETAIL_CACHE_TTL_MS,
    }
  );

  pruneCollegeDetailCache();
}


/*
|--------------------------------------------------------------------------
| Manual invalidation
|--------------------------------------------------------------------------
|
| Useful later from admin/import/update paths.
|
*/

export function clearCollegeDataCache(
  requestedCollegeId = null
) {
  if (
    requestedCollegeId == null
  ) {
    collegeDetailCache.clear();
    return;
  }

  const key =
    normalizeCacheKey(
      requestedCollegeId
    );

  collegeDetailCache.delete(
    key
  );
}


/*
|--------------------------------------------------------------------------
| PUBLIC RESOLVER
|--------------------------------------------------------------------------
*/

export async function resolveCollegeData(
  requestedCollegeId
) {
  const key =
    normalizeCacheKey(
      requestedCollegeId
    );

  if (!key) {
    return null;
  }


  /*
  |--------------------------------------------------------------------------
  | CACHE HIT
  |--------------------------------------------------------------------------
  */

  const cached =
    getCachedCollegeDetail(
      key
    );

  if (cached !== null) {
    return cached;
  }


  /*
  |--------------------------------------------------------------------------
  | REQUEST COALESCING
  |--------------------------------------------------------------------------
  |
  | Example:
  |
  | 100 students open IIT Delhi simultaneously.
  |
  | Before:
  | 100 resolver executions
  |
  | Now:
  | 1 resolver execution
  | 99 requests await the same Promise
  |
  */

  const existingRequest =
    collegeDetailInFlight.get(
      key
    );

  if (existingRequest) {
    return existingRequest;
  }


  const request =
    resolveCollegeDataUncached(
      key
    )
      .then(
        (resolved) => {
          /*
          |--------------------------------------------------------------------------
          | Cache successful records only
          |--------------------------------------------------------------------------
          */

          if (
            resolved !== null &&
            resolved !== undefined
          ) {
            setCachedCollegeDetail(
              key,
              resolved
            );
          }

          return resolved;
        }
      )
      .finally(
        () => {
          collegeDetailInFlight.delete(
            key
          );
        }
      );


  collegeDetailInFlight.set(
    key,
    request
  );


  return request;
}
