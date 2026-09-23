import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-dedupe-restore.jsx";

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
    "function dedupeRecommendationRows("
  )
) {
  console.log(
    "dedupeRecommendationRows already exists."
  );

  process.exit(0);
}

const marker =
  "export default function RecommendationSlide";

const markerIndex =
  s.indexOf(marker);

if (markerIndex < 0) {
  throw new Error(
    "RecommendationSlide export marker not found."
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
| GLOBAL COLLEGE + BRANCH DEDUPE
|--------------------------------------------------------------------------
|
| Prevent duplicate recommendation cards for the same college + branch.
|
| This does NOT change:
| - admission bucket
| - overall score
| - review score
| - Overall + Review average ranking
|
|--------------------------------------------------------------------------
*/

function dedupeRecommendationRows(
  rows
) {
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
        row?.college_id ??
        row?.college?.id ??
        row?.collegeName ??
        row?.college_name ??
        row?.college?.name ??
        ''
      )
        .trim()
        .toLowerCase();

    const branchId =
      String(
        row?.branchId ??
        row?.branch_id ??
        row?.branch?.id ??
        ''
      )
        .trim()
        .toLowerCase();

    const branchName =
      String(
        row?.branchName ??
        row?.branch_name ??
        row?.branch?.name ??
        ''
      )
        .trim()
        .toLowerCase();

    const key =
      [
        collegeId,
        branchId ||
        branchName,
      ].join(
        "::"
      );

    /*
     * If identity is unexpectedly missing,
     * keep the row instead of collapsing
     * unrelated recommendations together.
     */
    if (
      !collegeId &&
      !branchId &&
      !branchName
    ) {
      output.push(row);
      continue;
    }

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
  "DEDUPE HELPER RESTORED"
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
  "Admission logic: UNCHANGED"
);
console.log(
  "Review scoring: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
