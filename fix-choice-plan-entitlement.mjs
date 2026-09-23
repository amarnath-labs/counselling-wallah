import fs from "node:fs";

const backend =
  "./backend/src/routes/payments.js";

const frontend =
  "./frontend/src/services/paymentService.js";

if (!fs.existsSync(backend)) {
  throw new Error("payments.js missing");
}

if (!fs.existsSync(frontend)) {
  throw new Error("paymentService.js missing");
}

let b =
  fs.readFileSync(
    backend,
    "utf8"
  );

let f =
  fs.readFileSync(
    frontend,
    "utf8"
  );

fs.copyFileSync(
  backend,
  backend + ".before-choice-entitlement-fix.js"
);

fs.copyFileSync(
  frontend,
  frontend + ".before-choice-entitlement-fix.js"
);


/*
|--------------------------------------------------------------------------
| BACKEND: choice-plan highest priority in /me/access
|--------------------------------------------------------------------------
*/

if (
  !b.includes(
    "WHEN 'choice-plan' THEN 4"
  )
) {
  const oldCase =
`CASE plan_id
              WHEN 'support' THEN 3
              WHEN 'finder' THEN 2
              WHEN 'basic' THEN 1`;

  const newCase =
`CASE plan_id
              WHEN 'choice-plan' THEN 4
              WHEN 'support' THEN 3
              WHEN 'finder' THEN 2
              WHEN 'basic' THEN 1`;

  if (!b.includes(oldCase)) {
    throw new Error(
      "Backend access priority CASE not found"
    );
  }

  b =
    b.replace(
      oldCase,
      newCase
    );
}


/*
|--------------------------------------------------------------------------
| FRONTEND: include choice-plan in predictor fallback
|--------------------------------------------------------------------------
*/

f =
  f.replace(
`          planId === 'basic' ||
          planId === 'finder' ||
          planId === 'support'`,
`          planId === 'basic' ||
          planId === 'finder' ||
          planId === 'support' ||
          planId === 'choice-plan'`
  );


/*
|--------------------------------------------------------------------------
| FRONTEND: include choice-plan in recommendation fallback
|--------------------------------------------------------------------------
*/

f =
  f.replace(
`          planId === 'finder' ||
          planId === 'support'`,
`          planId === 'finder' ||
          planId === 'support' ||
          planId === 'choice-plan'`
  );


/*
|--------------------------------------------------------------------------
| FRONTEND: add dedicated choiceFillingPlan entitlement
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
      "callSupport normalizer block not found"
    );
  }

  const choiceAccess =
`    choiceFillingPlan:
      Boolean(
        raw.choiceFillingPlan ??
        raw.choice_filling_plan ??
        raw.choicePlan ??
        (
          planId === 'choice-plan'
        )
      ),

`;

  f =
    f.replace(
      marker,
      choiceAccess + marker
    );
}


/*
|--------------------------------------------------------------------------
| VALIDATE
|--------------------------------------------------------------------------
*/

const requiredBackend = [
  "WHEN 'choice-plan' THEN 4",
  "choiceFillingPlan",
  "'choice-plan'",
];

const requiredFrontend = [
  "choiceFillingPlan:",
  "raw.choiceFillingPlan",
  "planId === 'choice-plan'",
];

for (const token of requiredBackend) {
  if (!b.includes(token)) {
    throw new Error(
      `Backend validation failed: ${token}`
    );
  }
}

for (const token of requiredFrontend) {
  if (!f.includes(token)) {
    throw new Error(
      `Frontend validation failed: ${token}`
    );
  }
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
  "CHOICE PLAN ENTITLEMENT FIX COMPLETE"
);
console.log(
  "=============================================="
);
console.log(
  "Backend access priority fixed"
);
console.log(
  "Frontend choiceFillingPlan preserved"
);
