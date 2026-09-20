import fs from "node:fs";

const file =
  "./src/routes/counselling.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const importLine =
  `import { buildReviewIntelligenceV4 } from '../services/reviewIntelligenceV4Service.js';`;

if (
  !source.includes(
    importLine
  )
) {
  const routerMarker =
    "const router = Router();";

  if (
    !source.includes(
      routerMarker
    )
  ) {
    throw new Error(
      "Could not find const router = Router();"
    );
  }

  source =
    source.replace(
      routerMarker,
      `${importLine}

${routerMarker}`
    );
}

const routeMarker =
  "TRUMARG REVIEW INTELLIGENCE V4 ENDPOINT";

if (
  !source.includes(
    routeMarker
  )
) {
  const exportMarker =
    "export default router;";

  if (
    !source.includes(
      exportMarker
    )
  ) {
    throw new Error(
      "Could not find export default router;"
    );
  }

  const route = `

/*
|--------------------------------------------------------------------------
| TRUMARG REVIEW INTELLIGENCE V4 ENDPOINT
|--------------------------------------------------------------------------
|
| Additive reliability / explanation endpoint.
|
| Does NOT modify:
| - candidate selection
| - admission bucket
| - premium match score
| - V3 review component
| - recommendation ordering
|
*/

router.get(
  '/review-intelligence-v4',
  async (
    req,
    res,
    next
  ) => {
    let client;

    try {
      const collegeId =
        String(
          req.query.collegeId ||
          ''
        ).trim();

      const branch =
        String(
          req.query.branch ||
          ''
        ).trim() ||
        null;

      if (!collegeId) {
        return res
          .status(400)
          .json({
            error:
              'collegeId is required',
          });
      }

      client =
        await pool.connect();

      const data =
        await buildReviewIntelligenceV4(
          client,
          {
            collegeId,
            branch,
          }
        );

      return res.json({
        data,
      });
    }
    catch (error) {
      return next(error);
    }
    finally {
      if (client) {
        client.release();
      }
    }
  }
);

`;

  source =
    source.replace(
      exportMarker,
      `${route}
${exportMarker}`
    );
}

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "V4 route patch complete."
);
