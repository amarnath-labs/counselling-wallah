import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-unique-key-restore.jsx";

if (!fs.existsSync(file)) {
  throw new Error(
    `File not found: ${file}`
  );
}

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

if (
  s.includes(
    "function recommendationUniqueKey("
  )
) {
  console.log(
    "recommendationUniqueKey already exists."
  );

  process.exit(0);
}

const marker =
  "function dedupeRecommendationRows(";

const markerIndex =
  s.indexOf(marker);

if (markerIndex < 0) {
  throw new Error(
    "dedupeRecommendationRows() not found."
  );
}

fs.copyFileSync(
  file,
  backup
);

const helper =
`

/*
|--------------------------------------------------------------------------
| STABLE RECOMMENDATION UNIQUE KEY
|--------------------------------------------------------------------------
|
| One recommendation = college + branch.
|
| Used for:
| - global dedupe
| - React card key
|
| Does NOT affect scoring or admission classification.
|--------------------------------------------------------------------------
*/

function recommendationUniqueKey(
  row
) {
  const normalize = (
    value
  ) =>
    String(
      value ?? ''
    )
      .trim()
      .toLowerCase()
      .replace(
        /\\s+/g,
        ' '
      );


  const collegeId =
    normalize(
      row?.collegeId ??
      row?.college_id ??
      row?.college?.id
    );

  const collegeName =
    normalize(
      row?.collegeName ??
      row?.college_name ??
      row?.college?.name
    );

  const branchId =
    normalize(
      row?.branchId ??
      row?.branch_id ??
      row?.branch?.id
    );

  const branchName =
    normalize(
      row?.branchName ??
      row?.branch_name ??
      row?.branch?.name
    );


  const collegeKey =
    collegeId ||
    collegeName ||
    'unknown-college';

  const branchKey =
    branchId ||
    branchName ||
    'unknown-branch';


  return (
    collegeKey +
    '::' +
    branchKey
  );
}


`;

s =
  s.slice(
    0,
    markerIndex
  ) +
  helper +
  s.slice(
    markerIndex
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
  "RECOMMENDATION UNIQUE KEY RESTORED"
);
console.log(
  "=============================================="
);
console.log(
  "File:",
  file
);
console.log(
  "Average ranking: UNCHANGED"
);
console.log(
  "Dedupe: ACTIVE"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
