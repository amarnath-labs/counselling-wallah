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


      /* =====================================
         ADMISSION
      ===================================== */

      const historicalFit =
        calculateHistoricalFit({
          studentRank,
          closingRanks,
        });


      const admissionConfidence =
        calculateAdmissionConfidence({
          historicalRows,

          contextScore:
            admissionContextScore,
        });


      const admission =
        historicalFit
          .historicalFitScore ===
        null
          ? {
              score: null,

              historicalFitScore:
                null,

              bucket:
                'Admission data pending',

              confidence:
                admissionConfidence.score,

              confidenceLabel:
                admissionConfidence.label,

              status:
                FACTOR_STATUS.UNAVAILABLE,

              medianClosingRank:
                historicalFit
                  .medianClosingRank,

              relativeMargin:
                historicalFit
                  .relativeMargin,
            }
          : {
              score:
                historicalFit
                  .historicalFitScore,

              historicalFitScore:
                historicalFit
                  .historicalFitScore,

              bucket:
                historicalFit.bucket,

              confidence:
                admissionConfidence.score,

              confidenceLabel:
                admissionConfidence.label,

              status:
                FACTOR_STATUS.AVAILABLE,

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
            branchPreferenceRank,

          familyMatchScore:
            branchFamilyMatchScore,
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
            ? FACTOR_STATUS.UNAVAILABLE
            : FACTOR_STATUS.AVAILABLE,

        preferenceRank:
          branchPreferenceRank,
      };


      /* =====================================
         QUALITY
      ===================================== */

      const qualityScore =
        calculateQualityScore({
          nirfScore,
          placementScore,
          medianPackageScore,
        });


      const quality = {
        score:
          qualityScore,

        confidence:
          qualityScore === null
            ? 0
            : Number(
                qualityConfidence
              ) || 0,

        status:
          qualityScore === null
            ? FACTOR_STATUS.UNAVAILABLE
            : FACTOR_STATUS.AVAILABLE,
      };


      /* =====================================
         REVIEWS
      ===================================== */

      const parsedReviewScore =
        reviewScore === null ||
        reviewScore === undefined ||
        reviewScore === ''
          ? null
          : Number(
              reviewScore
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
              reviewConfidence
            )
          )
            ? Number(
                reviewConfidence
              )
            : 0,

        status:
          Number.isFinite(
            parsedReviewScore
          )
            ? FACTOR_STATUS.AVAILABLE
            : FACTOR_STATUS.UNAVAILABLE,
      };


      /* =====================================
         BUDGET
      ===================================== */

      const budgetScore =
        calculateBudgetScore({
          annualCost,
          annualBudget,
        });


      const budget = {
        score:
          budgetScore,

        confidence:
          budgetScore === null
            ? 0
            : Number(
                budgetConfidence
              ) || 0,

        status:
          budgetScore === null
            ? FACTOR_STATUS.UNAVAILABLE
            : FACTOR_STATUS.AVAILABLE,
      };


      /* =====================================
         LOCATION
      ===================================== */

      const normalizedLocationMode =
        String(
          locationMode ??
          'SOFT'
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
          locationScore === null ||
          locationScore === undefined ||
          locationScore === ''
            ? null
            : Number(
                locationScore
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
                locationConfidence
              )
            )
              ? Number(
                  locationConfidence
                )
              : 0,

          mode:
            normalizedLocationMode,

          status:
            Number.isFinite(
              parsedLocationScore
            )
              ? FACTOR_STATUS.AVAILABLE
              : FACTOR_STATUS.UNAVAILABLE,
        };
      }


      /* =====================================
         FINAL RESULT
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


      return res.json({
        ok: true,

        scoringVersion:
          CWREC_VERSION,

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
   SCORE REAL COUNSELLING ROW
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


      /* =====================================
         ADAPT RAW ROW
      ===================================== */

      const adapted =
        adaptCounsellingRowToCWRecInput(
          row,
          profile
        );


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
          'SOFT'
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
         FINAL CW-REC RESULT
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


      return res.json({
        ok: true,

        scoringVersion:
          CWREC_VERSION,

        adaptedInput:
          adapted,

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
   RECOMMENDATION-ONLY REAL DATA
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


export default router;