import fs from "node:fs";

const file =
  "./frontend/src/pages/Profile.jsx";

const backup =
  "./frontend/src/pages/Profile.before-final-preference-layout.jsx";

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
| FORCE COUNSELLING SELECTOR VISIBLE
|--------------------------------------------------------------------------
*/

const selectorMarker =
  "          {/* TRUMARG JOSAA CSAB SELECTOR */}";

const markerIndex =
  s.indexOf(
    selectorMarker
  );

if (markerIndex < 0) {
  throw new Error(
    "JoSAA/CSAB selector marker not found."
  );
}

const afterMarker =
  s.slice(
    markerIndex +
    selectorMarker.length
  );

/*
| Remove outer conditional wrapper immediately following marker.
*/

const conditionalMatch =
  afterMarker.match(
    /^\s*\{\s*(?:isJeeMainProfile|String\([\s\S]*?\)\s*\.trim\(\)\s*\.toLowerCase\(\)\s*===\s*'jee-main')\s*&&\s*\(/
  );

if (conditionalMatch) {

  const absoluteStart =
    markerIndex +
    selectorMarker.length +
    conditionalMatch.index;

  s =
    s.slice(
      0,
      absoluteStart
    ) +
    "\n          <>" +
    s.slice(
      absoluteStart +
      conditionalMatch[0].length
    );

  /*
  | Close fragment instead of conditional.
  | Locate the closing pattern before program selector.
  */

  const programLabel =
    `            <label>
              Engineering / Architecture
            </label>`;

  const programIndex =
    s.indexOf(
      programLabel
  );

  if (programIndex < 0) {
    throw new Error(
      "Engineering / Architecture section not found."
    );
  }

  const beforeProgram =
    s.slice(
      0,
      programIndex
    );

  const closeIndex =
    beforeProgram.lastIndexOf(
      "          )}"
    );

  if (closeIndex >= 0) {

    s =
      s.slice(
        0,
        closeIndex
      ) +
      "          </>" +
      s.slice(
        closeIndex +
        "          )}".length
      );
  }
}


/*
|--------------------------------------------------------------------------
| ENSURE BOTH REQUIRED LABELS EXIST
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "Counselling"
  )
) {
  throw new Error(
    "Counselling label missing."
  );
}

if (
  !s.includes(
    "Engineering / Architecture"
  )
) {
  throw new Error(
    "Engineering / Architecture label missing."
  );
}

if (
  !s.includes(
    "JoSAA"
  ) ||
  !s.includes(
    "CSAB"
  )
) {
  throw new Error(
    "JoSAA / CSAB buttons missing."
  );
}


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
  "FINAL PREFERENCE CONTROLS ENABLED"
);
console.log(
  "=============================================="
);
console.log(
  "Counselling -> JoSAA / CSAB"
);
console.log(
  "Program -> Engineering / Architecture"
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
