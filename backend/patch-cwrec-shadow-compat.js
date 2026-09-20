import { pool } from './src/db/pool.js';

async function main() {
  const client =
    await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      ALTER TABLE cw_rec_uptac_cutoffs_2025
      ADD COLUMN IF NOT EXISTS
        verification_status TEXT
        NOT NULL
        DEFAULT 'VERIFIED'
    `);

    await client.query(`
      ALTER TABLE cw_rec_uptac_cutoffs_2025
      ADD COLUMN IF NOT EXISTS
        retrieved_at TIMESTAMPTZ
        NOT NULL
        DEFAULT NOW()
    `);

    await client.query(`
      ALTER TABLE cw_rec_uptac_cutoffs_2025
      ADD COLUMN IF NOT EXISTS
        counselling_type TEXT
        NOT NULL
        DEFAULT 'UPTAC'
    `);

    await client.query(`
      UPDATE cw_rec_uptac_cutoffs_2025
      SET
        verification_status = 'VERIFIED',
        counselling_type = 'UPTAC'
      WHERE
        verification_status IS DISTINCT FROM 'VERIFIED'
        OR counselling_type IS DISTINCT FROM 'UPTAC'
    `);

    const result =
      await client.query(`
        SELECT
          COUNT(*)::int
            AS total,

          COUNT(*) FILTER (
            WHERE verification_status =
              'VERIFIED'
          )::int
            AS verified,

          COUNT(*) FILTER (
            WHERE counselling_type =
              'UPTAC'
          )::int
            AS uptac,

          COUNT(*) FILTER (
            WHERE is_verified = TRUE
          )::int
            AS is_verified

        FROM cw_rec_uptac_cutoffs_2025
      `);

    console.table(
      result.rows
    );

    const row =
      result.rows[0];

    if (
      row.total !== 10804 ||
      row.verified !== 10804 ||
      row.uptac !== 10804 ||
      row.is_verified !== 10804
    ) {
      throw new Error(
        'CW-REC shadow compatibility verification failed'
      );
    }

    await client.query('COMMIT');

    console.log(
      '\n✅ SHADOW TABLE QUERY-COMPATIBLE'
    );
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

main()
  .catch(error => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await pool.end();
  });
