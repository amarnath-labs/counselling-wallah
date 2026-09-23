import fs from "node:fs";

const file =
  "./frontend/src/pages/Profile.jsx";

const backup =
  "./frontend/src/pages/Profile.before-force-preference-ui.jsx";

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
| FORCE JOSAA / CSAB PREFERENCE UI TO RENDER
|--------------------------------------------------------------------------
*/

const startMarker =
  "          {/* TRUMARG JOSAA CSAB SELECTOR */}";

const start =
  s.indexOf(startMarker);

if (start < 0) {
  throw new Error(
    "JoSAA/CSAB selector marker not found."
  );
}


/*
| Find conditional immediately after marker.
*/

const after =
  s.slice(start);

const conditionRegex =
/\{\s*(?:isJeeMainProfile|String\([\s\S]*?===\s*'jee-main')\s*&&\s*\(/m;

const match =
  after.match(
    conditionRegex
  );

if (!match) {
  throw new Error(
    "JoSAA/CSAB outer visibility condition not found."
  );
}


/*
| Replace outer condition with a simple fragment.
|
| This affects UI visibility only.
*/

const absoluteStart =
  start +
  match.index;

s =
  s.slice(
    0,
    absoluteStart
  ) +
  "{(" +
  s.slice(
    absoluteStart +
    match[0].length
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
  "PREFERENCE UI FORCED VISIBLE"
);
console.log(
  "=============================================="
);
console.log(
  "JoSAA / CSAB selector: visible"
);
console.log(
  "Engineering / Architecture: visible"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "CSAB data mapping: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
console.log(
  "Backup:",
  backup
);
