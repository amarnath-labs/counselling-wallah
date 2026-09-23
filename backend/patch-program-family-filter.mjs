import fs from "node:fs";

const file =
  "./src/routes/cwRecV1-dev.js";

const backup =
  "./src/routes/cwRecV1-dev.before-program-family-filter.js";

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

fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| 1. ADD PROGRAM FAMILY HELPERS
|--------------------------------------------------------------------------
*/

const marker =
  "const branchPreferences =";

const markerIndex =
  s.indexOf(marker);

if (markerIndex < 0) {
  throw new Error(
    "branchPreferences marker not found."
  );
}

if (
  !s.includes(
    "const architectureOnlyRequest ="
  )
) {
  const semicolonIndex =
    s.indexOf(
      ";",
      markerIndex
    );

  if (semicolonIndex < 0) {
    throw new Error(
      "branchPreferences statement end not found."
    );
  }

  const addition =
`

      /*
      |--------------------------------------------------------------------------
      | PROGRAM FAMILY SEPARATION
      |--------------------------------------------------------------------------
      |
      | Architecture is a separate programme family.
      | It must not be mixed with B.Tech engineering branches.
      |--------------------------------------------------------------------------
      */

      const architectureOnlyRequest =
        branchPreferences.length > 0 &&
        branchPreferences.every(
          (branch) =>
            /architecture|b\\.?\\s*arch/i.test(
              String(
                branch || ''
              )
            )
        );


      const architectureBranchName = (
        value
      ) =>
        /architecture|b\\.?\\s*arch/i.test(
          String(
            value || ''
          )
        );
`;

  s =
    s.slice(
      0,
      semicolonIndex + 1
    ) +
    addition +
    s.slice(
      semicolonIndex + 1
    );
}


/*
|--------------------------------------------------------------------------
| 2. FILTER EACH CANDIDATE BEFORE SCORING
|--------------------------------------------------------------------------
*/

const scoreMarker =
`            const branchPreference =
              scoreBranchPreference({`;

const scoreIndex =
  s.indexOf(
    scoreMarker
  );

if (scoreIndex < 0) {
  throw new Error(
    "branchPreference scoring block not found."
  );
}

if (
  !s.includes(
    "TRUMARG PROGRAM FAMILY HARD FILTER"
  )
) {
  const filterBlock =
`            /*
            |--------------------------------------------------------------
            | TRUMARG PROGRAM FAMILY HARD FILTER
            |--------------------------------------------------------------
            |
            | Architecture request:
            |   keep Architecture / B.Arch rows only.
            |
            | Engineering request:
            |   exclude Architecture / B.Arch rows.
            |
            | This does NOT modify admission bucket logic.
            |--------------------------------------------------------------
            */

            const candidateIsArchitecture =
              architectureBranchName(
                row.branch_name
              );


            if (
              architectureOnlyRequest &&
              !candidateIsArchitecture
            ) {
              return null;
            }


            if (
              !architectureOnlyRequest &&
              branchPreferences.length > 0 &&
              candidateIsArchitecture
            ) {
              return null;
            }


`;

  s =
    s.slice(
      0,
      scoreIndex
    ) +
    filterBlock +
    s.slice(
      scoreIndex
    );
}


/*
|--------------------------------------------------------------------------
| 3. REMOVE NULL CANDIDATES AFTER MAP
|--------------------------------------------------------------------------
|
| Find the recommendation map completion and safely filter nulls.
|--------------------------------------------------------------------------
*/

const likelyPatterns = [
  "          );\n\n\n        const",
  "          );\r\n\r\n\r\n        const",
];

let patchedNullFilter = false;

if (
  !s.includes(
    "TRUMARG PROGRAM FILTER NULL CLEANUP"
  )
) {
  /*
  | We avoid blindly changing arbitrary .map().
  | Locate the map containing scoreBranchPreference.
  */

  const mapStart =
    s.lastIndexOf(
      ".map(",
      scoreIndex
    );

  if (mapStart < 0) {
    throw new Error(
      "Recommendation map start not found."
    );
  }

  let depth = 0;
  let seenParen = false;
  let mapEnd = -1;

  for (
    let i = mapStart;
    i < s.length;
    i++
  ) {
    const ch = s[i];

    if (ch === "(") {
      depth++;
      seenParen = true;
    } else if (ch === ")") {
      depth--;

      if (
        seenParen &&
        depth === 0
      ) {
        mapEnd = i;
        break;
      }
    }
  }

  if (mapEnd < 0) {
    throw new Error(
      "Recommendation map end not found."
    );
  }

  const after =
    s.slice(
      mapEnd,
      mapEnd + 50
    );

  if (
    !after.includes(
      ".filter(Boolean)"
    )
  ) {
    s =
      s.slice(
        0,
        mapEnd + 1
      ) +
      `.filter(Boolean)
          /* TRUMARG PROGRAM FILTER NULL CLEANUP */` +
      s.slice(
        mapEnd + 1
      );
  }

  patchedNullFilter = true;
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
  "PROGRAM FAMILY FILTER APPLIED"
);
console.log(
  "=============================================="
);
console.log(
  "Architecture -> Architecture/B.Arch candidates only"
);
console.log(
  "Engineering -> Architecture candidates excluded"
);
console.log(
  "Admission bucket logic: UNCHANGED"
);
console.log(
  "Review V3 logic: UNCHANGED"
);
console.log(
  "Overall + Review ranking: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
