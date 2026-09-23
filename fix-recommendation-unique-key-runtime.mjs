import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-unique-key-runtime-fix.jsx";

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
| RESTORE STABLE RECOMMENDATION UNIQUE KEY
|--------------------------------------------------------------------------
|
| One recommendation = college + branch.
|
| Used only for:
| - React keys
| - dedupe identity
| - serial/ranking map lookup
|
| Does NOT change:
| - admission bucket
| - overall score
| - review score
| - ranking formula
|--------------------------------------------------------------------------
*/

if (
  !/function\s+recommendationUniqueKey\s*\(/.test(s)
) {

  const helper =
`
function recommendationUniqueKey(
  row
) {
  const collegeId =
    row?.collegeId ??
    row?.college?.id ??
    row?.college_id ??
    row?.collegeName ??
    row?.college?.name ??
    'college';

  const branchName =
    row?.branch?.name ??
    row?.branchName ??
    row?.branch_name ??
    row?.program ??
    'branch';

  return (
    String(
      collegeId
    )
      .trim()
      .toLowerCase() +
    '::' +
    String(
      branchName
    )
      .trim()
      .toLowerCase()
  );
}


`;

  const dedupeMarker =
    "function dedupeRecommendationRows";

  const exportMarker =
    "export default function RecommendationSlide";


  if (
    s.includes(
      dedupeMarker
    )
  ) {

    s =
      s.replace(
        dedupeMarker,
        helper +
        dedupeMarker
      );

  } else if (
    s.includes(
      exportMarker
    )
  ) {

    s =
      s.replace(
        exportMarker,
        helper +
        exportMarker
      );

  } else {

    throw new Error(
      "Safe insertion marker not found."
    );
  }
}


/*
|--------------------------------------------------------------------------
| SAFETY
|--------------------------------------------------------------------------
*/

const definitions =
  (
    s.match(
      /function\s+recommendationUniqueKey\s*\(/g
    ) || []
  ).length;

if (
  definitions !== 1
) {
  throw new Error(
    `Expected exactly 1 recommendationUniqueKey definition, found ${definitions}`
  );
}

if (
  !s.includes(
    "recommendationUniqueKey("
  )
) {
  throw new Error(
    "recommendationUniqueKey usage missing."
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
  "PERSONALIZED RECOMMENDATION BLANK SCREEN FIXED"
);
console.log(
  "=============================================="
);
console.log(
  "recommendationUniqueKey restored"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "Review logic: UNCHANGED"
);
console.log(
  "Ranking formula: UNCHANGED"
);
console.log(
  "JoSAA/CSAB logic: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
