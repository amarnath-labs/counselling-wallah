import {
  Router,
} from "express";

import {
  fetchAndIngestReddit,
  ingestReviews,
  getReviewEnrichmentStatus,
} from "../services/reviewEnrichment/reviewEnrichmentService.js";


import {
  fillCollegeReviewsTo100,
} from "../services/reviewEnrichment/multiSourceReviewCollector.js";

const router =
  Router();


router.get(
  "/:collegeId/status",
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await getReviewEnrichmentStatus(
          req.params
            .collegeId
        );

      res.json({
        ok: true,
        ...result,
      });
    }
    catch (
      error
    ) {
      next(
        error
      );
    }
  }
);


router.post(
  "/:collegeId/reddit",
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await fetchAndIngestReddit({
          collegeId:
            req.params
              .collegeId,

          maxReviews:
            req.body
              ?.maxReviews ||
            60,
        });


      res.json({
        ok: true,
        ...result,
      });
    }
    catch (
      error
    ) {
      next(
        error
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| Authorized/licensed/manual source import
|--------------------------------------------------------------------------
|
| Use this for:
| - Quora export/data you are authorized to use
| - Shiksha licensed/exported data
| - Collegedunia licensed/exported data
| - Careers360 licensed/exported data
| - GetMyUni
| - CollegeBatch
| - CollegeDekho
| - Zollege
|
| Do NOT fabricate reviews.
|
*/

router.post(
  "/:collegeId/import",
  async (
    req,
    res,
    next
  ) => {
    try {
      const {
        source,
        sourceType =
          "rating_platform",

        baseUrl =
          null,

        reviews =
          [],
      } =
        req.body ||
        {};


      if (
        !source
      ) {
        return res
          .status(
            400
          )
          .json({
            error:
              "source is required",
          });
      }


      if (
        !Array.isArray(
          reviews
        )
      ) {
        return res
          .status(
            400
          )
          .json({
            error:
              "reviews must be an array",
          });
      }


      const result =
        await ingestReviews({
          collegeId:
            req.params
              .collegeId,

          source,

          sourceType,

          baseUrl,

          reviews,
        });


      res.json({
        ok: true,
        ...result,
      });
    }
    catch (
      error
    ) {
      next(
        error
      );
    }
  }
);



router.post(
  "/:collegeId/fill-to-100",
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await fillCollegeReviewsTo100({
          collegeId:
            req.params.collegeId,
        });


      res.json({
        ok: true,
        ...result,
      });
    }
    catch (
      error
    ) {
      next(
        error
      );
    }
  }
);


export default router;
