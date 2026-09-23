import fs from "node:fs";

const file =
  "./frontend/src/components/CollegeCard.jsx";

const backup =
  "./frontend/src/components/CollegeCard.before-single-intelligence-source.jsx";

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
| SOURCE DETECTION
|--------------------------------------------------------------------------
*/

const componentMarker =
  /export default function CollegeCard\(\{\s*row,\s*mode = 'locked',?\s*\}\)\s*\{/m;

if (!componentMarker.test(s)) {
  throw new Error(
    "CollegeCard component marker not found."
  );
}


if (
  !s.includes(
    "const activeCounsellingSource ="
  )
) {
  s =
    s.replace(
      componentMarker,
      (match) =>
`${match}

  const activeCounsellingSource =
    String(
      row?.counsellingType ||
      row?.counselling_type ||
      ''
    )
      .trim()
      .toUpperCase() ===
      'CSAB_SPECIAL'
      ? 'csab'
      : 'josaa';

`
    );
}


/*
|--------------------------------------------------------------------------
| REMOVE JOSAA / CSAB INTERNAL TAB SWITCHER
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /<div className="history-tabs">[\s\S]*?<\/div>/m,
`<div className="history-source-label">
                        {
                          activeCounsellingSource ===
                          'csab'
                            ? 'CSAB Special'
                            : 'JoSAA'
                        }
                      </div>`
  );


/*
|--------------------------------------------------------------------------
| SHOW ONLY CURRENT COUNSELLING SOURCE
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /if\s*\(\s*historyTab\s*!==\s*route\.key\s*\)\s*\{\s*return null;\s*\}/m,
`if (
                            activeCounsellingSource !==
                            route.key
                          ) {
                            return null;
                          }`
  );


/*
|--------------------------------------------------------------------------
| FALLBACK FOR FORMATTED MULTILINE VERSION
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /if\s*\(\s*historyTab\s*!==\s*route\.key\s*\)\s*\{\s*[\r\n\s]*return null;[\r\n\s]*\}/m,
`if (
                            activeCounsellingSource !==
                            route.key
                          ) {
                            return null;
                          }`
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
  "ADMISSION INTELLIGENCE SOURCE SEPARATED"
);
console.log(
  "=============================================="
);
console.log(
  "JoSAA result -> JoSAA intelligence ONLY"
);
console.log(
  "CSAB result  -> CSAB intelligence ONLY"
);
console.log(
  "Admission logic: UNCHANGED"
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
