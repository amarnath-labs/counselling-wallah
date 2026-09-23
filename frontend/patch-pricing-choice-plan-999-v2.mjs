import fs from "node:fs";

const file =
  "./src/pages/Pricing.jsx";

const backup =
  "./src/pages/Pricing.before-choice-plan-999-v2.jsx";

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

if (
  s.includes(
    "id: 'choice-plan'"
  )
) {
  console.log(
    "₹999 Choice-Filling Plan already present."
  );
  process.exit(0);
}

fs.copyFileSync(
  file,
  backup
);

/*
|--------------------------------------------------------------------------
| Find SUPPORT plan start
|--------------------------------------------------------------------------
*/

const supportMarker =
  "id: 'support'";

const supportIdIndex =
  s.indexOf(
    supportMarker
  );

if (
  supportIdIndex === -1
) {
  throw new Error(
    "support plan not found"
  );
}

/*
|--------------------------------------------------------------------------
| Find opening { of support object
|--------------------------------------------------------------------------
*/

const supportOpen =
  s.lastIndexOf(
    "{",
    supportIdIndex
  );

if (
  supportOpen === -1
) {
  throw new Error(
    "support plan opening brace not found"
  );
}

/*
|--------------------------------------------------------------------------
| Insert choice plan BEFORE support
|--------------------------------------------------------------------------
*/

const choicePlan =
`{
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
  },

  `;

s =
  s.slice(
    0,
    supportOpen
  ) +
  choicePlan +
  s.slice(
    supportOpen
  );

/*
|--------------------------------------------------------------------------
| Validate
|--------------------------------------------------------------------------
*/

const required = [
  "id: 'choice-plan'",
  "CHOICE-FILLING PLAN",
  "amount: '₹999'",
  "numericAmount: 999",
  "Unlock Choice-Filling Plan",
];

for (
  const token of required
) {
  if (
    !s.includes(token)
  ) {
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
  "₹999 CHOICE-FILLING PLAN ADDED"
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
