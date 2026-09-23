import fs from "node:fs";

const profileFile =
  "./frontend/src/pages/Profile.jsx";

const stateFile =
  "./frontend/src/hooks/useAppState.jsx";

const resultsFile =
  "./frontend/src/pages/Results.jsx";


for (const file of [
  profileFile,
  stateFile,
  resultsFile,
]) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing file: ${file}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| BACKUPS
|--------------------------------------------------------------------------
*/

fs.copyFileSync(
  profileFile,
  "./frontend/src/pages/Profile.before-josaa-csab-tabs.jsx"
);

fs.copyFileSync(
  stateFile,
  "./frontend/src/hooks/useAppState.before-josaa-csab-tabs.jsx"
);

fs.copyFileSync(
  resultsFile,
  "./frontend/src/pages/Results.before-josaa-csab-tabs.jsx"
);


/*
|--------------------------------------------------------------------------
| 1. PROFILE.JSX
| Add JoSAA / CSAB selector above Engineering / Architecture
|--------------------------------------------------------------------------
*/

let profile =
  fs.readFileSync(
    profileFile,
    "utf8"
  );


if (
  !profile.includes(
    "TRUMARG JOSAA CSAB SELECTOR"
  )
) {
  const engineeringFieldRegex =
    /(\s*<div className="field">\s*<label>\s*Engineering\s*\/\s*Architecture\s*<\/label>)/m;

  const match =
    profile.match(
      engineeringFieldRegex
    );

  if (!match) {
    throw new Error(
      "Engineering / Architecture field not found in Profile.jsx"
    );
  }


  const selector =
`
          {/* TRUMARG JOSAA CSAB SELECTOR */}
          {
            String(
              selectedExamId ||
              p?.examId ||
              ''
            )
              .trim()
              .toLowerCase() ===
              'jee-main' && (
              <div className="field">

                <label>
                  Counselling
                </label>

                <div className="chip-select">

                  <button
                    type="button"
                    className={
                      \`chip \${
                        (
                          p?.counsellingMode ||
                          'josaa'
                        ) ===
                        'josaa'
                          ? 'on'
                          : ''
                      }\`
                    }
                    onClick={() =>
                      set(
                        'counsellingMode',
                        'josaa'
                      )
                    }
                  >
                    JoSAA
                  </button>

                  <button
                    type="button"
                    className={
                      \`chip \${
                        p?.counsellingMode ===
                        'csab'
                          ? 'on'
                          : ''
                      }\`
                    }
                    onClick={() =>
                      set(
                        'counsellingMode',
                        'csab'
                      )
                    }
                  >
                    CSAB
                  </button>

                </div>

                <div
                  style={{
                    marginTop: 7,
                    fontSize: 11,
                    color: '#64748B',
                  }}
                >
                  {
                    p?.counsellingMode ===
                    'csab'
                      ? 'Using CSAB Special cutoff data'
                      : 'Using JoSAA cutoff data'
                  }
                </div>

              </div>
            )
          }

`;

  profile =
    profile.replace(
      engineeringFieldRegex,
      selector +
      match[1]
    );
}


fs.writeFileSync(
  profileFile,
  profile,
  "utf8"
);


/*
|--------------------------------------------------------------------------
| 2. useAppState.jsx
|
| Keep UI exam = jee-main
| API exam:
|   JoSAA -> jee-main
|   CSAB  -> csab-special
|--------------------------------------------------------------------------
*/

let state =
  fs.readFileSync(
    stateFile,
    "utf8"
  );


if (
  !state.includes(
    "TRUMARG COUNSELLING DATA SOURCE"
  )
) {
  const requestRegex =
    /const requestExamId\s*=\s*String\(\s*p\.examId\s*\|\|\s*''\s*\)\s*\.trim\(\)\s*\.toLowerCase\(\);/m;

  if (
    !requestRegex.test(
      state
    )
  ) {
    throw new Error(
      "requestExamId block not found in useAppState.jsx"
    );
  }


  state =
    state.replace(
      requestRegex,
`/*
      | TRUMARG COUNSELLING DATA SOURCE
      |
      | selected/base exam stays jee-main.
      | Only the API data source switches to csab-special.
      */

      const baseExamId =
        String(
          p.examId || ''
        )
          .trim()
          .toLowerCase();


      const counsellingMode =
        String(
          p.counsellingMode ||
          'josaa'
        )
          .trim()
          .toLowerCase();


      const requestExamId =
        baseExamId ===
          'jee-main' &&
        counsellingMode ===
          'csab'
          ? 'csab-special'
          : baseExamId;`
    );


  /*
  |--------------------------------------------------------------------------
  | Preserve profile.examId as JEE Main
  |--------------------------------------------------------------------------
  */

  const exactProfileRegex =
    /const exactProfile\s*=\s*\{\s*\.\.\.p,\s*examId:\s*requestExamId,\s*\};/m;

  if (
    !exactProfileRegex.test(
      state
    )
  ) {
    throw new Error(
      "exactProfile block not found in useAppState.jsx"
    );
  }


  state =
    state.replace(
      exactProfileRegex,
`const exactProfile = {
        ...p,

        examId:
          baseExamId,

        counsellingMode,
      };`
    );


  /*
  |--------------------------------------------------------------------------
  | Results belong to displayed exam JEE Main, not internal csab-special id
  |--------------------------------------------------------------------------
  */

  const resultExamRegex =
    /setResultsExamId\(\s*requestExamId\s*\);/m;

  if (
    !resultExamRegex.test(
      state
    )
  ) {
    throw new Error(
      "setResultsExamId(requestExamId) not found."
    );
  }


  state =
    state.replace(
      resultExamRegex,
`setResultsExamId(
          baseExamId
        );`
    );
}


fs.writeFileSync(
  stateFile,
  state,
  "utf8"
);


/*
|--------------------------------------------------------------------------
| 3. RESULTS.JSX
|
| Personalized Recommendations also need the same JoSAA/CSAB source.
|--------------------------------------------------------------------------
*/

let results =
  fs.readFileSync(
    resultsFile,
    "utf8"
  );


if (
  !results.includes(
    "TRUMARG RECOMMENDATION COUNSELLING SOURCE"
  )
) {
  const navRegex =
    /const nav\s*=\s*useNavigate\(\);/m;

  if (
    !navRegex.test(
      results
    )
  ) {
    throw new Error(
      "Results nav marker not found."
    );
  }


  results =
    results.replace(
      navRegex,
`const nav =
    useNavigate();


  /*
  |--------------------------------------------------------------------------
  | TRUMARG RECOMMENDATION COUNSELLING SOURCE
  |--------------------------------------------------------------------------
  */

  const baseRecommendationExamId =
    String(
      selectedExamId ||
      profile?.examId ||
      ''
    )
      .trim()
      .toLowerCase();


  const recommendationExamId =
    baseRecommendationExamId ===
      'jee-main' &&
    profile?.counsellingMode ===
      'csab'
      ? 'csab-special'
      : baseRecommendationExamId;`
    );


  /*
  |--------------------------------------------------------------------------
  | Replace fetch/V2 occurrences only
  |--------------------------------------------------------------------------
  */

  const oldExamExpression =
    /selectedExamId\s*\|\|\s*profile\?\.examId/g;

  const occurrences =
    (
      results.match(
        oldExamExpression
      ) || []
    ).length;


  if (
    occurrences < 2
  ) {
    throw new Error(
      `Expected at least 2 selectedExamId/profile.examId occurrences, found ${occurrences}`
    );
  }


  /*
  | Only the first two are recommendation API + V2 profile.
  */

  let replaced =
    0;

  results =
    results.replace(
      oldExamExpression,
      () => {
        replaced++;

        return replaced <= 2
          ? "recommendationExamId"
          : "selectedExamId || profile?.examId";
      }
    );
}


fs.writeFileSync(
  resultsFile,
  results,
  "utf8"
);


console.log("");
console.log(
  "=============================================="
);
console.log(
  "JOSAA / CSAB TABS PATCHED"
);
console.log(
  "=============================================="
);
console.log(
  "JoSAA -> jee-main -> JOSAA data"
);
console.log(
  "CSAB  -> csab-special -> CSAB_SPECIAL data"
);
console.log(
  "Displayed exam remains JEE Main"
);
console.log(
  "Engineering/Architecture logic: UNCHANGED"
);
console.log(
  "Admission logic: UNCHANGED"
);
console.log(
  "Review logic: UNCHANGED"
);
console.log(
  "Ranking logic: UNCHANGED"
);
