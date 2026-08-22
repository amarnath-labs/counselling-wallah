import { pool } from "./src/db/pool.js";

try {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS payments (
      id BIGSERIAL PRIMARY KEY,
      plan_id TEXT NOT NULL,
      plan_name TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL DEFAULT 'INR',
      razorpay_order_id TEXT UNIQUE NOT NULL,
      razorpay_payment_id TEXT UNIQUE,
      razorpay_signature TEXT,
      status TEXT NOT NULL DEFAULT 'created',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verified_at TIMESTAMPTZ
    );
  `);

  console.log("payments table ready");
} finally {
  await pool.end();
}
