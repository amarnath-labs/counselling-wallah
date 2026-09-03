import { apiRequest } from './apiClient';

const CASHFREE_SDK_URL =
  'https://sdk.cashfree.com/js/v3/cashfree.js';


function getCashfreeMode() {
  return (
    import.meta.env.VITE_CASHFREE_MODE ||
    'sandbox'
  );
}


function loadCashfreeSdk() {
  if (window.Cashfree) {
    return Promise.resolve(
      window.Cashfree
    );
  }


  return new Promise(
    (
      resolve,
      reject
    ) => {
      const existing =
        document.querySelector(
          `script[src="${CASHFREE_SDK_URL}"]`
        );


      if (existing) {
        existing.addEventListener(
          'load',
          () =>
            resolve(
              window.Cashfree
            )
        );

        existing.addEventListener(
          'error',
          reject
        );

        return;
      }


      const script =
        document.createElement(
          'script'
        );


      script.src =
        CASHFREE_SDK_URL;

      script.async =
        true;


      script.onload =
        () =>
          resolve(
            window.Cashfree
          );


      script.onerror =
        reject;


      document.head.appendChild(
        script
      );
    }
  );
}


/*
|--------------------------------------------------------------------------
| CREATE ORDER
|--------------------------------------------------------------------------
*/

export async function createPaymentOrder(
  planId
) {
  return apiRequest(
    '/payments/create-order',
    {
      method:
        'POST',

      body:
        JSON.stringify({
          planId,
        }),
    }
  );
}


/*
|--------------------------------------------------------------------------
| CASHFREE CHECKOUT
|--------------------------------------------------------------------------
*/

export async function startCashfreeCheckout(
  planId
) {
  const order =
    await createPaymentOrder(
      planId
    );


  if (
    !order?.paymentSessionId
  ) {
    throw new Error(
      'Payment session was not returned by the server'
    );
  }


  const Cashfree =
    await loadCashfreeSdk();


  const cashfree =
    Cashfree({
      mode:
        getCashfreeMode(),
    });


  await cashfree.checkout({
    paymentSessionId:
      order.paymentSessionId,

    redirectTarget:
      '_self',
  });


  return order;
}


/*
|--------------------------------------------------------------------------
| PAYMENT STATUS
|--------------------------------------------------------------------------
*/

export async function getPaymentStatus(
  orderId
) {
  return apiRequest(
    `/payments/status/${encodeURIComponent(
      orderId
    )}`
  );
}


/*
|--------------------------------------------------------------------------
| VERIFY PAYMENT
|--------------------------------------------------------------------------
|
| IMPORTANT:
| Frontend redirect does NOT unlock anything.
|
| Backend checks Cashfree and marks DB payment PAID.
|--------------------------------------------------------------------------
*/

export async function verifyPayment(
  orderId
) {
  if (!orderId) {
    throw new Error(
      'Missing payment order ID'
    );
  }


  return apiRequest(
    `/payments/verify/${encodeURIComponent(
      orderId
    )}`
  );
}


/*
|--------------------------------------------------------------------------
| CURRENT USER ACCESS
|--------------------------------------------------------------------------
*/

export async function getMyPaymentAccess() {
  return apiRequest(
    '/payments/me/access'
  );
}


/*
|--------------------------------------------------------------------------
| ACCESS NORMALIZER
|--------------------------------------------------------------------------
|
| Supports slightly different backend response wrappers.
|--------------------------------------------------------------------------
*/

export function normalizePaymentAccess(
  response
) {
  const raw =
    response?.access ||
    response?.data?.access ||
    response?.data ||
    response ||
    {};


  const planId =
    raw.planId ||
    raw.plan_id ||
    raw.currentPlan ||
    raw.plan ||
    null;


  return {
    planId,

    hasPaidPlan:
      Boolean(
        raw.hasPaidPlan ??
        raw.has_paid_plan ??
        planId
      ),

    collegePredictor:
      Boolean(
        raw.collegePredictor ??
        raw.college_predictor ??
        (
          planId === 'basic' ||
          planId === 'finder' ||
          planId === 'support'
        )
      ),

    recommendation:
      Boolean(
        raw.recommendation ??
        raw.recommendations ??
        (
          planId === 'finder' ||
          planId === 'support'
        )
      ),

    callSupport:
      Boolean(
        raw.callSupport ??
        raw.call_support ??
        (
          planId === 'support'
        )
      ),
  };
}