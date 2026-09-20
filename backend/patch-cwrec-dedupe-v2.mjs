import fs from "node:fs";

const path = "./src/routes/cwRecV1-dev.js";
let s = fs.readFileSync(path, "utf8");

if (
  s.includes(
    "const dedupedRecommendations = [];"
  )
) {
  console.log(
    "Dedupe already present"
  );
  process.exit(0);
}

const target =
  "const finalRecommendations =";

const targetIndex =
  s.indexOf(target);

if (targetIndex === -1) {
  throw new Error(
    "finalRecommendations NOT FOUND"
  );
}

const scoredSliceIndex =
  s.indexOf(
    "scored.slice(",
    targetIndex
  );

if (scoredSliceIndex === -1) {
  throw new Error(
    "scored.slice NOT FOUND"
  );
}

const dedupeBlock = `const dedupedRecommendations = [];
        const seenRecommendationKeys = new Set();

        for (const item of scored) {
          const collegeKey =
            String(
              item?.collegeId ||
              item?.collegeName ||
              ''
            )
              .trim()
              .toLowerCase();

          const branchKey =
            String(
              item?.branchId ||
              item?.branchName ||
              ''
            )
              .trim()
              .toLowerCase();

          const key =
            collegeKey + "::" + branchKey;

          if (
            !collegeKey ||
            !branchKey
          ) {
            dedupedRecommendations.push(
              item
            );
            continue;
          }

          if (
            seenRecommendationKeys.has(
              key
            )
          ) {
            continue;
          }

          seenRecommendationKeys.add(
            key
          );

          dedupedRecommendations.push(
            item
          );
        }

        `;

s =
  s.slice(0, targetIndex) +
  dedupeBlock +
  s.slice(targetIndex);

s = s.replace(
  "scored.slice(",
  "dedupedRecommendations.slice("
);

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "SUCCESS: CW-REC dedupe added"
);
