import fs from "node:fs";

const file =
  "./src/routes/cwRecV1-dev.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const routeMarker =
  "'/recommendations'";

const routeStart =
  source.indexOf(
    routeMarker
  );

if (routeStart === -1) {
  throw new Error(
    "Recommendations route not found."
  );
}

let route =
  source.slice(
    routeStart
  );


/*
|--------------------------------------------------------------------------
| HOME STATE REQUEST INPUT
|--------------------------------------------------------------------------
*/

if (
  !route.includes(
    "const homeState ="
  )
) {
  const genderRegex =
    /(\s+const gender\s*=\s*[\s\S]*?;\s*)/;

  const genderMatch =
    route.match(
      genderRegex
    );

  if (!genderMatch) {
    throw new Error(
      "Gender request block not found."
    );
  }

  route =
    route.replace(
      genderMatch[1],
`${genderMatch[1]}
      const homeState =
        String(
          req.query.homeState ??
          ''
        ).trim();
`
    );

  console.log(
    "Added homeState request input."
  );
}
else {
  console.log(
    "homeState request input already present."
  );
}


/*
|--------------------------------------------------------------------------
| FIND REAL DATA FETCH
|--------------------------------------------------------------------------
*/

const fetchRegex =
  /const\s+([A-Za-z_$][\w$]*)\s*=\s*await\s+fetchCWRecRows\s*\(/;

const fetchMatch =
  route.match(
    fetchRegex
  );

if (!fetchMatch) {
  throw new Error(
    "fetchCWRecRows assignment not found."
  );
}

const rowsVariable =
  fetchMatch[1];

console.log(
  `Rows variable: ${rowsVariable}`
);


/*
|--------------------------------------------------------------------------
| const -> let
|--------------------------------------------------------------------------
*/

route =
  route.replace(
    fetchRegex,
    `let ${rowsVariable} = await fetchCWRecRows(`
  );


/*
|--------------------------------------------------------------------------
| FIND END OF fetchCWRecRows(...)
|--------------------------------------------------------------------------
*/

const callStart =
  route.indexOf(
    "await fetchCWRecRows("
  );

const openParen =
  route.indexOf(
    "(",
    callStart
  );

let depth = 0;
let callEnd = -1;

for (
  let i = openParen;
  i < route.length;
  i++
) {
  const ch =
    route[i];

  if (ch === "(") {
    depth++;
  }
  else if (ch === ")") {
    depth--;

    if (depth === 0) {
      callEnd = i;
      break;
    }
  }
}

if (callEnd === -1) {
  throw new Error(
    "Could not find end of fetchCWRecRows call."
  );
}

let statementEnd =
  callEnd + 1;

while (
  statementEnd < route.length &&
  /\s/.test(
    route[statementEnd]
  )
) {
  statementEnd++;
}

if (
  route[statementEnd] === ";"
) {
  statementEnd++;
}


/*
|--------------------------------------------------------------------------
| HARD HOME STATE ELIGIBILITY
|--------------------------------------------------------------------------
*/

const marker =
  "CW-REC HOME STATE HARD ELIGIBILITY";

if (
  !route.includes(
    marker
  )
) {
  const filterCode = `


      /*
      |--------------------------------------------------------------------------
      | CW-REC HOME STATE HARD ELIGIBILITY
      |--------------------------------------------------------------------------
      |
      | Eligibility only.
      | No premium score or weight changes.
      |
      */

      if (
        examId === 'jee-main' &&
        homeState &&
        !quota
      ) {
        const normalizedHomeState =
          homeState
            .toLowerCase()
            .trim();

        ${rowsVariable} =
          ${rowsVariable}.filter(
            (row) => {
              const rowQuota =
                String(
                  row?.quota ??
                  ''
                )
                  .trim()
                  .toUpperCase();

              const collegeState =
                String(
                  row?.state ??
                  row?.college_state ??
                  ''
                )
                  .trim()
                  .toLowerCase();


              if (
                rowQuota === 'AI'
              ) {
                return true;
              }


              if (
                rowQuota === 'HS'
              ) {
                return (
                  collegeState ===
                  normalizedHomeState
                );
              }


              if (
                rowQuota === 'OS'
              ) {
                return (
                  collegeState !==
                  normalizedHomeState
                );
              }


              return false;
            }
          );
      }
`;

  route =
    route.slice(
      0,
      statementEnd
    ) +
    filterCode +
    route.slice(
      statementEnd
    );

  console.log(
    "Added Home State hard eligibility filter."
  );
}
else {
  console.log(
    "Home State hard eligibility already present."
  );
}


/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

source =
  source.slice(
    0,
    routeStart
  ) +
  route;

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "CW personalized Home State fix complete."
);
