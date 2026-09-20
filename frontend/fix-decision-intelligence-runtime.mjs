import fs from "node:fs";

const file =
  "./src/components/RecommendationSlide.jsx";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

/*
|--------------------------------------------------------------------------
| 1. FIX RecommendationCard PARAMETER
|--------------------------------------------------------------------------
*/

const cardStart =
  source.indexOf(
    "function RecommendationCard"
  );

if (
  cardStart === -1
) {
  throw new Error(
    "RecommendationCard not found."
  );
}

const openParen =
  source.indexOf(
    "(",
    cardStart
  );

const closeParen =
  source.indexOf(
    ")",
    openParen
  );

if (
  openParen === -1 ||
  closeParen === -1
) {
  throw new Error(
    "RecommendationCard parameters not found."
  );
}

const currentParams =
  source.slice(
    openParen + 1,
    closeParen
  );

if (
  !currentParams.includes(
    "allRows"
  )
) {
  const newParams =
`{
  row,
  index,
  allRows = [],
}`;

  source =
    source.slice(
      0,
      openParen + 1
    ) +
    newParams +
    source.slice(
      closeParen
    );

  console.log(
    "Added allRows to RecommendationCard."
  );
} else {
  console.log(
    "RecommendationCard already has allRows."
  );
}


/*
|--------------------------------------------------------------------------
| 2. ENSURE CARD RECEIVES rankedRows
|--------------------------------------------------------------------------
*/

if (
  !source.includes(
    "allRows={rankedRows}"
  )
) {
  const cardRenderIndex =
    source.lastIndexOf(
      "<RecommendationCard"
    );

  if (
    cardRenderIndex === -1
  ) {
    throw new Error(
      "RecommendationCard render not found."
    );
  }

  const cardClose =
    source.indexOf(
      "/>",
      cardRenderIndex
    );

  if (
    cardClose === -1
  ) {
    throw new Error(
      "RecommendationCard closing /> not found."
    );
  }

  source =
    source.slice(
      0,
      cardClose
    ) +
`  allRows={rankedRows}
            ` +
    source.slice(
      cardClose
    );

  console.log(
    "Passed rankedRows into RecommendationCard."
  );
} else {
  console.log(
    "rankedRows already passed to RecommendationCard."
  );
}


/*
|--------------------------------------------------------------------------
| 3. FIX DUPLICATE REACT KEYS IN 50/15/15/10/7/3 FORMULA
|--------------------------------------------------------------------------
*/

source =
  source.replace(
    /\.map\(\s*\(\s*value\s*\)\s*=>\s*\(\s*<span\s+key=\{\s*value\s*\}/g,
    `.map(
            (value, index) => (
              <span
                key={\`\${value}-\${index}\`}`
  );

source =
  source.replace(
    /\{\[50,\s*15,\s*15,\s*10,\s*7,\s*3\]\.map\(\(x\)\s*=>\s*<span key=\{x\}>/g,
    `{[50, 15, 15, 10, 7, 3].map((x, index) => <span key={\`\${x}-\${index}\`}>`
  );


fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "RecommendationSlide runtime repair complete."
);
