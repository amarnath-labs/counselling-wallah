import fs from "node:fs";

const backend =
  "./backend/src/routes/payments.js";

const frontend =
  "./frontend/src/services/paymentService.js";

if (!fs.existsSync(backend)) {
  throw new Error("backend payments.js missing");
}

if (!fs.existsSync(frontend)) {
  throw new Error("frontend paymentService.js missing");
}

let b = fs.readFileSync(
  backend,
  "utf8"
);

let f = fs.readFileSync(
  frontend,
  "utf8"
);

fs.copyFileSync(
  backend,
  backend + ".before-entitlement-aggregate.js"
);

fs.copyFileSync(
  frontend,
  frontend + ".before-entitlement-aggregate.js"
);


/*
|--------------------------------------------------------------------------
| BACKEND /me/access
|--------------------------------------------------------------------------
|
| Aggregate ALL verified purchases.
|--------------------------------------------------------------------------
*/

const routeStart =
  b.indexOf(
    "router.get(\n  '/me/access'"
  );

if (routeStart === -1) {
  throw new Error(
    "/me/access route start not found"
  );
}

const plansComment =
  b.indexOf(
    "| PLANS",
    routeStart
  );

if (plansComment === -1) {
  throw new Error(
    "PLANS section after /me/access not found"
  );
}

const commentStart =
  b.lastIndexOf(
    "/*",
    plansComment
  );

if (commentStart === -1) {
  throw new Error(
    "PLANS comment start not found"
  );
}

const newAccessRoute =
`router.get(
  '/me/access',
  requireAuth,
  async (
    req,
    res,
    next
  ) => {
    try {
      /*
      |--------------------------------------------------------------------------
      | TRUMARG AGGREGATED PAYMENT ENTITLEMENTS
      |--------------------------------------------------------------------------
      |
      | Products are NOT treated as one simple hierarchy.
      |
      | A user may own:
      | - College Predictor
      | - Recommendation
      | - Choice-Filling Plan
      | - Call Support
      |
      | independently.
      |--------------------------------------------------------------------------
      */

      const result =
        await pool.query(
          \`
          SELECT
            plan_id,
            plan_name,
            amount,
            verified_at
          FROM payments
          WHERE user_id = $1
            AND status = 'verified'
          ORDER BY
            verified_at DESC NULLS LAST,
            id DESC
          \`,
          [
            String(
              req.user.id
            ),
          ]
        );


      const rows =
        Array.isArray(
          result.rows
        )
          ? result.rows
          : [];


      const purchasedPlans =
        new Set(
          rows
            .map(
              row =>
                String(
                  row?.plan_id ||
                  ''
                )
                  .trim()
                  .toLowerCase()
            )
            .filter(Boolean)
        );


      const hasBasic =
        purchasedPlans.has(
          'basic'
        );

      const hasFinder =
        purchasedPlans.has(
          'finder'
        );

      const hasSupport =
        purchasedPlans.has(
          'support'
        );

      const hasChoicePlan =
        purchasedPlans.has(
          'choice-plan'
        );


      const collegePredictor =
        hasBasic ||
        hasFinder ||
        hasSupport ||
        hasChoicePlan;


      const recommendation =
        hasFinder ||
        hasSupport ||
        hasChoicePlan;


      const choiceFillingPlan =
        hasChoicePlan;


      const callSupport =
        hasSupport;


      /*
      |--------------------------------------------------------------------------
      | Compatibility primary plan
      |--------------------------------------------------------------------------
      */

      let planId = null;

      if (hasChoicePlan) {
        planId =
          'choice-plan';
      } else if (hasSupport) {
        planId =
          'support';
      } else if (hasFinder) {
        planId =
          'finder';
      } else if (hasBasic) {
        planId =
          'basic';
      }


      const primaryRow =
        rows.find(
          row =>
            String(
              row?.plan_id ||
              ''
            )
              .trim()
              .toLowerCase() ===
            planId
        ) ||
        null;


      return res.json({
        success: true,

        access: {
          planId,

          planName:
            primaryRow?.plan_name ||
            (
              planId
                ? PLANS[
                    planId
                  ]?.name ||
                  null
                : null
            ),

          hasPaidPlan:
            purchasedPlans.size >
            0,

          collegePredictor,

          recommendation,

          choiceFillingPlan,

          callSupport,

          purchasedPlans:
            Array.from(
              purchasedPlans
            ),
        },
      });

    } catch (error) {
      next(error);
    }
  }
);


`;

b =
  b.slice(
    0,
    routeStart
  ) +
  newAccessRoute +
  b.slice(
    commentStart
  );


/*
|--------------------------------------------------------------------------
| FRONTEND NORMALIZER
|--------------------------------------------------------------------------
*/

if (
  !f.includes(
    "choiceFillingPlan:"
  )
) {
  const marker =
`    callSupport:
      Boolean(`;

  if (!f.includes(marker)) {
    throw new Error(
      "callSupport block not found in paymentService.js"
    );
  }

  f =
    f.replace(
      marker,
`    choiceFillingPlan:
      Boolean(
        raw.choiceFillingPlan ??
        raw.choice_filling_plan ??
        raw.choicePlan ??
        (
          planId ===
            'choice-plan'
        )
      ),

${marker}`
    );
}


/*
|--------------------------------------------------------------------------
| Ensure choice-plan fallback
|--------------------------------------------------------------------------
*/

f =
  f.replace(
    /planId === 'support'\s*\n(\s*)\)/g,
    `planId === 'support' ||
$1planId === 'choice-plan'
$1)`
  );


/*
|--------------------------------------------------------------------------
| VALIDATE
|--------------------------------------------------------------------------
*/

const backendChecks = [
  "TRUMARG AGGREGATED PAYMENT ENTITLEMENTS",
  "purchasedPlans.has(",
  "'choice-plan'",
  "choiceFillingPlan",
  "Array.from(",
];

for (const token of backendChecks) {
  if (!b.includes(token)) {
    throw new Error(
      "Backend validation failed: " +
      token
    );
  }
}

if (
  !f.includes(
    "choiceFillingPlan:"
  )
) {
  throw new Error(
    "Frontend choiceFillingPlan missing"
  );
}


fs.writeFileSync(
  backend,
  b,
  "utf8"
);

fs.writeFileSync(
  frontend,
  f,
  "utf8"
);

console.log("");
console.log(
  "=============================================="
);
console.log(
  "CHOICE PLAN ACCESS AGGREGATION FIXED"
);
console.log(
  "=============================================="
);
console.log(
  "All verified payments are now considered."
);
console.log(
  "Existing ₹999 purchase should unlock automatically."
);
