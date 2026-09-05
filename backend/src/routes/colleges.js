import { Router } from "express";
import { gzipSync } from 'node:zlib';
import { pool } from "../db/pool.js";
import { getCollegeIdSqlCase } from "../services/collegeIdentityResolver.js";

import {
  resolveCollegeData,
} from "../services/collegeDataResolver.js";
const router = Router();

/*
|--------------------------------------------------------------------------
| HELPERS
|--------------------------------------------------------------------------
*/

function mapCollege(row) {
  return {
    id: row.id,
    name: row.name,
    city: row.city,
    state: row.state,
    type: row.type,
    established: row.established,
    website: row.website,
    portal: row.portal,
    branches: row.branches ?? [],
  };
}

function mapCollegeCatalog(row) {
  const college =
    mapCollege(row);

  return {
    ...college,

    branches:
      Array.isArray(college.branches)
        ? college.branches.map(
            (branch) => ({
              id:
                branch?.id ?? null,

              name:
                branch?.name ?? '',

              fees:
                branch?.fees ?? null,

              annualFee:
                branch?.annualFee ??
                branch?.fees ??
                null,

              openingRank:
                branch?.openingRank ??
                null,

              closingRank:
                branch?.closingRank ??
                null,

              median:
                branch?.median ??
                null,

              average:
                branch?.average ??
                null,

              highest:
                branch?.highest ??
                null,

              placement:
                branch?.placement ??
                null,
            })
          )
        : [],
  };
}


/*
|--------------------------------------------------------------------------
| COLLEGE QUERY
|--------------------------------------------------------------------------
|
| FEE PRIORITY
|
| 1. college_fee_profiles
| 2. branch_fees
| 3. branches.fees
|
| IMPORTANT:
| - Do NOT reject fee data only because verification_status differs.
| - Prefer verified / high confidence rows.
| - Still use pending/review rows if they contain valid numeric fee data.
| - branch-specific branch_fees rows beat college-wide rows.
|
*/

const collegeQuery = `

  SELECT

    c.id,
    c.name,
    c.city,
    c.state,
    c.type,
    c.established,
    c.website,
    c.portal,

    COALESCE(

      json_agg(

        json_build_object(

          /*
          |--------------------------------------------------------------------------
          | BASIC BRANCH
          |--------------------------------------------------------------------------
          */

          'id',
          b.id,

          'name',
          b.name,


          /*
          |--------------------------------------------------------------------------
          | BACKWARD-COMPATIBLE ANNUAL FEE
          |--------------------------------------------------------------------------
          |
          | Existing frontend can continue using:
          |
          | branch.fees
          |
          | This always tries to return the best annual / annual-equivalent
          | fee available.
          |
          */

          'fees',

          COALESCE(

            NULLIF(cfp.annual_total_fee, 0),

            NULLIF(bf.total_annual_fee, 0),

            NULLIF(cfp.annual_academic_fee, 0),

            CASE
              WHEN
                cfp.total_course_fee IS NOT NULL
                AND cfp.total_course_fee > 0
              THEN
                ROUND(cfp.total_course_fee / 4.0)
              ELSE NULL
            END,

            CASE
              WHEN
                cfp.academic_fee_per_semester IS NOT NULL
                AND cfp.academic_fee_per_semester > 0
              THEN
                cfp.academic_fee_per_semester * 2
              ELSE NULL
            END,

            CASE
              WHEN
                cfp.tuition_fee_per_semester IS NOT NULL
                AND cfp.tuition_fee_per_semester > 0
              THEN
                cfp.tuition_fee_per_semester * 2
              ELSE NULL
            END,

            CASE
              WHEN
                bf.tuition_fee IS NOT NULL
                AND bf.tuition_fee > 0
              THEN
                bf.tuition_fee
              ELSE NULL
            END,

            NULLIF(b.fees, 0)

          ),


          /*
          |--------------------------------------------------------------------------
          | FRONTEND FRIENDLY ALIAS
          |--------------------------------------------------------------------------
          */

          'annualFee',

          COALESCE(

            NULLIF(cfp.annual_total_fee, 0),

            NULLIF(bf.total_annual_fee, 0),

            NULLIF(cfp.annual_academic_fee, 0),

            CASE
              WHEN
                cfp.total_course_fee IS NOT NULL
                AND cfp.total_course_fee > 0
              THEN
                ROUND(cfp.total_course_fee / 4.0)
              ELSE NULL
            END,

            CASE
              WHEN
                cfp.academic_fee_per_semester IS NOT NULL
                AND cfp.academic_fee_per_semester > 0
              THEN
                cfp.academic_fee_per_semester * 2
              ELSE NULL
            END,

            CASE
              WHEN
                cfp.tuition_fee_per_semester IS NOT NULL
                AND cfp.tuition_fee_per_semester > 0
              THEN
                cfp.tuition_fee_per_semester * 2
              ELSE NULL
            END,

            NULLIF(b.fees, 0)

          ),


          /*
          |--------------------------------------------------------------------------
          | FEE YEAR
          |--------------------------------------------------------------------------
          */

          'feeYear',

          COALESCE(
            cfp.fee_year,
            bf.academic_year
          ),


          /*
          |--------------------------------------------------------------------------
          | TUITION
          |--------------------------------------------------------------------------
          */

          'tuitionFeePerSemester',

          NULLIF(
            cfp.tuition_fee_per_semester,
            0
          ),


          'tuitionFee',

          COALESCE(

            NULLIF(
              cfp.tuition_fee_per_semester,
              0
            ),

            NULLIF(
              bf.tuition_fee,
              0
            )

          ),


          /*
          |--------------------------------------------------------------------------
          | ACADEMIC FEE
          |--------------------------------------------------------------------------
          */

          'academicFeePerSemester',

          NULLIF(
            cfp.academic_fee_per_semester,
            0
          ),


          /*
          |--------------------------------------------------------------------------
          | FIRST SEMESTER
          |--------------------------------------------------------------------------
          */

          'firstSemesterFee',

          NULLIF(
            cfp.first_semester_fee,
            0
          ),


          /*
          |--------------------------------------------------------------------------
          | HOSTEL
          |--------------------------------------------------------------------------
          */

          'hostelFeePerSemester',

          COALESCE(

            NULLIF(
              cfp.hostel_fee_per_semester,
              0
            ),

            NULLIF(
              bf.hostel_fee,
              0
            )

          ),


          'hostelFee',

          COALESCE(

            NULLIF(
              cfp.hostel_fee_per_semester,
              0
            ),

            NULLIF(
              bf.hostel_fee,
              0
            )

          ),


          /*
          |--------------------------------------------------------------------------
          | MESS
          |--------------------------------------------------------------------------
          */

          'messFeePerSemester',

          NULLIF(
            cfp.mess_fee_per_semester,
            0
          ),


          'messFee',

          NULLIF(
            cfp.mess_fee_per_semester,
            0
          ),


          /*
          |--------------------------------------------------------------------------
          | OTHER FEE
          |--------------------------------------------------------------------------
          */

          'otherFee',

          NULLIF(
            bf.other_fee,
            0
          ),


          /*
          |--------------------------------------------------------------------------
          | ANNUAL ACADEMIC
          |--------------------------------------------------------------------------
          */

          'annualAcademicFee',

          NULLIF(
            cfp.annual_academic_fee,
            0
          ),


          /*
          |--------------------------------------------------------------------------
          | ANNUAL TOTAL
          |--------------------------------------------------------------------------
          */

          'annualTotalFee',

          COALESCE(

            NULLIF(
              cfp.annual_total_fee,
              0
            ),

            NULLIF(
              bf.total_annual_fee,
              0
            )

          ),


          /*
          |--------------------------------------------------------------------------
          | TOTAL COURSE
          |--------------------------------------------------------------------------
          */

          'totalCourseFee',

          NULLIF(
            cfp.total_course_fee,
            0
          ),


          /*
          |--------------------------------------------------------------------------
          | DISPLAY FEE
          |--------------------------------------------------------------------------
          |
          | Exact value which frontend should display.
          |
          */

          'displayFee',

          COALESCE(

            NULLIF(
              cfp.annual_total_fee,
              0
            ),

            NULLIF(
              bf.total_annual_fee,
              0
            ),

            NULLIF(
              cfp.annual_academic_fee,
              0
            ),

            NULLIF(
              cfp.total_course_fee,
              0
            ),

            NULLIF(
              cfp.first_semester_fee,
              0
            ),

            NULLIF(
              cfp.academic_fee_per_semester,
              0
            ),

            NULLIF(
              cfp.tuition_fee_per_semester,
              0
            ),

            NULLIF(
              bf.tuition_fee,
              0
            ),

            NULLIF(
              b.fees,
              0
            )

          ),


          /*
          |--------------------------------------------------------------------------
          | DISPLAY FEE PERIOD
          |--------------------------------------------------------------------------
          */

          'displayFeePeriod',

          CASE

            WHEN
              cfp.annual_total_fee IS NOT NULL
              AND cfp.annual_total_fee > 0
            THEN
              'annual'

            WHEN
              bf.total_annual_fee IS NOT NULL
              AND bf.total_annual_fee > 0
            THEN
              'annual'

            WHEN
              cfp.annual_academic_fee IS NOT NULL
              AND cfp.annual_academic_fee > 0
            THEN
              'annual'

            WHEN
              cfp.total_course_fee IS NOT NULL
              AND cfp.total_course_fee > 0
            THEN
              'course_total'

            WHEN
              cfp.first_semester_fee IS NOT NULL
              AND cfp.first_semester_fee > 0
            THEN
              'first_semester'

            WHEN
              (
                cfp.academic_fee_per_semester IS NOT NULL
                AND cfp.academic_fee_per_semester > 0
              )
              OR
              (
                cfp.tuition_fee_per_semester IS NOT NULL
                AND cfp.tuition_fee_per_semester > 0
              )
            THEN
              'semester'

            WHEN
              bf.tuition_fee IS NOT NULL
              AND bf.tuition_fee > 0
            THEN
              'annual'

            WHEN
              b.fees IS NOT NULL
              AND b.fees > 0
            THEN
              'annual'

            ELSE
              NULL

          END,


          /*
          |--------------------------------------------------------------------------
          | ESTIMATED ANNUAL FEE
          |--------------------------------------------------------------------------
          */

          'estimatedAnnualFee',

          COALESCE(

            NULLIF(
              cfp.annual_total_fee,
              0
            ),

            NULLIF(
              bf.total_annual_fee,
              0
            ),

            NULLIF(
              cfp.annual_academic_fee,
              0
            ),

            CASE
              WHEN
                cfp.total_course_fee IS NOT NULL
                AND cfp.total_course_fee > 0
              THEN
                ROUND(cfp.total_course_fee / 4.0)
              ELSE NULL
            END,

            CASE
              WHEN
                cfp.first_semester_fee IS NOT NULL
                AND cfp.first_semester_fee > 0
              THEN
                cfp.first_semester_fee * 2
              ELSE NULL
            END,

            CASE
              WHEN
                cfp.academic_fee_per_semester IS NOT NULL
                AND cfp.academic_fee_per_semester > 0
              THEN
                cfp.academic_fee_per_semester * 2
              ELSE NULL
            END,

            CASE
              WHEN
                cfp.tuition_fee_per_semester IS NOT NULL
                AND cfp.tuition_fee_per_semester > 0
              THEN
                cfp.tuition_fee_per_semester * 2
              ELSE NULL
            END,

            NULLIF(
              bf.total_annual_fee,
              0
            ),

            NULLIF(
              bf.tuition_fee,
              0
            ),

            NULLIF(
              b.fees,
              0
            )

          ),


          /*
          |--------------------------------------------------------------------------
          | HAS FEE DATA
          |--------------------------------------------------------------------------
          */

          'hasFeeData',

          CASE

            WHEN
              COALESCE(

                NULLIF(
                  cfp.annual_total_fee,
                  0
                ),

                NULLIF(
                  bf.total_annual_fee,
                  0
                ),

                NULLIF(
                  cfp.annual_academic_fee,
                  0
                ),

                NULLIF(
                  cfp.total_course_fee,
                  0
                ),

                NULLIF(
                  cfp.first_semester_fee,
                  0
                ),

                NULLIF(
                  cfp.academic_fee_per_semester,
                  0
                ),

                NULLIF(
                  cfp.tuition_fee_per_semester,
                  0
                ),

                NULLIF(
                  cfp.hostel_fee_per_semester,
                  0
                ),

                NULLIF(
                  cfp.mess_fee_per_semester,
                  0
                ),

                NULLIF(
                  bf.tuition_fee,
                  0
                ),

                NULLIF(
                  bf.hostel_fee,
                  0
                ),

                NULLIF(
                  bf.other_fee,
                  0
                ),

                NULLIF(
                  b.fees,
                  0
                )

              ) IS NOT NULL

            THEN TRUE

            ELSE FALSE

          END,


          /*
          |--------------------------------------------------------------------------
          | FEE SOURCE
          |--------------------------------------------------------------------------
          */

          'feeSourceLabel',

          COALESCE(
            NULLIF(cfp.source_kind, ''),
            NULLIF(bf.source_label, '')
          ),


          'feeSourceUrl',

          COALESCE(
            NULLIF(cfp.source_url, ''),
            NULLIF(bf.source_url, '')
          ),


          'feeVerificationStatus',

          COALESCE(
            NULLIF(cfp.verification_status, ''),
            NULLIF(bf.verification_status, '')
          ),


          'feeConfidence',

          cfp.confidence_score,


          /*
          |--------------------------------------------------------------------------
          | FEE BREAKDOWN
          |--------------------------------------------------------------------------
          */

          'feeBreakdown',

          json_build_object(

            'tuitionFeePerSemester',
            NULLIF(
              cfp.tuition_fee_per_semester,
              0
            ),

            'academicFeePerSemester',
            NULLIF(
              cfp.academic_fee_per_semester,
              0
            ),

            'firstSemesterFee',
            NULLIF(
              cfp.first_semester_fee,
              0
            ),

            'hostelFeePerSemester',
            COALESCE(
              NULLIF(
                cfp.hostel_fee_per_semester,
                0
              ),
              NULLIF(
                bf.hostel_fee,
                0
              )
            ),

            'messFeePerSemester',
            NULLIF(
              cfp.mess_fee_per_semester,
              0
            ),

            'otherFee',
            NULLIF(
              bf.other_fee,
              0
            ),

            'annualAcademicFee',
            NULLIF(
              cfp.annual_academic_fee,
              0
            ),

            'annualTotalFee',
            COALESCE(
              NULLIF(
                cfp.annual_total_fee,
                0
              ),
              NULLIF(
                bf.total_annual_fee,
                0
              )
            ),

            'totalCourseFee',
            NULLIF(
              cfp.total_course_fee,
              0
            )

          ),


          /*
          |--------------------------------------------------------------------------
          | PLACEMENTS
          |--------------------------------------------------------------------------
          */

          'median',
          b.median_package,

          'average',
          b.average_package,

          'highest',
          b.highest_package,

          'placement',
          b.placement_rate,


          /*
          |--------------------------------------------------------------------------
          | 2025 FALLBACK CLOSING RANK
          |--------------------------------------------------------------------------
          */

          'closingRank',

          COALESCE(
            (
              SELECT
                co.closing_rank

              FROM cutoffs co

              WHERE
                co.branch_id = b.id

                AND co.year = 2025

              ORDER BY
                co.id DESC

              LIMIT 1
            ),
            0
          ),


          /*
          |--------------------------------------------------------------------------
          | 2026 OPENING RANK
          |--------------------------------------------------------------------------
          */

          'openingRank2026',

          (
            SELECT
              co.opening_rank

            FROM cutoffs co

            WHERE
              co.branch_id = b.id

              AND co.year = 2026

            ORDER BY

              CASE
                WHEN co.round ~ '^[0-9]+$'
                THEN CAST(co.round AS INTEGER)
                ELSE 999
              END DESC,

              co.id DESC

            LIMIT 1
          ),


          /*
          |--------------------------------------------------------------------------
          | 2026 CLOSING RANK
          |--------------------------------------------------------------------------
          */

          'closingRank2026',

          (
            SELECT
              co.closing_rank

            FROM cutoffs co

            WHERE
              co.branch_id = b.id

              AND co.year = 2026

            ORDER BY

              CASE
                WHEN co.round ~ '^[0-9]+$'
                THEN CAST(co.round AS INTEGER)
                ELSE 999
              END DESC,

              co.id DESC

            LIMIT 1
          ),


          /*
          |--------------------------------------------------------------------------
          | 2026 ROUND
          |--------------------------------------------------------------------------
          */

          'round2026',

          (
            SELECT
              co.round

            FROM cutoffs co

            WHERE
              co.branch_id = b.id

              AND co.year = 2026

            ORDER BY

              CASE
                WHEN co.round ~ '^[0-9]+$'
                THEN CAST(co.round AS INTEGER)
                ELSE 999
              END DESC,

              co.id DESC

            LIMIT 1
          ),


          /*
          |--------------------------------------------------------------------------
          | 2026 CATEGORY
          |--------------------------------------------------------------------------
          */

          'category2026',

          (
            SELECT
              co.category

            FROM cutoffs co

            WHERE
              co.branch_id = b.id

              AND co.year = 2026

            ORDER BY

              CASE
                WHEN co.round ~ '^[0-9]+$'
                THEN CAST(co.round AS INTEGER)
                ELSE 999
              END DESC,

              co.id DESC

            LIMIT 1
          ),


          /*
          |--------------------------------------------------------------------------
          | 2026 QUOTA
          |--------------------------------------------------------------------------
          */

          'quota2026',

          (
            SELECT
              co.quota

            FROM cutoffs co

            WHERE
              co.branch_id = b.id

              AND co.year = 2026

            ORDER BY

              CASE
                WHEN co.round ~ '^[0-9]+$'
                THEN CAST(co.round AS INTEGER)
                ELSE 999
              END DESC,

              co.id DESC

            LIMIT 1
          ),


          /*
          |--------------------------------------------------------------------------
          | 2026 GENDER
          |--------------------------------------------------------------------------
          */

          'gender2026',

          (
            SELECT
              co.gender

            FROM cutoffs co

            WHERE
              co.branch_id = b.id

              AND co.year = 2026

            ORDER BY

              CASE
                WHEN co.round ~ '^[0-9]+$'
                THEN CAST(co.round AS INTEGER)
                ELSE 999
              END DESC,

              co.id DESC

            LIMIT 1
          ),


          /*
          |--------------------------------------------------------------------------
          | 2026 SOURCE
          |--------------------------------------------------------------------------
          */

          'source2026',

          (
            SELECT
              co.source_label

            FROM cutoffs co

            WHERE
              co.branch_id = b.id

              AND co.year = 2026

            ORDER BY

              CASE
                WHEN co.round ~ '^[0-9]+$'
                THEN CAST(co.round AS INTEGER)
                ELSE 999
              END DESC,

              co.id DESC

            LIMIT 1
          ),


          /*
          |--------------------------------------------------------------------------
          | 2026 VERIFIED
          |--------------------------------------------------------------------------
          */

          'verified2026',

          COALESCE(
            (
              SELECT
                co.is_verified

              FROM cutoffs co

              WHERE
                co.branch_id = b.id

                AND co.year = 2026

              ORDER BY

                CASE
                  WHEN co.round ~ '^[0-9]+$'
                  THEN CAST(co.round AS INTEGER)
                  ELSE 999
                END DESC,

                co.id DESC

              LIMIT 1
            ),
            FALSE
          ),


          /*
          |--------------------------------------------------------------------------
          | 2026 VERIFICATION STATUS
          |--------------------------------------------------------------------------
          */

          'verificationStatus2026',

          (
            SELECT
              co.verification_status

            FROM cutoffs co

            WHERE
              co.branch_id = b.id

              AND co.year = 2026

            ORDER BY

              CASE
                WHEN co.round ~ '^[0-9]+$'
                THEN CAST(co.round AS INTEGER)
                ELSE 999
              END DESC,

              co.id DESC

            LIMIT 1
          ),


          /*
          |--------------------------------------------------------------------------
          | 2026 SOURCE URL
          |--------------------------------------------------------------------------
          */

          'sourceUrl2026',

          (
            SELECT
              co.source_url

            FROM cutoffs co

            WHERE
              co.branch_id = b.id

              AND co.year = 2026

            ORDER BY

              CASE
                WHEN co.round ~ '^[0-9]+$'
                THEN CAST(co.round AS INTEGER)
                ELSE 999
              END DESC,

              co.id DESC

            LIMIT 1
          ),


          /*
          |--------------------------------------------------------------------------
          | 2026 RETRIEVED
          |--------------------------------------------------------------------------
          */

          'retrievedAt2026',

          (
            SELECT
              co.retrieved_at

            FROM cutoffs co

            WHERE
              co.branch_id = b.id

              AND co.year = 2026

            ORDER BY

              CASE
                WHEN co.round ~ '^[0-9]+$'
                THEN CAST(co.round AS INTEGER)
                ELSE 999
              END DESC,

              co.id DESC

            LIMIT 1
          )

        )

        ORDER BY b.name

      )

      FILTER (
        WHERE b.id IS NOT NULL
      ),

      '[]'::json

    ) AS branches


  FROM colleges c


  LEFT JOIN branches b

    ON b.college_id = c.id


  /*
  |--------------------------------------------------------------------------
  | BEST COLLEGE FEE PROFILE
  |--------------------------------------------------------------------------
  |
  | IMPORTANT FIX:
  |
  | Earlier query completely rejected statuses other than:
  | verified / high_confidence / review_recommended.
  |
  | Now every usable numeric row can participate.
  | Verification status only affects PRIORITY.
  |
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

      fp.source_kind,

      fp.updated_at

    FROM college_fee_profiles fp

    WHERE

      fp.college_id::text =
        ${getCollegeIdSqlCase("c.id::text")}


      AND (

        NULLIF(
          fp.tuition_fee_per_semester,
          0
        ) IS NOT NULL

        OR

        NULLIF(
          fp.academic_fee_per_semester,
          0
        ) IS NOT NULL

        OR

        NULLIF(
          fp.first_semester_fee,
          0
        ) IS NOT NULL

        OR

        NULLIF(
          fp.hostel_fee_per_semester,
          0
        ) IS NOT NULL

        OR

        NULLIF(
          fp.mess_fee_per_semester,
          0
        ) IS NOT NULL

        OR

        NULLIF(
          fp.annual_academic_fee,
          0
        ) IS NOT NULL

        OR

        NULLIF(
          fp.annual_total_fee,
          0
        ) IS NOT NULL

        OR

        NULLIF(
          fp.total_course_fee,
          0
        ) IS NOT NULL

      )

    ORDER BY

      CASE

        WHEN LOWER(
          TRIM(
            COALESCE(
              fp.verification_status,
              ''
            )
          )
        ) = 'verified'
        THEN 50

        WHEN LOWER(
          TRIM(
            COALESCE(
              fp.verification_status,
              ''
            )
          )
        ) = 'high_confidence'
        THEN 40

        WHEN LOWER(
          TRIM(
            COALESCE(
              fp.verification_status,
              ''
            )
          )
        ) = 'review_recommended'
        THEN 30

        WHEN LOWER(
          TRIM(
            COALESCE(
              fp.verification_status,
              ''
            )
          )
        ) = 'pending_review'
        THEN 20

        ELSE 10

      END DESC,


      /*
      | Prefer rows having a proper annual total.
      */

      CASE

        WHEN
          fp.annual_total_fee IS NOT NULL
          AND fp.annual_total_fee > 0
        THEN 80

        WHEN
          fp.annual_academic_fee IS NOT NULL
          AND fp.annual_academic_fee > 0
        THEN 70

        WHEN
          fp.total_course_fee IS NOT NULL
          AND fp.total_course_fee > 0
        THEN 60

        WHEN
          fp.first_semester_fee IS NOT NULL
          AND fp.first_semester_fee > 0
        THEN 50

        WHEN
          fp.academic_fee_per_semester IS NOT NULL
          AND fp.academic_fee_per_semester > 0
        THEN 40

        WHEN
          fp.tuition_fee_per_semester IS NOT NULL
          AND fp.tuition_fee_per_semester > 0
        THEN 30

        ELSE 0

      END DESC,


      COALESCE(
        fp.confidence_score,
        0
      ) DESC,


      fp.fee_year DESC NULLS LAST,


      fp.updated_at DESC NULLS LAST,


      fp.id DESC


    LIMIT 1

  ) cfp ON TRUE


  /*
  |--------------------------------------------------------------------------
  | BRANCH FEE FALLBACK
  |--------------------------------------------------------------------------
  |
  | IMPORTANT:
  | Branch-specific row must beat college-wide branch_id=NULL row.
  |
  */

  LEFT JOIN LATERAL (

    SELECT

      bf2.academic_year,

      bf2.tuition_fee,

      bf2.hostel_fee,

      bf2.other_fee,

      bf2.total_annual_fee,

      bf2.source_label,

      bf2.source_url,

      bf2.verification_status,

      bf2.updated_at

    FROM branch_fees bf2

    WHERE

      bf2.college_id::text =
        c.id::text

      AND (

        bf2.branch_id IS NULL

        OR

        bf2.branch_id::text =
          b.id::text

      )

      AND (

        NULLIF(
          bf2.tuition_fee,
          0
        ) IS NOT NULL

        OR

        NULLIF(
          bf2.hostel_fee,
          0
        ) IS NOT NULL

        OR

        NULLIF(
          bf2.other_fee,
          0
        ) IS NOT NULL

        OR

        NULLIF(
          bf2.total_annual_fee,
          0
        ) IS NOT NULL

      )

    ORDER BY


      /*
      |--------------------------------------------------------------------------
      | BRANCH-SPECIFIC FIRST
      |--------------------------------------------------------------------------
      */

      CASE

        WHEN
          bf2.branch_id IS NOT NULL
          AND bf2.branch_id::text = b.id::text

        THEN 100

        ELSE 0

      END DESC,


      /*
      |--------------------------------------------------------------------------
      | VERIFICATION QUALITY
      |--------------------------------------------------------------------------
      */

      CASE

        WHEN LOWER(
          TRIM(
            COALESCE(
              bf2.verification_status,
              ''
            )
          )
        ) = 'verified'

        THEN 50


        WHEN LOWER(
          TRIM(
            COALESCE(
              bf2.verification_status,
              ''
            )
          )
        ) = 'high_confidence'

        THEN 40


        WHEN LOWER(
          TRIM(
            COALESCE(
              bf2.verification_status,
              ''
            )
          )
        ) = 'review_recommended'

        THEN 30


        WHEN LOWER(
          TRIM(
            COALESCE(
              bf2.verification_status,
              ''
            )
          )
        ) = 'pending_review'

        THEN 20


        ELSE 10

      END DESC,


      /*
      |--------------------------------------------------------------------------
      | BEST VALUE TYPE
      |--------------------------------------------------------------------------
      */

      CASE

        WHEN
          bf2.total_annual_fee IS NOT NULL
          AND bf2.total_annual_fee > 0

        THEN 40


        WHEN
          bf2.tuition_fee IS NOT NULL
          AND bf2.tuition_fee > 0

        THEN 30


        WHEN
          bf2.hostel_fee IS NOT NULL
          AND bf2.hostel_fee > 0

        THEN 20


        WHEN
          bf2.other_fee IS NOT NULL
          AND bf2.other_fee > 0

        THEN 10


        ELSE 0

      END DESC,


      bf2.academic_year DESC NULLS LAST,


      bf2.updated_at DESC NULLS LAST


    LIMIT 1

  ) bf ON TRUE

`;


/*
|--------------------------------------------------------------------------
| COLLEGES CATALOG CACHE
|--------------------------------------------------------------------------
*/

const COLLEGES_CATALOG_CACHE_TTL_MS =
  5 * 60 * 1000;

let collegesCatalogCache = null;

let collegesCatalogInFlight = null;

function buildCollegeCatalogCacheEntry(
  payload
) {
  const serialized =
    JSON.stringify(payload);

  const gzipped =
    gzipSync(
      serialized,
      {
        level: 1,
      }
    );

  return {
    payload,
    serialized,
    gzipped,

    expiresAt:
      Date.now() +
      COLLEGES_CATALOG_CACHE_TTL_MS,
  };
}

function sendCachedCollegeCatalog(
  req,
  res,
  entry
) {
  const acceptEncoding =
    String(
      req.headers[
        'accept-encoding'
      ] || ''
    ).toLowerCase();

  res.type('application/json');

  res.vary(
    'Accept-Encoding'
  );

  if (
    acceptEncoding.includes(
      'gzip'
    )
  ) {
    res.set(
      'Content-Encoding',
      'gzip'
    );

    res.set(
      'Content-Length',
      String(
        entry.gzipped.length
      )
    );

    return res.send(
      entry.gzipped
    );
  }

  res.set(
    'Content-Length',
    String(
      Buffer.byteLength(
        entry.serialized
      )
    )
  );

  return res.send(
    entry.serialized
  );
}


/*
|--------------------------------------------------------------------------
| GET ALL COLLEGES
|--------------------------------------------------------------------------
*/

router.get(
  "/",
  async (req, res, next) => {

    try {

      const isUnfilteredCatalogRequest =
        !req.query.state &&
        !req.query.type &&
        !req.query.q;

      if (
        isUnfilteredCatalogRequest
      ) {
        res.set(
          'CDN-Cache-Control',
          'public, s-maxage=300, stale-while-revalidate=60'
        );
      }


      if (
        isUnfilteredCatalogRequest &&
        collegesCatalogCache &&
        collegesCatalogCache.expiresAt > Date.now()
      ) {

        return sendCachedCollegeCatalog(
          req,
          res,
          collegesCatalogCache
        );
      }


      if (
        isUnfilteredCatalogRequest &&
        collegesCatalogInFlight
      ) {

        const cacheEntry =
          await collegesCatalogInFlight;

        return sendCachedCollegeCatalog(
          req,
          res,
          cacheEntry
        );
      }


      const executeCollegeQuery =
        async () => {

          const params = [];
          const conditions = [];


          if (req.query.state) {

            params.push(
              req.query.state
            );

            conditions.push(
              `c.state ILIKE $${params.length}`
            );
          }


          if (req.query.type) {

            params.push(
              req.query.type
            );

            conditions.push(
              `c.type ILIKE $${params.length}`
            );
          }


          if (req.query.q) {

            params.push(
              `%${req.query.q.trim()}%`
            );

            conditions.push(
              `(
                c.name ILIKE $${params.length}
                OR
                c.city ILIKE $${params.length}
                OR
                c.state ILIKE $${params.length}
              )`
            );
          }


          const where =
            conditions.length > 0
              ? `WHERE ${conditions.join(" AND ")}`
              : "";


          const { rows } =
            await pool.query(

              `

                ${collegeQuery}

                ${where}

                GROUP BY

                  c.id,
                  c.name,
                  c.city,
                  c.state,
                  c.type,
                  c.established,
                  c.website,
                  c.portal

                ORDER BY
                  c.name

              `,

              params
            );


          return {
            data:
              rows.map(
                mapCollegeCatalog
              ),
          };
        };


      if (
        isUnfilteredCatalogRequest
      ) {

        collegesCatalogInFlight =
          (async () => {
            const payload =
              await executeCollegeQuery();

            const cacheEntry =
              buildCollegeCatalogCacheEntry(
                payload
              );

            collegesCatalogCache =
              cacheEntry;

            return cacheEntry;
          })();

        try {

          const cacheEntry =
            await collegesCatalogInFlight;

          return sendCachedCollegeCatalog(
            req,
            res,
            cacheEntry
          );

        } finally {

          collegesCatalogInFlight =
            null;
        }
      }


      const payload =
        await executeCollegeQuery();

      return res.json(
        payload
      );


    } catch (error) {

      console.error(
        "COLLEGES LIST ERROR:",
        error
      );

      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| GET SINGLE COLLEGE
|--------------------------------------------------------------------------
|
| Unified college detail endpoint.
|
| Uses collegeDataResolver as the single source of truth for:
| - canonical college identity
| - college details
| - branches
| - fees
| - cutoffs
| - reviews
| - quality
|
*/

router.get(
  "/:id",
  async (req, res, next) => {

    try {

      const requestedId =
        String(
          req.params.id ?? ""
        ).trim();


      if (!requestedId) {

        return res
          .status(400)
          .json({
            error:
              "College id is required",
          });
      }


      const resolved =
        await resolveCollegeData(
          requestedId
        );


      if (!resolved) {

        return res
          .status(404)
          .json({
            error:
              "College not found",
          });
      }


      return res.json({
        data: resolved,
      });


    } catch (error) {

      console.error(
        "COLLEGE DETAIL ERROR:",
        error
      );

      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| GET COLLEGE CUTOFFS
|--------------------------------------------------------------------------
*/

router.get(
  "/:id/cutoffs",
  async (req, res, next) => {

    try {

      const params = [
        req.params.id
      ];


      /*
      |--------------------------------------------------------------------------
      | YEAR
      |--------------------------------------------------------------------------
      */

      let yearCondition = "";

      if (req.query.year) {

        const year =
          Number(
            req.query.year
          );

        if (
          Number.isInteger(year)
          && year > 0
        ) {

          params.push(year);

          yearCondition =
            `AND co.year = $${params.length}`;
        }
      }


      /*
      |--------------------------------------------------------------------------
      | ROUND
      |--------------------------------------------------------------------------
      */

      let roundCondition = "";

      if (req.query.round) {

        params.push(
          req.query.round
        );

        roundCondition =
          `AND co.round = $${params.length}`;
      }


      const { rows } =
        await pool.query(

          `

            SELECT

              b.id
                AS branch_id,

              b.name
                AS branch,

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
                AS "counsellingType"


            FROM branches b


            JOIN cutoffs co

              ON co.branch_id =
                b.id


            WHERE

              b.college_id =
                $1


              ${yearCondition}


              ${roundCondition}


            ORDER BY

              co.year DESC,


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

              END DESC,


              b.name,


              co.category,


              co.quota,


              co.gender

          `,

          params
        );


      return res.json({
        data: rows,
      });


    } catch (error) {

      console.error(
        "COLLEGE CUTOFF ERROR:",
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
