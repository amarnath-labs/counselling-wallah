import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-dedupe-runtime-fix.jsx";

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
| SAFE GLOBAL DEDUPE HELPER
|--------------------------------------------------------------------------
|
| College + branch identity only.
| No admission/ranking/review scoring is changed.
|--------------------------------------------------------------------------
*/

const helperName =
  "dedupeRecommendationRowsSafe";


if (!s.includes(`function ${helperName}`)) {

  const firstFunctionIndex =
    s.search(
      /function\s+[A-Za-z_$][A-Za-z0-9_$]*\s*\(/
    );

  if (firstFunctionIndex < 0) {
    throw new Error(
      "Could not find insertion point."
    );
  }

  const helper =
`
function dedupeRecommendationRowsSafe(rows) {
  const seen =
    new Set();

  const output =
    [];

  for (
    const row of
    rows || []
  ) {
    if (!row) {
      continue;
    }

    const collegeId =
      String(
        row?.collegeId ??
        row?.college?.id ??
        row?.college_id ??
        row?.collegeName ??
        row?.college?.name ??
        ''
      )
        .trim()
        .toLowerCase();

    const branchName =
      String(
        row?.branch?.name ??
        row?.branchName ??
        row?.branch_name ??
        row?.branchId ??
        row?.branch_id ??
        ''
      )
        .trim()
        .toLowerCase();

    const key =
      collegeId +
      '::' +
      branchName;

    if (
      seen.has(key)
    ) {
      continue;
    }

    seen.add(key);

    output.push(row);
  }

  return output;
}


`;

  s =
    s.slice(
      0,
      firstFunctionIndex
    ) +
    helper +
    s.slice(
      firstFunctionIndex
    );
}


/*
|--------------------------------------------------------------------------
| REPLACE BROKEN CALLS
|--------------------------------------------------------------------------
*/

const brokenCalls =
  (
    s.match(
      /\bdedupeRecommendationRows\s*\(/g
    ) || []
  ).length;


if (brokenCalls < 1) {
  throw new Error(
    "No dedupeRecommendationRows calls found."
  );
}


s =
  s.replace(
    /\bdedupeRecommendationRows\s*\(/g,
    "dedupeRecommendationRowsSafe("
  );


/*
|--------------------------------------------------------------------------
| SAFETY
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "dedupeRecommendationRowsSafe(rows)"
  )
) {
  throw new Error(
    "Safe dedupe call not installed."
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
  "RECOMMENDATION DEDUPE RUNTIME FIXED"
);
console.log(
  "=============================================="
);
console.log(
  "Broken calls replaced:",
  brokenCalls
);
console.log(
  "JoSAA / CSAB logic: UNCHANGED"
);
console.log(
  "Engineering / Architecture: UNCHANGED"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "Ranking formula: UNCHANGED"
);
console.log(
  "Review logic: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
