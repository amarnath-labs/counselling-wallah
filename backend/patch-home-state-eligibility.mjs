import fs from "node:fs";

const file =
  "./src/routes/counselling.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );

const marker = `      /*
      |--------------------------------------------------------------------------
      | QUOTA
      |--------------------------------------------------------------------------
      */

      if (
        requestedQuota
      ) {`;

if (
  !source.includes(marker)
) {
  throw new Error(
    "Could not find QUOTA block."
  );
}

const replacement = `      /*
      |--------------------------------------------------------------------------
      | QUOTA / HOME STATE ELIGIBILITY
      |--------------------------------------------------------------------------
      |
      | Priority:
      |
      | 1. If quota explicitly supplied, use it exactly.
      |
      | 2. Otherwise for JEE Main:
      |
      |    AI -> always valid
      |
      |    HS -> college state must equal student's home state
      |
      |    OS -> college state must differ from student's home state
      |
      | Special quota codes such as GO / JK / LA are not guessed here.
      | They remain available only through explicit quota selection.
      |
      */

      if (
        requestedQuota
      ) {`;

source =
  source.replace(
    marker,
    replacement
  );

const quotaBlockEnd = `        query += \`
          AND co.quota =
            \${quotaParam}
        \`;
      }


      /*
      |--------------------------------------------------------------------------
      | ORDER`;

if (
  !source.includes(
    quotaBlockEnd
  )
) {
  throw new Error(
    "Could not locate end of QUOTA block."
  );
}

const homeStateLogic = `        query += \`
          AND co.quota =
            \${quotaParam}
        \`;
      }

      else if (
        examId === 'jee-main' &&
        homeState
      ) {
        params.push(
          homeState
        );

        const homeStateParam =
          \`$\${paramIndex++}\`;

        query += \`
          AND (
            UPPER(
              TRIM(co.quota)
            ) = 'AI'

            OR (
              UPPER(
                TRIM(co.quota)
              ) = 'HS'

              AND LOWER(
                TRIM(c.state)
              ) = LOWER(
                TRIM(
                  \${homeStateParam}
                )
              )
            )

            OR (
              UPPER(
                TRIM(co.quota)
              ) = 'OS'

              AND LOWER(
                TRIM(c.state)
              ) <> LOWER(
                TRIM(
                  \${homeStateParam}
                )
              )
            )
          )
        \`;
      }


      /*
      |--------------------------------------------------------------------------
      | ORDER`;

source =
  source.replace(
    quotaBlockEnd,
    homeStateLogic
  );

fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Home State eligibility patch complete."
);
