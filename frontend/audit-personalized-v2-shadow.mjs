import fs from "node:fs";


const path =
  "./src/services/personalizedRecommendationV2.js";

const text =
  fs.readFileSync(
    path,
    "utf8"
  );


const checks = [
  [
    'Branch 24',
    /branch:\s*24/,
  ],

  [
    'Quality 18',
    /quality:\s*18/,
  ],

  [
    'Demand 10',
    /demand:\s*10/,
  ],

  [
    'Reviews 30',
    /reviews:\s*30/,
  ],

  [
    'VFM 11',
    /valueForMoney:\s*11/,
  ],

  [
    'Location 7',
    /location:\s*7/,
  ],

  [
    '50 reviews',
    /REVIEW_MIN_EFFECTIVE\s*=\s*50/,
  ],

  [
    '3 sources',
    /REVIEW_MIN_SOURCES\s*=\s*3/,
  ],

  [
    'Cutoff selectivity',
    /selectivityScore/,
  ],

  [
    'Demand requires 2 signals',
    /availableFactors\s*<\s*2/,
  ],

  [
    'Missing-data renormalization',
    /availableWeight/,
  ],
];


let pass = true;


for (
  const [
    name,
    regex,
  ]
  of checks
) {
  const ok =
    regex.test(
      text
    );

  console.log(
    ok
      ? 'PASS'
      : 'FAIL',
    name
  );

  if (!ok) {
    pass = false;
  }
}


console.log(
  '\nOVERALL:',
  pass
    ? 'PASS'
    : 'FAIL'
);


if (!pass) {
  process.exitCode = 1;
}
