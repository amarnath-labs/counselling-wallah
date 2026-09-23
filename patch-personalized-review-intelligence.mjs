import fs from "node:fs";

const file =
  "./frontend/src/services/cwRecRecommendationService.js";

if (!fs.existsSync(file)) {
  throw new Error(
    `File not found: ${file}`
  );
}

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

const backup =
  "./frontend/src/services/cwRecRecommendationService.before-review-evidence.js";

fs.copyFileSync(
  file,
  backup
);

const oldBlock =
`  const reviewScore =
    optionalNumber(row?.reviews?.score);`;

const newBlock =
`  /*
  |--------------------------------------------------------------------------
  | REVIEW INTELLIGENCE
  |--------------------------------------------------------------------------
  |
  | Prefer backend review score when already available.
  | Otherwise use Review Intelligence V3 with evidence confidence scaling.
  |
  | Admission bucket logic is NOT changed here.
  |--------------------------------------------------------------------------
  */

  const rawV3ReviewScore =
    optionalNumber(
      row
        ?.reviewIntelligenceV3
        ?.score
    );

  const usableReviewCount =
    optionalNumber(
      row
        ?.reviewIntelligenceV3
        ?.evidence
        ?.usableReviews
    ) ?? 0;

  const independentReviewSources =
    optionalNumber(
      row
        ?.reviewIntelligenceV3
        ?.evidence
        ?.independentSources
    ) ?? 0;

  const reviewEvidenceConfidence =
    rawV3ReviewScore === null ||
    usableReviewCount <= 0 ||
    independentReviewSources < 2
      ? 0
      : Math.min(
          1,
          (
            usableReviewCount /
            100
          ) *
          Math.min(
            1,
            independentReviewSources /
            3
          )
        );

  const confidenceScaledV3Score =
    rawV3ReviewScore === null ||
    reviewEvidenceConfidence <= 0
      ? null
      : Math.max(
          0,
          Math.min(
            100,
            50 +
            (
              rawV3ReviewScore -
              50
            ) *
            reviewEvidenceConfidence
          )
        );

  const reviewScore =
    optionalNumber(
      row?.reviews?.score
    ) ??
    confidenceScaledV3Score;`;

if (!s.includes(oldBlock)) {
  throw new Error(
    "reviewScore block not found. No changes written."
  );
}

s =
  s.replace(
    oldBlock,
    newBlock
  );

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log("");
console.log(
  "=========================================="
);
console.log(
  "PERSONALIZED REVIEW INTELLIGENCE PATCHED"
);
console.log(
  "=========================================="
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
  "Admission bucket logic: UNCHANGED"
);
console.log(
  "Review factor: confidence-scaled"
);
