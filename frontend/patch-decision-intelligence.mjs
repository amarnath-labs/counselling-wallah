import fs from "node:fs";

const file =
  "./src/components/RecommendationSlide.jsx";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const importLine =
  `import DecisionIntelligencePanel from './DecisionIntelligencePanel';`;

if (
  !source.includes(
    importLine
  )
) {
  const constIndex =
    source.search(
      /^const\s+/m
    );

  if (
    constIndex === -1
  ) {
    throw new Error(
      "Could not find first const."
    );
  }

  source =
    source.slice(
      0,
      constIndex
    ) +
    importLine +
    "\n\n" +
    source.slice(
      constIndex
    );
}

source =
  source.replace(
    /function\s+RecommendationCard\s*\(\s*\{\s*row\s*,\s*index\s*\}\s*\)/,
    `function RecommendationCard({
  row,
  index,
  allRows = [],
})`
  );

if (
  !source.includes(
    "<DecisionIntelligencePanel"
  )
) {
  const marker =
    `<div className="rec-data-note">`;

  const markerIndex =
    source.indexOf(
      marker
    );

  if (
    markerIndex === -1
  ) {
    throw new Error(
      "rec-data-note marker not found."
    );
  }

  const addition =
`      <DecisionIntelligencePanel
        row={row}
        index={index}
        rows={allRows}
      />

`;

  source =
    source.slice(
      0,
      markerIndex
    ) +
    addition +
    source.slice(
      markerIndex
    );
}

if (
  !source.includes(
    "allRows={rankedRows}"
  )
) {
  source =
    source.replace(
      /(<RecommendationCard[\s\S]*?row=\{row\}[\s\S]*?index=\{(?:i|index)\})/m,
      `$1
              allRows={rankedRows}`
    );
}

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Decision Intelligence integration complete."
);
