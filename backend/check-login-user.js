import "dotenv/config";

const { pool } = await import("./src/db/pool.js");

const email = String(process.argv[2] || "")
  .trim()
  .toLowerCase();

try {
  console.log("Checking email:", email);

  const db = await pool.query(`
    SELECT
      current_database() AS database_name,
      current_user AS database_user
  `);

  console.log("DATABASE:");
  console.table(db.rows);

  const result = await pool.query(
    `
    SELECT
      id,
      name,
      email,
      role,
      created_at
    FROM users
    WHERE LOWER(TRIM(email)) = $1
    LIMIT 10
    `,
    [email]
  );

  if (!result.rows.length) {
    console.log("USER_NOT_FOUND");
  } else {
    console.log("USER_FOUND");
    console.table(result.rows);
  }
} catch (error) {
  console.error("CHECK ERROR:", error);
} finally {
  await pool.end();
}
