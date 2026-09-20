const fs = require("fs");

const file = "./src/routes/counselling.js";
let s = fs.readFileSync(file, "utf8");

const startMarker = `
      let queryPromise =
        resultsInFlight.get(
          resultsCacheKey
        );
`;

const endMarker = `
      res.json(
        responsePayload
      );
`;

const start = s.indexOf(startMarker);
const end = s.indexOf(endMarker, start);

if (start === -1 || end === -1) {
  throw new Error("Target results block not found");
}

const endPos =
  end + endMarker.length;

const replacement = `
      let payloadPromise =
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

            /*
            |--------------------------------------------------------------------------
            | REMOVE DUPLICATES
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | FINAL JEE MAIN SAFETY FILTER
            |--------------------------------------------------------------------------
            */

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

            /*
            |--------------------------------------------------------------------------
            | RESPONSE
            |--------------------------------------------------------------------------
            */

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
      );
`;

s =
  s.slice(0, start) +
  replacement +
  s.slice(endPos);

fs.writeFileSync(
  file,
  s,
  "utf8"
);

console.log(
  "Full results in-flight dedupe added."
);
