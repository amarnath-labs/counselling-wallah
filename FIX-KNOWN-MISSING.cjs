const fs = require("fs");

const file =
  "./frontend/src/components/DecisionIntelligencePanel.jsx";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


const componentMarker =
  "export default function DecisionIntelligencePanel({";

const componentIndex =
  text.indexOf(
    componentMarker
  );

if (
  componentIndex === -1
) {
  throw new Error(
    "DecisionIntelligencePanel component not found"
  );
}


/*
|--------------------------------------------------------------------------
| Find first stable variable inside component
|--------------------------------------------------------------------------
*/

const currentRankMarker =
  "const currentRank =";

let insertIndex =
  text.indexOf(
    currentRankMarker,
    componentIndex
  );


if (
  insertIndex === -1
) {
  const returnMarker =
    "return (";

  insertIndex =
    text.indexOf(
      returnMarker,
      componentIndex
    );
}


if (
  insertIndex === -1
) {
  throw new Error(
    "Could not find insertion point inside component"
  );
}


/*
|--------------------------------------------------------------------------
| Remove broken / duplicate component-level evidence declarations
|--------------------------------------------------------------------------
*/

const beforeComponent =
  text.slice(
    0,
    componentIndex
  );

let componentText =
  text.slice(
    componentIndex
  );


componentText =
  componentText.replace(
    /const\s+v1Evidence\s*=\s*getV1Evidence\(\s*row\s*\)\s*;\s*const\s+known\s*=\s*v1Evidence\.known\s*;\s*const\s+missing\s*=\s*v1Evidence\.missing\s*;/g,
    ""
  );


text =
  beforeComponent +
  componentText;


/*
|--------------------------------------------------------------------------
| Recalculate insertion point after cleanup
|--------------------------------------------------------------------------
*/

insertIndex =
  text.indexOf(
    currentRankMarker,
    componentIndex
  );

if (
  insertIndex === -1
) {
  insertIndex =
    text.indexOf(
      "return (",
      componentIndex
    );
}


const evidenceBlock =
`const v1Evidence =
    getV1Evidence(
      row
    );

  const known =
    Array.isArray(
      v1Evidence?.known
    )
      ? v1Evidence.known
      : [];

  const missing =
    Array.isArray(
      v1Evidence?.missing
    )
      ? v1Evidence.missing
      : [];


  `;


text =
  text.slice(
    0,
    insertIndex
  ) +
  evidenceBlock +
  text.slice(
    insertIndex
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: known/missing are now defined inside DecisionIntelligencePanel"
);
