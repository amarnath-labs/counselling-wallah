const fs = require("fs");

const file =
  "./frontend/src/components/DecisionIntelligencePanel.jsx";

let text =
  fs.readFileSync(
    file,
    "utf8"
  );


const start =
  text.indexOf(
    "function findUniqueBetterAlternativeV1("
  );

const end =
  text.indexOf(
    "function buildUniqueAlternativesV1(",
    start
  );

if (
  start === -1 ||
  end === -1
) {
  throw new Error(
    "Alternative helper block not found"
  );
}


const replacement =
`function findUniqueBetterAlternativeV1({
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


  const currentOverall =
    v1Number(
      row?.matchScore ??
      row?.premium?.score
    ) ??
    0;


  const currentRank =
    v1Number(
      row?.ranking?.globalRank ??
      row?.premium
        ?.ranking
        ?.globalRank
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


          if (
            !collegeKey ||
            collegeKey ===
              currentCollegeKey ||
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


          if (
            !candidateFactor.available ||
            candidateFactor.score <=
              currentFactor.score
          ) {
            return false;
          }


          /*
          |--------------------------------------------------------------------------
          | Avoid absurd alternatives
          |--------------------------------------------------------------------------
          |
          | Candidate should not be dramatically worse overall.
          |
          */

          const candidateOverall =
            v1Number(
              candidate?.matchScore ??
              candidate?.premium?.score
            ) ??
            0;


          if (
            candidateOverall <
              currentOverall -
              15
          ) {
            return false;
          }


          return true;
        }
      )
      .map(
        (
          candidate
        ) => {
          const factor =
            getV1Factor(
              candidate,
              factorKey
            );


          const candidateOverall =
            v1Number(
              candidate?.matchScore ??
              candidate?.premium?.score
            ) ??
            0;


          const candidateRank =
            v1Number(
              candidate?.ranking
                ?.globalRank ??
              candidate?.premium
                ?.ranking
                ?.globalRank
            );


          const factorGain =
            factor.score -
            currentFactor.score;


          const overallGap =
            Math.abs(
              candidateOverall -
              currentOverall
            );


          const rankGap =
            (
              currentRank !== null &&
              candidateRank !== null
            )
              ? Math.abs(
                  candidateRank -
                  currentRank
                )
              : 100;


          /*
          |--------------------------------------------------------------------------
          | Alternative relevance score
          |--------------------------------------------------------------------------
          |
          | Prefer:
          | 1. real factor improvement
          | 2. similar overall quality
          | 3. nearby global rank
          |
          */

          const relevance =
            (
              factorGain *
              4
            ) -
            (
              overallGap *
              1.5
            ) -
            (
              Math.min(
                rankGap,
                50
              ) *
              0.15
            );


          return {
            candidate,
            relevance,
            factorGain,
            overallGap,
          };
        }
      )
      .sort(
        (
          a,
          b
        ) => {
          if (
            b.relevance !==
            a.relevance
          ) {
            return (
              b.relevance -
              a.relevance
            );
          }


          if (
            b.factorGain !==
            a.factorGain
          ) {
            return (
              b.factorGain -
              a.factorGain
            );
          }


          return (
            a.overallGap -
            b.overallGap
          );
        }
      );


  const selected =
    candidates[0]
      ?.candidate ??
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


`;


text =
  text.slice(
    0,
    start
  ) +
  replacement +
  text.slice(
    end
  );


fs.writeFileSync(
  file,
  text,
  "utf8"
);


console.log(
  "PASS: Better Alternatives now prioritize relevant and diverse options"
);
