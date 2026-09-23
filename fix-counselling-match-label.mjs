import fs from "node:fs";

const file =
  "./frontend/src/components/CollegeCard.jsx";

const backup =
  "./frontend/src/components/CollegeCard.before-counselling-match-label.jsx";

if (!fs.existsSync(file)) {
  throw new Error(
    `Missing file: ${file}`
  );
}

let s =
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
| ADD DYNAMIC COUNSELLING LABEL
|--------------------------------------------------------------------------
*/

const componentMarker =
  /export default function CollegeCard\(\{\s*row,\s*mode = 'locked',?\s*\}\)\s*\{/m;

if (
  !componentMarker.test(s)
) {
  throw new Error(
    "CollegeCard component marker not found."
  );
}


if (
  !s.includes(
    "const counsellingMatchLabel ="
  )
) {
  s =
    s.replace(
      componentMarker,
      (match) =>
`${match}

  const counsellingType =
    String(
      row?.counsellingType ||
      row?.counselling_type ||
      ''
    )
      .trim()
      .toUpperCase();


  const counsellingMatchLabel =
    counsellingType ===
      'CSAB_SPECIAL'
      ? 'CSAB Match'
      : 'JoSAA Match';
`
    );
}


/*
|--------------------------------------------------------------------------
| REPLACE HARDCODED LABEL
|--------------------------------------------------------------------------
*/

const hardcoded =
  /JoSAA Match:\{' '\}/g;

const count =
  (
    s.match(
      hardcoded
    ) || []
  ).length;

if (
  count < 1
) {
  throw new Error(
    "Hardcoded JoSAA Match label not found."
  );
}


s =
  s.replace(
    hardcoded,
    "{counsellingMatchLabel}:{' '}"
  );


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
  "COUNSELLING MATCH LABEL FIXED"
);
console.log(
  "=============================================="
);
console.log(
  "JOSAA        -> JoSAA Match"
);
console.log(
  "CSAB_SPECIAL -> CSAB Match"
);
console.log(
  "Admission bucket logic: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
console.log(
  "Review logic: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
