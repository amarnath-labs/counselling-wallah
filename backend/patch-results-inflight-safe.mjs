import fs from "node:fs";

const path = "./src/routes/counselling.js";
let text = fs.readFileSync(path, "utf8");

if (text.includes("const resultsInFlight = new Map();")) {
  throw new Error("In-flight map already exists.");
}

text = text.replace(
  "const resultsCache = new Map();",
  `const resultsCache = new Map();
const resultsInFlight = new Map();`
);

const marker =
  "      console.log(\n        '[COUNSELLING] Query params:'";

const start =
  text.indexOf(marker);

if (start < 0) {
  throw new Error(
    "COUNSELLING results query marker not found."
  );
}

const oldQuery = `      const { rows } =
        await pool.query(
          query,
          params
        );`;

const queryIndex =
  text.indexOf(
    oldQuery,
    start
  );

if (queryIndex < 0) {
  throw new Error(
    "Results pool.query block not found."
  );
}

const replacement = `      let queryPromise =
        resultsInFlight.get(
          resultsCacheKey
        );

      if (!queryPromise) {
        queryPromise =
          pool.query(
            query,
            params
          );

        resultsInFlight.set(
          resultsCacheKey,
          queryPromise
        );
      }

      let queryResult;

      try {
        queryResult =
          await queryPromise;
      } finally {
        if (
          resultsInFlight.get(
            resultsCacheKey
          ) === queryPromise
        ) {
          resultsInFlight.delete(
            resultsCacheKey
          );
        }
      }

      const { rows } =
        queryResult;`;

text =
  text.slice(0, queryIndex) +
  replacement +
  text.slice(
    queryIndex + oldQuery.length
  );

fs.writeFileSync(
  path,
  text,
  "utf8"
);

console.log(
  "✅ In-flight dedupe added only to /results"
);
