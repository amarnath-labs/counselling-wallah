import fs from "node:fs";

const path = "./src/pages/Results.jsx";

if (!fs.existsSync(path)) {
  throw new Error("Results.jsx NOT FOUND");
}

if (
  !fs.existsSync(
    "./src/services/cwRecRecommendationService.js"
  )
) {
  throw new Error(
    "cwRecRecommendationService.js NOT FOUND"
  );
}

let s = fs.readFileSync(path, "utf8");


/* =========================================================
   1. CW-REC IMPORT
========================================================= */

if (
  !s.includes(
    "cwRecRecommendationService"
  )
) {
  const anchor =
    "} from '../services/recommendationService';";

  const index =
    s.indexOf(anchor);

  if (index === -1) {
    throw new Error(
      "recommendationService import NOT FOUND"
    );
  }

  const insertAt =
    index + anchor.length;

  const addition = `

import {
  fetchCWRecommendations,
} from '../services/cwRecRecommendationService';`;

  s =
    s.slice(0, insertAt) +
    addition +
    s.slice(insertAt);
}


/* =========================================================
   2. CW-REC STATE
========================================================= */

if (
  !s.includes(
    "const [\n    recommendationRows,"
  )
) {
  const anchor =
    "const hasRecommendationAccess =";

  const index =
    s.indexOf(anchor);

  if (index === -1) {
    throw new Error(
      "hasRecommendationAccess NOT FOUND"
    );
  }

  const addition = `const [
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
  ] = useState(null);

  `;

  s =
    s.slice(0, index) +
    addition +
    s.slice(index);
}


/* =========================================================
   3. CW-REC FETCH EFFECT
========================================================= */

if (
  !s.includes(
    "[CW-REC FRONTEND LOAD]"
  )
) {
  const anchor =
    "const safeResults =";

  const index =
    s.indexOf(anchor);

  if (index === -1) {
    throw new Error(
      "safeResults NOT FOUND"
    );
  }

  const addition = `useEffect(
    () => {
      let cancelled = false;

      async function loadCWRecommendations() {
        if (
          activeView !== 'recommendation' ||
          accessLoading ||
          !hasRecommendationAccess ||
          !profile?.rank
        ) {
          return;
        }

        try {
          setRecommendationLoading(true);
          setRecommendationError(null);

          console.log(
            '[CW-REC FRONTEND LOAD]'
          );

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
            Array.isArray(
              response?.data
            )
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

      loadCWRecommendations();

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

  `;

  s =
    s.slice(0, index) +
    addition +
    s.slice(index);
}


/* =========================================================
   4. RecommendationSlide MUST USE CW-REC ROWS
========================================================= */

const slideIndex =
  s.indexOf(
    "<RecommendationSlide"
  );

if (slideIndex === -1) {
  throw new Error(
    "RecommendationSlide NOT FOUND"
  );
}

const normalRowsIndex =
  s.indexOf(
    "rows={rows}",
    slideIndex
  );

if (normalRowsIndex !== -1) {
  s =
    s.slice(
      0,
      normalRowsIndex
    ) +
    "rows={recommendationRows}" +
    s.slice(
      normalRowsIndex +
        "rows={rows}".length
    );
}


/* =========================================================
   5. LOADING + ERROR UI
========================================================= */

if (
  !s.includes(
    "Loading personalized recommendations..."
  )
) {
  const slideIndex2 =
    s.indexOf(
      "<RecommendationSlide"
    );

  const addition = `{recommendationLoading &&
                        hasRecommendationAccess && (
                        <div className="source-note">
                          Loading personalized recommendations...
                        </div>
                      )}

                      {recommendationError &&
                        hasRecommendationAccess && (
                        <div className="source-note">
                          {recommendationError}
                        </div>
                      )}

                      `;

  s =
    s.slice(0, slideIndex2) +
    addition +
    s.slice(slideIndex2);
}


/* =========================================================
   SAVE
========================================================= */

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "SUCCESS: Results.jsx wired to CW-REC"
);
