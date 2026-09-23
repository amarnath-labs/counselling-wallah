import {
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  useNavigate,
} from 'react-router-dom';

import {
  useAuth,
} from '../hooks/AuthContext';

import {
  getMyPaymentAccess,
  normalizePaymentAccess,
  startCashfreeCheckout,
} from '../services/paymentService';


const PLANS = [
  {
    id: 'basic',
    level: 1,
    name: 'COLLEGE PREDICTOR',
    price: 49,
    subtitle: 'Check Your College Chances',
    description:
      'Get college admission chances based on your rank and counselling data.',
    features: [
      'College Predictor',
      'Rank-based admission chances',
      'Dream / Target / Safe / Backup',
      'College & branch options',
    ],
  },

  {
    id: 'finder',
    level: 2,
    name: 'RECOMMENDATION',
    price: 99,
    subtitle: 'Personalized College Recommendations',
    popular: true,
    description:
      'Get personalized recommendations using rank, branch preference, college quality and more.',
    features: [
      'Everything in College Predictor',
      'Personalized Recommendations',
      'Premium Match Score',
      'Branch Preference Analysis',
      'College Quality Analysis',
      'Budget & Location Match',
    ],
  },

  {
    id: 'support',
    level: 3,
    name: 'CALL SUPPORT',
    price: 599,
    subtitle: 'Personal Counselling Support',
    description:
      'Get premium recommendation access plus personal counselling support.',
    features: [
      'Everything in Recommendation',
      'Personal Counselling Call',
      'Choice Filling Guidance',
      'College Selection Support',
      'Priority Assistance',
    ],
  },
];


function getPlanLevel(
  planId
) {
  if (
    planId === 'support'
  ) {
    return 3;
  }

  if (
    planId === 'finder'
  ) {
    return 2;
  }

  if (
    planId === 'basic'
  ) {
    return 1;
  }

  return 0;
}


export default function Pricing() {
  const navigate =
    useNavigate();


  const {
    user,
    authLoading,
  } =
    useAuth();


  const [
    access,
    setAccess,
  ] =
    useState({
      planId: null,
      hasPaidPlan: false,
      collegePredictor: false,
      recommendation: false,
      callSupport: false,
    });


  const [
    accessLoading,
    setAccessLoading,
  ] =
    useState(true);


  const [
    paymentLoading,
    setPaymentLoading,
  ] =
    useState(null);


  const [
    error,
    setError,
  ] =
    useState('');


  /*
  |--------------------------------------------------------------------------
  | CURRENT PLAN LEVEL
  |--------------------------------------------------------------------------
  */

  const currentLevel =
    useMemo(
      () =>
        getPlanLevel(
          access?.planId
        ),
      [
        access?.planId,
      ]
    );


  /*
  |--------------------------------------------------------------------------
  | LOAD PAYMENT ACCESS
  |--------------------------------------------------------------------------
  */

  async function loadAccess() {
    /*
    |--------------------------------------------------------------------------
    | Logged out
    |--------------------------------------------------------------------------
    */

    if (!user) {
      setAccess({
        planId: null,
        hasPaidPlan: false,
        collegePredictor: false,
        recommendation: false,
        callSupport: false,
      });


      setAccessLoading(
        false
      );


      return;
    }


    try {
      setAccessLoading(
        true
      );


      setError('');


      const response =
        await getMyPaymentAccess();


      const normalized =
        normalizePaymentAccess(
          response
        );


      setAccess(
        normalized
      );

    } catch (
      err
    ) {
      console.error(
        '[PRICING ACCESS ERROR]',
        err
      );


      if (
        err?.status === 401 ||
        err?.statusCode === 401
      ) {
        setAccess({
          planId: null,
          hasPaidPlan: false,
          collegePredictor: false,
          recommendation: false,
          callSupport: false,
        });


        return;
      }


      setError(
        err?.message ||
        'Unable to load your plan.'
      );

    } finally {
      setAccessLoading(
        false
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | LOAD WHEN AUTH CHANGES
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      if (
        authLoading
      ) {
        return;
      }


      loadAccess();
    },
    [
      authLoading,
      user,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | LISTEN AFTER PAYMENT SUCCESS
  |--------------------------------------------------------------------------
  */

  useEffect(
    () => {
      function handleAccessUpdated(
        event
      ) {
        if (
          event?.detail
        ) {
          setAccess(
            event.detail
          );
        } else {
          loadAccess();
        }
      }


      window.addEventListener(
        'cw-payment-access-updated',
        handleAccessUpdated
      );


      return () => {
        window.removeEventListener(
          'cw-payment-access-updated',
          handleAccessUpdated
        );
      };
    },
    [
      user,
    ]
  );


  /*
  |--------------------------------------------------------------------------
  | BUY PLAN
  |--------------------------------------------------------------------------
  */

  async function handlePlanClick(
    plan
  ) {
    setError('');


    /*
    |--------------------------------------------------------------------------
    | LOGIN REQUIRED
    |--------------------------------------------------------------------------
    */

    if (!user) {
      navigate(
        '/login?redirect=/pricing'
      );

      return;
    }


    /*
    |--------------------------------------------------------------------------
    | ALREADY OWNED / INCLUDED
    |--------------------------------------------------------------------------
    */

    if (
      currentLevel >=
      plan.level
    ) {
      return;
    }


    try {
      setPaymentLoading(
        plan.id
      );


      /*
      |--------------------------------------------------------------------------
      | Re-check entitlement before creating payment
      |--------------------------------------------------------------------------
      */

      const response =
        await getMyPaymentAccess();


      const latestAccess =
        normalizePaymentAccess(
          response
        );


      setAccess(
        latestAccess
      );


      const latestLevel =
        getPlanLevel(
          latestAccess
            ?.planId
        );


      if (
        latestLevel >=
        plan.level
      ) {
        return;
      }


      /*
      |--------------------------------------------------------------------------
      | CASHFREE
      |--------------------------------------------------------------------------
      */

      await startCashfreeCheckout(
        plan.id
      );

    } catch (
      err
    ) {
      console.error(
        '[PAYMENT START ERROR]',
        err
      );


      if (
        err?.status === 401 ||
        err?.statusCode === 401
      ) {
        navigate(
          '/login?redirect=/pricing'
        );

        return;
      }


      if (
        err?.status === 409 ||
        err?.statusCode === 409
      ) {
        await loadAccess();

        return;
      }


      setError(
        err?.message ||
        'Unable to start payment.'
      );

    } finally {
      setPaymentLoading(
        null
      );
    }
  }


  /*
  |--------------------------------------------------------------------------
  | BUTTON STATE
  |--------------------------------------------------------------------------
  */

  function getPlanButton(
    plan
  ) {
    if (
      authLoading ||
      accessLoading
    ) {
      return {
        text:
          'Checking...',
        disabled:
          true,
      };
    }


    if (!user) {
      return {
        text:
          'Login to Purchase',
        disabled:
          false,
      };
    }


    /*
    |--------------------------------------------------------------------------
    | Exact current plan
    |--------------------------------------------------------------------------
    */

    if (
      access?.planId ===
      plan.id
    ) {
      return {
        text:
          'Current Plan',
        disabled:
          true,
      };
    }


    /*
    |--------------------------------------------------------------------------
    | Lower plan inherited by higher plan
    |--------------------------------------------------------------------------
    */

    if (
      currentLevel >
      plan.level
    ) {
      return {
        text:
          'Included in Your Plan',
        disabled:
          true,
      };
    }


    /*
    |--------------------------------------------------------------------------
    | Upgrade
    |--------------------------------------------------------------------------
    */

    if (
      currentLevel > 0 &&
      currentLevel <
        plan.level
    ) {
      return {
        text:
          `Upgrade to ${plan.name}`,
        disabled:
          false,
      };
    }


    return {
      text:
        `Get ${plan.name}`,
      disabled:
        false,
    };
  }


  return (
    <div
      className="container section"
    >
      <div
        style={{
          textAlign:
            'center',

          maxWidth:
            '760px',

          margin:
            '0 auto 36px',
        }}
      >
        <h1>
          Choose Your Plan
        </h1>


        <p>
          Simple counselling tools designed to help you make a better college decision.
        </p>


        {!authLoading &&
          user && (
          <p
            style={{
              marginTop:
                '10px',

              fontWeight:
                600,
            }}
          >
            Logged in as{' '}
            {user.name ||
              user.email}
          </p>
        )}


        {!authLoading &&
          !user && (
          <div
            style={{
              marginTop:
                '16px',

              padding:
                '12px 16px',

              borderRadius:
                '10px',

              background:
                '#fff7df',
            }}
          >
            Login is required before purchasing a plan.
          </div>
        )}
      </div>


      {error && (
        <div
          style={{
            maxWidth:
              '760px',

            margin:
              '0 auto 24px',

            padding:
              '14px',

            borderRadius:
              '10px',

            background:
              '#ffe8e8',

            color:
              '#b00020',

            textAlign:
              'center',
          }}
        >
          {error}
        </div>
      )}


      {access
        ?.hasPaidPlan && (
        <div
          className="card"
          style={{
            maxWidth:
              '760px',

            margin:
              '0 auto 30px',

            padding:
              '20px',

            textAlign:
              'center',
          }}
        >
          <strong>
            Active Plan:{' '}
          </strong>

          {access.planId ===
            'basic' &&
            'College Predictor'}

          {access.planId ===
            'finder' &&
            'Recommendation'}

          {access.planId ===
            'support' &&
            'Call Support'}
        </div>
      )}


      <div
        style={{
          display:
            'grid',

          gridTemplateColumns:
            'repeat(auto-fit, minmax(280px, 1fr))',

          gap:
            '24px',

          alignItems:
            'stretch',
        }}
      >
        {PLANS.map(
          (
            plan
          ) => {
            const button =
              getPlanButton(
                plan
              );


            const isLoading =
              paymentLoading ===
              plan.id;


            return (
              <div
                key={
                  plan.id
                }
                className="card"
                style={{
                  position:
                    'relative',

                  padding:
                    '28px',

                  display:
                    'flex',

                  flexDirection:
                    'column',
                }}
              >
                {plan.popular && (
                  <div
                    style={{
                      position:
                        'absolute',

                      top:
                        '-13px',

                      left:
                        '50%',

                      transform:
                        'translateX(-50%)',

                      padding:
                        '6px 14px',

                      borderRadius:
                        '999px',

                      background:
                        '#111827',

                      color:
                        '#fff',

                      fontSize:
                        '12px',

                      fontWeight:
                        700,

                      whiteSpace:
                        'nowrap',
                    }}
                  >
                    MOST POPULAR
                  </div>
                )}


                <h3
                  style={{
                    marginTop:
                      plan.popular
                        ? '10px'
                        : 0,
                  }}
                >
                  {plan.name}
                </h3>


                <p
                  style={{
                    fontWeight:
                      600,

                    minHeight:
                      '48px',
                  }}
                >
                  {plan.subtitle}
                </p>


                <div
                  style={{
                    margin:
                      '18px 0',
                  }}
                >
                  <span
                    style={{
                      fontSize:
                        '38px',

                      fontWeight:
                        800,
                    }}
                  >
                    ₹{plan.price}
                  </span>
                </div>


                <p>
                  {plan.description}
                </p>


                <div
                  style={{
                    flex:
                      1,

                    marginTop:
                      '16px',
                  }}
                >
                  {plan.features.map(
                    (
                      feature
                    ) => (
                      <div
                        key={
                          feature
                        }
                        style={{
                          marginBottom:
                            '10px',
                        }}
                      >
                        ✓{' '}
                        {feature}
                      </div>
                    )
                  )}
                </div>


                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={
                    button.disabled ||
                    isLoading
                  }
                  onClick={
                    () =>
                      handlePlanClick(
                        plan
                      )
                  }
                  style={{
                    width:
                      '100%',

                    marginTop:
                      '24px',
                  }}
                >
                  {isLoading
                    ? 'Opening Payment...'
                    : button.text}
                </button>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}