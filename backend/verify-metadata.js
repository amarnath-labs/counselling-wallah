import { pool } from "./src/db/pool.js";

try {
  const r = await pool.query(`
    SELECT
      name,
      city,
      state,
      type
    FROM colleges
    WHERE id IN (
      'indian-institute-of-science-bangalore',
      'indian-institute-of-technology-bombay',
      'indian-institute-of-technology-delhi',
      'indian-institute-of-technology-guwahati',
      'indian-institute-of-technology-madras',
      'indian-institute-of-technology-kanpur',
      'indian-institute-of-technology-gandhinagar',
      'national-institute-of-technology-calicut',
      'national-institute-of-technology-karnataka-surathkal',
      'national-institute-of-technology-warangal'
    )
    ORDER BY name;
  `);

  console.table(r.rows);
} finally {
  await pool.end();
}
