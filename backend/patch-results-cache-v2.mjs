import fs from "node:fs";

const path = "./src/routes/counselling.js";
let text = fs.readFileSync(path, "utf8");

if (text.includes("RESULTS_CACHE_TTL_MS")) {
  throw new Error("Cache already present. Aborting.");
}

/* -------------------------------------------------------
   1. CACHE HELPERS
------------------------------------------------------- */

const routerMarker = "const router = Router();";

const helpers = `

const RESULTS_CACHE_TTL_MS = 60 * 1000;
const RESULTS_CACHE_MAX_ENTRIES = 200;

const resultsCache = new Map();

function makeResultsCacheKey(values) {
  return [
    values.examId,
    values.rank,
    values.year,
    values.round,
    values.category,
    values.requestedQuota || '',
    values.requestedGender || '',
    values.homeState || '',
  ].join('|');
}

function readResultsCache(key) {
  const entry = resultsCache.get(key);

  if (!entry) return null;

  if (
    Date.now() - entry.createdAt >
    RESULTS_CACHE_TTL_MS
  ) {
    resultsCache.delete(key);
    return null;
  }

  return entry.payload;
}

function writeResultsCache(key, payload) {
  if (
    resultsCache.size >=
    RESULTS_CACHE_MAX_ENTRIES
  ) {
    const firstKey =
      resultsCache.keys().next().value;

    if (firstKey !== undefined) {
      resultsCache.delete(firstKey);
    }
  }

  resultsCache.set(key, {
    createdAt: Date.now(),
    payload,
  });
}
`;

if (!text.includes(routerMarker)) {
  throw new Error("Router marker missing.");
}

text = text.replace(
  routerMarker,
  routerMarker + helpers
);

/* -------------------------------------------------------
   2. CACHE LOOKUP BEFORE SQL PARAMS
------------------------------------------------------- */

const paramsMarker = `
      const params = [
        rank,       // $1
        year,       // $2
        round,      // $3
        category,   // $4
      ];`;

const paramsIndex =
  text.indexOf(paramsMarker);

if (paramsIndex < 0) {
  throw new Error("Exact params block not found.");
}

const cacheLookup = `
      const resultsCacheKey =
        makeResultsCacheKey({
          examId,
          rank,
          year,
          round,
          category,
          requestedQuota,
          requestedGender,
          homeState,
        });

      const cachedPayload =
        readResultsCache(
          resultsCacheKey
        );

      if (cachedPayload) {
        return res.json(
          cachedPayload
        );
      }

`;

text =
  text.slice(0, paramsIndex) +
  cacheLookup +
  text.slice(paramsIndex);

/* -------------------------------------------------------
   3. FINAL /results RESPONSE
------------------------------------------------------- */

const responseMarker = `
      res.json({

        data:
          finalRows,`;

const responseIndex =
  text.lastIndexOf(
    responseMarker
  );

if (responseIndex < 0) {
  throw new Error(
    "Final results response not found."
  );
}

const catchMarker = `
    } catch (error) {`;

const catchIndex =
  text.indexOf(
    catchMarker,
    responseIndex
  );

if (catchIndex < 0) {
  throw new Error(
    "Results catch block not found."
  );
}

let responseBlock =
  text.slice(
    responseIndex,
    catchIndex
  );

const closingIndex =
  responseBlock.lastIndexOf(
    "      });"
  );

if (closingIndex < 0) {
  throw new Error(
    "Final res.json closing not found."
  );
}

responseBlock =
  responseBlock.slice(
    0,
    closingIndex
  )
  .replace(
    "      res.json({",
    "      const responsePayload = {"
  ) +
  `      };

      writeResultsCache(
        resultsCacheKey,
        responsePayload
      );

      res.json(
        responsePayload
      );
`;

text =
  text.slice(0, responseIndex) +
  responseBlock +
  text.slice(catchIndex);

fs.writeFileSync(
  path,
  text,
  "utf8"
);

console.log(
  "✅ 60-second results cache installed"
);
