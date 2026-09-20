import 'dotenv/config';
import { pool } from './src/db/pool.js';

try {
  console.log('');
  console.log('=======================================');
  console.log('UPDATE FEE VARIANTS ROOM TYPE');
  console.log('=======================================');
  console.log('');

  await pool.query(`
    ALTER TABLE fee_variants
    DROP CONSTRAINT IF EXISTS fee_variants_room_type_check
  `);

  await pool.query(`
    ALTER TABLE fee_variants
    ADD CONSTRAINT fee_variants_room_type_check
    CHECK (
      room_type IS NULL
      OR room_type IN (
        'AC',
        'non_AC',
        'double_sharing',
        'single_occupancy'
      )
    )
  `);

  console.log(
    'room_type constraint updated.'
  );

  console.log('');
  console.log(
    'Existing fee rows NOT modified.'
  );

  console.log(
    'NIRF data NOT modified.'
  );

  console.log(
    'Placement data NOT modified.'
  );

  console.log(
    'Recommendation logic NOT modified.'
  );

} catch (error) {
  console.error(
    'FAILED:',
    error.message
  );

  process.exitCode = 1;

} finally {
  await pool.end();
}
