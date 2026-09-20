import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is missing");
}

const parsed =
  new URL(process.env.DATABASE_URL);

console.log("\n===== DB TARGET =====");
console.log("host:", parsed.hostname);
console.log("database:", parsed.pathname.replace("/", ""));
console.log("port:", parsed.port || "5432");

const pool =
  new Pool({
    connectionString:
      process.env.DATABASE_URL,
    max: 1,
  });

try {
  console.log(
    "\n===== CAPACITY INDEXES ====="
  );

  const indexes =
    await pool.query(`
      SELECT
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
        AND (
          tablename = 'cutoffs'
          OR tablename = 'branches'
          OR tablename = 'colleges'
        )
      ORDER BY
        tablename,
        indexname
    `);

  console.table(
    indexes.rows.map(
      (row) => ({
        indexname:
          row.indexname,
        definition:
          row.indexdef,
      })
    )
  );

  console.log(
    "\n===== EXACT UPTAC QUERY PLAN ====="
  );

  const plan =
    await pool.query(
      `
      EXPLAIN (
        ANALYZE,
        BUFFERS,
        FORMAT TEXT
      )
      SELECT
        c.id AS college_id,
        c.name AS college_name,
        c.city,
        c.state,
        c.type,

        b.id AS branch_id,
        b.name AS branch_name,

        co.year,
        co.round,
        co.category,
        co.quota,
        co.gender,

        co.opening_rank,
        co.closing_rank,

        co.source_label,
        co.is_verified,
        co.verification_status,
        co.source_url,
        co.retrieved_at

      FROM cutoffs co

      INNER JOIN branches b
        ON b.id = co.branch_id

      INNER JOIN colleges c
        ON c.id = b.college_id

      WHERE
        co.year = $1

        AND co.round = $2

        AND co.category = $3

        AND co.closing_rank >= $4

        AND co.counselling_type =
          'UPTAC'

        AND co.verification_status =
          'VERIFIED'

        AND co.is_verified = true

      ORDER BY
        co.closing_rank ASC,
        c.name ASC,
        b.name ASC

      LIMIT 500
      `,
      [
        2025,
        "Round 1",
        "OPEN",
        50000,
      ]
    );

  for (
    const row of plan.rows
  ) {
    console.log(
      row["QUERY PLAN"]
    );
  }

} finally {
  await pool.end();
}
