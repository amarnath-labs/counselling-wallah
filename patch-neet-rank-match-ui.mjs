import fs from 'fs';

const file =
  './frontend/src/components/CollegeCard.jsx';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


/*
|--------------------------------------------------------------------------
| 1. NEET FLAG + EXACT DISPLAY SCORE
|--------------------------------------------------------------------------
*/

const scorePattern =
  /const currentMatch\s*=\s*Number\.isFinite\(\s*Number\(row\?\.overall\)\s*\)[\s\S]*?:\s*0\s*;/m;


if (
  !scorePattern.test(
    src
  )
) {
  throw new Error(
    'currentMatch anchor not found.'
  );
}


src =
  src.replace(
    scorePattern,
`const isNeet =
    String(
      row?.examId ||
      row?.sourceExam ||
      ''
    )
      .trim()
      .toLowerCase() ===
      'neet' ||
    String(
      row?.sourceExam ||
      ''
    )
      .trim()
      .toLowerCase() ===
      'neet ug';


  const neetScoreCandidates = [
    row?.recommendationScore,
    row?.overallScore,
    row?.score,
    row?.admission?.score,
  ];


  const neetScore =
    neetScoreCandidates
      .map(
        value =>
          Number(
            value
          )
      )
      .find(
        value =>
          Number.isFinite(
            value
          )
      );


  const currentMatch =
    isNeet
      ? (
          Number.isFinite(
            neetScore
          )
            ? Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    neetScore
                  )
                )
              )
            : 0
        )
      : (
          Number.isFinite(
            Number(
              row?.overall
            )
          )
            ? Math.max(
                0,
                Math.min(
                  100,
                  Math.round(
                    Number(
                      row.overall
                    )
                  )
                )
              )
            : 0
        );`
  );


/*
|--------------------------------------------------------------------------
| 2. EXAM-SPECIFIC MATCH LABEL
|--------------------------------------------------------------------------
*/

const labelAnchor =
  "JoSAA Match:{' '}";


const labelCount =
  src.split(
    labelAnchor
  ).length - 1;


console.log(
  'JoSAA Match anchors:',
  labelCount
);


if (
  labelCount < 1
) {
  throw new Error(
    'JoSAA Match label anchor not found.'
  );
}


src =
  src.replace(
    labelAnchor,
    "{isNeet ? 'Rank Match' : 'JoSAA Match'}:{' '}"
  );


fs.writeFileSync(
  file,
  src,
  'utf8'
);


console.log(
  'CollegeCard NEET Rank Match + percentage patched.'
);
