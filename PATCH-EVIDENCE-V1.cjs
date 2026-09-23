const fs =
  require("fs");

const file =
  "./frontend/src/components/DecisionIntelligencePanel.jsx";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


const exportMarker =
  "export default function DecisionIntelligencePanel({";

const exportIndex =
  text.indexOf(
    exportMarker
  );


if (
  exportIndex === -1
) {
  throw new Error(
    "DecisionIntelligencePanel export not found"
  );
}


const bodyStart =
  text.indexOf(
    "{",
    exportIndex +
      exportMarker.length -
      1
  );


/*
|--------------------------------------------------------------------------
| Locate known/missing definitions inside component
|--------------------------------------------------------------------------
*/

const knownPattern =
  /const\s+known\s*=\s*[\s\S]*?;\s*\n\s*const\s+missing\s*=\s*[\s\S]*?;/;


if (
  knownPattern.test(
    text
  )
) {
  text =
    text.replace(
      knownPattern,
`const v1Evidence =
    getV1Evidence(
      row
    );

  const known =
    v1Evidence.known;

  const missing =
    v1Evidence.missing;`
    );

  console.log(
    "PASS: old known/missing logic replaced"
  );
} else {
  /*
  |--------------------------------------------------------------------------
  | If no direct variables exist,
  | insert before currentRank.
  |--------------------------------------------------------------------------
  */

  const currentRankMarker =
    "const currentRank =";


  const currentRankIndex =
    text.indexOf(
      currentRankMarker,
      exportIndex
    );


  if (
    currentRankIndex === -1
  ) {
    throw new Error(
      "Could not locate currentRank for evidence insertion"
    );
  }


  const insert =
`const v1Evidence =
    getV1Evidence(
      row
    );

  const known =
    v1Evidence.known;

  const missing =
    v1Evidence.missing;


  `;


  text =
    text.slice(
      0,
      currentRankIndex
    ) +
    insert +
    text.slice(
      currentRankIndex
    );


  console.log(
    "PASS: V1 evidence variables inserted"
  );
}


fs.writeFileSync(
  file,
  text,
  "utf8"
);
