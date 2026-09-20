import fs from "node:fs";

const path = "./src/pages/Results.jsx";
let s = fs.readFileSync(path, "utf8");

/* =========================================================
   1. IMPORT
========================================================= */

if (
  !s.includes(
    "../services/cwRecRecommendationService"
  )
) {
  const marker =
    "import { BRANCH_LIST,";

  const index =
    s.indexOf(marker);

  if (index === -1) {
    throw new Error(
      "RESULTS IMPORT AREA NOT FOUND"
    );
  }

  const insert = `import {
  fetchCWRecommendations,
} from '../services/cwRecRecommendationService';

`;

  s =
    s.slice(0, index) +
    insert +
    s.slice(index);
}


/* =========================================================
   2. STATE
========================================================= */

if (
  !s.includes(
    "recommendationRows"
  )
) {
  const marker =
    "const hasRecommendationAccess =";

  const index =
    s.indexOf(marker);

  if (index === -1) {
    throw new Error(
      "ACCESS MARKER NOT FOUND"
    );
  }

  const insert = `const [
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
    insert +
    s.slice(index);
}


/* =========================================================
   3. FETCH EFFECT
========================================================= */

if (
  !s.includes(
    "[CW-REC FRONTEND LOAD]"
  )
) {
  const marker =
    "const safeResults =";

  const index =
    s.indexOf(marker);

  if (index === -1) {
    throw new Error(
      "SAFE RESULTS MARKER NOT FOUND"
    );
  }

  const insert = `useEffect(
    () => {
      let cancelled = false;

      async function loadCWRec() {
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

      loadCWRec();

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
    insert +
    s.slice(index);
}


/* =========================================================
   4. REPLACE RecommendationSlide rows={rows}
========================================================= */

const oldRows =
  "rows={rows}";

if (
  s.includes(oldRows)
) {
  const recommendationSectionIndex =
    s.indexOf(
      "<RecommendationSlide"
    );

  if (
    recommendationSectionIndex === -1
  ) {
    throw new Error(
      "RECOMMENDATION SLIDE NOT FOUND"
    );
  }

  const rowsIndex =
    s.indexOf(
      oldRows,
      recommendationSectionIndex
    );

  if (
    rowsIndex === -1
  ) {
    throw new Error(
      "RECOMMENDATION ROW PROP NOT FOUND"
    );
  }

  s =
    s.slice(0, rowsIndex) +
    "rows={recommendationRows}" +
    s.slice(
      rowsIndex +
      oldRows.length
    );
}


/* =========================================================
   5. ADD LOADING / ERROR BEFORE SLIDE
========================================================= */

if (
  !s.includes(
    "Loading personalized recommendations..."
  )
) {
  const marker =
    "<RecommendationSlide";

  const index =
    s.indexOf(marker);

  if (index === -1) {
    throw new Error(
      "SLIDE JSX NOT FOUND"
    );
  }

  const insert = `{recommendationLoading &&
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
    s.slice(0, index) +
    insert +
    s.slice(index);
}

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "Results.jsx CW-REC patch applied"
);
