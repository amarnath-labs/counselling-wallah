import fs from "node:fs";

const path =
  "./src/services/career/questionRetriever.js";

let content =
  fs.readFileSync(
    path,
    "utf8"
  );


if (
  !content.includes(
    "function canonicalizeProfileArrays("
  )
) {
  const marker =
    "function normalizeClass(";

  const index =
    content.indexOf(
      marker
    );

  if (
    index === -1
  ) {
    throw new Error(
      "normalizeClass marker not found. No changes made."
    );
  }


  const helper = `function canonicalProfileArray(
  values
) {
  if (
    !Array.isArray(
      values
    )
  ) {
    return values;
  }


  const map =
    new Map();


  for (
    const value
    of values
  ) {
    const key =
      normalize(
        value
      );


    if (
      key &&
      !map.has(
        key
      )
    ) {
      map.set(
        key,
        value
      );
    }
  }


  return [
    ...map.entries(),
  ]
    .sort(
      (
        left,
        right
      ) =>
        left[0].localeCompare(
          right[0]
        )
    )
    .map(
      entry =>
        entry[1]
    );
}


function canonicalizeProfileArrays(
  profile = {}
) {
  return {
    ...profile,

    subjects:
      canonicalProfileArray(
        profile.subjects
      ),

    targetExams:
      canonicalProfileArray(
        profile.targetExams
      ),

    entranceExams:
      canonicalProfileArray(
        profile.entranceExams
      ),

    targetCourses:
      canonicalProfileArray(
        profile.targetCourses
      ),

    skills:
      canonicalProfileArray(
        profile.skills
      ),

    interestClusters:
      canonicalProfileArray(
        profile.interestClusters
      ),

    careerInterests:
      canonicalProfileArray(
        profile.careerInterests
      ),

    careerFamilies:
      canonicalProfileArray(
        profile.careerFamilies
      ),

    experience:
      Array.isArray(
        profile.experience
      )
        ? canonicalProfileArray(
            profile.experience
          )
        : profile.experience,

    experiences:
      canonicalProfileArray(
        profile.experiences
      ),
  };
}


`;

  content =
    content.slice(
      0,
      index
    ) +
    helper +
    content.slice(
      index
    );
}


/*
|--------------------------------------------------------------------------
| Canonicalize once at retrieval entry
|--------------------------------------------------------------------------
*/

const functionMarker =
  "export async function retrieveRankedQuestionCandidates({";

const functionIndex =
  content.indexOf(
    functionMarker
  );

if (
  functionIndex === -1
) {
  throw new Error(
    "retrieveRankedQuestionCandidates not found."
  );
}


const bodyStart =
  content.indexOf(
    "}) {",
    functionIndex
  );

if (
  bodyStart === -1
) {
  throw new Error(
    "retrieveRankedQuestionCandidates body not found."
  );
}


const insertionPoint =
  bodyStart +
  4;


const canonicalLine =
  `
  profile =
    canonicalizeProfileArrays(
      profile
    );

`;


const nearby =
  content.slice(
    insertionPoint,
    insertionPoint + 250
  );


if (
  !nearby.includes(
    "canonicalizeProfileArrays("
  )
) {
  content =
    content.slice(
      0,
      insertionPoint
    ) +
    canonicalLine +
    content.slice(
      insertionPoint
    );
}


fs.writeFileSync(
  path,
  content,
  "utf8"
);


console.log(
  "SUCCESS: profile arrays canonicalized at retrieval entry."
);
