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

fs.copyFileSync(
  file,
  "./src/components/choicePlanEngine.before-strict-band-order.js"
);

if (
  s.includes(
    "TRUMARG STRICT DREAM TARGET SAFE ORDER"
  )
) {
  console.log(
    "Strict band ordering already applied."
  );
  process.exit(0);
}

const oldBlock =
`  const front = main.filter((e) => !lastResortKeys.has(e.key)).sort(byDesirability);
  const back = safest.sort(byDesirability);`;

if (!s.includes(oldBlock)) {
  throw new Error(
    "Current front/back ordering block not found. No changes written."
  );
}

const newBlock =
`  /*
  |--------------------------------------------------------------------------
  | TRUMARG STRICT DREAM TARGET SAFE ORDER
  |--------------------------------------------------------------------------
  |
  | Final counselling order:
  | Dream -> Target -> Safe
  |
  | Within each band:
  | higher desirability stays above lower desirability.
  |--------------------------------------------------------------------------
  */

  const BAND_PRIORITY = {
    dream: 0,
    target: 1,
    safe: 2,
    unlikely: 3,
  };

  const byBandThenDesirability =
    (a, b) => {
      const bandDiff =
        (BAND_PRIORITY[
          a?.feasibility?.band
        ] ?? 99) -
        (BAND_PRIORITY[
          b?.feasibility?.band
        ] ?? 99);

      if (bandDiff !== 0) {
        return bandDiff;
      }

      return byDesirability(
        a,
        b
      );
    };


  const front =
    main
      .filter(
        (e) =>
          !lastResortKeys.has(
            e.key
          )
      )
      .sort(
        byBandThenDesirability
      );


  const back =
    safest.sort(
      byDesirability
    );`;

s =
  s.replace(
    oldBlock,
    newBlock
  );

if (
  !s.includes(
    "TRUMARG STRICT DREAM TARGET SAFE ORDER"
  )
) {
  throw new Error(
    "Patch validation failed"
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
  "CHOICE PLAN ORDER FIXED"
);
console.log(
  "=============================================="
);
console.log(
  "Dream -> Target -> Safe"
);
console.log(
  "Last-resort safe options remain at the end"
);
