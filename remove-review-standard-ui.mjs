import fs from "node:fs";

const file =
  "./frontend/src/components/RecommendationSlide.jsx";

const backup =
  "./frontend/src/components/RecommendationSlide.before-remove-review-standard-ui.jsx";

if (!fs.existsSync(file)) {
  throw new Error(
    `Active RecommendationSlide not found: ${file}`
  );
}

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

const title =
  "50+ Review Evidence Standard";

const titleIndex =
  s.indexOf(title);

if (titleIndex < 0) {
  throw new Error(
    "50+ Review Evidence Standard block not found. No changes written."
  );
}

/*
|--------------------------------------------------------------------------
| Find the Reviews CoverageChip after this diagnostic panel
|--------------------------------------------------------------------------
*/

const reviewsLabelIndex =
  s.indexOf(
    'label="Reviews"',
    titleIndex
  );

if (reviewsLabelIndex < 0) {
  throw new Error(
    'Reviews CoverageChip not found after diagnostic panel.'
  );
}

const coverageStart =
  s.lastIndexOf(
    "<CoverageChip",
    reviewsLabelIndex
  );

if (coverageStart < 0) {
  throw new Error(
    "CoverageChip start not found."
  );
}

/*
|--------------------------------------------------------------------------
| Match DIV pairs
|--------------------------------------------------------------------------
|
| We find the outer-most review-standard DIV that:
|
| - contains the title
| - contains reviewAspectRows.map
| - closes BEFORE Reviews CoverageChip
|
|--------------------------------------------------------------------------
*/

const tagRegex =
  /<\/?div\b[^>]*>/g;

const stack = [];
const pairs = [];

let match;

while (
  (
    match =
      tagRegex.exec(s)
  ) !== null
) {
  const tag =
    match[0];

  const isClose =
    tag.startsWith(
      "</div"
    );

  if (!isClose) {
    stack.push({
      start:
        match.index,

      end:
        tagRegex.lastIndex,
    });

    continue;
  }

  const open =
    stack.pop();

  if (!open) {
    continue;
  }

  pairs.push({
    openStart:
      open.start,

    openEnd:
      open.end,

    closeStart:
      match.index,

    closeEnd:
      tagRegex.lastIndex,
  });
}

/*
|--------------------------------------------------------------------------
| Candidate container
|--------------------------------------------------------------------------
*/

const candidates =
  pairs
    .filter(
      pair =>
        pair.openStart <
          titleIndex &&

        pair.closeEnd >
          titleIndex &&

        pair.closeEnd <=
          coverageStart
    )
    .map(
      pair => ({
        ...pair,

        content:
          s.slice(
            pair.openStart,
            pair.closeEnd
          ),
      })
    )
    .filter(
      pair =>
        pair.content.includes(
          title
        ) &&

        pair.content.includes(
          "reviewAspectRows.map"
        )
    )
    .sort(
      (a, b) =>
        b.closeEnd -
        a.closeEnd
    );

if (!candidates.length) {
  throw new Error(
    "Could not safely isolate review-standard UI. No changes written."
  );
}

const block =
  candidates[0];

/*
|--------------------------------------------------------------------------
| Extra safety
|--------------------------------------------------------------------------
*/

const removing =
  s.slice(
    block.openStart,
    block.closeEnd
  );

if (
  !removing.includes(
    "50+ Review Evidence Standard"
  ) ||
  !removing.includes(
    "reviewAspectRows.map"
  )
) {
  throw new Error(
    "Safety validation failed. No changes written."
  );
}

/*
|--------------------------------------------------------------------------
| Backup
|--------------------------------------------------------------------------
*/

fs.copyFileSync(
  file,
  backup
);

/*
|--------------------------------------------------------------------------
| Remove ONLY visible diagnostic panel
|--------------------------------------------------------------------------
*/

s =
  s.slice(
    0,
    block.openStart
  ) +
  `
      {/*
      Review threshold diagnostic cards removed from UI.
      Review Intelligence data/scoring remains active.
      */}
` +
  s.slice(
    block.closeEnd
  );

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
  "REVIEW STANDARD UI REMOVED"
);
console.log(
  "=============================================="
);
console.log(
  "File:",
  file
);
console.log(
  "Backup:",
  backup
);
console.log(
  "Removed: 50+ Review Evidence Standard cards"
);
console.log(
  "Review Intelligence scoring: UNCHANGED"
);
console.log(
  "Personalized recommendation: UNCHANGED"
);
console.log(
  "Choice filling review factor: UNCHANGED"
);
console.log(
  "Admission logic: UNCHANGED"
);
