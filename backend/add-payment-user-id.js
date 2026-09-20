import { pool } from "./src/db/pool.js";

try {
  await pool.query(`
    ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS user_id BIGINT
  `);

  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_payments_user_id
    ON payments(user_id)
  `);

  console.log("✅ payments.user_id ready");
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
