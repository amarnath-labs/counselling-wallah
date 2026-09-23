import {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import {
  getMyPaymentAccess,
  normalizePaymentAccess,
  verifyPayment,
} from '../services/paymentService';


export default function PaymentResult() {
  const [
    searchParams,
  ] =
    useSearchParams();


  const orderId =
    searchParams.get(
      'order_id'
    ) ||
    searchParams.get(
      'orderId'
    ) ||
    '';


  const [
    status,
    setStatus,
  ] =
    useState(
      'checking'
    );


  const [
    message,
    setMessage,
  ] =
    useState(
      'Verifying your payment...'
    );


  const [
    access,
    setAccess,
  ] =
    useState(null);


  const [
    payment,
    setPayment,
  ] =
    useState(null);


  useEffect(
    () => {
      let cancelled =
        false;


      async function verify() {
        /*
        |--------------------------------------------------------------------------
        | ORDER ID REQUIRED
        |--------------------------------------------------------------------------
        */

        if (
          !orderId
        ) {
          if (
            cancelled
          ) {
            return;
          }


          setStatus(
            'failed'
          );


          setMessage(
            'Payment order ID is missing.'
          );


          return;
        }


        try {
          setStatus(
            'checking'
          );


          setMessage(
            'Verifying your payment...'
          );


          /*
          |--------------------------------------------------------------------------
          | STEP 1: VERIFY PAYMENT WITH BACKEND
          |--------------------------------------------------------------------------
          |
          | Backend checks:
          | - user is logged in
          | - order belongs to this user
          | - Cashfree says PAID
          |--------------------------------------------------------------------------
          */

          const verification =
            await verifyPayment(
              orderId
            );


          if (
            cancelled
          ) {
            return;
          }


          setPayment(
            verification
          );


          /*
          |--------------------------------------------------------------------------
          | PAYMENT NOT PAID
          |--------------------------------------------------------------------------
          */

          if (
            !verification?.paid
          ) {
            const paymentStatus =
              String(
                verification
                  ?.cashfreeStatus ||
                verification
                  ?.status ||
                ''
              )
                .trim()
                .toUpperCase();


            /*
            |--------------------------------------------------------------------------
            | FAILED / EXPIRED
            |--------------------------------------------------------------------------
            */

            if (
              [
                'FAILED',
                'EXPIRED',
                'TERMINATED',
              ].includes(
                paymentStatus
              )
            ) {
              setStatus(
                'failed'
              );


              setMessage(
                'Payment was not completed successfully.'
              );


              return;
            }


            /*
            |--------------------------------------------------------------------------
            | PENDING
            |--------------------------------------------------------------------------
            */

            setStatus(
              'pending'
            );


            setMessage(
              'Your payment is still pending. If money was deducted, please wait a moment and refresh this page.'
            );


            return;
          }


          /*
          |--------------------------------------------------------------------------
          | STEP 2: LOAD USER ENTITLEMENT
          |--------------------------------------------------------------------------
          */

          const response =
            await getMyPaymentAccess();


          if (
            cancelled
          ) {
            return;
          }


          const normalizedAccess =
            normalizePaymentAccess(
              response
            );


          setAccess(
            normalizedAccess
          );


          /*
          |--------------------------------------------------------------------------
          | VERIFY ACCESS WAS ACTUALLY UNLOCKED
          |--------------------------------------------------------------------------
          */

          if (
            !normalizedAccess
              ?.hasPaidPlan
          ) {
            setStatus(
              'pending'
            );


            setMessage(
              'Payment was successful, but your plan access is still being updated. Please refresh in a moment.'
            );


            return;
          }


          /*
          |--------------------------------------------------------------------------
          | SUCCESS
          |--------------------------------------------------------------------------
          */

          setStatus(
            'success'
          );


          setMessage(
            'Payment verified successfully. Your plan is now active.'
          );


          /*
          |--------------------------------------------------------------------------
          | INFORM OTHER FRONTEND COMPONENTS
          |--------------------------------------------------------------------------
          |
          | Pricing.jsx can listen to this event and reload access.
          |--------------------------------------------------------------------------
          */

          window.dispatchEvent(
            new CustomEvent(
              'cw-payment-access-updated',
              {
                detail:
                  normalizedAccess,
              }
            )
          );

        } catch (
          error
        ) {
          console.error(
            '[PAYMENT RESULT ERROR]',
            error
          );


          if (
            cancelled
          ) {
            return;
          }


          /*
          |--------------------------------------------------------------------------
          | NOT LOGGED IN
          |--------------------------------------------------------------------------
          */

          if (
            error?.status ===
              401 ||
            error?.statusCode ===
              401
          ) {
            setStatus(
              'login-required'
            );


            setMessage(
              'Please login with the account used for this payment to verify your plan.'
            );


            return;
          }


          /*
          |--------------------------------------------------------------------------
          | ORDER DOES NOT BELONG TO USER / NOT FOUND
          |--------------------------------------------------------------------------
          */

          if (
            error?.status ===
              404 ||
            error?.statusCode ===
              404
          ) {
            setStatus(
              'failed'
            );


            setMessage(
              'This payment order could not be found for your account.'
            );


            return;
          }


          /*
          |--------------------------------------------------------------------------
          | OTHER ERROR
          |--------------------------------------------------------------------------
          */

          setStatus(
            'failed'
          );


          setMessage(
            error?.message ||
            'Unable to verify payment. Please try again.'
          );
        }
      }


      verify();


      return () => {
        cancelled =
          true;
      };
    },
    [
      orderId,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | CHECKING
  |--------------------------------------------------------------------------
  */

  if (
    status ===
    'checking'
  ) {
    return (
      <div
        className="container section"
      >
        <div
          className="card"
          style={{
            maxWidth:
              '650px',

            margin:
              '0 auto',

            padding:
              '32px',

            textAlign:
              'center',
          }}
        >
          <h2>
            Verifying Payment
          </h2>


          <p>
            {message}
          </p>


          {orderId && (
            <p
              style={{
                opacity:
                  0.7,

                fontSize:
                  '14px',
              }}
            >
              Order ID:{' '}
              <strong>
                {orderId}
              </strong>
            </p>
          )}
        </div>
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | LOGIN REQUIRED
  |--------------------------------------------------------------------------
  */

  if (
    status ===
    'login-required'
  ) {
    return (
      <div
        className="container section"
      >
        <div
          className="card"
          style={{
            maxWidth:
              '650px',

            margin:
              '0 auto',

            padding:
              '32px',

            textAlign:
              'center',
          }}
        >
          <h2>
            Login Required
          </h2>


          <p>
            {message}
          </p>


          <Link
            to={`/login?redirect=${encodeURIComponent(
              `/payment-result?order_id=${orderId}`
            )}`}
            className="btn btn-primary"
          >
            Login to Verify Payment
          </Link>
        </div>
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | SUCCESS
  |--------------------------------------------------------------------------
  */

  if (
    status ===
    'success'
  ) {
    return (
      <div
        className="container section"
      >
        <div
          className="card"
          style={{
            maxWidth:
              '700px',

            margin:
              '0 auto',

            padding:
              '32px',

            textAlign:
              'center',
          }}
        >
          <div
            style={{
              fontSize:
                '52px',

              marginBottom:
                '12px',
            }}
          >
            ✅
          </div>


          <h2>
            Payment Successful
          </h2>


          <p>
            {message}
          </p>


          {payment
            ?.planName && (
            <p>
              <strong>
                Plan:
              </strong>{' '}
              {
                payment.planName
              }
            </p>
          )}


          {payment
            ?.amount && (
            <p>
              <strong>
                Amount:
              </strong>{' '}
              ₹
              {
                payment.amount
              }
            </p>
          )}


          <p>
            <strong>
              Order ID:
            </strong>{' '}
            {orderId}
          </p>


          {access && (
            <div
              style={{
                marginTop:
                  '24px',

                padding:
                  '20px',

                borderRadius:
                  '12px',

                background:
                  '#f6f8ff',

                textAlign:
                  'left',
              }}
            >
              <h3>
                Your Access
              </h3>


              <p>
                College Predictor:{' '}

                <strong>
                  {access
                    .collegePredictor
                    ? 'Unlocked'
                    : 'Locked'}
                </strong>
              </p>


              <p>
                Recommendation:{' '}

                <strong>
                  {access
                    .recommendation
                    ? 'Unlocked'
                    : 'Locked'}
                </strong>
              </p>


              <p>
                Call Support:{' '}

                <strong>
                  {access
                    .callSupport
                    ? 'Unlocked'
                    : 'Locked'}
                </strong>
              </p>
            </div>
          )}


          <div
            style={{
              display:
                'flex',

              gap:
                '12px',

              justifyContent:
                'center',

              flexWrap:
                'wrap',

              marginTop:
                '28px',
            }}
          >
            <Link
              to="/results"
              className="btn btn-primary"
            >
              View Recommendations
            </Link>


            <Link
              to="/pricing"
              className="btn btn-ghost"
            >
              View My Plan
            </Link>


            <Link
              to="/account"
              className="btn btn-ghost"
            >
              My Account
            </Link>
          </div>
        </div>
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | PENDING
  |--------------------------------------------------------------------------
  */

  if (
    status ===
    'pending'
  ) {
    return (
      <div
        className="container section"
      >
        <div
          className="card"
          style={{
            maxWidth:
              '650px',

            margin:
              '0 auto',

            padding:
              '32px',

            textAlign:
              'center',
          }}
        >
          <div
            style={{
              fontSize:
                '50px',
            }}
          >
            ⏳
          </div>


          <h2>
            Payment Pending
          </h2>


          <p>
            {message}
          </p>


          <p>
            <strong>
              Order ID:
            </strong>{' '}
            {orderId}
          </p>


          <button
            type="button"
            className="btn btn-primary"
            onClick={
              () =>
                window.location
                  .reload()
            }
          >
            Check Again
          </button>


          <div
            style={{
              marginTop:
                '16px',
            }}
          >
            <Link
              to="/pricing"
            >
              Back to Pricing
            </Link>
          </div>
        </div>
      </div>
    );
  }


  /*
  |--------------------------------------------------------------------------
  | FAILED
  |--------------------------------------------------------------------------
  */

  return (
    <div
      className="container section"
    >
      <div
        className="card"
        style={{
          maxWidth:
            '650px',

          margin:
            '0 auto',

          padding:
            '32px',

          textAlign:
            'center',
        }}
      >
        <div
          style={{
            fontSize:
              '50px',
          }}
        >
          ❌
        </div>


        <h2>
          Payment Verification Failed
        </h2>


        <p>
          {message}
        </p>


        {orderId && (
          <p>
            <strong>
              Order ID:
            </strong>{' '}
            {orderId}
          </p>
        )}


        <div
          style={{
            display:
              'flex',

            gap:
              '12px',

            justifyContent:
              'center',

            flexWrap:
              'wrap',

            marginTop:
              '24px',
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={
              () =>
                window.location
                  .reload()
            }
          >
            Try Verification Again
          </button>


          <Link
            to="/pricing"
            className="btn btn-ghost"
          >
            Back to Pricing
          </Link>
        </div>
      </div>
    </div>
  );
}