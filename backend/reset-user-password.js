import "dotenv/config";
import bcrypt from "bcryptjs";
import { pool } from "./src/db/pool.js";

const email = String(process.argv[2] || "")
  .trim()
  .toLowerCase();

const password = String(process.argv[3] || "");

if (!email || !password) {
  console.error("Usage: node reset-user-password.js <email> <newPassword>");
  process.exit(1);
}

try {
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
    `
    UPDATE users
    SET password_hash = $1
    WHERE LOWER(TRIM(email)) = $2
    RETURNING id, name, email, role
    `,
    [passwordHash, email]
  );

  if (!result.rows.length) {
    console.log("USER_NOT_FOUND");
  } else {
    console.log("PASSWORD_RESET_SUCCESS");
    console.table(result.rows);
  }
} catch (error) {
  console.error("RESET ERROR:", error);
  process.exitCode = 1;
} finally {
  await pool.end();
}
