import fs from 'fs';

const file =
  './frontend/src/hooks/useAppState.jsx';

let src =
  fs.readFileSync(
    file,
    'utf8'
  );


const importLine =
`import {
  fetchNeetRecommendations,
} from '../services/neetRecommendationService';`;


if (
  !src.includes(
    "from '../services/neetRecommendationService'"
  )
) {

  src =
    importLine +
    '\n\n' +
    src;
}


/*
|--------------------------------------------------------------------------
| Insert NEET before the existing UPTAC branch.
|--------------------------------------------------------------------------
*/

if (
  !src.includes(
    "requestExamId === 'neet'"
  )
) {

  const uptacRegex =
    /if\s*\(\s*requestExamId\s*===\s*'uptac'\s*\)\s*\{/;


  if (
    !uptacRegex.test(
      src
    )
  ) {
    throw new Error(
      'Could not locate UPTAC generateResults branch.'
    );
  }


  src =
    src.replace(
      uptacRegex,
`if (
          requestExamId ===
          'neet'
        ) {

          console.log(
            '[NEET] Calling MCC recommendation API...'
          );


          /*
           * Do not reuse stale engineering branches.
           * NEET uses profile.medicalCourses.
           */

          const neetProfile = {
            ...exactProfile,

            branches:
              [],

            preferredBranches:
              [],

            branchPreferences:
              [],
          };


          rows =
            await fetchNeetRecommendations(
              neetProfile,
              {
                limit:
                  100,
              }
            );


          console.log(
            '[NEET] Rows received:',
            Array.isArray(
              rows
            )
              ? rows.length
              : 0
          );

        } else if (
          requestExamId ===
          'uptac'
        ) {`
    );
}


fs.writeFileSync(
  file,
  src,
  'utf8'
);

console.log(
  'useAppState.jsx NEET routing patch complete.'
);
