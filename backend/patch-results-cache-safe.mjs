import fs from "node:fs";

const path = "./src/routes/counselling.js";

let text = fs.readFileSync(path, "utf8");

if (text.includes("RESULTS_CACHE_TTL_MS")) {
  throw new Error("Results cache already exists. Aborting.");
}

/*
|--------------------------------------------------------------------------
| CACHE HELPERS
|--------------------------------------------------------------------------
*/

const routerMarker =
  "const router = Router();";

if (!text.includes(routerMarker)) {
  throw new Error("Router marker not found.");
}

const helpers = `

const RESULTS_CACHE_TTL_MS = 60 * 1000;
const RESULTS_CACHE_MAX_ENTRIES = 200;

const resultsCache = new Map();

function getResultsCacheKey({
  examId,
  rank,
  year,
  round,
  category,
  requestedQuota,
  requestedGender,
  homeState,
}) {
  return [
    examId,
    rank,
    year,
    round,
    category,
    requestedQuota || '',
    requestedGender || '',
    homeState || '',
  ].join('|');
}

function getCachedResults(key) {
  const entry =
    resultsCache.get(key);

  if (!entry) {
    return null;
  }

  if (
    Date.now() - entry.createdAt >
    RESULTS_CACHE_TTL_MS
  ) {
    resultsCache.delete(key);
    return null;
  }

  // Refresh insertion order.
  resultsCache.delete(key);
  resultsCache.set(key, entry);

  return entry.payload;
}

function setCachedResults(
  key,
  payload
) {
  if (resultsCache.has(key)) {
    resultsCache.delete(key);
  }

  while (
    resultsCache.size >=
    RESULTS_CACHE_MAX_ENTRIES
  ) {
    const oldestKey =
      resultsCache.keys().next().value;

    if (
      oldestKey === undefined
    ) {
      break;
    }

    resultsCache.delete(
      oldestKey
    );
  }

  resultsCache.set(
    key,
    {
      createdAt: Date.now(),
      payload,
    }
  );
}
`;

text = text.replace(
  routerMarker,
  routerMarker + helpers
);

/*
|--------------------------------------------------------------------------
| CACHE LOOKUP
|--------------------------------------------------------------------------
*/

const paramsRegex =
  /(\s+const params\s*=\s*\[\s*rank,\s*\/\/ \$1\s*year,\s*\/\/ \$2\s*round,\s*\/\/ \$3\s*category,\s*\/\/ \$4\s*\];)/m;

const paramsMatch =
  text.match(paramsRegex);

if (!paramsMatch) {
  throw new Error(
    "SQL params block not found."
  );
}

const cacheLookup = `

      const resultsCacheKey =
        getResultsCacheKey({
          examId,
          rank,
          year,
          round,
          category,
          requestedQuota,
          requestedGender,
          homeState,
        });

      const cachedResults =
        getCachedResults(
          resultsCacheKey
        );

      if (cachedResults) {
        return res.json(
          cachedResults
        );
      }
`;

text = text.replace(
  paramsRegex,
  cacheLookup + paramsMatch[1]
);

/*
|--------------------------------------------------------------------------
| CACHE FINAL RESPONSE
|--------------------------------------------------------------------------
|
| Replace only the LAST res.json() inside /results.
|--------------------------------------------------------------------------
*/

const responseStart =
  text.lastIndexOf(
    "      res.json({"
  );

if (responseStart < 0) {
  throw new Error(
    "Final results res.json block not found."
  );
}

const catchMarker =
  "\n    } catch (error) {";

const catchIndex =
  text.indexOf(
    catchMarker,
    responseStart
  );

if (catchIndex < 0) {
  throw new Error(
    "Results catch block not found."
  );
}

const responseSection =
  text.slice(
    responseStart,
    catchIndex
  );

if (
  !responseSection.trimEnd().endsWith(
    "});"
  )
) {
  throw new Error(
    "Unexpected final response structure."
  );
}

const payloadSection =
  responseSection
    .replace(
      "      res.json({",
      "      const responsePayload = {"
    )
    .replace(
      /\}\);\s*$/,
      `};

      setCachedResults(
        resultsCacheKey,
        responsePayload
      );

      res.json(
        responsePayload
      );
`
    );

text =
  text.slice(
    0,
    responseStart
  ) +
  payloadSection +
  text.slice(
    catchIndex
  );

fs.writeFileSync(
  path,
  text,
  "utf8"
);

console.log(
  "✅ Results cache added safely"
);
