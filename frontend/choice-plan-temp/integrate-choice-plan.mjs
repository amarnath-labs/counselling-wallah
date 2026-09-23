import fs from "node:fs";

const file = "./src/pages/Results.jsx";
const backup = "./src/pages/Results.before-choice-plan-integration.jsx";

if (!fs.existsSync(file)) {
  throw new Error("Run this script from the frontend folder. Results.jsx was not found.");
}

let source = fs.readFileSync(file, "utf8");

if (source.includes("TRUMARG CHOICE PLAN INTEGRATION")) {
  console.log("Choice Filling Plan integration already present.");
  process.exit(0);
}

fs.copyFileSync(file, backup);

/* 1) Import */
if (!source.includes("import ChoiceFillingPlan from '../components/ChoiceFillingPlan';")) {
  const importMarker =
    "import RecommendationSlide from '../components/RecommendationSlide';";

  if (!source.includes(importMarker)) {
    throw new Error("RecommendationSlide import not found. No changes written.");
  }

  source = source.replace(
    importMarker,
    `${importMarker}
import ChoiceFillingPlan from '../components/ChoiceFillingPlan';`
  );
}

/* 2) Future entitlement field in EMPTY_ACCESS */
source = source.replace(
  /recommendation:\s*false,\s*\n(\s*)callSupport:/m,
  `recommendation: false,
$1choiceFillingPlan: false,
$1callSupport:`
);

/* 3) Dedicated access flag */
if (!source.includes("const hasChoicePlanAccess =")) {
  const accessRegex =
    /const hasRecommendationAccess\s*=\s*Boolean\(\s*paymentAccess\s*\?\.\s*recommendation\s*\)\s*;/m;

  const accessMatch = source.match(accessRegex);

  if (!accessMatch) {
    throw new Error("hasRecommendationAccess block not found. No changes written.");
  }

  source = source.replace(
    accessRegex,
`${accessMatch[0]}

/*
| TRUMARG CHOICE PLAN INTEGRATION
| Separate entitlement so the Rs 999 plan is not silently unlocked
| by the Rs 99 recommendation plan.
*/
const hasChoicePlanAccess =
  Boolean(
    paymentAccess?.choiceFillingPlan ||
    paymentAccess?.choicePlan ||
    paymentAccess?.planId === 'choice-plan'
  );`
  );
}

/* 4) Allow premium recommendation rows to load for an unlocked choice plan */
source = source.replace(
  /activeView\s*!==\s*['"]recommendation['"]\s*\|\|/m,
  `![
            'recommendation',
            'choice-plan',
          ].includes(activeView) ||`
);

source = source.replace(
  /!\s*hasRecommendationAccess\s*\|\|\s*\n(\s*)!profile\?\.rank/m,
  `!(
            hasRecommendationAccess ||
            hasChoicePlanAccess
          ) ||
$1!profile?.rank`
);

if (
  source.includes("hasChoicePlanAccess") &&
  !/\[\s*activeView,[\s\S]*?hasChoicePlanAccess,[\s\S]*?profile,/m.test(source)
) {
  source = source.replace(
    /(hasRecommendationAccess,\s*\n)(\s*profile,)/m,
    `$1      hasChoicePlanAccess,
$2`
  );
}

/* 5) Add third left-side tab */
const asideClose = source.indexOf("</aside>");

if (asideClose === -1) {
  throw new Error("Results left-side <aside> closing tag not found.");
}

const tab = `
            {/* TRUMARG CHOICE PLAN INTEGRATION */}
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
                style={tabIconStyle}
              >
                PLAN
              </span>

              <span>
                <strong
                  style={{
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Choice-Filling Plan
                </strong>

                <small>
                  Ordered counselling list
                </small>

                <span
                  style={{
                    display: 'inline-block',
                    marginTop: 7,
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: '#EAF8F1',
                    color: '#166534',
                    fontSize: 10,
                    fontWeight: 800,
                  }}
                >
                  Rs 999
                </span>
              </span>
            </button>
`;

source =
  source.slice(0, asideClose) +
  tab +
  source.slice(asideClose);

/* 6) Add Choice Filling Plan content after recommendation view */
const recommendationStart = source.indexOf(
  "{activeView ===\n                'recommendation' && ("
);

if (recommendationStart === -1) {
  throw new Error("Recommendation view block not found. No changes written.");
}

const recommendationCloseMarker = `                </section>
              )}`;

const recommendationClose = source.indexOf(
  recommendationCloseMarker,
  recommendationStart
);

if (recommendationClose === -1) {
  throw new Error("Could not locate the end of Recommendation view.");
}

const insertAt =
  recommendationClose +
  recommendationCloseMarker.length;

const choiceBlock = `

              {/* ==============================================
                  TRUMARG CHOICE PLAN INTEGRATION
              ============================================== */}

              {activeView ===
                'choice-plan' && (
                <section>
                  <ChoiceFillingPlan
                    rows={
                      recommendationRows.length
                        ? recommendationRows
                        : rows
                    }
                    profile={{
                      ...profile,
                      rank:
                        Number(
                          profile?.rank
                        ) || null,
                    }}
                    hasPlanAccess={
                      hasChoicePlanAccess
                    }
                    isLoggedIn={
                      Boolean(user)
                    }
                    onUnlock={() => {
                      if (!user) {
                        nav(
                          '/login?redirect=/results'
                        );
                        return;
                      }

                      nav('/pricing');
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
              )}`;

source =
  source.slice(0, insertAt) +
  choiceBlock +
  source.slice(insertAt);

fs.writeFileSync(file, source, "utf8");

console.log("");
console.log("==============================================");
console.log("TRUMARG CHOICE-FILLING PLAN INTEGRATED");
console.log("==============================================");
console.log("Backup:", backup);
console.log("Updated:", file);
console.log("");
console.log("NOTE:");
console.log("- New Choice-Filling Plan tab is now wired.");
console.log("- Rs 999 plan stays locked unless payment access exposes");
console.log("  choiceFillingPlan / choicePlan or planId=choice-plan.");
