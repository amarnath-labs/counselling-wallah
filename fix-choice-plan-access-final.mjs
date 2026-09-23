import fs from "node:fs";

const backend =
  "./backend/src/routes/payments.js";

const frontend =
  "./frontend/src/services/paymentService.js";


for (const file of [backend, frontend]) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing file: ${file}`
    );
  }
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
  backend +
    ".before-choice-access-final.js"
);

fs.copyFileSync(
  frontend,
  frontend +
    ".before-choice-access-final.js"
);


/*
|--------------------------------------------------------------------------
| BACKEND
|--------------------------------------------------------------------------
|
| Make choice-plan the highest paid product for access lookup.
|
*/

if (
  !b.includes(
    "WHEN 'choice-plan' THEN 4"
  )
) {
  const marker =
`CASE plan_id
              WHEN 'support' THEN 3`;

  if (!b.includes(marker)) {
    throw new Error(
      "Backend plan priority CASE not found"
    );
  }

  b =
    b.replace(
      marker,
`CASE plan_id
              WHEN 'choice-plan' THEN 4
              WHEN 'support' THEN 3`
    );
}


/*
|--------------------------------------------------------------------------
| FRONTEND NORMALIZER
|--------------------------------------------------------------------------
|
| Current schema must preserve the new entitlement.
|
*/

if (
  !f.includes(
    "choiceFillingPlan:"
  )
) {
  const callSupportMarker =
`    callSupport:
      Boolean(`;

  if (!f.includes(callSupportMarker)) {
    throw new Error(
      "Frontend callSupport normalizer block not found"
    );
  }

  const choiceBlock =
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
      callSupportMarker,
      choiceBlock +
        callSupportMarker
    );
}


/*
|--------------------------------------------------------------------------
| ADD choice-plan TO COLLEGE PREDICTOR FALLBACK
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
| ADD choice-plan TO RECOMMENDATION FALLBACK
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
| VALIDATE
|--------------------------------------------------------------------------
*/

const backendRequired = [
  "WHEN 'choice-plan' THEN 4",
  "const choiceFillingPlan",
  "'choice-plan'",
];

const frontendRequired = [
  "choiceFillingPlan:",
  "raw.choiceFillingPlan",
  "planId === 'choice-plan'",
];

for (const token of backendRequired) {
  if (!b.includes(token)) {
    throw new Error(
      `Backend validation failed: ${token}`
    );
  }
}

for (const token of frontendRequired) {
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
  "CHOICE PLAN ACCESS FIX COMPLETE"
);
console.log(
  "=============================================="
);
console.log(
  "Backend: choice-plan priority = 4"
);
console.log(
  "Frontend: choiceFillingPlan preserved"
);
console.log(
  "Frontend: choice-plan includes recommendation"
);
console.log(
  "Frontend: choice-plan includes predictor"
);
