import fs from "node:fs";

const file =
  "./src/components/choicePlanEngine.js";

if (!fs.existsSync(file)) {
  throw new Error(
    "choicePlanEngine.js not found"
  );
}

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

const backup =
  "./src/components/choicePlanEngine.before-final-band-order-v4.js";

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| ALREADY PATCHED?
|--------------------------------------------------------------------------
*/

if (
  s.includes(
    "TRUMARG FINAL STRICT BAND ORDER V4"
  )
) {
  console.log(
    "V4 strict band order already applied."
  );

  process.exit(0);
}


/*
|--------------------------------------------------------------------------
| FIND FINAL CHOICES CREATION
|--------------------------------------------------------------------------
|
| We intentionally do NOT care how front/back were created.
|
| We only replace:
|
| const choices = [...front, ...back].map(...)
|
|--------------------------------------------------------------------------
*/

const choicesRegex =
  /const\s+choices\s*=\s*\[\s*\.\.\.front\s*,\s*\.\.\.back\s*\]\s*\.map\s*\(\s*\(\s*e\s*,\s*i\s*\)\s*=>\s*\(\{/m;

const match =
  s.match(
    choicesRegex
  );

if (!match) {
  throw new Error(
    "Final choices = [...front, ...back].map(...) block not found. No changes written."
  );
}


/*
|--------------------------------------------------------------------------
| INSERT STRICT ORDER
|--------------------------------------------------------------------------
*/

const replacement =
`/*
  |--------------------------------------------------------------------------
  | TRUMARG FINAL STRICT BAND ORDER V4
  |--------------------------------------------------------------------------
  |
  | Final choice-filling sequence:
  |
  | DREAM
  |   ↓
  | TARGET
  |   ↓
  | SAFE
  |
  | Last-resort Safe options stay at the very bottom.
  |
  | Within each band, existing desirability ranking is preserved.
  |--------------------------------------------------------------------------
  */

  const FINAL_BAND_PRIORITY = {
    dream: 0,
    target: 1,
    safe: 2,
    unlikely: 3,
  };


  const byFinalBandThenDesirability =
    (a, b) => {
      const aBand =
        a?.feasibility?.band;

      const bBand =
        b?.feasibility?.band;


      const bandDiff =
        (
          FINAL_BAND_PRIORITY[
            aBand
          ] ?? 99
        ) -
        (
          FINAL_BAND_PRIORITY[
            bBand
          ] ?? 99
        );


      if (
        bandDiff !== 0
      ) {
        return bandDiff;
      }


      return byDesirability(
        a,
        b
      );
    };


  /*
  |--------------------------------------------------------------------------
  | Normal choices:
  | Dream -> Target -> Safe
  |--------------------------------------------------------------------------
  */

  const orderedFront =
    [...front].sort(
      byFinalBandThenDesirability
    );


  /*
  |--------------------------------------------------------------------------
  | Last resort:
  | Always kept AFTER normal choices.
  |--------------------------------------------------------------------------
  */

  const orderedBack =
    [...back].sort(
      byDesirability
    );


  const choices = [
    ...orderedFront,
    ...orderedBack,
  ].map((e, i) => ({`;


s =
  s.replace(
    choicesRegex,
    replacement
  );


/*
|--------------------------------------------------------------------------
| VALIDATE
|--------------------------------------------------------------------------
*/

const required = [
  "TRUMARG FINAL STRICT BAND ORDER V4",
  "FINAL_BAND_PRIORITY",
  "orderedFront",
  "orderedBack",
  "...orderedFront",
  "...orderedBack",
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


/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

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
  "FINAL CHOICE ORDER V4 APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "Dream -> Target -> Safe"
);
console.log(
  "Within same band -> desirability"
);
console.log(
  "Last-resort Safe -> absolute bottom"
);
console.log(
  "Backup:",
  backup
);
