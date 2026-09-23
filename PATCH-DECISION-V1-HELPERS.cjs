const fs =
  require("fs");

const file =
  "./frontend/src/components/DecisionIntelligencePanel.jsx";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| INSERT V1 HELPERS
|--------------------------------------------------------------------------
*/

const marker =
  "export default function DecisionIntelligencePanel({";


const index =
  text.indexOf(
    marker
  );


if (
  index === -1
) {
  throw new Error(
    "DecisionIntelligencePanel export not found"
  );
}


const helpers =
`
/*
|--------------------------------------------------------------------------
| TRUMARG V1 DECISION INTELLIGENCE HELPERS
|--------------------------------------------------------------------------
*/


function v1Number(value) {
  if (
    value === null ||
    value === undefined ||
    value === ''
  ) {
    return null;
  }

  const parsed =
    Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
}


function getV1Factor(
  row,
  key
) {
  const direct =
    row?.factors?.[key];

  if (
    direct &&
    direct.available === true &&
    v1Number(
      direct.score
    ) !== null
  ) {
    return {
      available: true,
      score:
        v1Number(
          direct.score
        ),
    };
  }


  return {
    available: false,
    score: null,
  };
}


function getV1Evidence(
  row
) {
  const existing =
    row?.evidenceTransparency ??
    row?.premium
      ?.evidenceTransparency;


  if (
    existing &&
    Array.isArray(
      existing.known
    ) &&
    Array.isArray(
      existing.missing
    )
  ) {
    return existing;
  }


  const factors = [
    [
      'Admission data',
      'admission',
    ],
    [
      'Branch preference',
      'branch',
    ],
    [
      'College quality',
      'quality',
    ],
    [
      'Review intelligence',
      'reviews',
    ],
    [
      'Budget / fee fit',
      'budget',
    ],
    [
      'Location fit',
      'location',
    ],
  ];


  const known = [];
  const missing = [];


  for (
    const [
      label,
      key,
    ]
    of factors
  ) {
    const factor =
      getV1Factor(
        row,
        key
      );


    if (
      factor.available
    ) {
      known.push(
        label
      );
    } else {
      missing.push(
        label
      );
    }
  }


  return {
    known,
    missing,
  };
}


/*
|--------------------------------------------------------------------------
| SCENARIO WEIGHTS
|--------------------------------------------------------------------------
|
| Score stays on the same 0-100 scale.
| Missing data contributes zero.
| We DO NOT renormalize only across known factors.
|
|--------------------------------------------------------------------------
*/


const V1_SCENARIO_WEIGHTS = {
  balanced: {
    admission: 50,
    branch: 15,
    quality: 15,
    reviews: 10,
    budget: 7,
    location: 3,
  },

  branch: {
    admission: 35,
    branch: 35,
    quality: 12,
    reviews: 8,
    budget: 7,
    location: 3,
  },

  college: {
    admission: 35,
    branch: 12,
    quality: 35,
    reviews: 10,
    budget: 5,
    location: 3,
  },

  budget: {
    admission: 35,
    branch: 12,
    quality: 12,
    reviews: 8,
    budget: 30,
    location: 3,
  },

  location: {
    admission: 35,
    branch: 12,
    quality: 12,
    reviews: 8,
    budget: 8,
    location: 25,
  },
};


function scenarioScoreV1(
  row,
  mode = 'balanced'
) {
  const weights =
    V1_SCENARIO_WEIGHTS[
      mode
    ] ??
    V1_SCENARIO_WEIGHTS
      .balanced;


  let score = 0;


  for (
    const [
      key,
      weight,
    ]
    of Object.entries(
      weights
    )
  ) {
    const factor =
      getV1Factor(
        row,
        key
      );


    if (
      !factor.available
    ) {
      continue;
    }


    score +=
      (
        factor.score /
        100
      ) *
      weight;
  }


  return Math.round(
    score * 10
  ) / 10;
}


function findScenarioRankV1(
  row,
  rows,
  mode
) {
  const sorted =
    [...rows]
      .filter(Boolean)
      .sort(
        (
          a,
          b
        ) => {
          const scoreDiff =
            scenarioScoreV1(
              b,
              mode
            ) -
            scenarioScoreV1(
              a,
              mode
            );

          if (
            scoreDiff !== 0
          ) {
            return scoreDiff;
          }


          return (
            v1Number(
              b?.dataCoverage ??
              b?.premium
                ?.dataCoverage
            ) ??
            0
          ) -
          (
            v1Number(
              a?.dataCoverage ??
              a?.premium
                ?.dataCoverage
            ) ??
            0
          );
        }
      );


  const index =
    sorted.indexOf(
      row
    );


  return index >= 0
    ? index + 1
    : null;
}


/*
|--------------------------------------------------------------------------
| BETTER ALTERNATIVES
|--------------------------------------------------------------------------
|
| Candidate must actually improve requested factor.
|
|--------------------------------------------------------------------------
*/


function findBetterAlternativeV1(
  row,
  rows,
  factorKey
) {
  const current =
    getV1Factor(
      row,
      factorKey
    );


  /*
  |--------------------------------------------------------------------------
  | If current factor itself is unknown,
  | do not pretend we have a better alternative.
  |--------------------------------------------------------------------------
  */

  if (
    !current.available
  ) {
    return null;
  }


  const candidates =
    rows
      .filter(
        (
          candidate
        ) => {
          if (
            !candidate ||
            candidate === row
          ) {
            return false;
          }


          const factor =
            getV1Factor(
              candidate,
              factorKey
            );


          return (
            factor.available &&
            factor.score >
              current.score
          );
        }
      )
      .sort(
        (
          a,
          b
        ) => {
          const factorA =
            getV1Factor(
              a,
              factorKey
            );

          const factorB =
            getV1Factor(
              b,
              factorKey
            );


          const factorDiff =
            factorB.score -
            factorA.score;


          if (
            factorDiff !== 0
          ) {
            return factorDiff;
          }


          return (
            v1Number(
              b?.matchScore ??
              b?.premium?.score
            ) ??
            -1
          ) -
          (
            v1Number(
              a?.matchScore ??
              a?.premium?.score
            ) ??
            -1
          );
        }
      );


  return (
    candidates[0] ??
    null
  );
}


function getCurrentGlobalRankV1(
  row,
  fallbackIndex
) {
  return (
    v1Number(
      row?.ranking
        ?.globalRank ??
      row?.premium
        ?.ranking
        ?.globalRank
    ) ??
    (
      fallbackIndex +
      1
    )
  );
}


`;

text =
  text.slice(
    0,
    index
  ) +
  helpers +
  text.slice(
    index
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: V1 Decision Intelligence helpers inserted"
);
