import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function main() {
  try {
    for (const table of ["branch_fees", "fee_variants"]) {
      console.log(`\n========== ${table.toUpperCase()} SCHEMA ==========`);

      const schema = await pool.query(`
        SELECT
          column_name,
          data_type,
          is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      console.table(schema.rows);

      const count = await pool.query(`
        SELECT COUNT(*)::int AS rows
        FROM ${table}
      `);

      console.log(`${table} ROW COUNT:`, count.rows[0].rows);

      const sample = await pool.query(`
        SELECT *
        FROM ${table}
        ORDER BY id
        LIMIT 10
      `);

      console.log(`\n${table} SAMPLE:`);
      console.dir(sample.rows, {
        depth: null,
        maxArrayLength: null
      });
    }
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
