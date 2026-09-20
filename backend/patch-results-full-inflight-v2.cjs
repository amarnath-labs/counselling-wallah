const fs = require("fs");

const file = "./src/routes/counselling.js";
let s = fs.readFileSync(file, "utf8");

if (s.includes("let payloadPromise =")) {
  console.log("Full in-flight dedupe already added.");
  process.exit(0);
}

const startNeedle =
  "let queryPromise =";

const responseNeedle =
  "res.json(\n        responsePayload\n      );";

const start =
  s.indexOf(startNeedle);

if (start === -1) {
  throw new Error("queryPromise start not found");
}

const responseStart =
  s.indexOf(
    responseNeedle,
    start
  );

if (responseStart === -1) {
  throw new Error("responsePayload end not found");
}

const end =
  responseStart +
  responseNeedle.length;

const replacement = `let payloadPromise =
        resultsInFlight.get(
          resultsCacheKey
        );

      if (!payloadPromise) {
        payloadPromise =
          (async () => {
            const queryResult =
              await pool.query(
                query,
                params
              );

            const { rows } =
              queryResult;

            console.log(
              '[COUNSELLING] DB rows:',
              rows.length
            );

            const seen =
              new Set();

            const uniqueRows =
              rows.filter(
                (row) => {
                  const key = [
                    row.college_id,
                    row.branch_id,
                    row.year,
                    row.round,
                    row.category,
                    row.quota,
                    row.gender,
                  ].join('|');

                  if (
                    seen.has(key)
                  ) {
                    return false;
                  }

                  seen.add(key);

                  return true;
                }
              );

            let finalRows =
              uniqueRows;

            if (
              examId === 'jee-main'
            ) {
              finalRows =
                uniqueRows.filter(
                  (row) =>
                    isJeeMainInstitute(
                      row.college_name,
                      row.type
                    )
                );
            }

            const responsePayload = {
              data:
                finalRows,

              meta: {
                examId,
                rank,
                year,
                round,
                category,

                quota:
                  requestedQuota,

                gender:
                  requestedGender,

                homeState,

                count:
                  finalRows.length,
              },
            };

            writeResultsCache(
              resultsCacheKey,
              responsePayload
            );

            return responsePayload;
          })();

        resultsInFlight.set(
          resultsCacheKey,
          payloadPromise
        );
      }

      let responsePayload;

      try {
        responsePayload =
          await payloadPromise;
      } finally {
        if (
          resultsInFlight.get(
            resultsCacheKey
          ) === payloadPromise
        ) {
          resultsInFlight.delete(
            resultsCacheKey
          );
        }
      }

      return res.json(
        responsePayload
      );`;

s =
  s.slice(0, start) +
  replacement +
  s.slice(end);

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Full results in-flight dedupe added."
);
