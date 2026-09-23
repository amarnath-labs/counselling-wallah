import fs from "node:fs";

const file =
  "./src/pages/Pricing.jsx";

const backup =
  "./src/pages/Pricing.before-choice-plan-999.jsx";

if (!fs.existsSync(file)) {
  throw new Error(
    "Pricing.jsx not found"
  );
}

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  source.includes(
    "CHOICE-FILLING PLAN"
  ) ||
  source.includes(
    "id: 'choice-plan'"
  )
) {
  console.log(
    "₹999 Choice-Filling Plan already exists."
  );
  process.exit(0);
}

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| ADD ₹999 PLAN AFTER RECOMMENDATION
|--------------------------------------------------------------------------
*/

const finderRegex =
  /\{\s*id:\s*['"]finder['"][\s\S]*?popular:\s*(?:true|false),?\s*\},/m;

const finderMatch =
  source.match(
    finderRegex
  );

if (!finderMatch) {
  throw new Error(
    "Recommendation/finder plan block not found"
  );
}

const choicePlan =
`

  {
    id: 'choice-plan',

    name: 'CHOICE-FILLING PLAN',

    amount: '₹999',

    numericAmount: 999,

    subtitle:
      'Build Your Final Counselling Preference Order',

    items: [
      'Everything in Recommendation',
      'Personalized ordered choice-filling list',
      'Dream / Target / Safe balance',
      'Freeze / Float / Slide guidance',
      'College + branch priority ordering',
      'Risk preference controls',
      'Compare any 2 choices',
      'Last-resort safe options',
      'Download choice list as CSV',
      'Print-ready counselling plan',
    ],

    button:
      'Unlock Choice-Filling Plan',

    popular: false,
  },`;

source =
  source.replace(
    finderMatch[0],
    finderMatch[0] +
      choicePlan
  );


/*
|--------------------------------------------------------------------------
| VALIDATE
|--------------------------------------------------------------------------
*/

const required = [
  "id: 'choice-plan'",
  "CHOICE-FILLING PLAN",
  "₹999",
  "numericAmount: 999",
  "Unlock Choice-Filling Plan",
];

for (const token of required) {
  if (
    !source.includes(token)
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
  "₹999 CHOICE-FILLING PLAN ADDED TO PRICING"
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
