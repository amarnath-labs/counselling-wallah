import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  const result = await pool.query(`
    UPDATE colleges
    SET
      city = 'Varanasi',
      state = 'Uttar Pradesh',
      updated_at = NOW()
    WHERE id = 'indian-institute-of-technology-varanasi'
    RETURNING id, name, city, state, website
  `);

  console.table(result.rows);
} catch (error) {
  console.error('FAILED:', error.message);
  process.exitCode = 1;
} finally {
  await pool.end();
}
