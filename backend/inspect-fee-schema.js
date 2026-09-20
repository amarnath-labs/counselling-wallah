import dotenv from "dotenv";
import pg from "pg";

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    process.env.DB_URL
});

async function main() {

  const tables = [
    "college_fee_profiles",
    "branch_fees",
    "college_fees"
  ];

  for (const table of tables) {

    console.log("");
    console.log("================================");
    console.log(table);
    console.log("================================");

    const result = await pool.query(
      `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = $1
      ORDER BY ordinal_position
      `,
      [table]
    );

    if (!result.rows.length) {
      console.log("TABLE NOT FOUND");
      continue;
    }

    console.table(result.rows);
  }

  await pool.end();
}

main().catch(async err => {
  console.error(err);
  await pool.end();
  process.exit(1);
});
