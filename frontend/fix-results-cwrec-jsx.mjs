import fs from "node:fs";

const path = "./src/pages/Results.jsx";
let s = fs.readFileSync(path, "utf8");

const start = s.indexOf(
  "{recommendationLoading &&"
);

const slide = s.indexOf(
  "<RecommendationSlide",
  start
);

if (
  start === -1 ||
  slide === -1
) {
  throw new Error(
    "BROKEN RECOMMENDATION BLOCK NOT FOUND"
  );
}

const replacement = `<>
                      {recommendationLoading &&
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
  s.slice(0, start) +
  replacement +
  s.slice(slide);

const afterSlide = s.indexOf(
  "/>",
  s.indexOf(
    "<RecommendationSlide",
    start
  )
);

if (afterSlide === -1) {
  throw new Error(
    "RecommendationSlide END NOT FOUND"
  );
}

const closeAt =
  afterSlide + 2;

s =
  s.slice(0, closeAt) +
  "\n                    </>" +
  s.slice(closeAt);

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "SUCCESS: JSX block repaired"
);
