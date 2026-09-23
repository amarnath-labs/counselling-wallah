import 'dotenv/config';
import { pool } from './src/db/pool.js';

const result = await pool.query(`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'public'
    AND (
      table_name ILIKE '%cutoff%'
      OR table_name ILIKE '%neet%'
      OR table_name ILIKE '%mcc%'
    )
  ORDER BY table_name;
`);

console.table(result.rows);

await pool.end();
