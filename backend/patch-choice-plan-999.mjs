import fs from "node:fs";

const file =
  "./src/routes/payments.js";

const backup =
  "./src/routes/payments.before-choice-plan-999.js";

if (!fs.existsSync(file)) {
  throw new Error(
    "payments.js not found"
  );
}

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  source.includes(
    "TRUMARG CHOICE PLAN 999"
  )
) {
  console.log(
    "Choice Plan backend patch already applied."
  );

  process.exit(0);
}

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| 1. ADD Rs 999 PLAN
|--------------------------------------------------------------------------
*/

const supportPlanRegex =
  /support\s*:\s*\{[\s\S]*?id\s*:\s*['"]support['"][\s\S]*?name\s*:\s*['"]Call Support['"][\s\S]*?amount\s*:\s*599[\s\S]*?level\s*:\s*3[\s\S]*?\},/m;

const supportMatch =
  source.match(
    supportPlanRegex
  );

if (!supportMatch) {
  throw new Error(
    "Current support plan block not found. No file written."
  );
}

const choicePlanBlock =
`

  /*
  |--------------------------------------------------------------------------
  | TRUMARG CHOICE PLAN 999
  |--------------------------------------------------------------------------
  */

  'choice-plan': {
    id: 'choice-plan',
    name: 'Choice-Filling Plan',
    amount: 999,
    level: 4,
  },`;

source =
  source.replace(
    supportMatch[0],
    supportMatch[0] +
      choicePlanBlock
  );


/*
|--------------------------------------------------------------------------
| 2. REPLACE ACCESS CALCULATION
|--------------------------------------------------------------------------
|
| Do NOT use level >= 3 / >= 4 for every product.
|
| support and choice-plan are separate products:
|
| basic       => College Predictor
| finder      => Predictor + Recommendation
| support     => Predictor + Recommendation + Call Support
| choice-plan => Predictor + Recommendation + Choice Filling Plan
|
*/

const oldAccessRegex =
  /const\s+level\s*=\s*planId[\s\S]*?return\s+res\.json\(\{[\s\S]*?access\s*:\s*\{[\s\S]*?callSupport\s*:\s*level\s*>=\s*3,\s*\},\s*\}\);/m;

const accessMatch =
  source.match(
    oldAccessRegex
  );

if (!accessMatch) {
  throw new Error(
    "Current /me/access level-based block not found. No file written."
  );
}

const newAccessBlock =
`/*
      |--------------------------------------------------------------------------
      | TRUMARG EXPLICIT PRODUCT ENTITLEMENTS
      |--------------------------------------------------------------------------
      */

      const plan =
        planId
          ? PLANS[planId] || null
          : null;

      const hasPaidPlan =
        Boolean(plan);

      const collegePredictor =
        [
          'basic',
          'finder',
          'support',
          'choice-plan',
        ].includes(
          planId
        );

      const recommendation =
        [
          'finder',
          'support',
          'choice-plan',
        ].includes(
          planId
        );

      const choiceFillingPlan =
        planId ===
          'choice-plan';

      const callSupport =
        planId ===
          'support';


      return res.json({
        success:
          true,

        access: {
          planId,

          planName:
            row?.plan_name ||
            plan?.name ||
            null,

          hasPaidPlan,

          collegePredictor,

          recommendation,

          choiceFillingPlan,

          callSupport,
        },
      });`;

source =
  source.replace(
    oldAccessRegex,
    newAccessBlock
  );


/*
|--------------------------------------------------------------------------
| 3. SAFETY CHECKS
|--------------------------------------------------------------------------
*/

const required = [
  "'choice-plan'",
  "amount: 999",
  "choiceFillingPlan",
  "TRUMARG CHOICE PLAN 999",
  "TRUMARG EXPLICIT PRODUCT ENTITLEMENTS",
];

for (const token of required) {
  if (
    !source.includes(
      token
    )
  ) {
    throw new Error(
      `Validation failed: ${token}`
    );
  }
}


fs.writeFileSync(
  file,
  source,
  "utf8"
);


console.log("");
console.log(
  "=============================================="
);
console.log(
  "TRUMARG Rs 999 BACKEND PAYMENT PATCH COMPLETE"
);
console.log(
  "=============================================="
);
console.log(
  "Backup:",
  backup
);
console.log(
  "Updated:",
  file
);
console.log("");
console.log(
  "choice-plan => Rs 999"
);
console.log(
  "choiceFillingPlan => true only for choice-plan"
);
console.log(
  "callSupport => true only for support"
);
