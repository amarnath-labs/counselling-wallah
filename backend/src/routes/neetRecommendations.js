import {
  Router,
} from 'express';

import {
  fetchNeetRecommendations,
  fetchNeetAdmissionHistory,
} from '../services/neetRecommendationService.js';


const router =
  Router();


router.get(
  '/recommendations',
  async (
    req,
    res
  ) => {

    try {

      const courses =
        String(
          req.query.courses ||
          ''
        )
          .split(',')
          .map(
            item =>
              item.trim()
          )
          .filter(
            Boolean
          );


      const result =
        await fetchNeetRecommendations({
          rank:
            req.query.rank,

          year:
            req.query.year ??
            2026,

          round:
            req.query.round ??
            1,

          category:
            req.query.category ??
            'Open',

          courses,

          counsellingMode:
            req.query
              .counsellingMode ??
            'mcc',

          state:
            req.query.state ??
            '',

          limit:
            req.query.limit ??
            100,
        });


      return res.json({
        ok:
          true,

        ...result,
      });

    } catch (
      error
    ) {

      console.error(
        '[NEET RECOMMENDATIONS]',
        error
      );


      const message =
        error?.message ||
        'Unable to load NEET recommendations.';


      const clientError =
        /required|not available|not connected|currently available/i.test(
          message
        );


      return res
        .status(
          clientError
            ? 400
            : 500
        )
        .json({
          ok:
            false,

          error:
            message,
        });
    }
  }
);


router.get(
  '/history',
  async (
    req,
    res
  ) => {

    try {

      const result =
        await fetchNeetAdmissionHistory({
          collegeName:
            req.query.collegeName,

          course:
            req.query.course,

          category:
            req.query.category ??
            'Open',

          quota:
            req.query.quota ??
            '',

          rank:
            req.query.rank,

          round:
            req.query.round ??
            1,
        });


      return res.json({
        ok:
          true,

        ...result,
      });

    } catch (
      error
    ) {

      console.error(
        '[NEET HISTORY]',
        error
      );


      return res
        .status(400)
        .json({
          ok:
            false,

          error:
            error?.message ||
            'Unable to load NEET MCC history.',
        });
    }
  }
);


export default router;
