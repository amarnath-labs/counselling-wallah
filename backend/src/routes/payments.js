import { Router } from 'express';

import { pool } from '../db/pool.js';

import {
  requireAuth,
} from '../middleware/auth.js';


const router =
  Router();


/*
|--------------------------------------------------------------------------
| PLANS
|--------------------------------------------------------------------------
*/

const PLANS = {
  basic: {
    id: 'basic',
    name: 'College Predictor',
    amount: 49,
    level: 1,
  },

  finder: {
    id: 'finder',
    name: 'Recommendation',
    amount: 99,
    level: 2,
  },

  support: {
    id: 'support',
    name: 'Call Support',
    amount: 599,
    level: 3,
  },
};


/*
|--------------------------------------------------------------------------
| CONFIG
|--------------------------------------------------------------------------
*/

const CASHFREE_ENV =
  String(
    process.env.CASHFREE_ENV ||
    'sandbox'
  )
    .trim()
    .toLowerCase();


const CASHFREE_BASE_URL =
  CASHFREE_ENV ===
  'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';


const FRONTEND_URL =
  String(
    process.env.FRONTEND_URL ||
    'http://localhost:5173'
  )
    .trim()
    .replace(/\/+$/, '');


function ensureCashfreeConfig() {
  if (
    !process.env.CASHFREE_APP_ID ||
    !process.env.CASHFREE_SECRET_KEY
  ) {
    const error =
      new Error(
        'Cashfree is not configured'
      );

    error.status =
      500;

    throw error;
  }
}


/*
|--------------------------------------------------------------------------
| CASHFREE REQUEST
|--------------------------------------------------------------------------
*/

async function cashfreeRequest(
  path,
  options = {}
) {
  ensureCashfreeConfig();


  const response =
    await fetch(
      `${CASHFREE_BASE_URL}${path}`,
      {
        method:
          options.method ||
          'GET',

        headers: {
          'Content-Type':
            'application/json',

          'x-client-id':
            process.env
              .CASHFREE_APP_ID,

          'x-client-secret':
            process.env
              .CASHFREE_SECRET_KEY,

          'x-api-version':
            '2023-08-01',

          ...(
            options.headers ||
            {}
          ),
        },

        body:
          options.body
            ? JSON.stringify(
                options.body
              )
            : undefined,
      }
    );


  const data =
    await response
      .json()
      .catch(
        () => ({})
      );


  if (
    !response.ok
  ) {
    console.error(
      '[CASHFREE ERROR]',
      data
    );


    const error =
      new Error(
        data?.message ||
        data?.type ||
        `Cashfree request failed (${response.status})`
      );


    error.status =
      response.status;


    throw error;
  }


  return data;
}


/*
|--------------------------------------------------------------------------
| GET LOGGED-IN USER
|--------------------------------------------------------------------------
*/

async function getUser(
  userId
) {
  const result =
    await pool.query(
      `
      SELECT
        id,
        name,
        email,
        phone,
        role
      FROM users
      WHERE id::text = $1
      LIMIT 1
      `,
      [
        String(
          userId
        ),
      ]
    );


  return (
    result.rows?.[0] ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| CREATE ORDER
|--------------------------------------------------------------------------
|
| LOGIN IS MANDATORY.
|--------------------------------------------------------------------------
*/

router.post(
  '/create-order',
  requireAuth,
  async (
    req,
    res,
    next
  ) => {
    try {
      const planId =
        String(
          req.body?.planId ||
          ''
        )
          .trim()
          .toLowerCase();


      const plan =
        PLANS[
          planId
        ];


      if (!plan) {
        return res
          .status(400)
          .json({
            error:
              'Invalid plan',
          });
      }


      const user =
        await getUser(
          req.user.id
        );


      if (!user) {
        return res
          .status(401)
          .json({
            error:
              'User account not found',
          });
      }


      /*
      |--------------------------------------------------------------------------
      | Prevent buying same/lower entitlement again
      |--------------------------------------------------------------------------
      */

      const existing =
        await pool.query(
          `
          SELECT
            plan_id
          FROM payments
          WHERE user_id = $1
            AND status = 'verified'
          ORDER BY
            CASE plan_id
              WHEN 'support' THEN 3
              WHEN 'finder' THEN 2
              WHEN 'basic' THEN 1
              ELSE 0
            END DESC,
            id DESC
          LIMIT 1
          `,
          [
            String(
              user.id
            ),
          ]
        );


      const currentPlanId =
        existing.rows?.[0]
          ?.plan_id ||
        null;


      const currentLevel =
        currentPlanId
          ? PLANS[
              currentPlanId
            ]?.level || 0
          : 0;


      if (
        currentLevel >=
        plan.level
      ) {
        return res
          .status(409)
          .json({
            error:
              'You already have this plan or a higher plan',

            currentPlan:
              currentPlanId,
          });
      }


      const orderId =
        `cw_${planId}_${user.id}_${Date.now()}`;


      const phone =
        String(
          user.phone ||
          '9999999999'
        )
          .replace(
            /\D/g,
            ''
          )
          .slice(
            -10
          ) ||
        '9999999999';


      const data =
        await cashfreeRequest(
          '/orders',
          {
            method:
              'POST',

            body: {
              order_id:
                orderId,

              order_amount:
                plan.amount,

              order_currency:
                'INR',

              customer_details: {
                customer_id:
                  `cw_user_${user.id}`,

                customer_name:
                  user.name ||
                  'Counselling Wallah Student',

                customer_email:
                  user.email,

                customer_phone:
                  phone,
              },

              order_meta: {
                return_url:
                  `${FRONTEND_URL}/payment-result?order_id={order_id}`,
              },

              order_note:
                `Counselling Wallah - ${plan.name}`,

              order_tags: {
                plan_id:
                  plan.id,

                user_id:
                  String(
                    user.id
                  ),
              },
            },
          }
        );


      if (
        !data
          ?.payment_session_id
      ) {
        throw new Error(
          'Cashfree did not return payment session ID'
        );
      }


      /*
      |--------------------------------------------------------------------------
      | IMPORTANT: PAYMENT BELONGS TO USER
      |--------------------------------------------------------------------------
      */

      await pool.query(
        `
        INSERT INTO payments (
          user_id,
          plan_id,
          plan_name,
          amount,
          currency,
          razorpay_order_id,
          status
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          'INR',
          $5,
          'created'
        )
        `,
        [
          String(
            user.id
          ),

          plan.id,

          plan.name,

          plan.amount,

          orderId,
        ]
      );


      return res.json({
        success:
          true,

        orderId,

        planId:
          plan.id,

        planName:
          plan.name,

        amount:
          plan.amount,

        currency:
          'INR',

        paymentSessionId:
          data.payment_session_id,
      });

    } catch (
      error
    ) {
      console.error(
        '[CREATE ORDER ERROR]',
        error
      );


      next(
        error
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| GET USER PAYMENT
|--------------------------------------------------------------------------
*/

async function getLocalPayment(
  orderId,
  userId
) {
  const result =
    await pool.query(
      `
      SELECT
        id,
        user_id,
        plan_id,
        plan_name,
        amount,
        currency,
        status,
        razorpay_order_id
      FROM payments
      WHERE razorpay_order_id = $1
        AND user_id = $2
      ORDER BY id DESC
      LIMIT 1
      `,
      [
        orderId,
        String(
          userId
        ),
      ]
    );


  return (
    result.rows?.[0] ||
    null
  );
}


/*
|--------------------------------------------------------------------------
| VERIFY ORDER
|--------------------------------------------------------------------------
*/

async function verifyOrder(
  orderId,
  userId
) {
  if (!orderId) {
    const error =
      new Error(
        'Order ID is required'
      );

    error.status =
      400;

    throw error;
  }


  /*
  |--------------------------------------------------------------------------
  | Ensure order belongs to this logged-in user
  |--------------------------------------------------------------------------
  */

  const localPayment =
    await getLocalPayment(
      orderId,
      userId
    );


  if (!localPayment) {
    const error =
      new Error(
        'Payment order not found for this account'
      );

    error.status =
      404;

    throw error;
  }


  const data =
    await cashfreeRequest(
      `/orders/${encodeURIComponent(
        orderId
      )}`
    );


  const cashfreeStatus =
    String(
      data?.order_status ||
      ''
    )
      .trim()
      .toUpperCase();


  let dbStatus =
    'pending';


  if (
    cashfreeStatus ===
    'PAID'
  ) {
    dbStatus =
      'verified';

  } else if (
    [
      'EXPIRED',
      'TERMINATED',
    ].includes(
      cashfreeStatus
    )
  ) {
    dbStatus =
      'failed';
  }


  await pool.query(
    `
    UPDATE payments
    SET
      status = $1,

      verified_at =
        CASE
          WHEN $1 = 'verified'
          THEN NOW()
          ELSE verified_at
        END

    WHERE razorpay_order_id = $2
      AND user_id = $3
    `,
    [
      dbStatus,

      orderId,

      String(
        userId
      ),
    ]
  );


  return {
    success:
      true,

    paid:
      cashfreeStatus ===
      'PAID',

    orderId,

    status:
      dbStatus,

    cashfreeStatus,

    planId:
      localPayment.plan_id,

    planName:
      localPayment.plan_name,

    amount:
      Number(
        localPayment.amount ||
        0
      ),

    currency:
      localPayment.currency ||
      'INR',
  };
}


/*
|--------------------------------------------------------------------------
| PAYMENT STATUS
|--------------------------------------------------------------------------
*/

router.get(
  '/status/:orderId',
  requireAuth,
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await verifyOrder(
          String(
            req.params
              .orderId ||
            ''
          ).trim(),

          req.user.id
        );


      return res.json(
        result
      );

    } catch (
      error
    ) {
      next(
        error
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| VERIFY PAYMENT
|--------------------------------------------------------------------------
*/

router.get(
  '/verify/:orderId',
  requireAuth,
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await verifyOrder(
          String(
            req.params
              .orderId ||
            ''
          ).trim(),

          req.user.id
        );


      return res.json(
        result
      );

    } catch (
      error
    ) {
      next(
        error
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| MY ACCESS
|--------------------------------------------------------------------------
*/

router.get(
  '/me/access',
  requireAuth,
  async (
    req,
    res,
    next
  ) => {
    try {
      const result =
        await pool.query(
          `
          SELECT
            plan_id,
            plan_name,
            amount,
            verified_at
          FROM payments
          WHERE user_id = $1
            AND status = 'verified'
          ORDER BY
            CASE plan_id
              WHEN 'support' THEN 3
              WHEN 'finder' THEN 2
              WHEN 'basic' THEN 1
              ELSE 0
            END DESC,
            verified_at DESC NULLS LAST,
            id DESC
          LIMIT 1
          `,
          [
            String(
              req.user.id
            ),
          ]
        );


      const row =
        result.rows?.[0] ||
        null;


      const planId =
        row?.plan_id ||
        null;


      const level =
        planId
          ? PLANS[
              planId
            ]?.level || 0
          : 0;


      return res.json({
        success:
          true,

        access: {
          planId,

          planName:
            row?.plan_name ||
            null,

          hasPaidPlan:
            level > 0,

          collegePredictor:
            level >= 1,

          recommendation:
            level >= 2,

          callSupport:
            level >= 3,
        },
      });

    } catch (
      error
    ) {
      next(
        error
      );
    }
  }
);


/*
|--------------------------------------------------------------------------
| PLANS
|--------------------------------------------------------------------------
*/

router.get(
  '/plans',
  (
    req,
    res
  ) => {
    return res.json({
      success:
        true,

      plans:
        PLANS,
    });
  }
);


/*
|--------------------------------------------------------------------------
| TEST
|--------------------------------------------------------------------------
*/

router.get(
  '/test',
  (
    req,
    res
  ) => {
    return res.json({
      ok:
        true,

      gateway:
        'cashfree',

      environment:
        CASHFREE_ENV,

      configured:
        Boolean(
          process.env
            .CASHFREE_APP_ID &&
          process.env
            .CASHFREE_SECRET_KEY
        ),

      loginRequiredForPayment:
        true,

      plans: {
        basic: 49,
        finder: 99,
        support: 599,
      },
    });
  }
);


export default router;