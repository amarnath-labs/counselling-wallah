import fs from "node:fs";

const file =
  "./src/routes/cwRecV1-dev.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const marker =
  "CW-REC HOME STATE HARD ELIGIBILITY";

const markerIndex =
  source.indexOf(marker);

if (markerIndex === -1) {
  throw new Error(
    "Home State eligibility block not found."
  );
}

const tail =
  source.slice(markerIndex);

/*
|--------------------------------------------------------------------------
| Find erroneous:
|
| realData = realData.filter(...)
|--------------------------------------------------------------------------
*/

const match =
  tail.match(
    /\b([A-Za-z_$][\w$]*)\s*=\s*\1\.filter\s*\(/
  );

if (!match) {
  if (
    tail.includes(
      "cwRecFilteredRows"
    )
  ) {
    console.log(
      "Correct object-safe Home State filter already installed."
    );

    process.exit(0);
  }

  throw new Error(
    "Old realData.filter block not found."
  );
}

const variable =
  match[1];

const assignmentStart =
  markerIndex +
  match.index;

const filterText =
  `${variable}.filter`;

const filterIndex =
  source.indexOf(
    filterText,
    assignmentStart
  );

const openParen =
  source.indexOf(
    "(",
    filterIndex
  );

if (
  openParen === -1
) {
  throw new Error(
    "Filter opening parenthesis not found."
  );
}


/*
|--------------------------------------------------------------------------
| Find matching closing parenthesis
|--------------------------------------------------------------------------
*/

let depth = 0;
let closeParen = -1;

for (
  let i = openParen;
  i < source.length;
  i++
) {
  const ch =
    source[i];

  if (ch === "(") {
    depth++;
  }
  else if (ch === ")") {
    depth--;

    if (depth === 0) {
      closeParen = i;
      break;
    }
  }
}

if (
  closeParen === -1
) {
  throw new Error(
    "Filter closing parenthesis not found."
  );
}


/*
|--------------------------------------------------------------------------
| Preserve original filter callback
|--------------------------------------------------------------------------
*/

const filterCallback =
  source.slice(
    openParen + 1,
    closeParen
  );


/*
|--------------------------------------------------------------------------
| Find end of assignment
|--------------------------------------------------------------------------
*/

let assignmentEnd =
  closeParen + 1;

while (
  assignmentEnd <
    source.length &&
  /\s/.test(
    source[assignmentEnd]
  )
) {
  assignmentEnd++;
}

if (
  source[
    assignmentEnd
  ] === ";"
) {
  assignmentEnd++;
}


/*
|--------------------------------------------------------------------------
| Object-safe replacement
|--------------------------------------------------------------------------
|
| fetchCWRecRows may return:
|
| 1. Array
| 2. { rows: [...] }
| 3. { data: [...] }
|
| Preserve its original shape.
|--------------------------------------------------------------------------
*/

const replacement =
`
        const cwRecSourceRows =
          Array.isArray(${variable})
            ? ${variable}
            : Array.isArray(
                ${variable}?.rows
              )
              ? ${variable}.rows
              : Array.isArray(
                  ${variable}?.data
                )
                ? ${variable}.data
                : null;

        if (
          !cwRecSourceRows
        ) {
          throw new Error(
            'CW-REC row collection not found.'
          );
        }

        const cwRecFilteredRows =
          cwRecSourceRows.filter(
${filterCallback}
          );

        if (
          Array.isArray(
            ${variable}
          )
        ) {
          ${variable} =
            cwRecFilteredRows;
        }
        else if (
          Array.isArray(
            ${variable}.rows
          )
        ) {
          ${variable}.rows =
            cwRecFilteredRows;
        }
        else {
          ${variable}.data =
            cwRecFilteredRows;
        }
`;

source =
  source.slice(
    0,
    assignmentStart
  ) +
  replacement +
  source.slice(
    assignmentEnd
  );

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Fixed realData.filter object/array bug."
);

console.log(
  `Patched variable: ${variable}`
);

console.log(
  "Home State eligibility now preserves fetchCWRecRows response shape."
);
