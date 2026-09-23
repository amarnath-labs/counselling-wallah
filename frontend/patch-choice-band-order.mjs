import fs from "node:fs";

const file =
  "./src/components/choicePlanEngine.js";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  s.includes(
    "TRUMARG STRICT BAND ORDER"
  )
) {
  console.log(
    "Strict band order already applied."
  );
  process.exit(0);
}


/*
|--------------------------------------------------------------------------
| Find final choices assignment
|--------------------------------------------------------------------------
*/

const patterns = [
  /choices\s*=\s*selected\s*\.sort\([\s\S]*?\);/m,
  /const\s+choices\s*=\s*selected\s*\.sort\([\s\S]*?\);/m,
  /let\s+choices\s*=\s*selected\s*\.sort\([\s\S]*?\);/m,
];

let match = null;

for (const pattern of patterns) {
  match =
    s.match(pattern);

  if (match) {
    break;
  }
}

if (!match) {
  throw new Error(
    "Final selected.sort() block not found. No changes written."
  );
}


const replacement =
`/*
  |--------------------------------------------------------------------------
  | TRUMARG STRICT BAND ORDER
  |--------------------------------------------------------------------------
  |
  | Final counselling sequence:
  |
  | Dream -> Target -> Safe
  |
  | Within each band:
  | higher desirability stays above lower desirability.
  |--------------------------------------------------------------------------
  */

  const BAND_ORDER = {
    dream: 0,
    target: 1,
    safe: 2,
    unlikely: 3,
  };

  const choices =
    selected.sort(
      (a, b) => {
        const bandDiff =
          (BAND_ORDER[a.band] ?? 99) -
          (BAND_ORDER[b.band] ?? 99);

        if (bandDiff !== 0) {
          return bandDiff;
        }

        const aScore =
          Number(
            a?.desirability?.score ??
            a?.desirabilityScore ??
            a?.score ??
            0
          );

        const bScore =
          Number(
            b?.desirability?.score ??
            b?.desirabilityScore ??
            b?.score ??
            0
          );

        return bScore - aScore;
      }
    );`;

s =
  s.replace(
    match[0],
    replacement
  );


if (
  !s.includes(
    "TRUMARG STRICT BAND ORDER"
  )
) {
  throw new Error(
    "Validation failed."
  );
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
  "CHOICE LIST BAND ORDER FIXED"
);
console.log(
  "=============================================="
);
console.log(
  "Dream -> Target -> Safe"
);
console.log(
  "Within each band -> desirability high to low"
);
