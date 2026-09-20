import fs from "node:fs";

const path = "./src/routes/cwRecV1-dev.js";

let s = fs.readFileSync(path, "utf8");

const anchor = `        /*
        |--------------------------------------------------------------------------
        | FINAL USER-VISIBLE RESULTS
        |--------------------------------------------------------------------------
        */

        const finalRecommendations =
          scored.slice(
            0,
            limit
          );`;

if (!s.includes(anchor)) {
  throw new Error(
    "FINAL RECOMMENDATIONS ANCHOR NOT FOUND"
  );
}

const replacement = `        /*
        |--------------------------------------------------------------------------
        | DEDUPE USER-VISIBLE RECOMMENDATIONS
        |--------------------------------------------------------------------------
        |
        | Same college + same branch can appear more than once because multiple
        | cutoff rows may exist for quota/category/gender/source combinations.
        |
        | scored is already ordered by compareRecommendations(), so we keep the
        | first/best occurrence and discard later duplicates.
        |--------------------------------------------------------------------------
        */

        const dedupedRecommendations = [];
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
            \`\${collegeKey}::\${branchKey}\`;

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


        /*
        |--------------------------------------------------------------------------
        | FINAL USER-VISIBLE RESULTS
        |--------------------------------------------------------------------------
        */

        const finalRecommendations =
          dedupedRecommendations.slice(
            0,
            limit
          );`;

s = s.replace(
  anchor,
  replacement
);

fs.writeFileSync(
  path,
  s,
  "utf8"
);

console.log(
  "SUCCESS: recommendation dedupe added"
);
