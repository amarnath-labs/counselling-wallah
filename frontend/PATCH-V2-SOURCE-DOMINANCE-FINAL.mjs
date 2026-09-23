import fs from "node:fs";

const path =
  "./src/services/personalizedRecommendationV2.js";

let text =
  fs.readFileSync(
    path,
    "utf8"
  );


const backup =
  "./src/services/personalizedRecommendationV2.before-source-dominance-final.js";


if (
  text.includes(
    "MAX_SINGLE_SOURCE_SHARE_60_PERCENT"
  )
) {
  throw new Error(
    "Frontend source-dominance patch already appears applied."
  );
}


/*
|--------------------------------------------------------------------------
| BACKUP
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  backup,
  text,
  "utf8"
);


/*
|--------------------------------------------------------------------------
| 1. STRICT EFFECTIVE REVIEW COUNT
|--------------------------------------------------------------------------
|
| Do not fall back to evidenceCount because one review can generate
| multiple aspect evidence rows.
|
|--------------------------------------------------------------------------
*/

const oldCount = `    const effectiveCount =
      Math.max(
        0,
        num(
          data
            ?.effectiveReviewCount
        ) ??
        num(
          data
            ?.reviewCount
        ) ??
        num(
          data
            ?.evidenceCount
        ) ??
        0
      );`;


const newCount = `    const effectiveCount =
      Math.max(
        0,
        num(
          data
            ?.effectiveReviewCount
        ) ??
        num(
          data
            ?.reviewCount
        ) ??
        0
      );`;


if (
  !text.includes(
    oldCount
  )
) {
  throw new Error(
    "effectiveCount block not found. No changes written."
  );
}


text =
  text.replace(
    oldCount,
    newCount
  );


/*
|--------------------------------------------------------------------------
| 2. USE BACKEND EFFECTIVE SOURCE COUNT
|--------------------------------------------------------------------------
*/

const oldSources = `    const sourceCount =
      Math.max(
        0,
        num(
          data
            ?.sourceCount
        ) ??
        0
      );`;


const newSources = `    const sourceCount =
      Math.max(
        0,
        num(
          data
            ?.effectiveSourceCount
        ) ??
        num(
          data
            ?.sourceCount
        ) ??
        0
      );`;


if (
  !text.includes(
    oldSources
  )
) {
  throw new Error(
    "sourceCount block not found. No changes written."
  );
}


text =
  text.replace(
    oldSources,
    newSources
  );


/*
|--------------------------------------------------------------------------
| 3. ADD <= 60% SOURCE DOMINANCE GATE
|--------------------------------------------------------------------------
*/

const oldReady = `    const scorePass =
      score !== null;


    const ready =
      countPass &&
      sourcesPass &&
      scorePass;`;


const newReady = `    const scorePass =
      score !== null;


    const maxSourceShare =
      num(
        data
          ?.maxSourceShare
      );


    const sourceDominanceVerified =
      typeof data
        ?.sourceDominancePass ===
        'boolean' &&
      maxSourceShare !==
        null;


    const sourceDominancePass =
      sourceDominanceVerified &&
      data
        .sourceDominancePass ===
        true &&
      maxSourceShare <=
        0.60;


    const ready =
      countPass &&
      sourcesPass &&
      scorePass &&
      sourceDominancePass;`;


if (
  !text.includes(
    oldReady
  )
) {
  throw new Error(
    "ready block not found. No changes written."
  );
}


text =
  text.replace(
    oldReady,
    newReady
  );


/*
|--------------------------------------------------------------------------
| 4. RETURN SOURCE-DIVERSITY DIAGNOSTICS
|--------------------------------------------------------------------------
*/

const oldDiagnostics = `      minimumSources:
        REVIEW_MIN_SOURCES,

      sourceDominanceVerified:
        false,
    };`;


const newDiagnostics = `      minimumSources:
        REVIEW_MIN_SOURCES,

      maxSourceShare,

      maximumAllowedSourceShare:
        0.60,

      sourceDominanceVerified,

      sourceDominancePass,

      sourceDistribution:
        Array.isArray(
          data
            ?.sourceDistribution
        )
          ? data
              .sourceDistribution
          : [],
    };`;


if (
  !text.includes(
    oldDiagnostics
  )
) {
  throw new Error(
    "sourceDominanceVerified block not found. No changes written."
  );
}


text =
  text.replace(
    oldDiagnostics,
    newDiagnostics
  );


/*
|--------------------------------------------------------------------------
| 5. MARK RULE ACTIVE
|--------------------------------------------------------------------------
*/

const oldRule = `    sourceDominanceRule:
      'PENDING_BACKEND_SOURCE_DISTRIBUTION',`;


const newRule = `    sourceDominanceRule:
      'MAX_SINGLE_SOURCE_SHARE_60_PERCENT',`;


if (
  !text.includes(
    oldRule
  )
) {
  throw new Error(
    "sourceDominanceRule marker not found. No changes written."
  );
}


text =
  text.replace(
    oldRule,
    newRule
  );


/*
|--------------------------------------------------------------------------
| FINAL VALIDATION
|--------------------------------------------------------------------------
*/

const required = [
  "effectiveSourceCount",
  "maxSourceShare",
  "sourceDominanceVerified",
  "sourceDominancePass",
  "MAX_SINGLE_SOURCE_SHARE_60_PERCENT",
];


for (
  const token
  of required
) {
  if (
    !text.includes(
      token
    )
  ) {
    throw new Error(
      `Validation failed: ${token}`
    );
  }
}


fs.writeFileSync(
  path,
  text,
  "utf8"
);


console.log(
  "SUCCESS: V2 now enforces backend source dominance."
);

console.log(
  "Backup:",
  backup
);
