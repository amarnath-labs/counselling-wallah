import fs from "node:fs";

const file =
  "./src/pages/Pricing.jsx";

const backup =
  "./src/pages/Pricing.before-clean-4-plan-fix.jsx";

if (!fs.existsSync(file)) {
  throw new Error(
    "Pricing.jsx not found."
  );
}

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| FIND const PLANS = [
|--------------------------------------------------------------------------
*/

const marker =
  "const PLANS =";

const markerIndex =
  source.indexOf(
    marker
  );

if (markerIndex === -1) {
  throw new Error(
    "const PLANS = not found."
  );
}

const arrayStart =
  source.indexOf(
    "[",
    markerIndex
  );

if (arrayStart === -1) {
  throw new Error(
    "PLANS opening [ not found."
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
  i < source.length;
  i++
) {
  const ch =
    source[i];

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
    continue;
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
    "PLANS closing ] not found."
  );
}


/*
|--------------------------------------------------------------------------
| CLEAN 4-PLAN ARRAY
|--------------------------------------------------------------------------
*/

const newPlans =
`[
  {
    id: 'basic',

    name: 'COLLEGE PREDICTOR',

    amount: '₹49',

    numericAmount: 49,

    subtitle:
      'Check Your College Chances',

    items: [
      'Eligible college list',
      'Rank/category/quota based prediction',
      'Round-wise cutoff details',
      'College-wise cutoff information',
      'Basic filters',
    ],

    button:
      'Get College Predictor',

    popular: false,
  },

  {
    id: 'finder',

    name: 'RECOMMENDATION',

    amount: '₹99',

    numericAmount: 99,

    subtitle:
      'Personalized College Recommendations',

    items: [
      'Everything in College Predictor',
      'Dream / Target / Safe / Backup',
      'Personalized recommendation score',
      'Branch preference matching',
      'Budget + location matching',
      'College comparison',
      'Preference-list builder',
    ],

    button:
      'Unlock Recommendations',

    popular: true,
  },

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
      'Dream / Target / Safe / Backup balance',
      'College + branch priority ordering',
      'Freeze / Float / Slide guidance',
      'Risk preference controls',
      'Compare any 2 choices',
      'Last-resort safe options',
      'Download choice list as CSV',
      'Print-ready counselling plan',
    ],

    button:
      'Unlock Choice-Filling Plan',

    popular: false,
  },

  {
    id: 'support',

    name: 'CALL SUPPORT',

    amount: '₹599',

    numericAmount: 599,

    subtitle:
      'Talk to a Counsellor',

    items: [
      'Everything in Recommendation',
      '1-to-1 counselling call',
      'Personalized counselling guidance',
      'Choice-list review',
      'Document guidance',
      'Deadline guidance',
      'Priority support',
    ],

    button:
      'Book Counselling Call',

    popular: false,
  },
]`;


/*
|--------------------------------------------------------------------------
| REPLACE ONLY PLANS ARRAY
|--------------------------------------------------------------------------
*/

source =
  source.slice(
    0,
    arrayStart
  ) +
  newPlans +
  source.slice(
    arrayEnd + 1
  );


/*
|--------------------------------------------------------------------------
| VALIDATION
|--------------------------------------------------------------------------
*/

const required = [
  "id: 'basic'",
  "id: 'finder'",
  "id: 'choice-plan'",
  "id: 'support'",
  "amount: '₹999'",
  "numericAmount: 999",
  "items: [",
];

for (
  const token of required
) {
  if (!source.includes(token)) {
    throw new Error(
      `Validation failed: ${token}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

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
  "PRICING 4-PLAN ARRAY FIXED"
);
console.log(
  "=============================================="
);
console.log(
  "Backup:",
  backup
);
console.log("");
console.log(
  "₹49  College Predictor"
);
console.log(
  "₹99  Recommendation"
);
console.log(
  "₹999 Choice-Filling Plan"
);
console.log(
  "₹599 Call Support"
);
