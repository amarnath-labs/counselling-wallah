import fs from "node:fs";

const path = "./src/routes/counselling.js";
let lines = fs.readFileSync(path, "utf8").split(/\r?\n/);

if (lines.some(line => line.includes("RESULTS_CACHE_TTL_MS"))) {
  throw new Error("Cache already exists. Aborting.");
}

/*
|--------------------------------------------------------------------------
| 1. CACHE HELPERS
|--------------------------------------------------------------------------
*/

const routerIndex =
  lines.findIndex(
    line =>
      line.trim() ===
      "const router = Router();"
  );

if (routerIndex < 0) {
  throw new Error("Router marker not found.");
}

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
  if (resultsCache.has(key)) {
    resultsCache.delete(key);
  }

  while (
    resultsCache.size >=
    RESULTS_CACHE_MAX_ENTRIES
  ) {
    const oldestKey =
      resultsCache.keys().next().value;

    if (oldestKey === undefined) {
      break;
    }

    resultsCache.delete(oldestKey);
  }

  resultsCache.set(key, {
    createdAt: Date.now(),
    payload,
  });
}
`.split("\n");

lines.splice(
  routerIndex + 1,
  0,
  ...helpers
);

/*
|--------------------------------------------------------------------------
| 2. CACHE LOOKUP BEFORE const params
|--------------------------------------------------------------------------
*/

const paramsIndex =
  lines.findIndex(
    line =>
      line.trim() ===
      "const params = ["
  );

if (paramsIndex < 0) {
  throw new Error(
    "const params block not found."
  );
}

const lookup = `      const resultsCacheKey =
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

`.split("\n");

lines.splice(
  paramsIndex,
  0,
  ...lookup
);

/*
|--------------------------------------------------------------------------
| 3. FIND FINAL RESULTS res.json
|--------------------------------------------------------------------------
*/

let responseStart = -1;

for (
  let i = lines.length - 1;
  i >= 0;
  i--
) {
  if (
    lines[i].trim() ===
    "res.json({"
  ) {
    responseStart = i;
    break;
  }
}

if (responseStart < 0) {
  throw new Error(
    "Final res.json not found."
  );
}

/*
|--------------------------------------------------------------------------
| Find matching closing }); before catch(error)
|--------------------------------------------------------------------------
*/

let responseEnd = -1;

for (
  let i = responseStart + 1;
  i < lines.length;
  i++
) {
  if (
    lines[i].trim() ===
    "});"
  ) {
    responseEnd = i;
  }

  if (
    lines[i].includes(
      "} catch (error)"
    )
  ) {
    break;
  }
}

if (responseEnd < 0) {
  throw new Error(
    "Final res.json closing not found."
  );
}

lines[responseStart] =
  lines[responseStart].replace(
    "res.json({",
    "const responsePayload = {"
  );

lines[responseEnd] =
  lines[responseEnd].replace(
    "});",
    "};"
  );

const responseTail = `
      writeResultsCache(
        resultsCacheKey,
        responsePayload
      );

      res.json(
        responsePayload
      );`.split("\n");

lines.splice(
  responseEnd + 1,
  0,
  ...responseTail
);

fs.writeFileSync(
  path,
  lines.join("\n"),
  "utf8"
);

console.log(
  "✅ Results cache installed"
);
