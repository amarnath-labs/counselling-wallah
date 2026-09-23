import fs from 'fs';

const file =
  './backend/src/routes/neetRecommendations.js';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


src =
  src.replace(
    `  fetchNeetRecommendations,
} from '../services/neetRecommendationService.js';`,
    `  fetchNeetRecommendations,
  fetchNeetAdmissionHistory,
} from '../services/neetRecommendationService.js';`
  );


if (
  !src.includes(
    "router.get(\n  '/history'"
  )
) {

  const anchor =
    '\n\nexport default router;';


  if (
    !src.includes(
      anchor
    )
  ) {
    throw new Error(
      'NEET router export anchor not found.'
    );
  }


  const route =
`

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
`;


  src =
    src.replace(
      anchor,
      route +
      anchor
    );
}


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'NEET /history route added.'
);
