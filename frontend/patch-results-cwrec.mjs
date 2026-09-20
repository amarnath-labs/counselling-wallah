import fs from "node:fs";

const path = "./src/pages/Results.jsx";

let s = fs.readFileSync(path, "utf8");

/* =========================================================
   1. IMPORT CW-REC SERVICE
========================================================= */

const importAnchor = `import {
  getExamName,
} from '../services/examService';`;

const importReplacement = `import {
  getExamName,
} from '../services/examService';

import {
  fetchCWRecommendations,
} from '../services/cwRecRecommendationService';`;

if (!s.includes(importAnchor)) {
  throw new Error("IMPORT ANCHOR NOT FOUND");
}

s = s.replace(
  importAnchor,
  importReplacement
);


/* =========================================================
   2. ADD CW-REC STATE
========================================================= */

const stateAnchor = `  const [
    accessLoading,
    setAccessLoading,
  ] = useState(true);`;

const stateReplacement = `  const [
    accessLoading,
    setAccessLoading,
  ] = useState(true);

  const [
    recommendationRows,
    setRecommendationRows,
  ] = useState([]);

  const [
    recommendationLoading,
    setRecommendationLoading,
  ] = useState(false);

  const [
    recommendationError,
    setRecommendationError,
  ] = useState(null);

  const [
    recommendationMeta,
    setRecommendationMeta,
  ] = useState(null);`;

if (!s.includes(stateAnchor)) {
  throw new Error("STATE ANCHOR NOT FOUND");
}

s = s.replace(
  stateAnchor,
  stateReplacement
);


/* =========================================================
   3. FETCH CW-REC ONLY FOR PAID RECOMMENDATION VIEW
========================================================= */

const effectAnchor = `  const hasRecommendationAccess =
    Boolean(
      paymentAccess
        ?.recommendation
    );

  /*
  |--------------------------------------------------------------------------
  | EXISTING RESULT LOGIC - UNCHANGED
  |--------------------------------------------------------------------------
  */`;

const effectReplacement = `  const hasRecommendationAccess =
    Boolean(
      paymentAccess
        ?.recommendation
    );

  /*
  |--------------------------------------------------------------------------
  | CW-REC PERSONALIZED RECOMMENDATIONS
  |--------------------------------------------------------------------------
  |
  | Important:
  | - Normal College Search remains unchanged.
  | - CW-REC is loaded only for the Recommendation tab.
  | - Locked users do not fetch personalized score data here.
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      let cancelled = false;

      async function loadRecommendations() {
        if (
          activeView !== 'recommendation' ||
          accessLoading ||
          !hasRecommendationAccess ||
          !profile?.rank
        ) {
          if (
            !hasRecommendationAccess &&
            !cancelled
          ) {
            setRecommendationRows([]);
            setRecommendationMeta(null);
            setRecommendationError(null);
          }

          return;
        }

        try {
          setRecommendationLoading(true);
          setRecommendationError(null);

          const response =
            await fetchCWRecommendations(
              {
                ...profile,
                examId:
                  selectedExamId ||
                  profile?.examId,
              },
              {
                limit: 100,
                locationMode: 'NONE',
              }
            );

          if (cancelled) {
            return;
          }

          setRecommendationRows(
            Array.isArray(response?.data)
              ? response.data
              : []
          );

          setRecommendationMeta(
            response?.meta || null
          );
        } catch (error) {
          console.error(
            '[CW-REC FRONTEND ERROR]',
            error
          );

          if (!cancelled) {
            setRecommendationRows([]);
            setRecommendationMeta(null);

            setRecommendationError(
              error?.message ||
              'Unable to load personalized recommendations.'
            );
          }
        } finally {
          if (!cancelled) {
            setRecommendationLoading(false);
          }
        }
      }

      loadRecommendations();

      return () => {
        cancelled = true;
      };
    },
    [
      activeView,
      accessLoading,
      hasRecommendationAccess,
      profile,
      selectedExamId,
    ]
  );

  /*
  |--------------------------------------------------------------------------
  | EXISTING RESULT LOGIC - UNCHANGED
  |--------------------------------------------------------------------------
  */`;

if (!s.includes(effectAnchor)) {
  throw new Error("EFFECT ANCHOR NOT FOUND");
}

s = s.replace(
  effectAnchor,
  effectReplacement
);


/* =========================================================
   4. RECOMMENDATION TAB USES CW-REC ROWS
========================================================= */

const slideAnchor = `                  ) : (
                    <RecommendationSlide
                      rows={rows}
                      hasRecommendationAccess={
                        hasRecommendationAccess
                      }
                      isLoggedIn={Boolean(user)}
                      onUnlock={() =>
                        nav('/pricing')
                      }
                      onLogin={() =>
                        nav(
                          '/login?redirect=/results'
                        )
                      }
                    />
                  )}`;

const slideReplacement = `                  ) : recommendationLoading &&
                    hasRecommendationAccess ? (
                    <div className="source-note">
                      Loading personalized recommendations...
                    </div>
                  ) : recommendationError &&
                    hasRecommendationAccess ? (
                    <div className="source-note">
                      {recommendationError}
                    </div>
                  ) : (
                    <RecommendationSlide
                      rows={recommendationRows}
                      hasRecommendationAccess={
                        hasRecommendationAccess
                      }
                      isLoggedIn={Boolean(user)}
                      onUnlock={() =>
                        nav('/pricing')
                      }
                      onLogin={() =>
                        nav(
                          '/login?redirect=/results'
                        )
                      }
                    />
                  )}`;

if (!s.includes(slideAnchor)) {
  throw new Error("SLIDE ANCHOR NOT FOUND");
}

s = s.replace(
  slideAnchor,
  slideReplacement
);

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "✅ Results.jsx wired to CW-REC"
);
