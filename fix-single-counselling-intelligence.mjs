import fs from "node:fs";

const file =
  "./frontend/src/components/CollegeCard.jsx";

const backup =
  "./frontend/src/components/CollegeCard.before-single-counselling-intelligence.jsx";

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
| DETECT ACTIVE COUNSELLING SOURCE
|--------------------------------------------------------------------------
*/

const componentMarker =
  /export default function CollegeCard\(\{\s*row,\s*mode = 'locked',?\s*\}\)\s*\{/m;

if (!componentMarker.test(s)) {
  throw new Error(
    "CollegeCard component marker not found."
  );
}

if (!s.includes("const activeCounsellingSource =")) {
  s =
    s.replace(
      componentMarker,
      (match) =>
`${match}

  const rowCounsellingType =
    String(
      row?.counsellingType ||
      row?.counselling_type ||
      row?.counselling?.type ||
      ''
    )
      .trim()
      .toUpperCase();

  const activeCounsellingSource =
    rowCounsellingType ===
      'CSAB_SPECIAL'
      ? 'csab'
      : 'josaa';

`
    );
}


/*
|--------------------------------------------------------------------------
| REMOVE INTERNAL JOSAA / CSAB SWITCHER
|--------------------------------------------------------------------------
*/

const tabsRegex =
  /<div className="admission-history-tabs">[\s\S]*?<\/div>/m;

if (!tabsRegex.test(s)) {
  throw new Error(
    "Admission history tabs block not found."
  );
}

s =
  s.replace(
    tabsRegex,
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
| FORCE ONLY ACTIVE SOURCE CONTENT
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
| INITIAL HISTORY SOURCE
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /useState\(\s*'josaa'\s*\)/m,
    "useState(activeCounsellingSource)"
  );


/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

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
  "COUNSELLING INTELLIGENCE SOURCE LOCKED"
);
console.log(
  "=============================================="
);
console.log(
  "JoSAA -> JoSAA intelligence only"
);
console.log(
  "CSAB  -> CSAB intelligence only"
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
