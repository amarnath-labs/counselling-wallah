import express from 'express';

import {
  FACTOR_STATUS,
  CWREC_VERSION,
  calculateHistoricalFit,
  calculateAdmissionConfidence,
  calculateBranchFit,
  calculateQualityScore,
  calculateBudgetScore,
  buildRecommendation,
  compareRecommendations,
} from '../services/cwRecV1.js';

import {
  adaptCounsellingRowToCWRecInput,
} from '../services/cwRecAdapterV1.js';

import {
  fetchCWRecRows,
} from '../services/cwRecDataV1.js';

import {
  parseBranchPreferences,
  scoreBranchPreference,
} from '../services/cwRecBranchV1.js';


const router =
  express.Router();


/* =========================================================
   SHARED HELPERS
========================================================= */

function valueOrNull(
  value
) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const parsed =
    Number(
      value
    );

  return Number.isFinite(
    parsed
  )
    ? parsed
    : null;
}


function scoreAdaptedInput(
  adapted,
  fallbackLocationMode =
    'NONE'
) {
  /* =====================================
     ADMISSION
  ===================================== */

  const historicalFit =
    calculateHistoricalFit({
      studentRank:
        adapted.studentRank,

      closingRanks:
        adapted.closingRanks,
    });


  const admissionConfidence =
    calculateAdmissionConfidence({
      historicalRows:
        adapted.historicalRows,

      contextScore:
        adapted
          .admissionContextScore,
    });


  const admission = {
    score:
      historicalFit
        .historicalFitScore,

    historicalFitScore:
      historicalFit
        .historicalFitScore,

    bucket:
      historicalFit
        .historicalFitScore ===
      null
        ? 'Admission data pending'
        : historicalFit.bucket,

    confidence:
      admissionConfidence
        .score,

    confidenceLabel:
      admissionConfidence
        .label,

    status:
      historicalFit
        .historicalFitScore ===
      null
        ? FACTOR_STATUS
            .UNAVAILABLE
        : FACTOR_STATUS
            .AVAILABLE,

    medianClosingRank:
      historicalFit
        .medianClosingRank,

    relativeMargin:
      historicalFit
        .relativeMargin,
  };


  /* =====================================
     BRANCH
  ===================================== */

  const branchScore =
    calculateBranchFit({
      preferenceRank:
        adapted
          .branchPreferenceRank,

      familyMatchScore:
        adapted
          .branchFamilyMatchScore,
    });


  const branch = {
    score:
      branchScore,

    confidence:
      branchScore === null
        ? 0
        : 100,

    status:
      branchScore === null
        ? FACTOR_STATUS
            .UNAVAILABLE
        : FACTOR_STATUS
            .AVAILABLE,

    preferenceRank:
      adapted
        .branchPreferenceRank,
  };


  /* =====================================
     QUALITY
  ===================================== */

  const qualityScore =
    calculateQualityScore({
      nirfScore:
        adapted.nirfScore,

      placementScore:
        adapted
          .placementScore,

      medianPackageScore:
        adapted
          .medianPackageScore,
    });


  const quality = {
    score:
      qualityScore,

    confidence:
      qualityScore === null
        ? 0
        : valueOrNull(
            adapted
              .qualityConfidence
          ) ?? 0,

    status:
      qualityScore === null
        ? FACTOR_STATUS
            .UNAVAILABLE
        : FACTOR_STATUS
            .AVAILABLE,
  };


  /* =====================================
     REVIEWS
  ===================================== */

  const reviewScore =
    valueOrNull(
      adapted.reviewScore
    );


  const reviews = {
    score:
      reviewScore,

    confidence:
      reviewScore === null
        ? 0
        : valueOrNull(
            adapted
              .reviewConfidence
          ) ?? 0,

    status:
      reviewScore === null
        ? FACTOR_STATUS
            .UNAVAILABLE
        : FACTOR_STATUS
            .AVAILABLE,
  };


  /* =====================================
     BUDGET
  ===================================== */

  const budgetScore =
    calculateBudgetScore({
      annualCost:
        adapted.annualCost,

      annualBudget:
        adapted.annualBudget,
    });


  const budget = {
    score:
      budgetScore,

    confidence:
      budgetScore === null
        ? 0
        : valueOrNull(
            adapted
              .budgetConfidence
          ) ?? 0,

    status:
      budgetScore === null
        ? FACTOR_STATUS
            .UNAVAILABLE
        : FACTOR_STATUS
            .AVAILABLE,
  };


  /* =====================================
     LOCATION
  ===================================== */

  const locationMode =
    String(
      adapted.locationMode ??
      fallbackLocationMode ??
      'NONE'
    )
      .trim()
      .toUpperCase();


  let location;


  if (
    locationMode ===
    'NONE'
  ) {
    location = {
      score: null,

      confidence:
        null,

      mode:
        'NONE',

      status:
        FACTOR_STATUS
          .NOT_APPLICABLE,
    };
  } else {
    const locationScore =
      valueOrNull(
        adapted.locationScore
      );


    location = {
      score:
        locationScore,

      confidence:
        locationScore === null
          ? 0
          : valueOrNull(
              adapted
                .locationConfidence
            ) ?? 0,

      mode:
        locationMode,

      status:
        locationScore === null
          ? FACTOR_STATUS
              .UNAVAILABLE
          : FACTOR_STATUS
              .AVAILABLE,
    };
  }


  /* =====================================
     FINAL
  ===================================== */

  const recommendation =
    buildRecommendation({
      admission,
      branch,
      quality,
      reviews,
      budget,
      location,
    });


  return {
    admission,

    branchFit:
      branch,

    quality,

    reviews,

    budget,

    location,

    matchScore:
      recommendation
        .matchScore,

    matchCategory:
      recommendation
        .matchCategory,

    confidenceScore:
      recommendation
        .confidenceScore,

    confidenceLabel:
      recommendation
        .confidenceLabel,

    dataCoverage:
      recommendation
        .dataCoverage,
  };
}


/* =========================================================
   HEALTH
========================================================= */

router.get(
  '/health',
  (req, res) => {
    return res.json({
      ok: true,

      service:
        'CW-REC',

      version:
        CWREC_VERSION,

      mode:
        'development',

      branchPreference:
        true,
    });
  }
);


/* =========================================================
   DIRECT SCORE
========================================================= */

router.post(
  '/score',
  (req, res) => {
    try {
      const body =
        req.body ?? {};


      const adapted = {
        studentRank:
          body.studentRank,

        closingRanks:
          body.closingRanks ??
          [],

        historicalRows:
          body.historicalRows ??
          [],

        admissionContextScore:
          body
            .admissionContextScore ??
          60,

        branchPreferenceRank:
          body
            .branchPreferenceRank ??
          null,

        branchFamilyMatchScore:
          body
            .branchFamilyMatchScore ??
          null,

        nirfScore:
          body.nirfScore ??
          null,

        placementScore:
          body
            .placementScore ??
          null,

        medianPackageScore:
          body
            .medianPackageScore ??
          null,

        qualityConfidence:
          body
            .qualityConfidence ??
          0,

        reviewScore:
          body.reviewScore ??
          null,

        reviewConfidence:
          body
            .reviewConfidence ??
          0,

        annualCost:
          body.annualCost ??
          null,

        annualBudget:
          body.annualBudget ??
          null,

        budgetConfidence:
          body
            .budgetConfidence ??
          0,

        locationScore:
          body.locationScore ??
          null,

        locationConfidence:
          body
            .locationConfidence ??
          null,

        locationMode:
          body.locationMode ??
          'NONE',
      };


      const scoring =
        scoreAdaptedInput(
          adapted,
          adapted.locationMode
        );


      return res.json({
        ok: true,

        scoringVersion:
          CWREC_VERSION,

        ...scoring,
      });
    } catch (error) {
      console.error(
        '[CW-REC SCORE]',
        error
      );


      return res
        .status(500)
        .json({
          ok: false,

          error:
            'CW-REC scoring failed',

          detail:
            error?.message ??
            'Unknown error',
        });
    }
  }
);


/* =========================================================
   SCORE REAL ROW
========================================================= */

router.post(
  '/score-row',
  (req, res) => {
    try {
      const {
        row,
        profile = {},
      } =
        req.body ?? {};


      if (
        !row ||
        typeof row !==
          'object'
      ) {
        return res
          .status(400)
          .json({
            ok: false,

            error:
              'row object is required',
          });
      }


      const adapted =
        adaptCounsellingRowToCWRecInput(
          row,
          profile
        );


      const scoring =
        scoreAdaptedInput(
          adapted,
          profile.locationMode ??
          'NONE'
        );


      return res.json({
        ok: true,

        scoringVersion:
          CWREC_VERSION,

        adaptedInput:
          adapted,



              /* ===========================
                 REVIEW INTELLIGENCE V3
              =========================== */

              reviewIntelligenceV3:
                row.reviewIntelligenceV3 ??
                null,

        ...scoring,
      });
    } catch (error) {
      console.error(
        '[CW-REC SCORE ROW]',
        error
      );


      return res
        .status(500)
        .json({
          ok: false,

          error:
            'CW-REC row scoring failed',

          detail:
            error?.message ??
            'Unknown error',
        });
    }
  }
);


/* =========================================================
   REAL ROWS
========================================================= */

router.get(
  '/real-rows',
  async (
    req,
    res
  ) => {
    try {
      const examId =
        String(
          req.query.examId ??
          'uptac'
        )
          .trim()
          .toLowerCase();


      const rank =
        Number(
          req.query.rank
        );


      const year =
        Number(
          req.query.year ??
          (
            examId ===
            'uptac'
              ? 2025
              : 2026
          )
        );


      const round =
        req.query.round ??
        '1';


      const category =
        req.query.category ??
        'OPEN';


      const quota =
        req.query.quota ??
        null;


      const gender =
        req.query.gender ??
        null;


      const limit =
        Number(
          req.query.limit ??
          250
        );


      const result =
        await fetchCWRecRows({
          examId,
          rank,
          year,
          round,
          category,
          quota,
          gender,
          limit,
        });


      return res.json({
        ok: true,

        ...result,
      });
    } catch (error) {
      console.error(
        '[CW-REC REAL ROWS]',
        error
      );


      return res
        .status(500)
        .json({
          ok: false,

          error:
            'CW-REC real-row fetch failed',

          detail:
            error?.message ??
            'Unknown error',
        });
    }
  }
);


/* =========================================================
   REAL RECOMMENDATIONS
========================================================= */

router.get(
  '/recommendations',
  async (
    req,
    res
  ) => {
    try {
      /* =====================================
         REQUEST
      ===================================== */

      const examId =
        String(
          req.query.examId ??
          'uptac'
        )
          .trim()
          .toLowerCase();


      const rank =
        Number(
          req.query.rank
        );


      const year =
        Number(
          req.query.year ??
          (
            examId ===
            'uptac'
              ? 2025
              : 2026
          )
        );


      const round =
        req.query.round ??
        '1';


      const category =
        req.query.category ??
        'OPEN';


      const quota =
        req.query.quota ??
        null;


      const gender =
        req.query.gender ??
        null;


      const annualBudget =
        valueOrNull(
          req.query
            .annualBudget
        );


      const locationMode =
        String(
          req.query
            .locationMode ??
          'NONE'
        )
          .trim()
          .toUpperCase();


      /*
      |--------------------------------------------------------------------------
      | BRANCH PREFERENCES
      |--------------------------------------------------------------------------
      |
      | Example:
      |
      | ?branchPreferences=CSE,IT,ECE
      |
      |--------------------------------------------------------------------------
      */

      const branchPreferences =
        parseBranchPreferences(
          req.query
            .branchPreferences
        );


      const rawLimit =
        Number(
          req.query.limit ??
          250
        );


      const limit =
        Math.min(
          Math.max(
            Number.isFinite(
              rawLimit
            )
              ? Math.trunc(
                  rawLimit
                )
              : 250,
            1
          ),
          1000
        );


      /*
      |--------------------------------------------------------------------------
      | INTERNAL CANDIDATE POOL
      |--------------------------------------------------------------------------
      |
      | Fetch more candidates than the user-visible limit.
      | Score/sort the whole pool first.
      |--------------------------------------------------------------------------
      */

      const candidatePoolLimit =
        Math.min(
          Math.max(
            limit * 5,
            500
          ),
          1000
        );


      /* =====================================
         FETCH
      ===================================== */

      const realData =
        await fetchCWRecRows({
          examId,
          rank,
          year,
          round,
          category,
          quota,
          gender,
          limit:
            candidatePoolLimit,
        });


      /* =====================================
         SCORE
      ===================================== */

      const scored =
        realData.rows.map(
          (row) => {
            /*
            ------------------------------------
            BRANCH PREFERENCE
            ------------------------------------
            */

            const branchPreference =
              scoreBranchPreference({
                branchName:
                  row.branch_name,

                preferences:
                  branchPreferences,
              });


            /*
            ------------------------------------
            PROFILE
            ------------------------------------
            */

            const profile = {
              rank,

              annualBudget,

              locationMode,

              branchPreferenceRank:
                branchPreference
                  .preferenceRank,

              branchFamilyMatchScore:
                branchPreference
                  .familyMatchScore,
            };


            /*
            ------------------------------------
            ADAPTER
            ------------------------------------
            */

            const adapted =
              adaptCounsellingRowToCWRecInput(
                row,
                profile
              );


            /*
            ------------------------------------
            SCORE
            ------------------------------------
            */

            const scoring =
              scoreAdaptedInput(
                adapted,
                locationMode
              );


            /*
            ------------------------------------
            RESULT
            ------------------------------------
            */

            return {
              collegeId:
                row.college_id,

              collegeName:
                row.college_name,

              branchId:
                row.branch_id,

              branchName:
                row.branch_name,


              /* ===========================
                 BRANCH INTELLIGENCE
              =========================== */

              branchFamily:
                branchPreference
                  .candidateFamily,

              branchPreferenceMatch: {
                type:
                  branchPreference
                    .matchType,

                matchedPreference:
                  branchPreference
                    .matchedPreference ??
                  null,

                matchedPreferencePosition:
                  branchPreference
                    .matchedPreferencePosition ??
                  branchPreference
                    .preferenceRank ??
                  null,
              },


              /* ===========================
                 COLLEGE
              =========================== */

              city:
                row.city,

              state:
                row.state,

              collegeType:
                row.type,


              /* ===========================
                 CONTEXT
              =========================== */

              examId,

              year:
                row.year,

              round:
                row.round,

              category:
                row.category,

              quota:
                row.quota,

              gender:
                row.gender,


              /* ===========================
                 CUTOFF
              =========================== */

              openingRank:
                row.openingRank,

              closingRank:
                row.closingRank,


              /* ===========================
                 SOURCE
              =========================== */

              counsellingType:
                row.counsellingType,

              source:
                row.source,

              sourceUrl:
                row.sourceUrl,

              retrievedAt:
                row.retrievedAt,

              isVerified:
                row.isVerified,

              verificationStatus:
                row
                  .verificationStatus,


              /* ===========================
                 DEBUG / INPUT
              =========================== */

              adaptedInput:
                adapted,


              

              /* ===========================
                 REVIEW INTELLIGENCE V3
              =========================== */

              reviewIntelligenceV3:
                row.reviewIntelligenceV3 ??
                null,

/* ===========================
                 SCORING
              =========================== */

              ...scoring,

              scoringVersion:
                CWREC_VERSION,
            };
          }
        );


      /* =====================================
         SORT
      ===================================== */

      scored.sort(
        compareRecommendations
      );


      /*
      |--------------------------------------------------------------------------
      | COMPLETE INTERNAL POOL BUCKET DISTRIBUTION
      |--------------------------------------------------------------------------
      */

      const bucketPoolStats =
        scored.reduce(
          (
            stats,
            item
          ) => {
            const bucket =
              item?.admission?.bucket ??
              'Unknown';

            stats[bucket] =
              (
                stats[bucket] ??
                0
              ) + 1;

            return stats;
          },
          {}
        );


      /*
      |--------------------------------------------------------------------------
      | FINAL USER-VISIBLE RESULTS
      |--------------------------------------------------------------------------
      */

      const dedupedRecommendations = [];
        const seenRecommendationKeys = new Set();

        for (const item of scored) {
          const collegeKey =
            String(
              item?.collegeId ||
              item?.collegeName ||
              ''
            )
              .trim()
              .toLowerCase();

          const branchKey =
            String(
              item?.branchId ||
              item?.branchName ||
              ''
            )
              .trim()
              .toLowerCase();

          const key =
            collegeKey + "::" + branchKey;

          if (
            !collegeKey ||
            !branchKey
          ) {
            dedupedRecommendations.push(
              item
            );
            continue;
          }

          if (
            seenRecommendationKeys.has(
              key
            )
          ) {
            continue;
          }

          seenRecommendationKeys.add(
            key
          );

          dedupedRecommendations.push(
            item
          );
        }

        const finalRecommendations =
        dedupedRecommendations.slice(
          0,
          limit
        );


      /* =====================================
         RESPONSE
      ===================================== */

      return res.json({
        ok: true,

        scoringVersion:
          CWREC_VERSION,

        data:
          finalRecommendations,

        meta: {
          ...realData.meta,

          count:
            finalRecommendations.length,

          candidatePoolCount:
            scored.length,

          candidatePoolLimit,

          bucketPoolStats,

          endpoint:
            'recommendations',

          recommendationOnly:
            true,

          mainCounsellingRouteTouched:
            false,

          locationMode,

          annualBudget,

          branchPreferences,

          branchPreferenceEnabled:
            branchPreferences.length >
            0,
        },
      });
    } catch (error) {
      console.error(
        '[CW-REC RECOMMENDATIONS]',
        error
      );


      return res
        .status(500)
        .json({
          ok: false,

          error:
            'CW-REC recommendations failed',

          detail:
            error?.message ??
            'Unknown error',
        });
    }
  }
);


export default router;

