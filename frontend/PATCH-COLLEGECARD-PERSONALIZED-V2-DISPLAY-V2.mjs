import fs from "node:fs";

const path =
  "./src/components/CollegeCard.jsx";

const backup =
  "./src/components/CollegeCard.before-personalized-v2-display-v2.jsx";

const original =
  fs.readFileSync(
    path,
    "utf8"
  );

if (
  original.includes(
    "PERSONALIZED V2 DISPLAY SOURCE"
  )
) {
  throw new Error(
    "Personalized V2 display patch already applied."
  );
}


/*
|--------------------------------------------------------------------------
| 1. INSERT V2 DISPLAY SOURCE AFTER premium
|--------------------------------------------------------------------------
*/

const premiumRegex =
  /const\s+premium\s*=\s*row\?\.premium\s*\|\|\s*null\s*;/m;

const premiumMatches =
  [...original.matchAll(
    new RegExp(
      premiumRegex.source,
      "gm"
    )
  )];

if (
  premiumMatches.length !== 1
) {
  throw new Error(
    `Expected 1 premium declaration, found ${premiumMatches.length}. No changes written.`
  );
}

let updated =
  original.replace(
    premiumRegex,
`const premium =
    row?.premium || null;

  /*
  |--------------------------------------------------------------------------
  | PERSONALIZED V2 DISPLAY SOURCE
  |--------------------------------------------------------------------------
  |
  | Display V2 when available.
  | Legacy premium remains fallback only.
  | Admission bucket logic stays untouched.
  |
  */

  const personalizedV2 =
    row?.personalizedV2 || null;

  const personalizedV2Score =
    Number.isFinite(
      Number(
        personalizedV2?.rawScore
      )
    )
      ? Number(
          personalizedV2.rawScore
        )
      : null;

  const personalizedV2RankingScore =
    Number.isFinite(
      Number(
        personalizedV2?.rankingScore
      )
    )
      ? Number(
          personalizedV2.rankingScore
        )
      : null;

  const personalizedV2Coverage =
    Number.isFinite(
      Number(
        personalizedV2?.coverage
      )
    )
      ? Number(
          personalizedV2.coverage
        )
      : null;`
  );


/*
|--------------------------------------------------------------------------
| 2. REPLACE premiumScore CALCULATION
|--------------------------------------------------------------------------
*/

const premiumScoreRegex =
  /const\s+premiumScore\s*=\s*Number\.isFinite\s*\(\s*Number\s*\(\s*premium\?\.score\s*\)\s*\)\s*\?\s*Number\s*\(\s*premium\.score\s*\)\s*:\s*null\s*;/m;

const scoreMatches =
  [...updated.matchAll(
    new RegExp(
      premiumScoreRegex.source,
      "gm"
    )
  )];

if (
  scoreMatches.length !== 1
) {
  throw new Error(
    `Expected 1 premiumScore block, found ${scoreMatches.length}. No changes written.`
  );
}

updated =
  updated.replace(
    premiumScoreRegex,
`const premiumScore =
    personalizedV2Score ??
    (
      Number.isFinite(
        Number(
          premium?.score
        )
      )
        ? Number(
            premium.score
          )
        : null
    );`
  );


/*
|--------------------------------------------------------------------------
| 3. VALIDATE
|--------------------------------------------------------------------------
*/

for (
  const token
  of [
    "PERSONALIZED V2 DISPLAY SOURCE",
    "row?.personalizedV2",
    "personalizedV2Score",
    "personalizedV2RankingScore",
    "personalizedV2Coverage",
  ]
) {
  if (
    !updated.includes(
      token
    )
  ) {
    throw new Error(
      `Validation failed: ${token}`
    );
  }
}


fs.writeFileSync(
  backup,
  original,
  "utf8"
);

fs.writeFileSync(
  path,
  updated,
  "utf8"
);

console.log(
  "SUCCESS: CollegeCard Personalized V2 display patch applied."
);

console.log(
  "Backup:",
  backup
);
