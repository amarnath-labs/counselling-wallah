import fs from "node:fs";

const file =
  "./src/services/choicePlanEngine.js";

let s =
  fs.readFileSync(
    file,
    "utf8"
  );

fs.copyFileSync(
  file,
  "./src/services/choicePlanEngine.before-review-evidence.js"
);

const oldGate =
`/** Review score counts only if enough aspects pass the 50 / 3 / 60% gate. */
export function reviewGate(row, minReadyAspects = 3) {
  const aspects = row?.reviewIntelligenceV3?.aspects;
  if (!aspects || typeof aspects !== 'object') return { ready: false, readyAspects: 0 };

  let readyAspects = 0;
  for (const data of Object.values(aspects)) {
    const reviews = num(data?.effectiveReviewCount) ?? 0;
    const sources = num(data?.effectiveSourceCount) ?? 0;
    const share = num(data?.maxSourceShare);
    if (reviews >= 50 && sources >= 3 && share !== null && share <= 0.6) readyAspects += 1;
  }
  return { ready: readyAspects >= minReadyAspects, readyAspects };
}`;

const newGate =
`/*
 * Review intelligence is allowed to contribute before the full
 * 100-review qualification threshold, but its influence is scaled
 * by evidence strength.
 *
 * Admission feasibility is NOT affected by this function.
 */
export function reviewGate(row) {
  const intel =
    row?.reviewIntelligenceV3;

  const rawScore =
    num(intel?.score);

  const reviews =
    num(
      intel?.evidence?.usableReviews
    ) ?? 0;

  const sources =
    num(
      intel?.evidence?.independentSources
    ) ?? 0;

  if (
    rawScore === null ||
    reviews <= 0 ||
    sources < 2
  ) {
    return {
      ready: false,
      qualified: false,
      usableReviews: reviews,
      independentSources: sources,
      confidence: 0,
      effectiveScore: null,
    };
  }

  /*
   * Review volume reaches full confidence at 100.
   * Source diversity reaches full confidence at 3.
   */
  const volumeConfidence =
    Math.min(
      1,
      reviews / 100
    );

  const sourceConfidence =
    Math.min(
      1,
      sources / 3
    );

  const confidence =
    Math.min(
      1,
      volumeConfidence *
      sourceConfidence
    );

  /*
   * Low-confidence review evidence is pulled toward neutral 50,
   * instead of being discarded or treated as fully reliable.
   */
  const effectiveScore =
    clamp(
      50 +
      (
        rawScore - 50
      ) *
      confidence
    );

  return {
    ready: true,

    qualified:
      reviews >= 100 &&
      sources >= 3,

    usableReviews:
      reviews,

    independentSources:
      sources,

    confidence,

    rawScore,

    effectiveScore:
      round1(
        effectiveScore
      ),
  };
}`;

if (!s.includes(oldGate)) {
  throw new Error(
    "Old reviewGate block not found. No changes written."
  );
}

s =
  s.replace(
    oldGate,
    newGate
  );

const oldScore =
`  const gate = reviewGate(row);
  const reviewsScore = gate.ready ? num(row?.reviewIntelligenceV3?.score) : null;`;

const newScore =
`  const gate = reviewGate(row);

  const reviewsScore =
    gate.ready
      ? num(
          gate.effectiveScore
        )
      : null;`;

if (!s.includes(oldScore)) {
  throw new Error(
    "Review score block not found. No changes written."
  );
}

s =
  s.replace(
    oldScore,
    newScore
  );

const oldEvidence =
`      reviews: e.reviewGate.ready ? 'verified' : 'not counted',`;

const newEvidence =
`      reviews:
        e.reviewGate.qualified
          ? 'qualified'
          : e.reviewGate.ready
            ? 'limited-evidence'
            : 'not-counted',

      reviewCount:
        e.reviewGate.usableReviews ?? 0,

      reviewSources:
        e.reviewGate.independentSources ?? 0,

      reviewConfidence:
        e.reviewGate.confidence ?? 0,`;

if (!s.includes(oldEvidence)) {
  throw new Error(
    "Choice evidence block not found. No changes written."
  );
}

s =
  s.replace(
    oldEvidence,
    newEvidence
  );

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Choice filling now uses confidence-scaled review intelligence."
);
