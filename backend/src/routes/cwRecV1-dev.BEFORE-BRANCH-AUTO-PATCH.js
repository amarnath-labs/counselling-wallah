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


const router =
  express.Router();


/* =========================================================
   HEALTH
========================================================= */

router.get(
  '/health',
  (req, res) => {
    return res.json({
      ok: true,
      service: 'CW-REC',
      version: CWREC_VERSION,
      mode: 'development',
    });
  }
);


/* =========================================================
   SHARED SCORING HELPER
========================================================= */

function scoreAdaptedInput(
  adapted,
  fallbackLocationMode = 'NONE'
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
      admissionConfidence.score,

    confidenceLabel:
      admissionConfidence.label,

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
        : Number(
            adapted
              .qualityConfidence
          ) || 0,

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

  const parsedReviewScore =
    adapted.reviewScore ===
      null ||
    adapted.reviewScore ===
      undefined ||
    adapted.reviewScore ===
      ''
      ? null
      : Number(
          adapted.reviewScore
        );


  const reviews = {
    score:
      Number.isFinite(
        parsedReviewScore
      )
        ? parsedReviewScore
        : null,

    confidence:
      Number.isFinite(
        Number(
          adapted
            .reviewConfidence
        )
      )
        ? Number(
            adapted
              .reviewConfidence
          )
        : 0,

    status:
      Number.isFinite(
        parsedReviewScore
      )
        ? FACTOR_STATUS
            .AVAILABLE
        : FACTOR_STATUS
            .UNAVAILABLE,
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
        : Number(
            adapted
              .budgetConfidence
          ) || 0,

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

  const normalizedLocationMode =
    String(
      adapted.locationMode ??
      fallbackLocationMode ??
      'NONE'
    )
      .trim()
      .toUpperCase();


  let location;


  if (
    normalizedLocationMode ===
    'NONE'
  ) {
    location = {
      score: null,

      confidence: null,

      mode: 'NONE',

      status:
        FACTOR_STATUS
          .NOT_APPLICABLE,
    };
  } else {
    const parsedLocationScore =
      adapted.locationScore ===
        null ||
      adapted.locationScore ===
        undefined ||
      adapted.locationScore ===
        ''
        ? null
        : Number(
            adapted
              .locationScore
          );


    location = {
      score:
        Number.isFinite(
          parsedLocationScore
        )
          ? parsedLocationScore
          : null,

      confidence:
        Number.isFinite(
          Number(
            adapted
              .locationConfidence
          )
        )
          ? Number(
              adapted
                .locationConfidence
            )
          : 0,

      mode:
        normalizedLocationMode,

      status:
        Number.isFinite(
          parsedLocationScore
        )
          ? FACTOR_STATUS
              .AVAILABLE
          : FACTOR_STATUS
              .UNAVAILABLE,
    };
  }


  /* =====================================
     FINAL CW-REC
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
   DIRECT SCORE
========================================================= */

router.post(
  '/score',
  (req, res) => {
    try {
      const {
        studentRank,

        closingRanks = [],
        historicalRows = [],

        admissionContextScore = 60,

        branchPreferenceRank = null,
        branchFamilyMatchScore = null,

        nirfScore = null,
        placementScore = null,
        medianPackageScore = null,

        qualityConfidence = 0,

        reviewScore = null,
        reviewConfidence = 0,

        annualCost = null,
        annualBudget = null,
        budgetConfidence = 0,

        locationScore = null,
        locationConfidence = 0,
        locationMode = 'SOFT',
      } = req.body ?? {};


      const adapted = {
        studentRank,

        closingRanks,

        historicalRows,

        admissionContextScore,

        branchPreferenceRank,

        branchFamilyMatchScore,

        nirfScore,

        placementScore,

        medianPackageScore,

        qualityConfidence,

        reviewScore,

        reviewConfidence,

        annualCost,

        annualBudget,

        budgetConfidence,

        locationScore,

        locationConfidence,

        locationMode,
      };


      const scored =
        scoreAdaptedInput(
          adapted,
          locationMode
        );


      return res.json({
        ok: true,

        scoringVersion:
          CWREC_VERSION,

        ...scored,
      });
    } catch (error) {
      console.error(
        '[CW-REC DEV SCORE]',
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
   SCORE ONE REAL COUNSELLING ROW
========================================================= */

router.post(
  '/score-row',
  (req, res) => {
    try {
      const {
        row,
        profile = {},
      } = req.body ?? {};


      if (
        !row ||
        typeof row !== 'object'
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


      const scored =
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

        ...scored,
      });
    } catch (error) {
      console.error(
        '[CW-REC DEV SCORE-ROW]',
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
   RECOMMENDATION-ONLY REAL ROWS
========================================================= */

router.get(
  '/real-rows',
  async (req, res) => {
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
            examId === 'uptac'
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


      const detail =
        error?.message ??
        'Unknown error';


      const badRequest =
        [
          'Unsupported counselling exam',
          'Valid rank is required',
          'Valid year is required',
          'Valid round is required',
          'Valid category is required',
        ].includes(
          detail
        );


      return res
        .status(
          badRequest
            ? 400
            : 500
        )
        .json({
          ok: false,

          error:
            'CW-REC real-row fetch failed',

          detail,
        });
    }
  }
);


/* =========================================================
   FINAL REAL RECOMMENDATIONS
========================================================= */

router.get(
  '/recommendations',
  async (req, res) => {
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
            examId === 'uptac'
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
        req.query.annualBudget ===
          undefined ||
        req.query.annualBudget ===
          null ||
        req.query.annualBudget ===
          ''
          ? null
          : Number(
              req.query.annualBudget
            );


      const locationMode =
        String(
          req.query.locationMode ??
          'NONE'
        )
          .trim()
          .toUpperCase();


      const requestedLimit =
        Number(
          req.query.limit ??
          250
        );


      const limit =
        Math.min(
          Math.max(
            Number.isFinite(
              requestedLimit
            )
              ? Math.trunc(
                  requestedLimit
                )
              : 250,
            1
          ),
          1000
        );


      /*
      |--------------------------------------------------------------------------
      | FETCH REAL RECOMMENDATION ROWS
      |--------------------------------------------------------------------------
      */

      const realData =
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


      /*
      |--------------------------------------------------------------------------
      | SCORE EACH ROW
      |--------------------------------------------------------------------------
      */

      const scored =
        realData.rows.map(
          (row) => {
            const profile = {
              rank,

              annualBudget,

              locationMode,

              branchPreferenceRank:
                null,

              branchFamilyMatchScore:
                null,
            };


            const adapted =
              adaptCounsellingRowToCWRecInput(
                row,
                profile
              );


            const scoring =
              scoreAdaptedInput(
                adapted,
                locationMode
              );


            return {
              collegeId:
                row.college_id,

              collegeName:
                row.college_name,

              branchId:
                row.branch_id,

              branchName:
                row.branch_name,

              city:
                row.city,

              state:
                row.state,

              collegeType:
                row.type,


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


              openingRank:
                row.openingRank,

              closingRank:
                row.closingRank,


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
                row.verificationStatus,


              adaptedInput:
                adapted,


              ...scoring,


              scoringVersion:
                CWREC_VERSION,
            };
          }
        );


      /*
      |--------------------------------------------------------------------------
      | SORT
      |
      | Expected service priority:
      | Target -> Safe -> Backup -> Dream
      | then score/confidence/etc.
      |--------------------------------------------------------------------------
      */

      const sorted =
        scored.sort(
          compareRecommendations
        );


      /*
      |--------------------------------------------------------------------------
      | RESPONSE
      |--------------------------------------------------------------------------
      */

      return res.json({
        ok: true,

        scoringVersion:
          CWREC_VERSION,

        data:
          sorted,

        meta: {
          ...realData.meta,

          count:
            sorted.length,

          endpoint:
            'recommendations',

          recommendationOnly:
            true,

          mainCounsellingRouteTouched:
            false,

          locationMode,

          annualBudget,
        },
      });
    } catch (error) {
      console.error(
        '[CW-REC RECOMMENDATIONS]',
        error
      );


      const detail =
        error?.message ??
        'Unknown error';


      const badRequest =
        [
          'Unsupported counselling exam',
          'Valid rank is required',
          'Valid year is required',
          'Valid round is required',
          'Valid category is required',
        ].includes(
          detail
        );


      return res
        .status(
          badRequest
            ? 400
            : 500
        )
        .json({
          ok: false,

          error:
            'CW-REC recommendations failed',

          detail,
        });
    }
  }
);


export default router;