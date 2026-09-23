import fs from "node:fs";

const file =
  "./src/pages/Results.jsx";

const backup =
  "./src/pages/Results.before-choice-plan-v2.jsx";


if (
  !fs.existsSync(file)
) {
  throw new Error(
    "Results.jsx not found. Run from frontend folder."
  );
}


if (
  !fs.existsSync(
    "./src/components/ChoiceFillingPlan.jsx"
  )
) {
  throw new Error(
    "ChoiceFillingPlan.jsx missing from src/components"
  );
}


if (
  !fs.existsSync(
    "./src/components/choicePlanEngine.js"
  )
) {
  throw new Error(
    "choicePlanEngine.js missing from src/components"
  );
}


let s =
  fs.readFileSync(
    file,
    "utf8"
  );


fs.copyFileSync(
  file,
  backup
);


/*
|--------------------------------------------------------------------------
| 1. COMPONENT IMPORT
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "import ChoiceFillingPlan from '../components/ChoiceFillingPlan';"
  )
) {
  const marker =
    "import RecommendationSlide from '../components/RecommendationSlide';";

  if (
    !s.includes(marker)
  ) {
    throw new Error(
      "RecommendationSlide import not found"
    );
  }

  s =
    s.replace(
      marker,
`${marker}
import ChoiceFillingPlan from '../components/ChoiceFillingPlan';`
    );

  console.log(
    "ChoiceFillingPlan import added"
  );
}


/*
|--------------------------------------------------------------------------
| 2. ACCESS OBJECT
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "choiceFillingPlan: false"
  )
) {
  s =
    s.replace(
      /(\brecommendation:\s*false,\s*\r?\n)(\s*)(callSupport:)/m,
      `$1$2choiceFillingPlan: false,
$2$3`
    );

  console.log(
    "choiceFillingPlan access field added"
  );
}


/*
|--------------------------------------------------------------------------
| 3. DEDICATED CHOICE PLAN ACCESS
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "const hasChoicePlanAccess ="
  )
) {
  const accessRegex =
    /const\s+hasRecommendationAccess\s*=\s*Boolean\s*\(\s*paymentAccess\s*\?\.\s*recommendation\s*\)\s*;/m;

  const match =
    s.match(
      accessRegex
    );

  if (
    !match
  ) {
    throw new Error(
      "hasRecommendationAccess block not found"
    );
  }

  s =
    s.replace(
      accessRegex,
`${match[0]}

/*
|--------------------------------------------------------------------------
| TRUMARG CHOICE-FILLING PLAN ACCESS
|--------------------------------------------------------------------------
|
| Separate Rs 999 entitlement.
| Rs 99 recommendation access does NOT automatically unlock this.
|
*/

const hasChoicePlanAccess =
  Boolean(
    paymentAccess?.choiceFillingPlan ||
    paymentAccess?.choicePlan ||
    paymentAccess?.planId ===
      'choice-plan'
  );`
    );

  console.log(
    "Dedicated choice-plan access added"
  );
}


/*
|--------------------------------------------------------------------------
| 4. ALLOW RECOMMENDATION DATA TO LOAD IN CHOICE PLAN VIEW
|--------------------------------------------------------------------------
*/

const activeViewGuard =
  /activeView\s*!==\s*['"]recommendation['"]\s*\|\|/m;

if (
  activeViewGuard.test(
    s
  )
) {
  s =
    s.replace(
      activeViewGuard,
`![
            'recommendation',
            'choice-plan',
          ].includes(
            activeView
          ) ||`
    );

  console.log(
    "Recommendation fetch enabled for choice-plan view"
  );
}


/*
|--------------------------------------------------------------------------
| 5. ACCESS GUARD FOR FETCH
|--------------------------------------------------------------------------
*/

const recommendationGuard =
  /!\s*hasRecommendationAccess\s*\|\|/m;

if (
  recommendationGuard.test(
    s
  )
) {
  s =
    s.replace(
      recommendationGuard,
`!(
            hasRecommendationAccess ||
            hasChoicePlanAccess
          ) ||`
    );

  console.log(
    "Choice-plan access added to recommendation fetch guard"
  );
}


/*
|--------------------------------------------------------------------------
| 6. EFFECT DEPENDENCY
|--------------------------------------------------------------------------
*/

if (
  s.includes(
    "hasChoicePlanAccess"
  )
) {
  const depPattern =
    /(hasRecommendationAccess,\s*\r?\n)(\s*)(profile,)/m;

  if (
    depPattern.test(
      s
    ) &&
    !/hasRecommendationAccess,\s*\r?\n\s*hasChoicePlanAccess,/m.test(
      s
    )
  ) {
    s =
      s.replace(
        depPattern,
`$1$2hasChoicePlanAccess,
$2$3`
      );

    console.log(
      "Choice-plan dependency added"
    );
  }
}


/*
|--------------------------------------------------------------------------
| 7. ADD LEFT-SIDE TAB
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "TRUMARG CHOICE PLAN TAB"
  )
) {
  const asideClose =
    s.indexOf(
      "</aside>"
    );

  if (
    asideClose === -1
  ) {
    throw new Error(
      "Left navigation </aside> not found"
    );
  }

  const choiceTab =
`

            {/* ==========================================
                TRUMARG CHOICE PLAN TAB
            ========================================== */}

            <button
              type="button"
              onClick={() =>
                setActiveView(
                  'choice-plan'
                )
              }
              style={
                tabButtonStyle(
                  activeView ===
                    'choice-plan',
                  'green'
                )
              }
            >
              <span
                style={
                  tabIconStyle
                }
              >
                PLAN
              </span>

              <span>
                <strong
                  style={{
                    display:
                      'block',
                    marginBottom:
                      4,
                  }}
                >
                  Choice-Filling Plan
                </strong>

                <small>
                  Ordered counselling list
                </small>

                <span
                  style={{
                    display:
                      'inline-block',
                    marginTop:
                      7,
                    padding:
                      '2px 7px',
                    borderRadius:
                      999,
                    background:
                      '#EAF8F1',
                    color:
                      '#166534',
                    fontSize:
                      10,
                    fontWeight:
                      800,
                  }}
                >
                  ₹999
                </span>
              </span>
            </button>

`;

  s =
    s.slice(
      0,
      asideClose
    ) +
    choiceTab +
    s.slice(
      asideClose
    );

  console.log(
    "Choice-Filling Plan tab added"
  );
}


/*
|--------------------------------------------------------------------------
| 8. LOCATE RECOMMENDATION VIEW FLEXIBLY
|--------------------------------------------------------------------------
*/

if (
  !s.includes(
    "TRUMARG CHOICE PLAN VIEW"
  )
) {
  const recommendationRegex =
    /\{\s*activeView\s*===\s*['"]recommendation['"]\s*&&\s*\(\s*<section>[\s\S]*?<RecommendationSlide[\s\S]*?<\/section>\s*\)\s*\}/m;


  const match =
    s.match(
      recommendationRegex
    );


  if (
    !match
  ) {
    /*
    |--------------------------------------------------------------------------
    | Fallback:
    | locate RecommendationSlide first, then nearest closing section.
    |--------------------------------------------------------------------------
    */

    const recComponent =
      s.indexOf(
        "<RecommendationSlide"
      );


    if (
      recComponent === -1
    ) {
      throw new Error(
        "RecommendationSlide render not found"
      );
    }


    const closingSection =
      s.indexOf(
        "</section>",
        recComponent
      );


    if (
      closingSection === -1
    ) {
      throw new Error(
        "Recommendation section closing tag not found"
      );
    }


    const afterSection =
      closingSection +
      "</section>".length;


    const choiceView =
`

              {/* ==============================================
                  TRUMARG CHOICE PLAN VIEW
              ============================================== */}

              {activeView ===
                'choice-plan' && (
                <section>
                  <ChoiceFillingPlan
                    rows={
                      recommendationRows
                        .length
                        ? recommendationRows
                        : rows
                    }

                    profile={{
                      ...profile,

                      rank:
                        Number(
                          profile?.rank
                        ) ||
                        null,
                    }}

                    hasPlanAccess={
                      hasChoicePlanAccess
                    }

                    isLoggedIn={
                      Boolean(
                        user
                      )
                    }

                    onUnlock={() => {
                      if (
                        !user
                      ) {
                        nav(
                          '/login?redirect=/results'
                        );

                        return;
                      }

                      nav(
                        '/pricing'
                      );
                    }}

                    onLogin={() =>
                      nav(
                        '/login?redirect=/results'
                      )
                    }

                    dataAsOf={
                      recommendationMeta
                        ?.dataAsOf ||
                      recommendationMeta
                        ?.year ||
                      null
                    }
                  />
                </section>
              )}

`;

    s =
      s.slice(
        0,
        afterSection
      ) +
      choiceView +
      s.slice(
        afterSection
      );


    console.log(
      "Choice-plan view added using fallback locator"
    );
  }

  else {
    const originalBlock =
      match[0];


    const choiceView =
`

              {/* ==============================================
                  TRUMARG CHOICE PLAN VIEW
              ============================================== */}

              {activeView ===
                'choice-plan' && (
                <section>
                  <ChoiceFillingPlan
                    rows={
                      recommendationRows
                        .length
                        ? recommendationRows
                        : rows
                    }

                    profile={{
                      ...profile,

                      rank:
                        Number(
                          profile?.rank
                        ) ||
                        null,
                    }}

                    hasPlanAccess={
                      hasChoicePlanAccess
                    }

                    isLoggedIn={
                      Boolean(
                        user
                      )
                    }

                    onUnlock={() => {
                      if (
                        !user
                      ) {
                        nav(
                          '/login?redirect=/results'
                        );

                        return;
                      }

                      nav(
                        '/pricing'
                      );
                    }}

                    onLogin={() =>
                      nav(
                        '/login?redirect=/results'
                      )
                    }

                    dataAsOf={
                      recommendationMeta
                        ?.dataAsOf ||
                      recommendationMeta
                        ?.year ||
                      null
                    }
                  />
                </section>
              )}
`;

    s =
      s.replace(
        originalBlock,
        originalBlock +
          choiceView
      );


    console.log(
      "Choice-plan view added after recommendation view"
    );
  }
}


/*
|--------------------------------------------------------------------------
| 9. MOBILE NAV: SUPPORT THREE TABS
|--------------------------------------------------------------------------
*/

s =
  s.replace(
    /grid-template-columns:\s*1fr 1fr\s*!important;/g,
    "grid-template-columns: repeat(3, minmax(0, 1fr)) !important;"
  );


/*
|--------------------------------------------------------------------------
| 10. SAFETY ASSERTIONS
|--------------------------------------------------------------------------
*/

const required = [
  "ChoiceFillingPlan",
  "hasChoicePlanAccess",
  "'choice-plan'",
  "TRUMARG CHOICE PLAN TAB",
  "TRUMARG CHOICE PLAN VIEW",
];


for (
  const token of
  required
) {
  if (
    !s.includes(
      token
    )
  ) {
    throw new Error(
      `Final validation failed: ${token}`
    );
  }
}


fs.writeFileSync(
  file,
  s,
  "utf8"
);


console.log("");
console.log(
  "=============================================="
);
console.log(
  "TRUMARG CHOICE PLAN V2 INTEGRATION COMPLETE"
);
console.log(
  "=============================================="
);
console.log(
  "Backup:",
  backup
);
console.log(
  "Updated:",
  file
);
