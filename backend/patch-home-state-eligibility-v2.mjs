import fs from "node:fs";

const file =
  "./src/routes/counselling.js";

let source =
  fs.readFileSync(
    file,
    "utf8"
  );


/*
|--------------------------------------------------------------------------
| Find QUOTA section
|--------------------------------------------------------------------------
*/

const quotaLabelIndex =
  source.indexOf(
    "| QUOTA"
  );

if (
  quotaLabelIndex === -1
) {
  throw new Error(
    "QUOTA section label not found."
  );
}


const quotaBlockStart =
  source.lastIndexOf(
    "/*",
    quotaLabelIndex
  );

if (
  quotaBlockStart === -1
) {
  throw new Error(
    "Could not find start of QUOTA comment."
  );
}


/*
|--------------------------------------------------------------------------
| Find next ORDER section
|--------------------------------------------------------------------------
*/

const orderLabelIndex =
  source.indexOf(
    "| ORDER",
    quotaLabelIndex
  );

if (
  orderLabelIndex === -1
) {
  throw new Error(
    "ORDER section after QUOTA was not found."
  );
}


const orderBlockStart =
  source.lastIndexOf(
    "/*",
    orderLabelIndex
  );

if (
  orderBlockStart === -1 ||
  orderBlockStart <=
    quotaBlockStart
) {
  throw new Error(
    "Could not determine QUOTA block boundaries."
  );
}


/*
|--------------------------------------------------------------------------
| Replacement
|--------------------------------------------------------------------------
*/

const newQuotaBlock = `/*
      |--------------------------------------------------------------------------
      | QUOTA / HOME STATE ELIGIBILITY
      |--------------------------------------------------------------------------
      |
      | Priority:
      |
      | 1. Explicit quota wins.
      |
      | 2. Otherwise for JEE Main:
      |
      |    AI:
      |      valid regardless of home state.
      |
      |    HS:
      |      college state must match student's home state.
      |
      |    OS:
      |      college state must differ from student's home state.
      |
      | Special quota codes are NOT guessed automatically.
      |
      */

      if (
        requestedQuota
      ) {
        params.push(
          requestedQuota
        );

        const quotaParam =
          \`$\${paramIndex++}\`;

        query += \`
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


      `;


/*
|--------------------------------------------------------------------------
| Replace only QUOTA section
|--------------------------------------------------------------------------
*/

source =
  source.slice(
    0,
    quotaBlockStart
  ) +
  newQuotaBlock +
  source.slice(
    orderBlockStart
  );


/*
|--------------------------------------------------------------------------
| Safety checks
|--------------------------------------------------------------------------
*/

if (
  !source.includes(
    "QUOTA / HOME STATE ELIGIBILITY"
  )
) {
  throw new Error(
    "New Home State block was not inserted."
  );
}

if (
  !source.includes(
    "const homeStateParam"
  )
) {
  throw new Error(
    "homeStateParam logic missing after patch."
  );
}

if (
  !source.includes(
    "AND co.gender IN"
  ) ||
  !source.includes(
    "'Gender-Neutral'"
  )
) {
  throw new Error(
    "Existing gender logic appears missing. Aborting."
  );
}


fs.writeFileSync(
  file,
  source,
  "utf8"
);

console.log(
  "Home State eligibility V2 patch complete."
);
