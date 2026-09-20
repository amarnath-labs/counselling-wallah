import fs from "node:fs";

const rankerPath =
  "./src/services/career/questionRanker.js";

const scorerPath =
  "./src/services/career/profileCombinationScorer.js";


/*
|--------------------------------------------------------------------------
| QUESTION RANKER
|--------------------------------------------------------------------------
*/

let ranker =
  fs.readFileSync(
    rankerPath,
    "utf8"
  );


const oldRanker = `      [
        ...(profile.careerInterests || []),
        ...(profile.interestClusters || []),
      ],
      question.interestClusters,`;


const newRanker = `      [
        ...(profile.stream
          ? [profile.stream]
          : []),
        ...(profile.careerInterests || []),
        ...(profile.interestClusters || []),
      ],
      question.interestClusters,`;


if (
  !ranker.includes(
    oldRanker
  )
) {
  throw new Error(
    "questionRanker target block not found. No files changed."
  );
}


ranker =
  ranker.replace(
    oldRanker,
    newRanker
  );


/*
|--------------------------------------------------------------------------
| PROFILE COMBINATION SCORER
|--------------------------------------------------------------------------
*/

let scorer =
  fs.readFileSync(
    scorerPath,
    "utf8"
  );


const oldScorer = `    const interests = [
      ...(profile.interestClusters || []),
      ...(profile.careerInterests || []),
    ];`;


const newScorer = `    const interests = [
      ...(profile.stream
        ? [profile.stream]
        : []),
      ...(profile.interestClusters || []),
      ...(profile.careerInterests || []),
    ];`;


if (
  !scorer.includes(
    oldScorer
  )
) {
  throw new Error(
    "profileCombinationScorer target block not found. No files changed."
  );
}


scorer =
  scorer.replace(
    oldScorer,
    newScorer
  );


/*
|--------------------------------------------------------------------------
| WRITE ONLY AFTER BOTH TARGETS FOUND
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  rankerPath,
  ranker,
  "utf8"
);

fs.writeFileSync(
  scorerPath,
  scorer,
  "utf8"
);


console.log("");
console.log(
  "FOUNDATION INTEREST WIRING FIX COMPLETE"
);

console.log(
  "profile.stream now contributes to question.interestClusters"
);

console.log("");
