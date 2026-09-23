import fs from "node:fs";

const resultsFile =
  "./src/pages/Results.jsx";

const paymentFile =
  "./src/pages/PaymentResult.jsx";


function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing file: ${file}`
    );
  }

  return fs.readFileSync(
    file,
    "utf8"
  );
}


let results =
  read(resultsFile);

let payment =
  read(paymentFile);


fs.copyFileSync(
  resultsFile,
  resultsFile +
    ".before-direct-choice-payment-v2.jsx"
);

fs.copyFileSync(
  paymentFile,
  paymentFile +
    ".before-direct-choice-payment-v2.jsx"
);


/*
|--------------------------------------------------------------------------
| HELPER — FIND END OF FUNCTION CALL
|--------------------------------------------------------------------------
*/

function findCallEnd(
  source,
  callStart
) {
  const open =
    source.indexOf(
      "(",
      callStart
    );

  if (open === -1) {
    return -1;
  }

  let depth = 0;
  let quote = null;
  let escaped = false;

  for (
    let i = open;
    i < source.length;
    i++
  ) {
    const ch = source[i];

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (ch === "\\") {
        escaped = true;
        continue;
      }

      if (ch === quote) {
        quote = null;
      }

      continue;
    }

    if (
      ch === "'" ||
      ch === '"' ||
      ch === "`"
    ) {
      quote = ch;
      continue;
    }

    if (ch === "(") {
      depth++;
      continue;
    }

    if (ch === ")") {
      depth--;

      if (depth === 0) {
        let end = i + 1;

        while (
          /\s/.test(
            source[end] || ""
          )
        ) {
          end++;
        }

        if (
          source[end] === ";"
        ) {
          end++;
        }

        return end;
      }
    }
  }

  return -1;
}


/*
|--------------------------------------------------------------------------
| RESULTS.JSX
| 1. ADD startCashfreeCheckout TO EXISTING paymentService IMPORT
|--------------------------------------------------------------------------
*/

if (
  !results.includes(
    "startCashfreeCheckout"
  )
) {
  const importRegex =
    /import\s*\{([\s\S]*?)\}\s*from\s*['"]\.\.\/services\/paymentService['"];/m;

  const match =
    results.match(
      importRegex
    );

  if (!match) {
    throw new Error(
      "paymentService import not found in Results.jsx"
    );
  }

  const currentNames =
    match[1];

  const newImport =
`import {
${currentNames.trimEnd()}
  startCashfreeCheckout,
} from '../services/paymentService';`;

  results =
    results.replace(
      match[0],
      newImport
    );
}


/*
|--------------------------------------------------------------------------
| 2. OPEN choice-plan AUTOMATICALLY WHEN ?view=choice-plan
|--------------------------------------------------------------------------
|
| No useSearchParams dependency needed.
|
*/

if (
  !results.includes(
    "TRUMARG CHOICE VIEW RESTORE"
  )
) {
  const activeRegex =
    /const\s*\[\s*activeView\s*,\s*setActiveView\s*,?\s*\]\s*=\s*useState\s*\(\s*['"]search['"]\s*\)\s*;/m;

  if (
    !activeRegex.test(
      results
    )
  ) {
    throw new Error(
      "activeView useState('search') block not found"
    );
  }

  results =
    results.replace(
      activeRegex,
`/* TRUMARG CHOICE VIEW RESTORE */
  const [
    activeView,
    setActiveView,
  ] = useState(() => {
    const requestedView =
      new URLSearchParams(
        window.location.search
      ).get('view');

    return requestedView ===
      'choice-plan'
        ? 'choice-plan'
        : 'search';
  });`
    );
}


/*
|--------------------------------------------------------------------------
| 3. DIRECT PAYMENT FROM ChoiceFillingPlan
|--------------------------------------------------------------------------
*/

if (
  !results.includes(
    "TRUMARG DIRECT CHOICE PAYMENT"
  )
) {
  const componentStart =
    results.indexOf(
      "<ChoiceFillingPlan"
    );

  if (
    componentStart === -1
  ) {
    throw new Error(
      "ChoiceFillingPlan render not found"
    );
  }

  const componentEnd =
    results.indexOf(
      "/>",
      componentStart
    );

  if (
    componentEnd === -1
  ) {
    throw new Error(
      "ChoiceFillingPlan closing /> not found"
    );
  }

  let block =
    results.slice(
      componentStart,
      componentEnd + 2
    );

  const unlockStart =
    block.indexOf(
      "onUnlock="
    );

  if (
    unlockStart === -1
  ) {
    throw new Error(
      "ChoiceFillingPlan onUnlock prop not found"
    );
  }

  const loginStart =
    block.indexOf(
      "onLogin=",
      unlockStart
    );

  if (
    loginStart === -1
  ) {
    throw new Error(
      "ChoiceFillingPlan onLogin prop not found"
    );
  }

  const beforeUnlock =
    block.slice(
      0,
      unlockStart
    );

  const afterUnlock =
    block.slice(
      loginStart
    );

  const directUnlock =
`{/* TRUMARG DIRECT CHOICE PAYMENT */}
                    onUnlock={async () => {
                      if (!user) {
                        nav(
                          '/login?redirect=' +
                          encodeURIComponent(
                            '/results?view=choice-plan'
                          )
                        );

                        return;
                      }

                      try {
                        sessionStorage.setItem(
                          'trumarg-payment-return',
                          '/results?view=choice-plan'
                        );

                        await startCashfreeCheckout(
                          'choice-plan'
                        );
                      } catch (error) {
                        console.error(
                          '[CHOICE PLAN PAYMENT ERROR]',
                          error
                        );

                        window.alert(
                          error?.message ||
                          'Unable to start payment. Please try again.'
                        );
                      }
                    }}

                    `;

  block =
    beforeUnlock +
    directUnlock +
    afterUnlock;

  results =
    results.slice(
      0,
      componentStart
    ) +
    block +
    results.slice(
      componentEnd + 2
    );
}


/*
|--------------------------------------------------------------------------
| PAYMENTRESULT.JSX
| 4. AFTER VERIFIED ACCESS, RETURN DIRECTLY TO CHOICE PLAN
|--------------------------------------------------------------------------
*/

if (
  !payment.includes(
    "TRUMARG VERIFIED CHOICE RETURN"
  )
) {
  const eventText =
    "'cw-payment-access-updated'";

  const eventIndex =
    payment.indexOf(
      eventText
    );

  if (
    eventIndex === -1
  ) {
    throw new Error(
      "cw-payment-access-updated event not found in PaymentResult.jsx"
    );
  }

  const dispatchStart =
    payment.lastIndexOf(
      "window.dispatchEvent",
      eventIndex
    );

  if (
    dispatchStart === -1
  ) {
    throw new Error(
      "window.dispatchEvent call not found"
    );
  }

  const dispatchEnd =
    findCallEnd(
      payment,
      dispatchStart
    );

  if (
    dispatchEnd === -1
  ) {
    throw new Error(
      "Unable to determine dispatchEvent end"
    );
  }

  const returnCode =
`

          /*
          |--------------------------------------------------------------------------
          | TRUMARG VERIFIED CHOICE RETURN
          |--------------------------------------------------------------------------
          */

          if (
            normalizedAccess
              ?.choiceFillingPlan
          ) {
            const returnPath =
              sessionStorage.getItem(
                'trumarg-payment-return'
              ) ||
              '/results?view=choice-plan';

            sessionStorage.removeItem(
              'trumarg-payment-return'
            );

            window.location.replace(
              returnPath
            );

            return;
          }
`;

  payment =
    payment.slice(
      0,
      dispatchEnd
    ) +
    returnCode +
    payment.slice(
      dispatchEnd
    );
}


/*
|--------------------------------------------------------------------------
| VALIDATION — DO NOT WRITE IF SOMETHING IS WRONG
|--------------------------------------------------------------------------
*/

const resultsRequired = [
  "startCashfreeCheckout",
  "TRUMARG CHOICE VIEW RESTORE",
  "TRUMARG DIRECT CHOICE PAYMENT",
  "startCashfreeCheckout(",
  "'choice-plan'",
  "trumarg-payment-return",
];

for (
  const token of
  resultsRequired
) {
  if (
    !results.includes(
      token
    )
  ) {
    throw new Error(
      `Results validation failed: ${token}`
    );
  }
}


const paymentRequired = [
  "TRUMARG VERIFIED CHOICE RETURN",
  "normalizedAccess",
  "choiceFillingPlan",
  "window.location.replace",
  "/results?view=choice-plan",
];

for (
  const token of
  paymentRequired
) {
  if (
    !payment.includes(
      token
    )
  ) {
    throw new Error(
      `PaymentResult validation failed: ${token}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| WRITE ONLY AFTER ALL VALIDATION PASSES
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  resultsFile,
  results,
  "utf8"
);

fs.writeFileSync(
  paymentFile,
  payment,
  "utf8"
);


console.log("");
console.log(
  "=============================================="
);
console.log(
  "DIRECT CHOICE PAYMENT V2 COMPLETE"
);
console.log(
  "=============================================="
);
console.log(
  "₹999 button -> Cashfree directly"
);
console.log(
  "Payment -> backend verification"
);
console.log(
  "Verified choiceFillingPlan -> Results"
);
console.log(
  "Choice-Filling tab -> automatically opened"
);
