import { pool } from "./src/db/pool.js";

const schema = await pool.query(`
  SELECT
    column_name,
    data_type,
    is_nullable
  FROM information_schema.columns
  WHERE table_name = 'users'
  ORDER BY ordinal_position
`);

console.log("\n===== USERS TABLE =====");
console.table(schema.rows);

const sample = await pool.query(`
  SELECT
    id,
    email,
    pg_typeof(id)::text AS id_type
  FROM users
  ORDER BY id DESC
  LIMIT 5
`);

console.log("\n===== USER ID SAMPLE =====");
console.table(sample.rows);

await pool.end();
