import "dotenv/config";
import { pool } from "./src/db/pool.js";

async function main() {
  const client =
    await pool.connect();

  try {
    await client.query(
      "BEGIN"
    );

    console.log("");
    console.log(
      "======================================="
    );
    console.log(
      "EXTEND HOSTEL ROOM TYPE CONSTRAINT"
    );
    console.log(
      "======================================="
    );
    console.log("");

    const before =
      await client.query(`
        SELECT
          conname,
          pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = 'fee_variants'::regclass
          AND conname = 'fee_variants_room_type_check'
      `);

    console.log(
      "BEFORE:"
    );

    console.table(
      before.rows
    );

    await client.query(`
      ALTER TABLE fee_variants
      DROP CONSTRAINT IF EXISTS fee_variants_room_type_check
    `);

    await client.query(`
      ALTER TABLE fee_variants
      ADD CONSTRAINT fee_variants_room_type_check
      CHECK (
        room_type IS NULL
        OR room_type IN (
          'AC',
          'non_AC',
          'double_sharing',
          'single_occupancy',
          'triple_sharing'
        )
      )
    `);

    const after =
      await client.query(`
        SELECT
          conname,
          pg_get_constraintdef(oid) AS definition
        FROM pg_constraint
        WHERE conrelid = 'fee_variants'::regclass
          AND conname = 'fee_variants_room_type_check'
      `);

    console.log("");
    console.log(
      "AFTER:"
    );

    console.table(
      after.rows
    );

    await client.query(
      "COMMIT"
    );

    console.log("");
    console.log(
      "ROOM TYPE CONSTRAINT UPDATED SUCCESSFULLY."
    );

    console.log(
      "Existing data NOT modified."
    );

  } catch (error) {
    await client.query(
      "ROLLBACK"
    );

    throw error;

  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(
  error => {
    console.error(
      "FAILED:",
      error.message
    );

    process.exitCode = 1;
  }
);