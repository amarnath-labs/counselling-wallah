import fs from "node:fs";

const resultsFile =
  "./src/pages/Results.jsx";

const paymentResultFile =
  "./src/pages/PaymentResult.jsx";

for (const file of [resultsFile, paymentResultFile]) {
  if (!fs.existsSync(file)) {
    throw new Error(
      `Missing file: ${file}`
    );
  }
}

let results =
  fs.readFileSync(
    resultsFile,
    "utf8"
  );

let paymentResult =
  fs.readFileSync(
    paymentResultFile,
    "utf8"
  );

fs.copyFileSync(
  resultsFile,
  resultsFile +
    ".before-direct-choice-payment.jsx"
);

fs.copyFileSync(
  paymentResultFile,
  paymentResultFile +
    ".before-choice-return.jsx"
);


/*
|--------------------------------------------------------------------------
| RESULTS.JSX
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| 1. IMPORT startCashfreeCheckout
|--------------------------------------------------------------------------
*/

if (
  !results.includes(
    "startCashfreeCheckout"
  )
) {
  results =
    results.replace(
`import {
  getMyPaymentAccess,
  normalizePaymentAccess,
} from '../services/paymentService';`,
`import {
  getMyPaymentAccess,
  normalizePaymentAccess,
  startCashfreeCheckout,
} from '../services/paymentService';`
    );
}


/*
|--------------------------------------------------------------------------
| 2. ADD useSearchParams IMPORT
|--------------------------------------------------------------------------
*/

if (
  !results.includes(
    "useSearchParams"
  )
) {
  results =
    results.replace(
`import {
  Link,
  useNavigate,
} from 'react-router-dom';`,
`import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';`
    );
}


/*
|--------------------------------------------------------------------------
| 3. CREATE searchParams
|--------------------------------------------------------------------------
*/

if (
  !results.includes(
    "const [searchParams] ="
  )
) {
  const navMarker =
`  const nav =
    useNavigate();`;

  if (
    !results.includes(
      navMarker
    )
  ) {
    throw new Error(
      "Results useNavigate block not found"
    );
  }

  results =
    results.replace(
      navMarker,
`${navMarker}

  const [searchParams] =
    useSearchParams();`
    );
}


/*
|--------------------------------------------------------------------------
| 4. RESTORE CHOICE PLAN TAB FROM QUERY PARAM
|--------------------------------------------------------------------------
*/

const activeViewRegex =
  /const\s*\[\s*activeView,\s*setActiveView,\s*\]\s*=\s*useState\(\s*['"]search['"]\s*\);/m;

if (
  activeViewRegex.test(
    results
  )
) {
  results =
    results.replace(
      activeViewRegex,
`const [
    activeView,
    setActiveView,
  ] = useState(
    searchParams.get('view') ===
      'choice-plan'
      ? 'choice-plan'
      : 'search'
  );`
    );
}


/*
|--------------------------------------------------------------------------
| 5. REPLACE CHOICE PLAN onUnlock
|--------------------------------------------------------------------------
*/

const oldUnlockRegex =
  /onUnlock=\{\(\)\s*=>\s*\{[\s\S]*?nav\(\s*['"]\/pricing['"]\s*\);[\s\S]*?\}\}/m;

if (
  !oldUnlockRegex.test(
    results
  )
) {
  throw new Error(
    "Choice plan onUnlock block pointing to /pricing not found"
  );
}

results =
  results.replace(
    oldUnlockRegex,
`onUnlock={async () => {
                      if (!user) {
                        nav(
                          '/login?redirect=/results?view=choice-plan'
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
                    }}`
  );


/*
|--------------------------------------------------------------------------
| PAYMENTRESULT.JSX
|--------------------------------------------------------------------------
*/


/*
|--------------------------------------------------------------------------
| 6. ADD useNavigate IMPORT
|--------------------------------------------------------------------------
*/

if (
  !paymentResult.includes(
    "useNavigate"
  )
) {
  paymentResult =
    paymentResult.replace(
`import {
  Link,
  useSearchParams,
} from 'react-router-dom';`,
`import {
  Link,
  useNavigate,
  useSearchParams,
} from 'react-router-dom';`
    );
}


/*
|--------------------------------------------------------------------------
| 7. CREATE nav
|--------------------------------------------------------------------------
*/

if (
  !paymentResult.includes(
    "const nav ="
  )
) {
  const orderMarker =
`  const orderId =
    searchParams.get(
      'order_id'
    ) ||
    searchParams.get(
      'orderId'
    ) ||
    '';`;

  if (
    !paymentResult.includes(
      orderMarker
    )
  ) {
    throw new Error(
      "PaymentResult orderId block not found"
    );
  }

  paymentResult =
    paymentResult.replace(
      orderMarker,
`${orderMarker}

  const nav =
    useNavigate();`
    );
}


/*
|--------------------------------------------------------------------------
| 8. REDIRECT AFTER VERIFIED CHOICE-PLAN ACCESS
|--------------------------------------------------------------------------
*/

if (
  !paymentResult.includes(
    "TRUMARG CHOICE PLAN VERIFIED RETURN"
  )
) {
  const eventMarker =
`          window.dispatchEvent(
            new CustomEvent(
              'cw-payment-access-updated',
              {
                detail:
                  normalizedAccess,
              }
            )
          );`;

  if (
    !paymentResult.includes(
      eventMarker
    )
  ) {
    throw new Error(
      "Payment access update event block not found"
    );
  }

  const returnBlock =
`${eventMarker}

          /*
          |--------------------------------------------------------------------------
          | TRUMARG CHOICE PLAN VERIFIED RETURN
          |--------------------------------------------------------------------------
          */

          if (
            normalizedAccess
              ?.choiceFillingPlan
          ) {
            const returnPath =
              sessionStorage.getItem(
                'trumarg-payment-return'
              );

            sessionStorage.removeItem(
              'trumarg-payment-return'
            );

            nav(
              returnPath ||
                '/results?view=choice-plan',
              {
                replace: true,
              }
            );

            return;
          }`;

  paymentResult =
    paymentResult.replace(
      eventMarker,
      returnBlock
    );
}


/*
|--------------------------------------------------------------------------
| VALIDATE
|--------------------------------------------------------------------------
*/

const resultsRequired = [
  "startCashfreeCheckout",
  "useSearchParams",
  "trumarg-payment-return",
  "startCashfreeCheckout(",
  "'choice-plan'",
];

for (const token of resultsRequired) {
  if (!results.includes(token)) {
    throw new Error(
      `Results validation failed: ${token}`
    );
  }
}

const paymentRequired = [
  "useNavigate",
  "TRUMARG CHOICE PLAN VERIFIED RETURN",
  "normalizedAccess",
  "choiceFillingPlan",
  "/results?view=choice-plan",
];

for (const token of paymentRequired) {
  if (!paymentResult.includes(token)) {
    throw new Error(
      `PaymentResult validation failed: ${token}`
    );
  }
}


/*
|--------------------------------------------------------------------------
| WRITE
|--------------------------------------------------------------------------
*/

fs.writeFileSync(
  resultsFile,
  results,
  "utf8"
);

fs.writeFileSync(
  paymentResultFile,
  paymentResult,
  "utf8"
);

console.log("");
console.log(
  "=============================================="
);
console.log(
  "DIRECT ₹999 CHOICE PLAN FLOW PATCH COMPLETE"
);
console.log(
  "=============================================="
);
console.log(
  "Unlock button -> Cashfree direct"
);
console.log(
  "Payment verify -> choiceFillingPlan access"
);
console.log(
  "Success -> /results?view=choice-plan"
);
