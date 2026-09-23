import fs from "node:fs";

const path =
  "./src/components/CollegeCard.jsx";

const backup =
  "./src/components/CollegeCard.before-personalized-v2-display.jsx";

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
    "Personalized V2 CollegeCard patch already applied."
  );
}

const oldBlock =
`  const premium =
    row?.premium || null;

  /*
|--------------------------------------------------------------------------
  | ORIGINAL CARD PERCENTAGE
|--------------------------------------------------------------------------
  */

  const currentMatch =
    Number.isFinite(
      Number(row?.overall)
    )`;

if (
  !original.includes(
    oldBlock
  )
) {
  throw new Error(
    "CollegeCard anchor not found. No changes written."
  );
}

const newBlock =
`  const premium =
    row?.premium || null;

  /*
|--------------------------------------------------------------------------
  | PERSONALIZED V2 DISPLAY SOURCE
|--------------------------------------------------------------------------
  |
  | V2 is display-preferred when available.
  | Legacy premium remains untouched as fallback.
  | Admission bucket logic is NOT changed here.
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
      : null;

  /*
|--------------------------------------------------------------------------
  | ORIGINAL CARD PERCENTAGE
|--------------------------------------------------------------------------
  */

  const currentMatch =
    Number.isFinite(
      Number(row?.overall)
    )`;

let updated =
  original.replace(
    oldBlock,
    newBlock
  );

/*
|--------------------------------------------------------------------------
| CHANGE DISPLAY SCORE ONLY
|--------------------------------------------------------------------------
*/

const oldPremiumScore =
`  const premiumScore =
    Number.isFinite(
      Number(premium?.score)
    )
      ? Number(premium.score)
      : null;`;

if (
  !updated.includes(
    oldPremiumScore
  )
) {
  throw new Error(
    "premiumScore block not found. No changes written."
  );
}

const newPremiumScore =
`  const premiumScore =
    personalizedV2Score ??
    (
      Number.isFinite(
        Number(premium?.score)
      )
        ? Number(
            premium.score
          )
        : null
    );`;

updated =
  updated.replace(
    oldPremiumScore,
    newPremiumScore
  );

/*
|--------------------------------------------------------------------------
| VALIDATE
|--------------------------------------------------------------------------
*/

for (
  const token
  of [
    "PERSONALIZED V2 DISPLAY SOURCE",
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
  "SUCCESS: CollegeCard now prefers Personalized V2 score."
);

console.log(
  "Backup:",
  backup
);
