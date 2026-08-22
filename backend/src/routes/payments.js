import { Router } from 'express';
import crypto from 'node:crypto';
import { pool } from '../db/pool.js';

const router = Router();

const PLANS = {
  basic: {
    name: 'Basic',
    amount: 49,
  },

  finder: {
    name: 'College Finder',
    amount: 99,
  },

  support: {
    name: 'Counselling Support',
    amount: 299,
  },
};

const CASHFREE_BASE_URL =
  process.env.CASHFREE_ENV === 'production'
    ? 'https://api.cashfree.com/pg'
    : 'https://sandbox.cashfree.com/pg';

const CASHFREE_API_VERSION = '2025-01-01';


function cashfreeHeaders() {
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'x-api-version': CASHFREE_API_VERSION,
    'x-client-id': process.env.CASHFREE_APP_ID,
    'x-client-secret': process.env.CASHFREE_SECRET_KEY,
  };
}


/*
|--------------------------------------------------------------------------
| CREATE CASHFREE ORDER
|--------------------------------------------------------------------------
*/

router.post('/create-order', async (req, res, next) => {
  try {
    const { planId } = req.body;

    const plan = PLANS[planId];

    if (!plan) {
      return res.status(400).json({
        error: 'Invalid plan',
      });
    }

    if (
      !process.env.CASHFREE_APP_ID ||
      !process.env.CASHFREE_SECRET_KEY
    ) {
      return res.status(500).json({
        error: 'Cashfree credentials are not configured',
      });
    }

    const orderId =
      `cw_${planId}_${Date.now()}`;

    const response = await fetch(
      `${CASHFREE_BASE_URL}/orders`,
      {
        method: 'POST',
        headers: cashfreeHeaders(),
        body: JSON.stringify({
          order_id: orderId,
          order_amount: plan.amount,
          order_currency: 'INR',

          customer_details: {
            customer_id: `cw_guest_${Date.now()}`,
            customer_phone: '9999999999',
          },

          order_meta: {
            return_url:
              `http://localhost:5173/payment-result?order_id={order_id}`,
          },

          order_note:
            `Counselling Wallah - ${plan.name}`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error(
        'Cashfree create order error:',
        data
      );

      return res.status(502).json({
        error:
          data?.message ||
          data?.error_description ||
          'Cashfree order creation failed',
      });
    }

    await pool.query(
      `
      INSERT INTO payments (
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
        'INR',
        $4,
        'created'
      )
      `,
      [
        planId,
        plan.name,
        plan.amount,
        orderId,
      ]
    );

    res.json({
      success: true,
      orderId,
      planId,
      planName: plan.name,
      amount: plan.amount,
      paymentSessionId:
        data.payment_session_id,
    });

  } catch (error) {
    next(error);
  }
});


/*
|--------------------------------------------------------------------------
| CHECK CASHFREE ORDER STATUS
|--------------------------------------------------------------------------
*/

router.get(
  '/status/:orderId',
  async (req, res, next) => {
    try {
      const { orderId } = req.params;

      const response = await fetch(
        `${CASHFREE_BASE_URL}/orders/${encodeURIComponent(orderId)}`,
        {
          method: 'GET',
          headers: cashfreeHeaders(),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        return res.status(502).json({
          error:
            data?.message ||
            'Unable to fetch Cashfree order status',
        });
      }

      const orderStatus =
        String(
          data?.order_status || ''
        ).toUpperCase();

      let dbStatus = 'pending';

      if (
        orderStatus === 'PAID'
      ) {
        dbStatus = 'verified';
      } else if (
        [
          'ACTIVE',
          'EXPIRED',
          'TERMINATED',
        ].includes(orderStatus)
      ) {
        dbStatus =
          orderStatus === 'ACTIVE'
            ? 'pending'
            : 'failed';
      }

      await pool.query(
        `
        UPDATE payments
        SET status = $1,
            verified_at = CASE
              WHEN $1 = 'verified'
              THEN NOW()
              ELSE verified_at
            END
        WHERE razorpay_order_id = $2
        `,
        [
          dbStatus,
          orderId,
        ]
      );

      res.json({
        success: true,
        orderId,
        status: dbStatus,
        cashfreeStatus: orderStatus,
      });

    } catch (error) {
      next(error);
    }
  }
);


/*
|--------------------------------------------------------------------------
| PAYMENT VERIFY / WEBHOOK PLACEHOLDER
|--------------------------------------------------------------------------
|
| For the first local test, status/:orderId is enough.
| We will add signed webhook verification before production.
|
*/

router.get('/test', (_req, res) => {
  res.json({
    ok: true,
    gateway: 'cashfree',
    environment:
      process.env.CASHFREE_ENV || 'sandbox',
  });
});


export default router;
