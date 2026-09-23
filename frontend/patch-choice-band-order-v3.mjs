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
  "./src/components/choicePlanEngine.before-dream-target-safe.js";

fs.copyFileSync(
  file,
  backup
);

if (
  s.includes(
    "TRUMARG DREAM TARGET SAFE FINAL ORDER"
  )
) {
  console.log(
    "Dream -> Target -> Safe ordering already applied."
  );
  process.exit(0);
}

const oldBlock =
`  const front = main.filter((e) => !lastResortKeys.has(e.key)).sort(byDesirability);
  const back = safest.sort(byDesirability);`;

if (!s.includes(oldBlock)) {
  throw new Error(
    "Exact current front/back ordering block not found. No changes written."
  );
}

const newBlock =
`  /*
  |--------------------------------------------------------------------------
  | TRUMARG DREAM TARGET SAFE FINAL ORDER
  |--------------------------------------------------------------------------
  |
  | Counselling preference list:
  |
  | 1. Dream
  | 2. Target
  | 3. Safe
  |
  | Inside the same band, desirability still decides order.
  | Last-resort Safe options remain at the very end.
  |--------------------------------------------------------------------------
  */

  const bandPriority = {
    dream: 0,
    target: 1,
    safe: 2,
    unlikely: 3,
  };

  const byBandThenDesirability =
    (a, b) => {
      const aBand =
        a?.feasibility?.band;

      const bBand =
        b?.feasibility?.band;

      const bandDifference =
        (bandPriority[aBand] ?? 99) -
        (bandPriority[bBand] ?? 99);

      if (bandDifference !== 0) {
        return bandDifference;
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
    "TRUMARG DREAM TARGET SAFE FINAL ORDER"
  )
) {
  throw new Error(
    "Validation failed"
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
  "CHOICE ORDER PATCH COMPLETE"
);
console.log(
  "=============================================="
);
console.log(
  "Dream -> Target -> Safe"
);
console.log(
  "Same band -> desirability descending"
);
console.log(
  "Last-resort Safe -> very end"
);
console.log(
  "Backup:",
  backup
);
