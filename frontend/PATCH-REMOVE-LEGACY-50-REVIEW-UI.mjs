import fs from "node:fs";

const file =
  "./src/components/RecommendationSlide.jsx";

const backup =
  "./src/components/RecommendationSlide.before-review100-cleanup.jsx";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.writeFileSync(
  backup,
  source,
  "utf8"
);


/*
|--------------------------------------------------------------------------
| Remove old 50-review-per-aspect UI
|--------------------------------------------------------------------------
|
| We remove only the visible legacy block identified by its UI text.
| Current Review V3 data/functions stay untouched.
|
*/

const startTokens = [
  "50+ Review Evidence Standard",
  "50 + Review Evidence Standard",
];

let start = -1;

for (
  const token
  of startTokens
) {
  const index =
    source.indexOf(
      token
    );

  if (
    index !== -1
  ) {
    start =
      index;
    break;
  }
}


if (
  start === -1
) {
  console.log(
    "Legacy 50-review UI text not found. Trying JSX container search..."
  );
}
else {
  /*
  |--------------------------------------------------------------------------
  | Find nearest opening JSX section/div before heading.
  |--------------------------------------------------------------------------
  */

  const candidates = [
    source.lastIndexOf(
      "<section",
      start
    ),

    source.lastIndexOf(
      "<div",
      start
    ),
  ];

  const valid =
    candidates.filter(
      value =>
        value >= 0
    );

  if (
    valid.length ===
    0
  ) {
    throw new Error(
      "Could not locate legacy review container."
    );
  }

  const blockStart =
    Math.max(
      ...valid
    );


  /*
  |--------------------------------------------------------------------------
  | Find next ReviewStandard100Panel or existing main review panel.
  |--------------------------------------------------------------------------
  */

  let blockEnd =
    source.indexOf(
      "<ReviewStandard100Panel",
      start
    );

  if (
    blockEnd === -1
  ) {
    blockEnd =
      source.indexOf(
        "<ReviewIntelligencePanel",
        start
      );
  }


  if (
    blockEnd === -1
  ) {
    throw new Error(
      "Could not locate next review panel boundary."
    );
  }


  source =
    source.slice(
      0,
      blockStart
    ) +
    `
      {/* Legacy 50-per-aspect review gate removed.
          TruMarg now uses the college-level
          100-review standard below. */}

` +
    source.slice(
      blockEnd
    );


  console.log(
    "Removed legacy 50-review-per-aspect UI."
  );
}


/*
|--------------------------------------------------------------------------
| Update stale visible copy anywhere else
|--------------------------------------------------------------------------
*/

source =
  source.replaceAll(
    "50+ Review Evidence Standard",
    "100+ Student Review Evidence Standard"
  );

source =
  source.replaceAll(
    "50 effective reviews, 3+ sources, and no source above 60% per aspect.",
    "100 unique usable reviews per college, 3+ canonical sources, and no source above 60%."
  );

source =
  source.replaceAll(
    "Need 50 more reviews.",
    "Review evidence is still building."
  );


fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "SUCCESS: Personalized Recommendation now uses the 100-review college standard UI."
);

console.log(
  "Backup:",
  backup
);
