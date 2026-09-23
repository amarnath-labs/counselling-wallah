import fs from "node:fs";

const file =
  "./frontend/src/components/CollegeCard.jsx";

const backup =
  "./frontend/src/components/CollegeCard.before-source-specific-intelligence.jsx";

if (!fs.existsSync(file)) {
  throw new Error(`Missing file: ${file}`);
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
| 1. SOURCE-SPECIFIC HISTORY KEY
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
    "const activeHistorySource ="
  )
) {
  s =
    s.replace(
      componentMarker,
      (match) =>
`${match}

  const resultCounsellingType =
    String(
      row?.counsellingType ||
      row?.counselling_type ||
      ''
    )
      .trim()
      .toUpperCase();

  const activeHistorySource =
    resultCounsellingType ===
      'CSAB_SPECIAL'
      ? 'csab'
      : 'josaa';

`
    );
}


/*
|--------------------------------------------------------------------------
| 2. FORCE HISTORY TAB TO ACTIVE RESULT SOURCE
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /const\s*\[\s*historyTab,\s*setHistoryTab\s*\]\s*=\s*useState\(\s*'josaa'\s*\);/m,
`const [
    historyTab,
    setHistoryTab,
  ] = useState(
    activeHistorySource
  );`
  );


/*
|--------------------------------------------------------------------------
| 3. REMOVE JOSAA / CSAB INTERNAL SWITCH BUTTONS
|--------------------------------------------------------------------------
*/

const tabButtons =
  /<div className="history-tabs">[\s\S]*?<\/div>/m;

if (tabButtons.test(s)) {
  s =
    s.replace(
      tabButtons,
`<div className="history-source-label">
                        {
                          activeHistorySource ===
                          'csab'
                            ? 'CSAB Special'
                            : 'JoSAA'
                        }
                      </div>`
    );
}


/*
|--------------------------------------------------------------------------
| 4. SHOW ONLY ACTIVE SOURCE ROUTE
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /if\s*\(\s*historyTab\s*!==\s*route\.key\s*\)\s*\{\s*return null;\s*\}/m,
`if (
                            activeHistorySource !==
                            route.key
                          ) {
                            return null;
                          }`
  );


/*
|--------------------------------------------------------------------------
| 5. KEEP STATE SYNCHRONIZED WHEN CARD SOURCE CHANGES
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "setHistoryTab(activeHistorySource)"
  )
) {
  const loadMarker =
    /const loadAdmissionHistory\s*=\s*async \(\) => \{/m;

  if (!loadMarker.test(s)) {
    throw new Error(
      "loadAdmissionHistory marker not found."
    );
  }

  s =
    s.replace(
      loadMarker,
`const loadAdmissionHistory =
    async () => {

      setHistoryTab(
        activeHistorySource
      );`
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
  "ADMISSION INTELLIGENCE SOURCE LOCKED"
);
console.log(
  "=============================================="
);
console.log(
  "JoSAA result -> JoSAA intelligence only"
);
console.log(
  "CSAB result  -> CSAB intelligence only"
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
