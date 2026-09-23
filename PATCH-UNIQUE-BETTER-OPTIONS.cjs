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
| UNIQUE COLLEGE ALTERNATIVES
|--------------------------------------------------------------------------
*/

const marker =
  "export default function DecisionIntelligencePanel({";

const markerIndex =
  text.indexOf(
    marker
  );

if (
  markerIndex === -1
) {
  throw new Error(
    "DecisionIntelligencePanel export not found"
  );
}


if (
  !text.includes(
    "function buildUniqueAlternativesV1("
  )
) {
  const helpers =
`
function alternativeCollegeKeyV1(
  row
) {
  return String(
    row?.collegeId ??
    row?.college?.id ??
    row?.college_id ??
    getCollegeName(
      row
    ) ??
    ''
  )
    .trim()
    .toLowerCase();
}


function findUniqueBetterAlternativeV1({
  row,
  rows,
  factorKey,
  usedCollegeKeys,
}) {
  const currentFactor =
    getV1Factor(
      row,
      factorKey
    );


  if (
    !currentFactor.available
  ) {
    return null;
  }


  const currentCollegeKey =
    alternativeCollegeKeyV1(
      row
    );


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


          const collegeKey =
            alternativeCollegeKeyV1(
              candidate
            );


          /*
          |--------------------------------------------------------------------------
          | Never recommend same college as current option
          |--------------------------------------------------------------------------
          */

          if (
            !collegeKey ||
            collegeKey ===
              currentCollegeKey
          ) {
            return false;
          }


          /*
          |--------------------------------------------------------------------------
          | Never repeat a college already used by another alternative
          |--------------------------------------------------------------------------
          */

          if (
            usedCollegeKeys.has(
              collegeKey
            )
          ) {
            return false;
          }


          const candidateFactor =
            getV1Factor(
              candidate,
              factorKey
            );


          return (
            candidateFactor.available &&
            candidateFactor.score >
              currentFactor.score
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


          const factorDifference =
            factorB.score -
            factorA.score;


          if (
            factorDifference !== 0
          ) {
            return factorDifference;
          }


          const overallA =
            v1Number(
              a?.matchScore ??
              a?.premium?.score
            ) ??
            -1;


          const overallB =
            v1Number(
              b?.matchScore ??
              b?.premium?.score
            ) ??
            -1;


          if (
            overallB !== overallA
          ) {
            return (
              overallB -
              overallA
            );
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


  const selected =
    candidates[0] ??
    null;


  if (
    selected
  ) {
    usedCollegeKeys.add(
      alternativeCollegeKeyV1(
        selected
      )
    );
  }


  return selected;
}


function buildUniqueAlternativesV1(
  row,
  rows
) {
  const usedCollegeKeys =
    new Set();


  /*
  |--------------------------------------------------------------------------
  | Priority order
  |--------------------------------------------------------------------------
  |
  | Each section gets a different college.
  |
  */

  const admission =
    findUniqueBetterAlternativeV1({
      row,
      rows,
      factorKey:
        'admission',
      usedCollegeKeys,
    });


  const branch =
    findUniqueBetterAlternativeV1({
      row,
      rows,
      factorKey:
        'branch',
      usedCollegeKeys,
    });


  const quality =
    findUniqueBetterAlternativeV1({
      row,
      rows,
      factorKey:
        'quality',
      usedCollegeKeys,
    });


  const budget =
    findUniqueBetterAlternativeV1({
      row,
      rows,
      factorKey:
        'budget',
      usedCollegeKeys,
    });


  const location =
    findUniqueBetterAlternativeV1({
      row,
      rows,
      factorKey:
        'location',
      usedCollegeKeys,
    });


  return {
    admission,
    branch,
    quality,
    budget,
    location,
  };
}


`;

  text =
    text.slice(
      0,
      markerIndex
    ) +
    helpers +
    text.slice(
      markerIndex
    );
}


/*
|--------------------------------------------------------------------------
| REPLACE INDIVIDUAL ALTERNATIVE useMemo BLOCK
|--------------------------------------------------------------------------
*/

const startMarker =
  "const admissionAlternative =";

const endMarker =
  "return (";

const start =
  text.indexOf(
    startMarker
  );

if (
  start === -1
) {
  throw new Error(
    "admissionAlternative block not found"
  );
}


const componentReturn =
  text.indexOf(
    endMarker,
    start
  );

if (
  componentReturn === -1
) {
  throw new Error(
    "Component return not found after alternatives"
  );
}


const before =
  text.slice(
    0,
    start
  );

const after =
  text.slice(
    componentReturn
  );


const replacement =
`const alternativesV1 =
    useMemo(
      () =>
        buildUniqueAlternativesV1(
          row,
          rows
        ),
      [
        row,
        rows,
      ]
    );


  const admissionAlternative =
    alternativesV1.admission;

  const branchAlternative =
    alternativesV1.branch;

  const collegeAlternative =
    alternativesV1.quality;

  const budgetAlternative =
    alternativesV1.budget;

  const locationAlternative =
    alternativesV1.location;


  `;


text =
  before +
  replacement +
  after;


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: Better Alternatives now use unique colleges"
);
