import fs from "node:fs";

const file =
  "./src/routes/reviewEnrichment.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );


const importLine =
`import {
  fillCollegeReviewsTo100,
} from "../services/reviewEnrichment/multiSourceReviewCollector.js";`;


if (
  !source.includes(
    "fillCollegeReviewsTo100"
  )
) {
  const routerIndex =
    source.indexOf(
      "const router"
    );

  if (
    routerIndex === -1
  ) {
    throw new Error(
      "const router not found"
    );
  }


  source =
    source.slice(
      0,
      routerIndex
    ) +
    importLine +
    "\n\n" +
    source.slice(
      routerIndex
    );
}


if (
  !source.includes(
    '"/:collegeId/fill-to-100"'
  )
) {
  const exportIndex =
    source.lastIndexOf(
      "export default router"
    );


  if (
    exportIndex === -1
  ) {
    throw new Error(
      "export default router not found"
    );
  }


  const route =
`
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


`;


  source =
    source.slice(
      0,
      exportIndex
    ) +
    route +
    source.slice(
      exportIndex
    );
}


fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "fill-to-100 route added"
);
