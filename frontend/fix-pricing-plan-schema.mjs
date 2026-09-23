import fs from "node:fs";

const file =
  "./src/pages/Pricing.jsx";

const backup =
  "./src/pages/Pricing.before-plan-schema-fix.jsx";

if (!fs.existsSync(file)) {
  throw new Error(
    "Pricing.jsx not found"
  );
}

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  backup
);

if (
  s.includes(
    "TRUMARG PLAN SCHEMA COMPATIBILITY"
  )
) {
  console.log(
    "Plan compatibility fix already applied."
  );

  process.exit(0);
}


/*
|--------------------------------------------------------------------------
| FIND PLANS ARRAY
|--------------------------------------------------------------------------
*/

const marker =
  "const PLANS =";

const start =
  s.indexOf(
    marker
  );

if (start === -1) {
  throw new Error(
    "const PLANS not found"
  );
}

const arrayStart =
  s.indexOf(
    "[",
    start
  );

if (arrayStart === -1) {
  throw new Error(
    "PLANS [ not found"
  );
}


/*
|--------------------------------------------------------------------------
| FIND MATCHING ]
|--------------------------------------------------------------------------
*/

let depth = 0;
let quote = null;
let escaped = false;
let arrayEnd = -1;

for (
  let i = arrayStart;
  i < s.length;
  i++
) {
  const ch = s[i];

  if (quote) {
    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      escaped = true;
      continue;
    }

    if (ch === quote) {
      quote = null;
    }

    continue;
  }

  if (
    ch === "'" ||
    ch === '"' ||
    ch === "`"
  ) {
    quote = ch;
    continue;
  }

  if (ch === "[") {
    depth++;
  }

  if (ch === "]") {
    depth--;

    if (depth === 0) {
      arrayEnd = i;
      break;
    }
  }
}

if (arrayEnd === -1) {
  throw new Error(
    "PLANS closing ] not found"
  );
}


/*
|--------------------------------------------------------------------------
| ADD COMPATIBILITY MAPPING
|--------------------------------------------------------------------------
|
| Current plan objects:
|
| amount
| numericAmount
| subtitle
| items
|
| Current UI expects:
|
| price
| description
| features
|
| We preserve BOTH.
|
*/

const replacement =
`]/* TRUMARG PLAN SCHEMA COMPATIBILITY */
.map(
  (plan) => ({
    ...plan,

    price:
      plan.price ??
      plan.numericAmount ??
      null,

    description:
      plan.description ??
      plan.subtitle ??
      '',

    features:
      Array.isArray(
        plan.features
      )
        ? plan.features
        : Array.isArray(
            plan.items
          )
          ? plan.items
          : [],
  })
)`;


s =
  s.slice(
    0,
    arrayEnd
  ) +
  replacement +
  s.slice(
    arrayEnd + 1
  );


/*
|--------------------------------------------------------------------------
| VALIDATE
|--------------------------------------------------------------------------
*/

const required = [
  "TRUMARG PLAN SCHEMA COMPATIBILITY",
  "plan.numericAmount",
  "plan.subtitle",
  "plan.items",
  "features:",
];

for (
  const token of required
) {
  if (!s.includes(token)) {
    throw new Error(
      `Validation failed: ${token}`
    );
  }
}


fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log("");
console.log(
  "=============================================="
);
console.log(
  "PRICING PLAN SCHEMA FIX COMPLETE"
);
console.log(
  "=============================================="
);
console.log(
  "items -> features"
);
console.log(
  "numericAmount -> price"
);
console.log(
  "subtitle -> description"
);
console.log(
  "Existing fields preserved."
);
